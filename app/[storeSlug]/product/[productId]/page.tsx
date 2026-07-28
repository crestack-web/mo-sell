import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAdminDb } from '@/lib/firebase-admin';
import { ProductDetailClient } from './ProductDetailClient';

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function getStoreConfig(storeSlug: string) {
  try {
    const db = getAdminDb();
    const idxDoc = await db.collection('storeIndex').doc(storeSlug).get();
    if (idxDoc.exists) {
      const bId = idxDoc.data()?.businessId as string | undefined;
      if (bId) {
        const configSnap = await db.collection('businesses').doc(bId).collection('store').doc('config').get();
        if (configSnap.exists) {
          const data = configSnap.data()!;
          if ((data.status ?? 'draft') !== 'active') return null;
          return { ...data, businessId: bId } as Record<string, any>;
        }
      }
    }
    return null;
  } catch { return null; }
}

async function getProduct(businessId: string, productId: string) {
  try {
    const db = getAdminDb();
    const snap = await db.collection('businesses').doc(businessId).collection('storeProducts').doc(productId).get();
    if (!snap.exists) return null;
    const data = snap.data()!;
    return { id: snap.id, ...data } as any;
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
  return {
    title: `${product.displayName} — ${config.storeName}`,
    description: product.description ?? `Buy ${product.displayName} at ${config.storeName}`,
    openGraph: {
      title: `${product.displayName} — ${config.storeName}`,
      description: product.description ?? '',
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
    const dbAnalytics = getAdminDb();
    dbAnalytics.collection('businesses').doc(config.businessId).collection('storeAnalytics').add({
      eventType: 'page_view', storeSlug,
      businessId: config.businessId,
      pageType: 'product', productId,
      createdAt: new Date().toISOString(),
    }).catch(() => {});
  } catch {}

  return (
    <ProductDetailClient
      product={product}
      storeSlug={storeSlug}
      currency={config.currency}
      theme={config.theme ?? 'luxe'}
      businessId={config.businessId}
    />
  );
}
