import { NextRequest, NextResponse } from 'next/server';
import { generateDesignedPdf } from '@/lib/ask-mo-pdf';

/**
 * POST /api/ask-mo/generate-pdf
 *
 * Generates a designed 5-page meal-prep PDF ebook:
 *   - Groq writes the recipes (title, ingredients, steps) as strict JSON
 *   - Pexels supplies embedded cover + dish images
 *   - pdf-lib renders a colorful PDF (cover / recipes / notes+CTA)
 *   - PDF is uploaded to Supabase Storage bucket `ebooks`
 *
 * Body: { message: string, businessId?: string }
 * Returns: { success, title, subtitle, url, dataUrl?, pageCount }
 */
export async function POST(req: NextRequest) {
  let body: { message?: string; businessId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const message = (body?.message ?? '').toString().trim();
  if (!message) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  const result = await generateDesignedPdf({ message, businessId: body?.businessId || null });

  if (!result.success) {
    return NextResponse.json({ error: result.error || 'PDF generation failed' }, { status: 500 });
  }

  return NextResponse.json(result);
}
