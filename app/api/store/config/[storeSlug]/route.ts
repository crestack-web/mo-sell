import { NextRequest, NextResponse } from 'next/server';
import { getServerFirestore as getAdminDb } from '@/lib/server-firestore';

/**
 * GET /api/store/config/[storeSlug]
 * Public — returns store config for a given slug.
 *
 * Strategy:
 * 1. Try storeIndex lookup (O(1), always reliable).
 * 2. If that fails, use collectionGroup query (fallback).
 * 3. If storeIndex doc exists, read the config directly by path.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  const { storeSlug } = await params;

  if (!storeSlug) {
    return NextResponse.json({ error: 'storeSlug is required' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    let data: FirebaseFirestore.DocumentData | null = null;
    let businessId = '';

    // ── Strategy 1: storeIndex lookup (O(1), always reliable) ────────────────
    try {
      const idxDoc = await db.collection('storeIndex').doc(storeSlug).get();
      if (idxDoc.exists) {
        const bId = idxDoc.data()?.businessId as string | undefined;
        if (bId) {
          const configSnap = await db
            .collection('businesses').doc(bId)
            .collection('store').doc('config')
            .get();
          if (configSnap.exists) {
            data = configSnap.data()!;
            businessId = bId;
          }
        }
      }
    } catch {
      // storeIndex lookup failed, fall through to collectionGroup
    }

    // ── Strategy 2: collectionGroup query (fallback) ──────────────────────────
    if (!data) {
      try {
        const snap = await db.collectionGroup('store')
          .where('storeSlug', '==', storeSlug)
          .limit(1)
          .get();
        if (!snap.empty) {
          const doc = snap.docs[0];
          data = doc.data();
          businessId = doc.ref.path.split('/')[1];
        }
    } catch {
      // collectionGroup query failed (index may be building)
    }
    }

    if (!data) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Only serve stores that are published/live (active status)
    const storeStatus = data.status ?? 'draft';
    if (storeStatus !== 'active') {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const publicConfig = {
      businessId,
      storeSlug:           data.storeSlug,
      storeName:           data.storeName,
      logoUrl:             data.logoUrl ?? null,
      primaryColor:        data.primaryColor ?? '#0EA5E9',
      secondaryColor:      data.secondaryColor ?? '#6366F1',
      businessCategory:    data.businessCategory ?? '',
      currency:            data.currency ?? 'NGN',
      contactEmail:        data.contactEmail ?? '',
      contactPhone:        data.contactPhone ?? '',
      status:              storeStatus,
      theme:               data.theme ?? 'classic',
      tagline:             data.tagline ?? null,
      storePolicy:         data.storePolicy ?? null,
      sections:            data.sections ?? null,
      enabledProductTypes: data.enabledProductTypes ?? ['physical'],
      pickupLocations:     data.pickupLocations ?? [],
      customDomain:        data.customDomain ?? null,
      customDomainStatus:  data.customDomainStatus ?? 'pending',
      paystackPublicKey:   data.paystackPublicKey ?? '',
    };

    return NextResponse.json(publicConfig, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
