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
import { EbookPdfData, RecipeEbookPages } from '@/components/pdf/ebook_recipe_5page';
import { EbookCoverCollage, CoverCollageData } from '@/components/pdf/ebook_cover_collage';
import { EbookChaptersDocument } from '@/components/pdf/ebook_chapters';
import { renderToBuffer, Document } from '@react-pdf/renderer';
import { getTokenBalance, deductTokens, TOKEN_COSTS } from '@/lib/ask-mo-tokens';
import { getServerFirestore } from '@/lib/server-firestore';

// PDF/ebook generation is a paid (token-consuming) feature → llama-versatile.
// Chat uses llama-instant via the Ask MO route.
const PDF_MODEL = process.env.PDF_MODEL || 'llama-3.3-70b-versatile';
const PDF_TOKEN_COST = TOKEN_COSTS.ebookCreate;

const GEN_SYSTEM_PROMPT = `You are a JSON content generator for Ask MO. Never output markdown, explanations, or apologies.
Output ONLY one valid JSON object (no code fences) with two keys. Keep ALL text under 8 words per field.

1. "cover_collage": a one-page overview collage
{
  "title": "string (max 6 words, e.g. 'MEAL PREP MADE EASY')",
  "subtitle": "string (max 8 words)",
  "what_youll_find": ["string (max 8 words)"] (5-6 items),
  "why_bullets": ["string (max 8 words)"] (exactly 4 items),
  "image_prompts": ["string"] (exactly 6 short Pexels photo keywords),
  "badges": ["string (max 4 words)"] (2-4 badges),
  "meal_plan_table": [{"day":"Mon","breakfast":"string","lunch":"string","dinner":"string","snack":"string"}] (exactly 7 rows, Mon-Sun),
  "recipes_grid": [{"name":"string (max 4 words)","image_prompt":"string"}] (exactly 6 items)
}

2. "ebook_recipe_5page": detailed recipe pages
{
  "template": "ebook_recipe_5page",
  "title": "string (max 6 words)",
  "brand_colors": ["2-3 hex colors"],
  "pages": [
    {"type":"cover|recipe|cta","title":"string","subtitle":"string","image_prompt":"string","ingredients":["string"],"steps":["string"],"ingredients_box_color":"hex color"}
  ]
}

Rules:
- ebook_recipe_5page.pages: exactly 5 (1 cover, 3 recipe, 1 cta). Recipe pages have 5-7 ingredients and 4-6 steps.
- Every page includes an image_prompt (short Pexels photo keyword), including the cover.
- All recipes and the meal plan must match what the user asked for.
- Output ONLY the JSON object.`;

export interface PdfResult {
  success: boolean;
  title?: string;
  url?: string | null;
  dataUrl?: string | null;
  pageCount?: number;
  error?: string;
  /** true when the user needs to purchase tokens before a PDF can be generated */
  tokensRequired?: boolean;
  requiredTokens?: number;
  balance?: number;
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
    model: PDF_MODEL,
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

export interface EbookPdfInput {
  businessId: string;
  title: string;
  subtitle?: string | null;
  chapters: { heading?: string; body?: string }[];
  author?: string | null;
  storeName?: string | null;
}

export async function generateEbookPdf(params: EbookPdfInput): Promise<{ url: string | null; fileName: string }> {
  const { businessId, title, subtitle, chapters, author, storeName } = params;
  const safeChapters = Array.isArray(chapters)
    ? chapters.filter(c => c && (c.heading || c.body))
    : [];

  const buffer = await renderToBuffer(
    <EbookChaptersDocument
      data={{
        title: title || 'Digital Product',
        subtitle: subtitle ?? null,
        author: author || storeName || 'Busmo Merchant',
        chapters: safeChapters,
      }}
    />,
  );

  const { url, dataUrl } = await uploadPdf(buffer, businessId, title || 'digital-product');
  return { url: url || dataUrl, fileName: `${slugify(title || 'digital-product')}.pdf` };
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

  // Paid feature: require tokens BEFORE spending a single versatile call.
  if (businessId) {
    const balance = await getTokenBalance(getServerFirestore(), businessId);
    if (balance < PDF_TOKEN_COST) {
      return {
        success: false,
        error: 'You need Ask MO tokens to create PDFs and ebooks.',
        tokensRequired: true,
        requiredTokens: PDF_TOKEN_COST,
        balance,
      };
    }
  }

  try {
    const userPrompt = await summarizeIfNeeded(client, GEN_SYSTEM_PROMPT, message);

    const contentRes = await client.chat.completions.create({
      model: PDF_MODEL,
      messages: [
        { role: 'system', content: GEN_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    });

    const raw = contentRes.choices[0]?.message?.content;
    if (!raw) {
      return { success: false, error: 'Could not generate content for the PDF' };
    }

    const parsed = parseStrictJson(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'Invalid content format returned by the model' };
    }

    const recipeSection = parsed.ebook_recipe_5page && typeof parsed.ebook_recipe_5page === 'object' ? parsed.ebook_recipe_5page : parsed;
    const collageSection = parsed.cover_collage && typeof parsed.cover_collage === 'object' ? parsed.cover_collage : {};

    const rawPages = Array.isArray(recipeSection.pages) ? recipeSection.pages : [];
    if (rawPages.length === 0) {
      return { success: false, error: 'Invalid content format returned by the model' };
    }

    // ── Collage (page 1) ──────────────────────────────────────────────────
    const collageData: CoverCollageData = {
      title: typeof collageSection.title === 'string' ? collageSection.title : recipeSection.title,
      subtitle: typeof collageSection.subtitle === 'string' ? collageSection.subtitle : undefined,
      what_youll_find: Array.isArray(collageSection.what_youll_find) ? collageSection.what_youll_find : [],
      why_bullets: Array.isArray(collageSection.why_bullets) ? collageSection.why_bullets : [],
      image_prompts: Array.isArray(collageSection.image_prompts) ? collageSection.image_prompts : [],
      badges: Array.isArray(collageSection.badges) ? collageSection.badges : [],
      meal_plan_table: Array.isArray(collageSection.meal_plan_table) ? collageSection.meal_plan_table : [],
      recipes_grid: Array.isArray(collageSection.recipes_grid) ? collageSection.recipes_grid : [],
    };

    // ── Recipe pages (2-6) ────────────────────────────────────────────────
    const recipeData: EbookPdfData = {
      template: 'ebook_recipe_5page',
      title: typeof recipeSection.title === 'string' && recipeSection.title ? recipeSection.title : 'Meal Prep Made Easy',
      brand_colors: Array.isArray(recipeSection.brand_colors) ? recipeSection.brand_colors.filter((c: unknown) => typeof c === 'string') : [],
      pages: rawPages.map((p: any) => ({
        type: p?.type === 'cta' || p?.type === 'cover' ? p.type : 'recipe',
        title: p?.title,
        subtitle: p?.subtitle,
        image_prompt: p?.image_prompt,
        ingredients: Array.isArray(p?.ingredients) ? p.ingredients.slice(0, 7) : [],
        steps: Array.isArray(p?.steps) ? p.steps.slice(0, 6) : [],
        ingredients_box_color: p?.ingredients_box_color,
      })),
    };

    // ── Fetch images in parallel (Pexels, embedded — never hotlinked) ─────
    const collagePrompts = (collageData.image_prompts ?? []).slice(0, 6);
    const gridPrompts = (collageData.recipes_grid ?? []).slice(0, 6).map(r => r?.image_prompt || '');
    const pagePrompts = recipeData.pages.map(p => p.image_prompt || '');

    const [collageImages, gridImages, recipeImages] = await Promise.all([
      Promise.all(collagePrompts.map(q => fetchPexelsImage(q))),
      Promise.all(gridPrompts.map(q => fetchPexelsImage(q))),
      Promise.all(pagePrompts.map(q => fetchPexelsImage(q))),
    ]);

    // ── Render: 1 collage page + recipe pages in one Document ─────────────
    const pdfBuffer = await renderToBuffer(
      <Document title={recipeData.title}>
        {EbookCoverCollage({ data: collageData, images: collageImages, recipeImages: gridImages })}
        {RecipeEbookPages({ data: recipeData, images: recipeImages })}
      </Document>,
    );

    const { url, dataUrl } = await uploadPdf(pdfBuffer, businessId, recipeData.title);

    // Deduct tokens only after the PDF was actually produced.
    if (businessId) {
      try {
        await deductTokens(getServerFirestore(), businessId, PDF_TOKEN_COST);
      } catch (err) {
        console.error('[AskMoPdf] Failed to deduct tokens:', err);
      }
    }

    return {
      success: true,
      title: recipeData.title,
      url,
      dataUrl,
      pageCount: 1 + recipeData.pages.length,
    };
  } catch (err) {
    console.error('[AskMoPdf] Error:', err);
    return { success: false, error: friendlyError(err) };
  }
}
