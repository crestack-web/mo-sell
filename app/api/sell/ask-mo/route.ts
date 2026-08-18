import { NextRequest, NextResponse } from 'next/server';
import { sanitizeOutput } from '@/lib/ask-mo-safety';
import { generateDesignedPdf } from '@/lib/ask-mo-pdf';
import { extractFencedJson } from '@/lib/ask-mo-extract';
import { createProductInFirestore, updateProductInFirestore } from '@/lib/ask-mo-products';
import { SELL_MO_SYSTEM_PROMPT } from '@/lib/ask-mo-system';
import { buildStoreContext, buildCatalogContext, callGrok } from '@/lib/ask-mo-runtime';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      businessId,
      conversationHistory = [],
      attachments = [],
      storeConfig,
    } = body as {
      message: string;
      businessId?: string;
      conversationHistory: { role: 'user' | 'model'; parts: { text: string }[] }[];
      attachments?: { id: string; type: 'image' | 'audio' | 'file'; name: string; data: string; mimeType: string }[];
      storeConfig?: Record<string, unknown> | null;
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // ── Designed PDF intent (e.g. "create a meal prep pdf with images...") ──
    const PDF_INTENT =
      /(create|make|build|generate|design|write)\b.{0,50}\b(pdf|ebook)\b/i.test(message) ||
      /\b(pdf|ebook)\b.{0,50}\b(with\s+images?|colorful|meal\s+prep|recipe|dishes?)\b/i.test(message);

    if (PDF_INTENT && !conversationHistory.length) {
      const pdfResult = await generateDesignedPdf({ message, businessId: businessId ?? null });
      if (pdfResult.success) {
        const answer = pdfResult.title
          ? `Here's your PDF: "${pdfResult.title}". ${pdfResult.pageCount ?? 5} pages, ready to download.`
          : "Here's your designed PDF. Tap download to grab it.";
        return NextResponse.json({
          answer,
          raw: answer,
          pdf: {
            title: pdfResult.title,
            url: pdfResult.url,
            dataUrl: pdfResult.dataUrl,
            pageCount: pdfResult.pageCount,
          },
          pdfGenerated: true,
          provider: 'grok',
        });
      }
      // No tokens → ask the user to purchase before generating.
      if (pdfResult.tokensRequired) {
        const answer =
          'PDF & ebook creation needs Ask MO tokens. Top up your token balance and I’ll build it right away.';
        return NextResponse.json({
          answer,
          raw: answer,
          purchaseRequired: true,
          pdfBlocked: true,
          pdfCost: pdfResult.requiredTokens ?? 500,
          pdfBalance: pdfResult.balance ?? 0,
          provider: 'grok',
        });
      }
      // Fall through to normal chat if the PDF flow failed
    }

    // Convert conversation history from Gemini format to Grok format
    const grokHistory: { role: 'user' | 'assistant'; content: string }[] = conversationHistory.map(h => ({
      role: h.role === 'model' ? 'assistant' : 'user',
      content: h.parts[0]?.text || '',
    }));

    // Build the system prompt with awareness of the CURRENT storefront + bio
    const storeContext = buildStoreContext(storeConfig);
    const catalogContext = await buildCatalogContext(businessId);
    const combinedContext = [storeContext, catalogContext].filter(Boolean).join('\n\n');
    const systemPrompt = combinedContext
      ? `${SELL_MO_SYSTEM_PROMPT}\n\n=== CURRENT STATE OF THE MERCHANT'S STORE (use this context when the user asks to change things) ===\n${combinedContext}\n\nWhen proposing store_update or bio_update, only include the fields being changed — leave everything else null. When editing an existing product, always include the exact productId from the CURRENT PRODUCTS list.`
      : SELL_MO_SYSTEM_PROMPT;

    const { text: responseText, provider } = await callGrok(systemPrompt, grokHistory, message, attachments);

    // Parse response for JSON action blocks (tolerant of model formatting drift)
    const storeUpdate = extractFencedJson(responseText, 'store_update');
    const newProduct = extractFencedJson(responseText, 'new_product');
    const editProduct = extractFencedJson(responseText, 'edit_product');
    const bioUpdate = extractFencedJson(responseText, 'bio_update');

    // Clean the response text (remove JSON blocks) then sanitize anything
    // that must never reach the user (keys, paths, schema, fenced JSON)
    const cleanText = sanitizeOutput(
      responseText
        .replace(/```store_update[\s\S]+?```/g, '')
        .replace(/```new_product[\s\S]+?```/g, '')
        .replace(/```edit_product[\s\S]+?```/g, '')
        .replace(/```bio_update[\s\S]+?```/g, '')
        .trim(),
    );

    return NextResponse.json({
      answer: cleanText,
      raw: responseText,
      storeUpdate,
      newProduct,
      editProduct,
      bioUpdate,
      provider,
    });
  } catch (err) {
    console.error('[AskMo] Error:', err);
    const msg = err instanceof Error ? err.message : 'Internal server error';
    const isKeyError = msg.includes('API_KEY') || msg.includes('quota') || msg.includes('permission');
    return NextResponse.json(
      { error: isKeyError ? 'AI service configuration error' : msg || 'Internal server error' },
      { status: isKeyError ? 503 : 500 }
    );
  }
}

// ── PUT Handler (approve a proposed product → create or update in storeProducts) ─

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, storeConfig, productData } = body as {
      businessId?: string;
      storeConfig: Record<string, unknown> | null;
      productData: Record<string, unknown>;
    };

    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    }
    if (!productData || typeof productData !== 'object') {
      return NextResponse.json(
        { error: 'Valid productData is required' },
        { status: 400 },
      );
    }

    // If the payload carries an existing product id → update it in place
    // (edit_product flow). Otherwise it's a brand-new product (new_product).
    const productId = productData.id || productData.productId;
    if (typeof productId === 'string' && productId) {
      const updated = await updateProductInFirestore(businessId, productId, productData, storeConfig);
      return NextResponse.json({ success: true, product: updated, updated: true });
    }

    if (!productData.displayName) {
      return NextResponse.json(
        { error: 'Valid productData with displayName is required' },
        { status: 400 },
      );
    }

    const created = await createProductInFirestore(businessId, productData, storeConfig);

    return NextResponse.json({ success: true, product: created });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[AskMo] Approve error:', msg);
    return NextResponse.json(
      { error: 'Failed to approve product', details: msg },
      { status: 500 },
    );
  }
}
