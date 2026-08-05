/**
 * Ask MO — Designed PDF ebook generator (pdf-lib)
 *
 * Builds a 5-page meal-prep style PDF:
 *   Page 1: Cover (title, subtitle, hero image, colorful decoration)
 *   Page 2-4: One recipe per page — [image left 40%] [text right 60%],
 *             accent blocks for Ingredients & Steps in brand colors
 *   Page 5: Notes / CTA
 *
 * Brand colors: coral #FF6B6B, teal #4ECDC4, yellow #FFE66D.
 * Images are embedded (never hotlinked).
 */

import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont, PDFImage } from 'pdf-lib';

export interface EbookRecipe {
  title: string;
  subtitle?: string;
  ingredients: string[];
  steps: string[];
  image?: Uint8Array | null;
}

export interface EbookData {
  title: string;
  subtitle?: string;
  coverImage?: Uint8Array | null;
  recipes: EbookRecipe[];
  notes?: string[];
  cta?: string;
}

const PAGE_W = 612;   // US Letter portrait
const PAGE_H = 792;
const MARGIN = 48;

const CORAL      = rgb(1, 0.42, 0.42);        // #FF6B6B
const CORAL_DK   = rgb(0.78, 0.18, 0.18);
const CORAL_SOFT = rgb(1, 0.87, 0.87);
const TEAL       = rgb(0.31, 0.8, 0.77);      // #4ECDC4
const TEAL_DK    = rgb(0.07, 0.5, 0.48);
const TEAL_SOFT  = rgb(0.85, 0.97, 0.96);
const YELLOW     = rgb(1, 0.9, 0.43);         // #FFE66D
const YELLOW_SOFT= rgb(1, 0.97, 0.82);
const DARK       = rgb(0.16, 0.16, 0.2);
const MUTED      = rgb(0.42, 0.42, 0.5);
const CREAM      = rgb(1, 0.98, 0.94);
const WHITE      = rgb(1, 1, 1);

function wrap(text: string, size: number, maxWidth: number, font: PDFFont): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawCentered(
  page: PDFPage,
  text: string,
  y: number,
  size: number,
  font: PDFFont,
  color: ReturnType<typeof rgb>,
  maxWidth: number,
): number {
  let yy = y;
  for (const line of wrap(text, size, maxWidth, font)) {
    const w = font.widthOfTextAtSize(line, size);
    page.drawText(line, { x: (PAGE_W - w) / 2, y: yy, size, font, color, maxWidth });
    yy -= size + 4;
  }
  return yy;
}

async function embedImage(doc: PDFDocument, bytes: Uint8Array | null | undefined): Promise<PDFImage | null> {
  if (!bytes || bytes.length < 8) return null;
  try {
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return await doc.embedJpg(bytes as any);
    if (bytes[0] === 0x89 && bytes[1] === 0x50) return await doc.embedPng(bytes as any);
  } catch {
    /* unsupported image — caller falls back to placeholder */
  }
  return null;
}

function drawPlaceholder(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  h: number,
  color: ReturnType<typeof rgb>,
  label: string,
  font: PDFFont,
): void {
  page.drawRectangle({ x, y, width: w, height: h, color });
  const size = 13;
  const lines = wrap(label || 'Recipe image', size, w - 24, font);
  let yy = y + h / 2 + (lines.length * size) / 2;
  for (const line of lines) {
    const lw = font.widthOfTextAtSize(line, size);
    page.drawText(line, { x: x + (w - lw) / 2, y: yy, size, font, color: DARK, maxWidth: w - 24 });
    yy -= size + 3;
  }
}

function drawAccentCard(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  title: string,
  items: string[],
  accent: ReturnType<typeof rgb>,
  accentText: ReturnType<typeof rgb>,
  soft: ReturnType<typeof rgb>,
  font: PDFFont,
  bold: PDFFont,
  numbered: boolean,
): number {
  // Header bar
  page.drawRectangle({ x, y: y - 22, width: w, height: 22, color: accent });
  page.drawText(title, { x: x + 10, y: y - 17, size: 11, font: bold, color: accentText, maxWidth: w - 20 });

  let yy = y - 22 - 10;
  const labelColor = accent;

  items.forEach((item, idx) => {
    const prefix = numbered ? `${idx + 1}. ` : '\u2022 ';
    const display = prefix + item.replace(/^[-•*\d.)\s]+/, '');
    const lines = wrap(display, 9.5, w - 24, font);
    // dotted divider under each item
    page.drawRectangle({ x, y: yy - 3, width: w, height: 0.6, color: soft });
    for (const line of lines) {
      if (yy < MARGIN) break;
      page.drawText(line, { x: x + 12, y: yy, size: 9.5, font, color: DARK, maxWidth: w - 24 });
      yy -= 12.5;
    }
    yy -= 5;
    void labelColor;
  });

  return yy;
}

export async function generateEbookPDF(data: EbookData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font   = await doc.embedFont(StandardFonts.Helvetica);
  const bold   = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);

  const recipes = data.recipes.slice(0, 3);
  const notes = data.notes && data.notes.length ? data.notes.slice(0, 6)
    : ['Prep in batches on a free day (e.g. Sunday).', 'Store in airtight containers to keep things fresh.', 'Reheat gently so texture stays great.'];
  const cta = data.cta || 'Ready to make it yours? Publish this ebook in your Busmo store today.';

  // ── Page 1: Cover ──────────────────────────────────────────────────────────
  {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: CREAM });

    // decorative shapes
    page.drawCircle({ x: PAGE_W - 70, y: PAGE_H - 70, size: 78, color: CORAL });
    page.drawCircle({ x: 60, y: 110, size: 56, color: TEAL });
    page.drawCircle({ x: PAGE_W - 130, y: 70, size: 34, color: YELLOW });

    // top bands
    page.drawRectangle({ x: 0, y: PAGE_H - 30, width: PAGE_W, height: 12, color: CORAL });
    page.drawRectangle({ x: 0, y: PAGE_H - 18, width: PAGE_W, height: 18, color: YELLOW });

    const title = data.title || 'Meal Prep Made Easy';
    const subtitle = data.subtitle || 'Simple, colorful recipes for a stress-free week';

    let y = PAGE_H - 130;
    const titleLines = wrap(title, 32, PAGE_W - 120, bold);
    for (const line of titleLines) {
      const w = font.widthOfTextAtSize(line, 32);
      page.drawText(line, { x: (PAGE_W - w) / 2, y, size: 32, font: bold, color: CORAL_DK, maxWidth: PAGE_W - 120 });
      y -= 40;
    }
    y -= 6;
    y = drawCentered(page, subtitle, y, 14, italic, MUTED, PAGE_W - 160);

    // Hero image
    const heroImg = await embedImage(doc, data.coverImage);
    const heroW = 400;
    const heroH = 210;
    const heroY = 300;
    if (heroImg) {
      const dims = heroImg.scaleToFit(heroW, heroH);
      page.drawImage(heroImg, { x: (PAGE_W - dims.width) / 2, y: heroY + (heroH - dims.height) / 2, width: dims.width, height: dims.height });
      page.drawRectangle({ x: (PAGE_W - heroW) / 2 - 8, y: heroY - 8, width: heroW + 16, height: heroH + 16, color: YELLOW_SOFT });
      page.drawRectangle({ x: (PAGE_W - heroW) / 2, y: heroY, width: heroW, height: heroH, color: CORAL_SOFT });
      page.drawImage(heroImg, { x: (PAGE_W - dims.width) / 2, y: heroY + (heroH - dims.height) / 2, width: dims.width, height: dims.height });
    } else {
      drawPlaceholder(page, (PAGE_W - heroW) / 2, heroY, heroW, heroH, TEAL_SOFT, `${title} — week of delicious, healthy meals`, italic);
    }

    const metaLine = `${recipes.length} recipes \u2022 ${recipes.reduce((s, r) => s + (r.steps?.length || 0), 0)} simple steps \u2022 meal prep made fun`;
    drawCentered(page, metaLine, heroY - 26, 11, bold, TEAL_DK, PAGE_W - 160);

    // bottom strip + tag
    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 12, color: TEAL });
    page.drawText('Powered by Busmo \u2014 Africa\u2019s Business Operating System', {
      x: MARGIN, y: 26, size: 9, font, color: MUTED,
    });
  }

  // ── Pages 2-4: one recipe per page ────────────────────────────────────────
  for (let i = 0; i < Math.max(recipes.length, 1); i++) {
    const recipe = recipes[i] || { title: 'Recipe', ingredients: ['Fresh ingredients of your choice'], steps: ['Prep', 'Cook', 'Enjoy'] };
    const page = doc.addPage([PAGE_W, PAGE_H]);
    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: WHITE });

    // Header band
    page.drawRectangle({ x: 0, y: PAGE_H - 64, width: PAGE_W, height: 64, color: YELLOW_SOFT });
    page.drawRectangle({ x: 0, y: PAGE_H - 8, width: PAGE_W, height: 8, color: CORAL });

    const numChipX = MARGIN;
    page.drawCircle({ x: numChipX + 18, y: PAGE_H - 32, size: 18, color: CORAL });
    page.drawText(String(i + 1), { x: numChipX + 18 - 6, y: PAGE_H - 37, size: 15, font: bold, color: WHITE });

    page.drawText(recipe.title || `Recipe ${i + 1}`, { x: numChipX + 46, y: PAGE_H - 46, size: 20, font: bold, color: DARK, maxWidth: PAGE_W - 160 });
    if (recipe.subtitle) {
      page.drawText(recipe.subtitle, { x: numChipX + 46, y: PAGE_H - 60, size: 10, font: italic, color: MUTED, maxWidth: PAGE_W - 200 });
    }

    // Left column: image (40%)
    const leftW = 220;
    const imgH = 220;
    const imgX = MARGIN;
    const imgY = PAGE_H - 64 - imgH - 28;
    const img = await embedImage(doc, recipe.image);
    if (img) {
      page.drawRectangle({ x: imgX - 6, y: imgY - 6, width: leftW + 12, height: imgH + 12, color: YELLOW_SOFT });
      const dims = img.scaleToFit(leftW, imgH);
      page.drawImage(img, { x: imgX + (leftW - dims.width) / 2, y: imgY + (imgH - dims.height) / 2, width: dims.width, height: dims.height });
    } else {
      drawPlaceholder(page, imgX, imgY, leftW, imgH, TEAL_SOFT, (recipe.title || 'Recipe') + '\n\nFresh & colorful', italic);
    }

    // decoration under image
    page.drawRectangle({ x: imgX, y: imgY - 14, width: 60, height: 5, color: CORAL });
    page.drawRectangle({ x: imgX + 68, y: imgY - 14, width: 40, height: 5, color: YELLOW });
    page.drawRectangle({ x: imgX + 116, y: imgY - 14, width: 40, height: 5, color: TEAL });

    // Right column: Ingredients + Steps (60%)
    const rightX = MARGIN + leftW + 30;
    const rightW = PAGE_W - MARGIN - rightX; // ~266

    const ingredients = recipe.ingredients?.length ? recipe.ingredients : ['Fresh ingredients of your choice'];
    const steps = recipe.steps?.length ? recipe.steps : ['Prep', 'Cook', 'Enjoy'];

    let ry = PAGE_H - 64 - 24;
    ry = drawAccentCard(page, rightX, ry, rightW, 'INGREDIENTS', ingredients.slice(0, 7), TEAL, WHITE, TEAL_SOFT, font, bold, false);
    ry -= 16;
    drawAccentCard(page, rightX, ry, rightW, 'STEPS', steps.slice(0, 6), CORAL, WHITE, CORAL_SOFT, font, bold, true);
  }

  // ── Page 5: Notes & CTA ────────────────────────────────────────────────────
  {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: CREAM });
    page.drawCircle({ x: 80, y: PAGE_H - 90, size: 64, color: YELLOW });
    page.drawCircle({ x: PAGE_W - 90, y: 110, size: 70, color: CORAL });

    page.drawRectangle({ x: 0, y: PAGE_H - 18, width: PAGE_W, height: 18, color: TEAL });

    let y = PAGE_H - 110;
    page.drawText('Notes & Next Steps', { x: MARGIN, y, size: 26, font: bold, color: TEAL_DK });
    y -= 12;
    page.drawRectangle({ x: MARGIN, y: y - 2, width: 90, height: 4, color: CORAL });
    y -= 30;

    // Notes card
    const cardX = MARGIN;
    const cardW = PAGE_W - MARGIN * 2;
    page.drawRectangle({ x: cardX, y: 250, width: cardW, height: 320, color: YELLOW_SOFT });
    page.drawText('Quick meal-prep tips', { x: cardX + 16, y: 300 + 250 - 40, size: 13, font: bold, color: DARK });

    let ny = 250 + 320 - 70;
    for (const tip of notes) {
      const lines = wrap('\u2022  ' + tip, 11, cardW - 40, font);
      for (const line of lines) {
        if (ny < 270) break;
        page.drawText(line, { x: cardX + 16, y: ny, size: 11, font, color: DARK, maxWidth: cardW - 40 });
        ny -= 16;
      }
      ny -= 4;
    }

    // CTA box
    const ctaY = 140;
    const ctaH = 70;
    page.drawRectangle({ x: MARGIN, y: ctaY, width: cardW, height: ctaH, color: CORAL });
    page.drawText('YOUR NEXT STEP', { x: MARGIN + 16, y: ctaY + ctaH - 20, size: 9, font: bold, color: WHITE });
    const ctaLines = wrap(cta, 12, cardW - 40, font);
    let cy = ctaY + ctaH - 36;
    for (const line of ctaLines.slice(0, 3)) {
      page.drawText(line, { x: MARGIN + 16, y: cy, size: 12, font: italic, color: WHITE, maxWidth: cardW - 40 });
      cy -= 15;
    }

    page.drawText('Powered by Busmo', { x: MARGIN, y: 26, size: 9, font, color: MUTED });
  }

  return doc.save();
}
