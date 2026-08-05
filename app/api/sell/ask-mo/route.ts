import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@/lib/groq-client';
import { getServerFirestore as getAdminDb, getServerStorage as getAdminStorage, FieldValue } from '@/lib/server-firestore';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { ASK_MO_COMMISSION_RATE, ASK_MO_COMMISSION_FIELD, getTokenCost, TOKEN_DOC_PATH, TOKEN_BALANCE_FIELD, ensureFreeTokens, getTokenSpendPlan } from '@/lib/ask-mo-tokens';

const MODEL = process.env.AI_MODEL || 'llama-3.3-70b-versatile';

const SELL_MO_SYSTEM_PROMPT = `
You are MO — the AI commerce assistant inside Busmo, Africa's business operating system.
You are helping a merchant manage and grow their online store through conversation.

WHO YOU ARE:
- A strategic commerce partner — you know branding, pricing, product strategy, and the African market
- Direct, specific, action-oriented — never generic or robotic
- You think like a store owner who wants to sell more

WHAT YOU CAN DO:
1. EDIT THE STORE — name, colors, tagline, collections, policy, theme, FAQ
2. CREATE DIGITAL PRODUCTS — ebooks, templates, courses, tickets — with title, description, price, category, tags
3. EDIT DIGITAL PRODUCTS — modify any product you previously created (change title, chapters, price, description, add/remove sections)
4. GENERAL HELP — product descriptions, collection ideas, pricing advice, marketing tips

HOW TO RESPOND:
- Keep responses short and conversational (2-4 sentences max)
- When the user asks to change something, confirm what you're changing and return the storeUpdate
- When the user wants to create a product, gather the key details (name, price, type) then return the newProduct
- When the user wants to tweak/edit a product they already created, return the edit_product block with ALL the updated content
- Never repeat questions they already answered
- No filler words: never say "Great!", "Fantastic!", "Happy to help!"
- Speak like a sharp business partner, not a chatbot

RESPONSE FORMAT:
Always respond in plain text for the "answer" field.
When appropriate, also return structured JSON blocks for actions.

CRITICAL — JSON ACTION BLOCKS:
When the user wants to EDIT their store, append this at the END of your message:

\`\`\`store_update
{
  "storeName": "new name or null",
  "storeSlug": "new-slug-or-null",
  "primaryColor": "#hex-or-null",
  "secondaryColor": "#hex-or-null",
  "tagline": "new tagline or null",
  "storePolicy": "new policy or null",
  "businessCategory": "category-or-null",
  "theme": "luxe|glow|market|creator-or-null"
}
\`\`\`

When the user wants to CREATE a digital product, append this at the END of your message:

\`\`\`new_product
{
  "displayName": "Product Name",
  "description": "Compelling product description (2-3 sentences that sell the value)",
  "price": 5000,
  "currency": "NGN",
  "productType": "digital",
  "digitalSubtype": "ebook|template|course|ticket",
  "category": "one of: fashion|beauty|food|electronics|home|health|services|general|digital",
  "tags": ["tag1", "tag2"],
  "pdfContent": {
    "title": "PDF Document Title",
    "subtitle": "Optional subtitle",
    "chapters": [
      {
        "heading": "Chapter Title",
        "body": "Full chapter content with multiple paragraphs. Use line breaks between paragraphs. Include actionable steps, real examples, and detailed explanations. Each chapter must be 500-1000 words with practical value."
      }
    ],
    "author": "Store Name or Author Name"
  }
}
\`\`\`

When the user wants to EDIT/UPDATE an existing product, append this at the END of your message:

\`\`\`edit_product
{
  "productId": "the-product-id-from-the-preview",
  "displayName": "Updated Product Name or null to keep current",
  "description": "Updated description or null to keep current",
  "price": 5000 or null to keep current,
  "category": "updated-category or null to keep current",
  "tags": ["updated", "tags"] or null to keep current,
  "pdfContent": {
    "title": "Updated PDF Title",
    "subtitle": "Updated subtitle",
    "chapters": [
      {
        "heading": "Chapter Title",
        "body": "FULL updated chapter content. Include the entire chapter text, not just the changes."
      }
    ],
    "author": "Author Name"
  }
}
\`\`\`

RULES FOR new_product:
- price must be a positive number (no currency symbol)
- digitalSubtype must be one of: ebook, template, course, ticket
- pdfContent is REQUIRED for digital products — this is the actual product the customer pays for
- Generate 5-8 chapters of SUBSTANTIAL, SELLABLE content
- Each chapter MUST be 500-1000 words — real educational value, not surface-level fluff
- Every chapter MUST include: actionable steps, real-world examples, specific tips, and practical advice
- Use line breaks (\\n) to separate paragraphs within each chapter body
- The content should feel like a premium paid product — the reader should get real value
- Include specific numbers, frameworks, checklists, and actionable takeaways
- tags should be 2-5 relevant search terms
- description should be compelling marketing copy, not just "An ebook about X"

CONTENT QUALITY RULES FOR EBOOKS:
- Chapter 1 should be an introduction with context and why this matters
- Middle chapters should teach specific skills/methods with step-by-step instructions
- Include bullet points, numbered lists, and frameworks (use \\n for line breaks)
- Include real examples relevant to the African/Nigerian market where applicable
- Final chapter should be a summary with action items and next steps
- Write as if charging ₦5,000+ for this content — it must deliver real value

RULES FOR edit_product:
- Always include the productId of the product being edited
- Set fields to null if the user doesn't want to change them
- If editing pdfContent, include the COMPLETE updated pdfContent with ALL chapters
- After editing, the PDF will be regenerated automatically

RULES FOR TWEAKING A PROPOSED PRODUCT (no productId yet, pre-approval):
- When the user asks to tweak/modify a proposed ebook that hasn't been approved yet, return a new new_product block with the COMPLETE updated pdfContent containing ALL chapters
- Your text answer MUST be very short (1-2 sentences confirming the change)
- NEVER include the full ebook chapters in your text answer — put all content in the new_product JSON block
- The full new_product block replaces the old proposal entirely

RULES FOR store_update:
- Only include fields the user wants to change
- Set unchanged fields to null
- storeSlug must be lowercase-hyphen format, max 30 chars
- primaryColor/secondaryColor must be valid hex (#RRGGBB)

THEME GUIDE:
- luxe: fashion, clothing, accessories, premium/luxury
- glow: beauty, cosmetics, skincare, wellness
- market: food, grocery, home, lifestyle, general retail
- creator: digital products, courses, services, ebooks, tech

CATEGORIES: fashion, beauty, food, electronics, home, health, services, general, digital
`;

interface AttachmentData {
  id: string;
  type: 'image' | 'audio' | 'file';
  name: string;
  data: string;
  mimeType: string;
}

async function callGrok(
  client: Client,
  systemPrompt: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  message: string,
  attachments?: AttachmentData[],
): Promise<string> {
  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: message },
  ];

  // Add attachments as content
  if (attachments && attachments.length > 0) {
    messages[messages.length - 1].content += '\n\nAttachments included in conversation.';
  }

  const response = await client.chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0.8,
    max_tokens: 8192,
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error('Grok returned empty response');
  return text;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
    }

    const client = new Client({ apiKey });

    const body = await req.json();
    const {
      message,
      businessId,
      conversationHistory = [],
      attachments = [],
    } = body as {
      message: string;
      businessId?: string;
      conversationHistory: { role: 'user' | 'model'; parts: { text: string }[] }[];
      attachments?: AttachmentData[];
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Convert conversation history from Gemini format to Grok format
    const grokHistory: { role: 'user' | 'assistant'; content: string }[] = conversationHistory.map(h => ({
      role: h.role === 'model' ? 'assistant' : 'user',
      content: h.parts[0]?.text || '',
    }));

    const responseText = await callGrok(client, SELL_MO_SYSTEM_PROMPT, grokHistory, message, attachments);

    // Parse response for JSON blocks
    const storeUpdateMatch = responseText.match(/```store_update\n([\s\S]+?)\n```/);
    const newProductMatch = responseText.match(/```new_product\n([\s\S]+?)\n```/);
    const editProductMatch = responseText.match(/```edit_product\n([\s\S]+?)\n```/);

    let storeUpdate = null;
    let newProduct = null;
    let editProduct = null;

    if (storeUpdateMatch) {
      try {
        storeUpdate = JSON.parse(storeUpdateMatch[1]);
      } catch (e) {
        console.error('[AskMo] Failed to parse store_update JSON:', e);
      }
    }

    if (newProductMatch) {
      try {
        newProduct = JSON.parse(newProductMatch[1]);
      } catch (e) {
        console.error('[AskMo] Failed to parse new_product JSON:', e);
      }
    }

    if (editProductMatch) {
      try {
        editProduct = JSON.parse(editProductMatch[1]);
      } catch (e) {
        console.error('[AskMo] Failed to parse edit_product JSON:', e);
      }
    }

    // Clean the response text (remove JSON blocks)
    const cleanText = responseText
      .replace(/```store_update[\s\S]+?```/g, '')
      .replace(/```new_product[\s\S]+?```/g, '')
      .replace(/```edit_product[\s\S]+?```/g, '')
      .trim();

    return NextResponse.json({
      text: cleanText,
      storeUpdate,
      newProduct,
      editProduct,
      provider: 'grok',
    });
  } catch (err) {
    console.error('[AskMo] Error:', err);
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg || 'Internal server error' }, { status: 500 });
  }
}
