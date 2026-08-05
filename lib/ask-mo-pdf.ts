/**
 * Ask MO PDF Generator v2 — designed PDF ebook pipeline
 *
 * 1. Groq writes the 5-page ebook content as strict JSON (max_tokens 800)
 * 2. Pexels supplies a full-bleed cover + per-recipe photos (embedded, never hotlinked)
 * 3. @react-pdf/renderer renders a Canva-style 5-page PDF
 * 4. PDF is uploaded to Supabase Storage bucket `ebooks` and a public URL returned
 *
 * Errors are surfaced to the user WITHOUT leaking org_id, token limits, or internals.
 */

import { Client } from '@/lib/groq-client';
import { estimateTokens } from '@/lib/ask-mo-safety';
import { EbookRecipe5Page, EbookPdfData } from '@/components/pdf/ebook_recipe_5page';
import { renderToBuffer } from '@react-pdf/renderer';

const MODEL = process.env.AI_MODEL || 'llama-3.3-70b-versatile';

const GEN_SYSTEM_PROMPT = `You are a JSON content generator for Ask MO. Never output markdown, explanations, or apologies.
Only output valid JSON matching the schema below. Keep all text under 15 words per field.

Schema:
{
  "template": "ebook_recipe_5page",
  "title": "string (short catchy ebook title)",
  "brand_colors": ["2-3 hex colors that match the theme"],
  "pages": [
    {
      "type": "cover | recipe | cta",
      "title": "string",
      "subtitle": "string (one short line)",
      "image_prompt": "string (Pexels photo keyword, e.g. 'meal prep bowls healthy')",
      "ingredients": ["string"] (recipe pages only, 5-7 concise items),
      "steps": ["string"] (recipe pages only, 4-6 concise instructions),
      "ingredients_box_color": "hex color" (recipe pages only)
    }
  ]
}

Rules:
- Exactly 5 pages: 1 cover, 3 recipe, 1 cta.
- Every page includes an image_prompt, including the cover (hero photo).
- Recipe pages must match what the user asked for.
- Keep every string SHORT and under 15 words so it fits one PDF page.
- Output ONLY the JSON object.`;

export interface PdfResult {
  success: boolean;
  title?: string;
  url?: string | null;
  dataUrl?: string | null;
  pageCount?: number;
  error?: string;
}

const BUSY_ERROR = 'Busy right now. Try again in 1 minute.';

function isBusyOrTooLarge(msg: string): boolean {
  return /429|413|rate limit|quota exceeded|too large|request too large|token limit|busy|overloaded/i.test(msg);
}

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (isBusyOrTooLarge(msg)) return BUSY_ERROR;
  return 'Could not generate the PDF. Try again with a shorter request.';
}

async function summarizeIfNeeded(
  client: Client,
  systemPrompt: string,
  message: string,
): Promise<string> {
  const full = systemPrompt + '\n\n' + message;
  if (estimateTokens(full) <= 6000) return message;
  const res = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: 'Condense the user request into one short, complete sentence that preserves every specific requirement (subject, count, style, images, colors). Output only the condensed request.' },
      { role: 'user', content: message },
    ],
    temperature: 0,
    max_tokens: 150,
  });
  return res.choices[0]?.message?.content?.trim() || message;
}

export function parseStrictJson(text: string): any {
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    /* try extracting the first {...} */
  }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      /* not valid JSON */
    }
  }
  return null;
}

async function fetchPexelsImage(query: string): Promise<Buffer | null> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query || 'meal prep')}&per_page=1&orientation=landscape`,
      { headers: { Authorization: key } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const photo = data?.photos?.[0];
    if (!photo?.src?.large) return null;
    const imgRes = await fetch(photo.src.large);
    if (!imgRes.ok) return null;
    return Buffer.from(await imgRes.arrayBuffer());
  } catch {
    return null;
  }
}

function slugify(s: string): string {
  return (s || 'ebook')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'ebook';
}

async function uploadPdf(bytes: Uint8Array, businessId: string | null, title: string): Promise<{ url: string | null; dataUrl: string | null }> {
  const { supabaseServer } = await import('@/lib/supabase-server');

  if (supabaseServer) {
    try {
      const path = `${businessId || 'public'}/${Date.now()}-${slugify(title)}.pdf`;
      const { error } = await supabaseServer.storage.from('ebooks').upload(path, bytes as any, {
        contentType: 'application/pdf',
        upsert: true,
      });
      if (!error) {
        const { data } = supabaseServer.storage.from('ebooks').getPublicUrl(path);
        if (data?.publicUrl) {
          return { url: data.publicUrl, dataUrl: null };
        }
      }
    } catch {
      /* fall through to base64 */
    }
  }

  // Fallback: return the PDF inline so the user can still download it.
  const base64 = Buffer.from(bytes).toString('base64');
  return { url: null, dataUrl: `data:application/pdf;base64,${base64}` };
}

export async function generateDesignedPdf(params: {
  message: string;
  businessId?: string | null;
}): Promise<PdfResult> {
  const { message, businessId = null } = params;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'AI service not configured' };
  }

  const client = new Client({ apiKey });

  try {
    const userPrompt = await summarizeIfNeeded(client, GEN_SYSTEM_PROMPT, message);

    const contentRes = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: GEN_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const raw = contentRes.choices[0]?.message?.content;
    if (!raw) {
      return { success: false, error: 'Could not generate content for the PDF' };
    }

    const parsed = parseStrictJson(raw);
    const pages = Array.isArray(parsed?.pages) ? parsed.pages : null;
    if (!pages || pages.length === 0) {
      return { success: false, error: 'Invalid content format returned by the model' };
    }

    // Fetch one Pexels photo per page in parallel (embedded, never hotlinked)
    const images = await Promise.all(
      pages.map((p: { image_prompt?: string }) =>
        p?.image_prompt ? fetchPexelsImage(p.image_prompt) : Promise.resolve(null),
      ),
    );

    const data: EbookPdfData = {
      template: parsed.template === 'ebook_recipe_5page' ? 'ebook_recipe_5page' : 'ebook_recipe_5page',
      title: typeof parsed.title === 'string' && parsed.title ? parsed.title : 'Meal Prep Made Easy',
      brand_colors: Array.isArray(parsed.brand_colors) ? parsed.brand_colors.filter((c: unknown) => typeof c === 'string') : [],
      pages: pages.map((p: any) => ({
        type: p?.type === 'cta' || p?.type === 'cover' ? p.type : 'recipe',
        title: p?.title,
        subtitle: p?.subtitle,
        image_prompt: p?.image_prompt,
        ingredients: Array.isArray(p?.ingredients) ? p.ingredients.slice(0, 7) : [],
        steps: Array.isArray(p?.steps) ? p.steps.slice(0, 6) : [],
        ingredients_box_color: p?.ingredients_box_color,
      })),
    };

    const pdfBuffer = await renderToBuffer(EbookRecipe5Page({ data, images }));
    const { url, dataUrl } = await uploadPdf(pdfBuffer, businessId, data.title);

    return {
      success: true,
      title: data.title,
      url,
      dataUrl,
      pageCount: data.pages.length,
    };
  } catch (err) {
    console.error('[AskMoPdf] Error:', err);
    return { success: false, error: friendlyError(err) };
  }
}
