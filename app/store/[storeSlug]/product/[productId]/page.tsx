import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import { getStoreConfigBySlug } from '@/lib/store';
import { resolveEcommerceTheme } from '@/themes/registry';
import { cookies } from 'next/headers';
import { ProductDetailClient } from './ProductDetailClient';

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function getStoreConfig(storeSlug: string) {
  try {
    return await getStoreConfigBySlug(storeSlug);
  } catch { return null; }
}

async function getProduct(businessId: string, productId: string) {
  try {
    const supabase = getSupabaseServer();
    const { data } = await supabase
      .from('storeProducts')
      .select('*')
      .eq('businessId', businessId)
      .eq('id', productId)
      .maybeSingle();
    if (!data || (data.status ?? 'active') === 'draft') return null;
    const images = typeof data.images === 'string' ? JSON.parse(data.images || '[]') : (Array.isArray(data.images) ? data.images : []);
    return { id: data.id, ...data, images } as any;
  } catch { return null; }
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeSlug: string; productId: string }>;
}): Promise<Metadata> {
  const { storeSlug, productId } = await params;
  const config = await getStoreConfig(storeSlug);
  if (!config) return {};
  const product = await getProduct(config.businessId, productId);
  if (!product) return { title: config.storeName };
  const plainDescription = product.description
    ? product.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200)
    : `Buy ${product.displayName} at ${config.storeName}`;
  return {
    title: `${product.displayName} — ${config.storeName}`,
    description: plainDescription,
    openGraph: {
      title: `${product.displayName} — ${config.storeName}`,
      description: plainDescription,
      images: product.images?.[0] ? [product.images[0]] : [],
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ storeSlug: string; productId: string }>;
}) {
  const { storeSlug, productId } = await params;

  const config = await getStoreConfig(storeSlug);
  if (!config) notFound();

  const product = await getProduct(config.businessId, productId);
  if (!product || !product.available) notFound();

  // Fire page_view analytics (fire-and-forget)
  try {
    const supabaseAnalytics = getSupabaseServer();
    supabaseAnalytics.from('storeAnalytics').insert({
      eventType: 'page_view', storeSlug,
      businessId: config.businessId,
      pageType: 'product', productId,
      createdAt: new Date().toISOString(),
    }).then(() => {}, () => {});
  } catch {}

  const defaultTheme = config.theme ?? 'luxe';
  const cookieStore = await cookies();
  const themeOverride = cookieStore.get(`sf_theme_override_${storeSlug}`)?.value;
  const theme = themeOverride || defaultTheme;

  return (
    <ProductDetailClient
      product={product}
      storeSlug={storeSlug}
      currency={config.currency}
      theme={resolveEcommerceTheme(theme)}
      businessId={config.businessId}
      paystackPublicKey={config.paystackPublicKey}
    />
  );
}
