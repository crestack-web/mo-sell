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
    id: 'market', name: 'Market',
    description: 'Bright, dense, and price-forward. Built for high-volume everyday selling.',
    previewBg: '#FFF7ED', previewAccent: '#EA580C', previewFont: 'Plus Jakarta Sans',
    bestFor: ['General', 'Home', 'Lifestyle'],
    badge: { label: 'Best Seller', color: '#065F46', bg: '#D1FAE5' },
    dataAttr: 'market', type: 'e-commerce',
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
];

export function getTheme(id?: string): ThemeMeta {
  return THEMES.find(t => t.id === id) ?? THEMES[0];
}

export function suggestTheme(category: string): StorefrontTheme {
  const c = category.toLowerCase();
  if (['fashion', 'jewellery', 'luxury', 'clothing', 'accessories'].some(k => c.includes(k))) return 'luxe';
  if (['food', 'grocery', 'market', 'home', 'lifestyle', 'general', 'handmade', 'artisan'].some(k => c.includes(k))) return 'market';
  if (['beauty', 'cosmetics', 'skincare', 'makeup', 'wellness', 'spa', 'candle', 'fitness', 'pop', 'music', 'creator'].some(k => c.includes(k))) return 'ankara';
  if (['premium', 'vintage', 'jewellery', 'nightlife', 'bar', 'quiet', 'elegant', 'gold'].some(k => c.includes(k))) return 'midnight';
  if (['editorial', 'art', 'minimal', 'neutral', 'fashion', 'photography'].some(k => c.includes(k))) return 'harmattan';
  if (['night', 'club', 'vibrant', 'bold', 'party', 'event', 'rave', 'dj'].some(k => c.includes(k))) return 'neon';
  if (['warm', 'sunset', 'summer', 'beach', 'travel', 'beauty', 'cosmetics'].some(k => c.includes(k))) return 'sunset';
  if (['design', 'software', 'digital', 'course', 'template', 'ebook', 'developer', 'photographer', 'architect'].some(k => c.includes(k))) return 'mono';
  return 'luxe';
}

// ─── Lazy-load theme components ─────────────────────────────────────────────

const themeLoader: Record<string, () => Promise<ThemeComponents>> = {
  luxe: () => import('./luxe').then(m => ({
    ProductCard: m.LuxeProductCard,
    CollectionCard: m.LuxeCollectionCard,
    Hero: m.LuxeHero,
    ProductPage: m.LuxeProductPage,
    cssClass: 'theme-luxe',
  })),
  market: () => import('./market').then(m => ({
    ProductCard: m.MarketProductCard,
    CollectionCard: m.MarketCollectionCard,
    Hero: m.MarketHero,
    ProductPage: m.MarketProductPage,
    cssClass: 'theme-market',
  })),
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
