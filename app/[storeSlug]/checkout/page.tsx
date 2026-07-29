import React from 'react';
import { notFound } from 'next/navigation';
import { getServerFirestore as getAdminDb } from '@/lib/server-firestore';
import { CheckoutForm } from './CheckoutForm';

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

async function getShippingZones(businessId: string) {
  try {
    const db = getAdminDb();
    const snap = await db
      .collection('businesses').doc(businessId)
      .collection('storeShippingZones').get();
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  } catch { return []; }
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const config = await getStoreConfig(storeSlug);
  if (!config) notFound();

  const shippingZones = await getShippingZones(config.businessId);
  const pickupLocations = config.pickupLocations ?? [];

  return (
    <div className="sf-page" style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--sf-text-1)', marginBottom: 4 }}>
        Checkout
      </h1>
      <p style={{ fontSize: '0.875rem', color: 'var(--sf-text-3)', marginBottom: 28 }}>
        Complete your order details below
      </p>
      <CheckoutForm
        storeSlug={storeSlug}
        businessId={config.businessId}
        currency={config.currency}
        shippingZones={shippingZones as any[]}
        pickupLocations={pickupLocations}
      />
    </div>
  );
}
