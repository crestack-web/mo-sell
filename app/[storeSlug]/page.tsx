import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStoreConfigBySlug } from '@/lib/store';
import { resolveLinkBioTheme } from '@/themes/registry';
import type { ProductCardData } from '@/themes/types';
import { BioPageClient } from './BioPageClient';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';

async function getStoreConfig(storeSlug: string) {
  try {
    return await getStoreConfigBySlug(storeSlug);
  } catch { return null; }
}

async function getProducts(businessId: string) {
  try {
    const supabase = getSupabaseServer();
    const { data: rows } = await supabase
      .from('storeProducts')
      .select('*')
      .eq('businessId', businessId);
    const products = (rows ?? [])
      .filter((r: any) => (r.status ?? 'active') !== 'draft')
      .filter((r: any) => r.available === true)
      .slice(0, 100);
    return products.map((row: any) => {
      const images = typeof row.images === 'string' ? JSON.parse(row.images || '[]') : (Array.isArray(row.images) ? row.images : []);
      return {
        id: row.id,
        displayName: row.displayName ?? '',
        price: row.price ?? 0,
        compareAtPrice: row.compareAtPrice ?? null,
        images,
        category: row.category ?? '',
        available: row.available ?? true,
        stock: row.stock ?? 0,
        productType: row.productType ?? 'physical',
        description: row.description ?? '',
        digitalFileUrl: row.digitalFileUrl ?? null,
        rating: typeof row.rating === 'number' ? row.rating : undefined,
        reviewCount: typeof row.reviewCount === 'number' ? row.reviewCount : undefined,
      } as ProductCardData;
    });
  } catch { return []; }
}

const MO_SELL_BRAND_LOGO = 'mosell_gpzl2q';

function isMoSellBrandLogo(url?: string | null): boolean {
  return !!url && url.includes(MO_SELL_BRAND_LOGO);
}

/** Prefer creator profile photo for link previews; never use the MO-Sell brand mark. */
function bioShareImage(config: { logoUrl?: string | null; linkBio?: any; storeName?: string }): string | null {
  const linkBio = (config as any).linkBio ?? {};
  const avatar = typeof linkBio.avatarUrl === 'string' ? linkBio.avatarUrl.trim() : '';
  if (avatar && !isMoSellBrandLogo(avatar)) return avatar;
  const logo = config.logoUrl?.trim() || '';
  if (logo && !isMoSellBrandLogo(logo)) return logo;
  return null;
}

export async function generateMetadata(
  { params }: { params: Promise<{ storeSlug: string }> }
): Promise<Metadata> {
  const { storeSlug } = await params;
  const config = await getStoreConfig(storeSlug);
  if (!config) return { title: 'Store' };
  const name = ((config as any).linkBio?.name || config.storeName || 'Store').trim();
  const description =
    ((config as any).linkBio?.bio || config.tagline || `${name} — link-in-bio`).trim();
  const image = bioShareImage(config as any);
  return {
    title: name,
    description,
    openGraph: {
      title: name,
      description,
      type: 'profile',
      images: image ? [{ url: image }] : [],
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: name,
      description,
      images: image ? [image] : [],
    },
  };
}

export const dynamic = 'force-dynamic';

export default async function BioPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const config = await getStoreConfig(storeSlug);
  if (!config) notFound();

  // The /{storeSlug} URL is the dedicated link-in-bio page and always
  // exists alongside the storefront at /store/{storeSlug}.
  const linkBioTheme = resolveLinkBioTheme(config.theme, config.linkBioTheme);
  const primary   = config.primaryColor ?? '#0EA5E9';
  const secondary = config.secondaryColor ?? '#6366F1';

  const products = await getProducts(config.businessId);

  try {
    const supabaseAnalytics = getSupabaseServer();
    supabaseAnalytics.from('storeAnalytics').insert({
      eventType: 'page_view', storeSlug, businessId: config.businessId, pageType: 'bio',
      createdAt: new Date().toISOString(),
    }).then(() => {}, () => {});
  } catch {}

  return (
    <BioPageClient
      theme={linkBioTheme}
      primary={primary}
      secondary={secondary}
      config={{
        storeSlug,
        storeName: config.storeName,
        logoUrl: config.logoUrl,
        primaryColor: primary,
        secondaryColor: secondary,
        currency: config.currency,
        tagline: config.tagline,
        contactEmail: config.contactEmail,
        contactPhone: config.contactPhone,
        paystackPublicKey: config.paystackPublicKey ?? '',
      }}
      products={products as any}
      linkBio={(config as any).linkBio}
    />
  );
}
