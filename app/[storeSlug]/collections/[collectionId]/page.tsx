import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import { getStoreConfigBySlug } from '@/lib/store';
import { ProductGrid } from '../../components/ProductGrid';
import type { ProductCardData } from '../../components/ProductCard';

async function getStoreConfig(storeSlug: string) {
  try {
    return await getStoreConfigBySlug(storeSlug);
  } catch { return null; }
}

async function getCollection(businessId: string, collectionId: string) {
  try {
    const supabase = getSupabaseServer();
    const { data } = await supabase
      .from('storeCollections')
      .select('*')
      .eq('businessId', businessId)
      .eq('id', collectionId)
      .maybeSingle();
    if (!data) return null;
    return { id: data.id, ...data, title: data.title ?? data.name ?? '' } as any;
  } catch { return null; }
}

async function getProducts(businessId: string, collectionId: string) {
  try {
    const supabase = getSupabaseServer();
    const { data: rows } = await supabase
      .from('storeProducts')
      .select('*')
      .eq('businessId', businessId);
    return (rows ?? [])
      .filter((r: any) => r.available === true)
      .filter((r: any) => (Array.isArray(r.collectionIds) ? r.collectionIds.includes(collectionId) : false))
      .slice(0, 100)
      .map((row: any) => {
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
        } as ProductCardData;
      });
  } catch { return []; }
}

// ─── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeSlug: string; collectionId: string }>;
}): Promise<Metadata> {
  const { storeSlug, collectionId } = await params;
  const config = await getStoreConfig(storeSlug);
  if (!config) return { title: 'Collection' };
  const collection = await getCollection(config.businessId, collectionId);
  return {
    title: collection ? `${collection.title} — ${config.storeName}` : config.storeName,
    description: collection?.description || `Shop ${collection?.title} at ${config.storeName}`,
    openGraph: {
      title: collection?.title ?? config.storeName,
      images: collection?.coverImageUrl ? [collection.coverImageUrl] : config.logoUrl ? [config.logoUrl] : [],
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ storeSlug: string; collectionId: string }>;
}) {
  const { storeSlug, collectionId } = await params;

  const config = await getStoreConfig(storeSlug);
  if (!config) notFound();

  const [collection, products] = await Promise.all([
    getCollection(config.businessId, collectionId),
    getProducts(config.businessId, collectionId),
  ]);

  if (!collection) notFound();

  // Fire analytics event (fire-and-forget)
  try {
    const supabaseAnalytics = getSupabaseServer();
    supabaseAnalytics.from('storeAnalytics').insert({
      eventType: 'page_view', storeSlug,
      businessId: config.businessId, pageType: 'collection',
      createdAt: new Date().toISOString(),
    }).then(() => {}, () => {});
  } catch {}

  return (
    <div className="sf-page">
      {/* Collection header */}
      <section className="sf-hero" style={{ paddingBottom: '32px' }}>
        {collection.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={collection.coverImageUrl}
            alt={collection.title}
            style={{
              width: '100%', maxHeight: 240, objectFit: 'cover',
              borderRadius: 16, marginBottom: 24,
            }}
          />
        )}
        <h1>{collection.title}</h1>
        {collection.description && (
          <p style={{ maxWidth: 560, margin: '0 auto' }}>{collection.description}</p>
        )}
        <p style={{ fontSize: '0.85rem', color: 'var(--sf-text-3)', marginTop: 8 }}>
          {products.length} product{products.length !== 1 ? 's' : ''}
        </p>
      </section>

      {/* Products */}
      <section className="sf-section">
        <ProductGrid
          products={products}
          storeSlug={storeSlug}
          currency={config.currency}
          emptyMessage="No products in this collection yet."
        />
      </section>

      {/* Back link */}
      <div style={{ textAlign: 'center', padding: '16px 0 48px' }}>
        <a
          href={`/${storeSlug}`}
          style={{
            fontSize: 14, color: 'var(--sf-text-2)',
            textDecoration: 'none', fontWeight: 500,
          }}
        >
          ← Back to all products
        </a>
      </div>
    </div>
  );
}
