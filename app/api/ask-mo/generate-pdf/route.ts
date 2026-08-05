import { NextRequest, NextResponse } from 'next/server';
import { generateDesignedPdf } from '@/lib/ask-mo-pdf';

/**
 * POST /api/ask-mo/generate-pdf
 *
 * Ask MO PDF Generator v2:
 *   1. Groq writes the 5-page ebook content as strict JSON (llama-3.3-70b-versatile, max_tokens 800)
 *   2. Pexels supplies a full-bleed cover + per-recipe photos
 *   3. @react-pdf/renderer renders a Canva-style 5-page PDF
 *   4. PDF is uploaded to Supabase Storage bucket `ebooks` and a public URL returned
 *
 * Body: { prompt: string, brand_id?: string }
 *       (also accepts message / businessId for backward compatibility)
 *
 * Returns: { success, title, url, dataUrl?, pageCount }
 * On Groq 429/413: { error: "Busy right now. Try again in 1 minute." }
 */
export async function POST(req: NextRequest) {
  let body: { prompt?: string; brand_id?: string; message?: string; businessId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const prompt = (body?.prompt ?? body?.message ?? '').toString().trim();
  if (!prompt) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }

  const brandId = body?.brand_id ?? body?.businessId ?? null;

  const result = await generateDesignedPdf({ message: prompt, businessId: brandId });

  if (!result.success) {
    const status = result.error?.startsWith('Busy right now') ? 503 : 500;
    return NextResponse.json({ error: result.error || 'PDF generation failed' }, { status });
  }

  return NextResponse.json(result);
}
