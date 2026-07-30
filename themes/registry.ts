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
    id: 'glow', name: 'Glow',
    description: 'One-page bio store for creators. Profile, social links, and products in one scroll.',
    previewBg: '#FDF6F0', previewAccent: '#E8927C', previewFont: 'DM Sans',
    bestFor: ['Creators', 'Influencers', 'Coaches'],
    badge: null,
    dataAttr: 'glow', type: 'link-style',
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
    id: 'creator', name: 'Creator',
    description: 'Clean one-page bio store for digital creators. Social links and products in one scroll.',
    previewBg: '#0F172A', previewAccent: '#6366F1', previewFont: 'Sora',
    bestFor: ['Digital Products', 'Creators'],
    badge: { label: 'Best for Creators', color: '#5B21B6', bg: '#EDE9FE' },
    dataAttr: 'creator', type: 'link-style',
  },
  {
    id: 'link', name: 'Link',
    description: 'Centered bio page. Profile, social links, and products in one scroll.',
    previewBg: '#0D0D0D', previewAccent: '#A78BFA', previewFont: 'Plus Jakarta Sans',
    bestFor: ['Coaches', 'Creators', 'Freelancers'],
    badge: { label: 'E-COMMERCE', color: '#166534', bg: '#DCFCE7' },
    dataAttr: 'link', type: 'link-style',
  },
  {
    id: 'pulse', name: 'Pulse',
    description: 'Vibrant one-page store with social links and product showcase.',
    previewBg: '#FFF7ED', previewAccent: '#FF6B35', previewFont: 'Outfit',
    bestFor: ['Influencers', 'Content Creators'],
    badge: null,
    dataAttr: 'pulse', type: 'link-style',
  },
  {
    id: 'vault', name: 'Vault',
    description: 'Premium one-page product page. Bio, socials, and digital products.',
    previewBg: '#0B1D3A', previewAccent: '#3B82F6', previewFont: 'Space Grotesk',
    bestFor: ['Digital Products', 'Ebooks', 'Courses'],
    badge: null,
    dataAttr: 'vault', type: 'link-style',
  },
  {
    id: 'atlas', name: 'Atlas',
    description: 'Professional one-page bio for consultants and freelancers. Portfolio and booking in one scroll.',
    previewBg: '#F8FAFC', previewAccent: '#0D9488', previewFont: 'Manrope',
    bestFor: ['Consultants', 'Designers', 'Freelancers'],
    badge: { label: 'Pro Services', color: '#134E4A', bg: '#CCFBF1' },
    dataAttr: 'atlas', type: 'link-style',
  },
  {
    id: 'spark', name: 'Spark',
    description: 'Coach bio page with social links and product offerings.',
    previewBg: '#FFF8EE', previewAccent: '#D97706', previewFont: 'Raleway',
    bestFor: ['Coaches', 'Trainers', 'Mentors'],
    badge: null,
    dataAttr: 'spark', type: 'link-style',
  },
  {
    id: 'bazaar', name: 'Bazaar',
    description: 'One-page bio store for small businesses. Products and social links in one scroll.',
    previewBg: '#ECFDF5', previewAccent: '#059669', previewFont: 'Poppins',
    bestFor: ['Fashion', 'Food', 'Beauty', 'Handmade'],
    badge: { label: 'Small Biz', color: '#065F46', bg: '#D1FAE5' },
    dataAttr: 'bazaar', type: 'link-style',
  },
  {
    id: 'abby', name: 'Abby',
    description: 'Clean branded bio page for creators and coaches. Blue accent, modern and professional.',
    previewBg: '#F8FAFC', previewAccent: '#5383FF', previewFont: 'Nunito Sans',
    bestFor: ['Creators', 'Coaches', 'Digital Products'],
    badge: { label: 'NEW', color: '#2563EB', bg: '#DBEAFE' },
    dataAttr: 'abby', type: 'link-style',
  },
];

export function getTheme(id?: string): ThemeMeta {
  return THEMES.find(t => t.id === id) ?? THEMES[0];
}

export function suggestTheme(category: string): StorefrontTheme {
  const c = category.toLowerCase();
  if (['fashion', 'jewellery', 'luxury', 'clothing', 'accessories'].some(k => c.includes(k))) return 'luxe';
  if (['beauty', 'cosmetics', 'skincare', 'glow', 'makeup', 'wellness', 'spa', 'candle'].some(k => c.includes(k))) return 'glow';
  if (['digital', 'ebook', 'template', 'course', 'notion', 'preset', 'design'].some(k => c.includes(k))) return 'vault';
  if (['influencer', 'content', 'creator', 'youtube', 'tiktok', 'personal', 'brand', 'bio', 'link'].some(k => c.includes(k))) return 'pulse';
  if (['coach', 'mentor', 'trainer', 'educator', 'fitness', 'transformation'].some(k => c.includes(k))) return 'spark';
  if (['consult', 'freelance', 'designer', 'developer', 'photographer', 'service', 'agency', 'booking'].some(k => c.includes(k))) return 'atlas';
  if (['food', 'grocery', 'market', 'home', 'lifestyle', 'general', 'handmade', 'artisan'].some(k => c.includes(k))) return 'bazaar';
  if (['creator', 'course', 'software'].some(k => c.includes(k))) return 'creator';
  if (['bio', 'link', 'profile', 'simple', 'clean', 'professional'].some(k => c.includes(k))) return 'abby';
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
  creator: () => import('./creator').then(m => ({
    ProductCard: m.CreatorProductCard,
    CollectionCard: m.CreatorCollectionCard,
    Hero: m.CreatorHero,
    ProductPage: m.CreatorProductPage,
    cssClass: 'theme-creator',
  })),
  glow: () => import('./glow').then(m => ({
    ProductCard: m.GlowProductCard,
    CollectionCard: m.GlowCollectionCard,
    Hero: m.GlowHero,
    ProductPage: m.GlowProductPage,
    cssClass: 'theme-glow',
  })),
  link: () => import('./link').then(m => ({
    ProductCard: m.LinkProductCard,
    CollectionCard: m.LinkCollectionCard,
    Hero: m.LinkHero,
    ProductPage: m.LinkProductPage,
    cssClass: 'theme-link',
  })),
  pulse: () => import('./pulse').then(m => ({
    ProductCard: m.PulseProductCard,
    CollectionCard: m.PulseCollectionCard,
    Hero: m.PulseHero,
    ProductPage: m.PulseProductPage,
    cssClass: 'theme-pulse',
  })),
  vault: () => import('./vault').then(m => ({
    ProductCard: m.VaultProductCard,
    CollectionCard: m.VaultCollectionCard,
    Hero: m.VaultHero,
    ProductPage: m.VaultProductPage,
    cssClass: 'theme-vault',
  })),
  atlas: () => import('./atlas').then(m => ({
    ProductCard: m.AtlasProductCard,
    CollectionCard: m.AtlasCollectionCard,
    Hero: m.AtlasHero,
    ProductPage: m.AtlasProductPage,
    cssClass: 'theme-atlas',
  })),
  spark: () => import('./spark').then(m => ({
    ProductCard: m.SparkProductCard,
    CollectionCard: m.SparkCollectionCard,
    Hero: m.SparkHero,
    ProductPage: m.SparkProductPage,
    cssClass: 'theme-spark',
  })),
  bazaar: () => import('./bazaar').then(m => ({
    ProductCard: m.BazaarProductCard,
    CollectionCard: m.BazaarCollectionCard,
    Hero: m.BazaarHero,
    ProductPage: m.BazaarProductPage,
    cssClass: 'theme-bazaar',
  })),
  abby: () => import('./abby').then(m => ({
    ProductCard: m.AbbyProductCard,
    CollectionCard: m.AbbyCollectionCard,
    Hero: m.AbbyHero,
    ProductPage: m.AbbyProductPage,
    cssClass: 'theme-abby',
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
  return meta?.type ?? 'e-commerce';
}
