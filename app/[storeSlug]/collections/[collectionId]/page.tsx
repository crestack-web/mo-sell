import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getServerFirestore as getAdminDb } from '@/lib/server-firestore';
import { ProductGrid } from '../../components/ProductGrid';
import type { ProductCardData } from '../../components/ProductCard';

async function getStoreConfig(storeSlug: string) {
  try {
    const db = getAdminDb();
    let data: any = null;
    let businessId = '';

    const idxDoc = await db.collection('storeIndex').doc(storeSlug).get();
    if (idxDoc.exists) {
      const bId = idxDoc.data()?.businessId as string | undefined;
      if (bId) {
        const configSnap = await db.collection('businesses').doc(bId).collection('store').doc('config').get();
        if (configSnap.exists) {
          data = configSnap.data()!;
          businessId = bId;
        }
      }
    }

    if (!data) {
      const snap = await db.collectionGroup('store').where('storeSlug', '==', storeSlug).limit(1).get();
      if (!snap.empty) {
        const doc = snap.docs[0];
        data = doc.data();
        businessId = doc.ref.path.split('/')[1];
      }
    }

    if (!data) return null;
    if ((data.status ?? 'draft') !== 'active') return null;
    return { ...data, businessId } as Record<string, any>;
  } catch { return null; }
}

async function getCollection(businessId: string, collectionId: string) {
  try {
    const db = getAdminDb();
    const snap = await db.collection('businesses').doc(businessId).collection('storeCollections').doc(collectionId).get();
    if (!snap.exists) return null;
    const data = snap.data()!;
    return { id: snap.id, ...data } as any;
  } catch { return null; }
}

async function getProducts(businessId: string, collectionId: string) {
  try {
    const db = getAdminDb();
    const snap = await db
      .collection('businesses').doc(businessId)
      .collection('storeProducts')
      .where('available', '==', true)
      .where('collectionIds', 'array-contains', collectionId)
      .limit(100)
      .get();
    return snap.docs.map((d: any) => {
      const data = d.data();
      return {
        id: d.id,
        displayName: data.displayName ?? '',
        price: data.price ?? 0,
        compareAtPrice: data.compareAtPrice ?? null,
        images: data.images ?? [],
        category: data.category ?? '',
        available: data.available ?? true,
        stock: data.stock ?? 0,
        productType: data.productType ?? 'physical',
        description: data.description ?? '',
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
    const dbAnalytics = getAdminDb();
    dbAnalytics.collection('businesses').doc(config.businessId).collection('storeAnalytics').add({
      eventType: 'page_view', storeSlug,
      businessId: config.businessId, pageType: 'collection',
      collectionId, createdAt: new Date().toISOString(),
    }).catch(() => {});
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
