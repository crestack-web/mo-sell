import React from 'react';
import { notFound } from 'next/navigation';
import { getAdminDb } from '@/lib/firebase-admin';
import { CheckoutForm } from './CheckoutForm';

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

async function getShippingZones(businessId: string) {
  try {
    const db = getAdminDb();
    const snap = await db
      .collection('businesses').doc(businessId)
      .collection('storeShippingZones').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
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
