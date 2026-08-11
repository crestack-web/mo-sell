import type { StorefrontTheme } from '@/types/mo-sell.types';
import type { ThemeComponents, ThemeProductCardProps, ThemeCollectionCardProps, ThemeHeroProps, ThemeProductPageProps } from './types';

// ─── Theme metadata (for sell dashboard UI) ─────────────────────────────────

export type ThemeLayoutType = 'link-style' | 'e-commerce';

export interface ThemeMeta {
  id: StorefrontTheme;
  name: string;
  description: string;
  previewBg: string;
  previewAccent: string;
  previewFont: string;
  bestFor: string[];
  badge: { label: string; color: string; bg: string } | null;
  dataAttr: string;
  type: ThemeLayoutType;
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'luxe', name: 'Luxe',
    description: 'Editorial, high-end fashion with large imagery and luxury whitespace.',
    previewBg: '#0A0A0A', previewAccent: '#C9A84C', previewFont: 'Playfair Display',
    bestFor: ['Fashion', 'Accessories'],
    badge: { label: 'Premium', color: '#92400E', bg: '#FEF3C7' },
    dataAttr: 'luxe', type: 'e-commerce',
  },
  {
    id: 'atelier', name: 'Atelier Noir',
    description: 'Quiet luxury fashion. Editorial dark palette, hairline rules and considered typography.',
    previewBg: '#0B0B0B', previewAccent: '#D4AF6A', previewFont: 'Georgia',
    bestFor: ['Fashion', 'Luxury', 'Accessories'],
    badge: { label: 'Luxury', color: '#0B0B0B', bg: '#D4AF6A' },
    dataAttr: 'atelier', type: 'e-commerce',
  },
  {
    id: 'citrus', name: 'Citrus Market',
    description: 'Fresh & playful. Warm cream canvas, orange accents and round, friendly cards.',
    previewBg: '#FFF4DE', previewAccent: '#FF7A1A', previewFont: 'Verdana',
    bestFor: ['Grocery', 'Food', 'Juice', 'Wellness'],
    badge: null,
    dataAttr: 'citrus', type: 'e-commerce',
  },
  {
    id: 'nordly', name: 'Nordic Minimal',
    description: 'Furniture & home goods. Airy neutrals, hairline grids and restrained muted accents.',
    previewBg: '#F7F5F0', previewAccent: '#5B6B58', previewFont: 'Century Gothic',
    bestFor: ['Furniture', 'Home', 'Minimal', 'Lifestyle'],
    badge: null,
    dataAttr: 'nordly', type: 'e-commerce',
  },
  {
    id: 'neotech', name: 'Neo Tech',
    description: 'Electronics & gadgets. Deep blue space, electric accents and spec-card grids.',
    previewBg: '#0A0E17', previewAccent: '#3D8BFF', previewFont: 'Arial',
    bestFor: ['Electronics', 'Gadgets', 'Tech'],
    badge: null,
    dataAttr: 'neotech', type: 'e-commerce',
  },
  {
    id: 'terra', name: 'Terra Craft',
    description: 'Artisanal & organic. Warm earthy surface, sage and clay accents, generous radii.',
    previewBg: '#F1EEE4', previewAccent: '#6B7A4F', previewFont: 'Trebuchet MS',
    bestFor: ['Handmade', 'Artisan', 'Organic', 'Craft'],
    badge: { label: 'Handmade', color: '#B5652E', bg: '#F1EEE4' },
    dataAttr: 'terra', type: 'e-commerce',
  },
  {
    id: 'volt', name: 'Neon Streetwear',
    description: 'Bold streetwear drops. Hard black, acid-yellow chips and sharp square corners.',
    previewBg: '#000000', previewAccent: '#E9FF3D', previewFont: 'Arial Narrow',
    bestFor: ['Streetwear', 'Sneakers', 'Drops', 'Urban'],
    badge: { label: 'Drop', color: '#000000', bg: '#E9FF3D' },
    dataAttr: 'volt', type: 'e-commerce',
  },
  {
    id: 'botanica', name: 'Botanica',
    description: 'Clean beauty & botanicals. Deep green surfaces, gold accents and soft organic cards.',
    previewBg: '#0F2318', previewAccent: '#D8A667', previewFont: 'Candara',
    bestFor: ['Beauty', 'Skincare', 'Botanicals', 'Wellness'],
    badge: null,
    dataAttr: 'botanica', type: 'e-commerce',
  },
  {
    id: 'prism', name: 'Prism Studio',
    description: 'Holographic gen-z beauty. Gradient glass, floating thumbnails and glowing pill buttons.',
    previewBg: '#7B2FF7', previewAccent: '#FFE066', previewFont: 'Arial Rounded MT Bold',
    bestFor: ['Beauty', 'Makeup', 'Gen-Z', 'Trend'],
    badge: null,
    dataAttr: 'prism', type: 'e-commerce',
  },
  {
    id: 'ankara', name: 'Ankara Pop',
    description: 'Bold and loud. Bright yellow page with pop-pink and teal rows, chunky display type.',
    previewBg: '#FFC93C', previewAccent: '#FF3E7F', previewFont: 'Arial Black',
    bestFor: ['Creators', 'Musicians', 'Pop', 'Culture'],
    badge: { label: 'Bold', color: '#FFFFFF', bg: '#FF3E7F' },
    dataAttr: 'ankara', type: 'link-style',
  },
  {
    id: 'midnight', name: 'Midnight Gold',
    description: 'Premium and quiet. Near-black page framed in gold with a serif display.',
    previewBg: '#0B0B0F', previewAccent: '#C9A227', previewFont: 'Georgia',
    bestFor: ['Premium', 'Jewellery', 'Nightlife', 'Vintage'],
    badge: { label: 'Premium', color: '#0B0B0F', bg: '#C9A227' },
    dataAttr: 'midnight', type: 'link-style',
  },
  {
    id: 'harmattan', name: 'Harmattan Sand',
    description: 'Dry-season minimal. Sand-toned page with a horizon bar, steel-blue accent, serif type.',
    previewBg: '#EDE7D9', previewAccent: '#4C6B8A', previewFont: 'Georgia',
    bestFor: ['Editorial', 'Art', 'Fashion', 'Minimal'],
    badge: null,
    dataAttr: 'harmattan', type: 'link-style',
  },
  {
    id: 'neon', name: 'Neon Lagos',
    description: 'After-dark energy. Black page with scan-line texture, cyan borders and magenta accents.',
    previewBg: '#0A0A0A', previewAccent: '#FF2E9A', previewFont: 'Arial Narrow',
    bestFor: ['Nightlife', 'Events', 'Clubs', 'Raves'],
    badge: null,
    dataAttr: 'neon', type: 'link-style',
  },
  {
    id: 'sunset', name: 'Lagos Sunset',
    description: 'Soft gradient glow. Purple-to-coral gradient with blurred blobs and glassy cards.',
    previewBg: '#6E3AFF', previewAccent: '#FFD24C', previewFont: 'Verdana',
    bestFor: ['Fashion', 'Beauty', 'Cosmetics', 'Travel'],
    badge: null,
    dataAttr: 'sunset', type: 'link-style',
  },
  {
    id: 'mono', name: 'Mono Studio',
    description: 'Sharp and editorial. Black-on-white with a single red accent, square corners and stamp mark.',
    previewBg: '#FFFFFF', previewAccent: '#FF0000', previewFont: 'Helvetica Neue',
    bestFor: ['Photographers', 'Designers', 'Architects', 'Editorial'],
    badge: null,
    dataAttr: 'mono', type: 'link-style',
  },
  {
    id: 'blush', name: 'Blush Silk',
    description: 'Soft pink grid layout. Centered profile with a 2-column tile grid in gentle blush tones.',
    previewBg: '#FCE8EC', previewAccent: '#D88C9A', previewFont: 'Georgia',
    bestFor: ['Beauty', 'Fashion', 'Feminine', 'Lifestyle'],
    badge: null,
    dataAttr: 'blush', type: 'link-style',
  },
  {
    id: 'rose', name: 'Rosé Editorial',
    description: 'Masthead name with a numbered index list. Editorial serif masthead and hairline rules.',
    previewBg: '#171114', previewAccent: '#C97B8B', previewFont: 'Georgia',
    bestFor: ['Editorial', 'Fashion', 'Art', 'Feminine'],
    badge: null,
    dataAttr: 'rose', type: 'link-style',
  },
  {
    id: 'pearl', name: 'Pearl Glow',
    description: 'Floating glass card with a 2x2 translucent tile grid over a pastel gradient.',
    previewBg: '#E0C3FC', previewAccent: '#F5A6C9', previewFont: 'Verdana',
    bestFor: ['Beauty', 'Cosmetics', 'Soft', 'Feminine'],
    badge: null,
    dataAttr: 'pearl', type: 'link-style',
  },
  {
    id: 'cherry', name: 'Cherry Pop',
    description: 'Asymmetric sticker collage. Loud pink page with rotated white sticker links and dot texture.',
    previewBg: '#FF4D6D', previewAccent: '#FFD400', previewFont: 'Arial Black',
    bestFor: ['Pop', 'Music', 'Trend', 'Bold'],
    badge: null,
    dataAttr: 'cherry', type: 'link-style',
  },
  {
    id: 'quiet', name: 'Quiet Creator',
    description: 'Left-aligned minimal list. Monogram header, plain numbered rows and a hairline accent.',
    previewBg: '#111111', previewAccent: '#B08968', previewFont: 'Helvetica Neue',
    bestFor: ['Minimal', 'Photographers', 'Designers', 'Quiet'],
    badge: null,
    dataAttr: 'quiet', type: 'link-style',
  },
  {
    id: 'concrete', name: 'Concrete Studio',
    description: 'Strict bordered 2-col block grid with a monospace body and grid-line texture.',
    previewBg: '#E5E3DE', previewAccent: '#8C8A82', previewFont: 'Arial',
    bestFor: ['Design', 'Studio', 'Architecture', 'Grid'],
    badge: null,
    dataAttr: 'concrete', type: 'link-style',
  },
  {
    id: 'chrome', name: 'Chrome Nova',
    description: 'HUD-style list with offset rows and index glyphs over a metallic gradient.',
    previewBg: '#6E7378', previewAccent: '#00E5FF', previewFont: 'Arial',
    bestFor: ['Tech', 'HUD', 'Futuristic', 'Gaming'],
    badge: null,
    dataAttr: 'chrome', type: 'link-style',
  },
];

export function getTheme(id?: string): ThemeMeta {
  return THEMES.find(t => t.id === id) ?? THEMES[0];
}

export function suggestTheme(category: string): StorefrontTheme {
  const c = category.toLowerCase();
  if (['fashion', 'jewellery', 'luxury', 'clothing', 'accessories'].some(k => c.includes(k))) return 'atelier';
  if (['food', 'grocery', 'market', 'juice', 'wellness', 'fresh'].some(k => c.includes(k))) return 'citrus';
  if (['furniture', 'home', 'minimal', 'lifestyle', 'general', 'interior'].some(k => c.includes(k))) return 'nordly';
  if (['electronics', 'gadget', 'tech', 'device', 'computer', 'audio'].some(k => c.includes(k))) return 'neotech';
  if (['handmade', 'artisan', 'organic', 'craft', 'ceramic', 'plant'].some(k => c.includes(k))) return 'terra';
  if (['streetwear', 'sneaker', 'urban', 'drop', 'skate'].some(k => c.includes(k))) return 'volt';
  if (['beauty', 'cosmetics', 'skincare', 'makeup', 'botanical', 'spa', 'candle', 'fitness', 'pop', 'music', 'creator'].some(k => c.includes(k))) return 'botanica';
  if (['gen-z', 'holographic', 'trend', 'studio'].some(k => c.includes(k))) return 'prism';
  if (['premium', 'vintage', 'jewellery', 'nightlife', 'bar', 'quiet', 'elegant', 'gold'].some(k => c.includes(k))) return 'midnight';
  if (['editorial', 'art', 'minimal', 'neutral', 'fashion', 'photography'].some(k => c.includes(k))) return 'harmattan';
  if (['night', 'club', 'vibrant', 'bold', 'party', 'event', 'rave', 'dj'].some(k => c.includes(k))) return 'neon';
  if (['warm', 'sunset', 'summer', 'beach', 'travel', 'beauty', 'cosmetics'].some(k => c.includes(k))) return 'sunset';
  if (['design', 'software', 'digital', 'course', 'template', 'ebook', 'developer', 'photographer', 'architect'].some(k => c.includes(k))) return 'mono';
  return 'atelier';
}

// ─── Lazy-load theme components ─────────────────────────────────────────────

const themeLoader: Record<string, () => Promise<ThemeComponents>> = {
  luxe: () => import('./luxe').then(m => ({
    ProductCard: m.LuxeProductCard,
    CollectionCard: m.LuxeCollectionCard,
    Hero: m.LuxeHero,
    ProductPage: m.LuxeProductPage,
    SearchBar: m.LuxeSearchBar,
    cssClass: 'theme-luxe',
  })),
  atelier: () => import('./shared/factory').then(m => m.makeTheme('atelier')),
  citrus: () => import('./shared/factory').then(m => m.makeTheme('citrus')),
  nordly: () => import('./shared/factory').then(m => m.makeTheme('nordly')),
  neotech: () => import('./shared/factory').then(m => m.makeTheme('neotech')),
  terra: () => import('./shared/factory').then(m => m.makeTheme('terra')),
  volt: () => import('./shared/factory').then(m => m.makeTheme('volt')),
  botanica: () => import('./shared/factory').then(m => m.makeTheme('botanica')),
  prism: () => import('./shared/factory').then(m => m.makeTheme('prism')),
};

export type ThemeId = keyof typeof themeLoader;

export async function getThemeComponents(themeId: string): Promise<ThemeComponents> {
  const loader = themeLoader[themeId];
  if (!loader) {
    return themeLoader.luxe();
  }
  return loader();
}

export async function getThemeComponentsServer(themeId: string): Promise<ThemeComponents> {
  const loader = themeLoader[themeId];
  if (!loader) {
    return themeLoader.luxe();
  }
  return loader();
}

export function isLinkTheme(themeId: string): boolean {
  const meta = THEMES.find(t => t.id === themeId);
  return meta?.type === 'link-style';
}

export function isCreatorTheme(themeId: string): boolean {
  return false;
}

export function getThemeType(themeId: string): ThemeLayoutType {
  const meta = THEMES.find(t => t.id === themeId);
  if (meta) return meta.type;
  return 'link-style';
}

// ─── Store ↔ Link-in-bio decoupling ─────────────────────────────────────────

/**
 * The store and the link-in-bio are independent pages:
 *   - /store/{storeSlug} → e-commerce storefront, rendered with `theme`
 *   - /{storeSlug}       → link-in-bio page, rendered with `linkBioTheme`
 *
 * A link-style theme is never a valid storefront theme, so the store always
 * renders with an e-commerce theme (defaulting to luxe).
 */
export function resolveEcommerceTheme(theme?: string | null): StorefrontTheme {
  const t = theme ?? null;
  if (t && getThemeType(t) === 'e-commerce') return t as StorefrontTheme;
  return 'luxe';
}

/**
 * Effective link-in-bio theme. Prefers the explicitly chosen `linkBioTheme`;
 * legacy stores may only have a link-style `theme` set, which we reuse.
 */
export function resolveLinkBioTheme(
  theme?: string | null,
  linkBioTheme?: string | null,
): string {
  if (linkBioTheme) return linkBioTheme;
  const t = theme ?? null;
  if (t && getThemeType(t) === 'link-style') return t;
  return 'ankara';
}
