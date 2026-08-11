import React from 'react';
import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { getStoreConfigBySlug } from '@/lib/store';
import { resolveStoreMode } from '@/themes/registry';
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

export async function generateMetadata(
  { params }: { params: Promise<{ storeSlug: string }> }
): Promise<Metadata> {
  const { storeSlug } = await params;
  const config = await getStoreConfig(storeSlug);
  if (!config) return { title: 'Store' };
  return {
    title: config.storeName,
    description: config.tagline ?? `${config.storeName} — link-in-bio`,
    openGraph: {
      title: config.storeName,
      description: config.tagline ?? `${config.storeName} — link-in-bio`,
      images: config.logoUrl ? [config.logoUrl] : [],
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

  // The /bio/{storeSlug} URL only exists for stores running both a link-in-bio
  // page and a full store at the same time ('both' mode). Everything else stays
  // on the main /{storeSlug} URL.
  const mode = resolveStoreMode(config.theme, config.mode, config.linkBioTheme);
  if (mode !== 'both') redirect(`/${storeSlug}`);

  const linkBioTheme = config.linkBioTheme ?? 'ankara';
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
