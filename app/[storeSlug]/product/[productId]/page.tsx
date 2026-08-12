import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import { getStoreConfigBySlug } from '@/lib/store';
import { getThemeCssVars } from '@/components/StorefrontCanvas';
import { resolveLinkBioTheme } from '@/themes/registry';
import { ProductDetailClient } from '../../../store/[storeSlug]/product/[productId]/ProductDetailClient';

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
  if (!config) return { title: 'Store' };
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

export const dynamic = 'force-dynamic';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BioProductPage({
  params,
}: {
  params: Promise<{ storeSlug: string; productId: string }>;
}) {
  const { storeSlug, productId } = await params;

  const config = await getStoreConfig(storeSlug);
  if (!config) notFound();

  const product = await getProduct(config.businessId, productId);
  if (!product || !product.available) notFound();

  // The /{storeSlug} URL is the dedicated link-in-bio page, so product pages
  // under it render with the link-in-bio theme (never the e-commerce theme).
  const linkBioTheme = resolveLinkBioTheme(config.theme, config.linkBioTheme);

  // Inject the theme's --sf-* CSS variables so the theme-specific product
  // page matches the link-in-bio storefront exactly (same as the bio page).
  const themeVars = getThemeCssVars(linkBioTheme as any, config.primaryColor, config.secondaryColor);

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

  return (
    <div style={themeVars}>
      <ProductDetailClient
        product={JSON.parse(JSON.stringify(product))}
        storeSlug={storeSlug}
        currency={config.currency}
        theme={linkBioTheme}
        businessId={config.businessId}
        paystackPublicKey={config.paystackPublicKey}
        primaryColor={config.primaryColor}
        forceLinkBio={true}
      />
    </div>
  );
}
