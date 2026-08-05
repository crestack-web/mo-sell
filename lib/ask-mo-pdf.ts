/**
 * Ask MO — designed PDF ebook pipeline
 *
 * 1. Groq generates the 5-page recipe content (strict JSON, <3000 tokens)
 * 2. Pexels supplies a cover + per-recipe images (embedded, never hotlinked)
 * 3. pdf-lib renders a colorful 5-page PDF
 * 4. PDF is uploaded to Supabase Storage bucket `ebooks` and a public URL returned
 */

import { Client } from '@/lib/groq-client';
import { estimateTokens } from '@/lib/ask-mo-safety';
import { generateEbookPDF, EbookData } from '@/lib/ebook-pdf';

const MODEL = process.env.AI_MODEL || 'llama-3.3-70b-versatile';
const RECIPE_COUNT = 3;

const RECIPE_SYSTEM_PROMPT = `You design a 5-page meal-prep recipe PDF ebook.

Return ONLY a JSON object. No markdown, no code fences, no explanations. Schema:
{
  "title": "short catchy ebook title (max 6 words)",
  "subtitle": "one short subtitle line",
  "coverSearch": "image keyword for the cover, e.g. 'meal prep bowls healthy'",
  "recipes": [
    {
      "title": "dish name (max 5 words)",
      "subtitle": "one short line describing it",
      "search": "image keyword for this dish, e.g. 'grilled chicken meal prep bowl'",
      "ingredients": ["concise item, max 10 words"],
      "steps": ["concise instruction, max 14 words"]
    }
  ],
  "notes": ["quick meal-prep tip, max 12 words"],
  "cta": "one short line inviting the reader to make the ebook theirs"
}

Rules:
- Exactly ${RECIPE_COUNT} recipes.
- 5-7 ingredients and 4-6 steps per recipe. Keep every string SHORT (concise) so it fits one PDF page.
- Recipes must match what the user asked for.
- Output ONLY the JSON object.`;

export interface PdfResult {
  success: boolean;
  title?: string;
  subtitle?: string;
  url?: string | null;
  dataUrl?: string | null;
  pageCount?: number;
  error?: string;
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

async function fetchPexelsImage(query: string): Promise<Uint8Array | null> {
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
    const buf = await imgRes.arrayBuffer();
    return new Uint8Array(buf);
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
    const userPrompt = await summarizeIfNeeded(client, RECIPE_SYSTEM_PROMPT, message);

    const contentRes = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: RECIPE_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1800,
    });

    const raw = contentRes.choices[0]?.message?.content;
    if (!raw) {
      return { success: false, error: 'Could not generate content for the PDF' };
    }

    const parsed = parseStrictJson(raw);
    if (!parsed) {
      return { success: false, error: 'Invalid content format returned by the model' };
    }

    const recipes = (parsed.recipes || []).slice(0, RECIPE_COUNT);

    // Fetch cover + recipe images in parallel (Pexels)
    const [coverImage, ...recipeImages] = await Promise.all([
      fetchPexelsImage(parsed.coverSearch || 'meal prep'),
      ...recipes.map((r: { search?: string }) => fetchPexelsImage(r.search || 'meal prep')),
    ]);

    const ebook: EbookData = {
      title: parsed.title || 'Meal Prep Made Easy',
      subtitle: parsed.subtitle || 'Simple, colorful recipes for a stress-free week',
      coverImage,
      recipes: recipes.map((r: any, i: number) => ({
        title: r.title || `Recipe ${i + 1}`,
        subtitle: r.subtitle,
        ingredients: Array.isArray(r.ingredients) ? r.ingredients.slice(0, 7) : [],
        steps: Array.isArray(r.steps) ? r.steps.slice(0, 6) : [],
        image: recipeImages[i] || null,
      })),
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      cta: parsed.cta,
    };

    const pdfBytes = await generateEbookPDF(ebook);
    const { url, dataUrl } = await uploadPdf(pdfBytes, businessId, ebook.title);

    return {
      success: true,
      title: ebook.title,
      subtitle: ebook.subtitle,
      url,
      dataUrl,
      pageCount: 5,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'PDF generation failed';
    console.error('[AskMoPdf] Error:', err);
    return { success: false, error: msg };
  }
}
