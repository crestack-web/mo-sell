import { NextRequest, NextResponse } from 'next/server';
import { getServerFirestore as getAdminDb } from '@/lib/server-firestore';
import type { CustomerTag, StoreCustomer } from '@/types/mo-sell.types';

/**
 * GET /api/store/customers?businessId=xxx&tag=buyer
 * Returns all customers for a business, ordered by createdAt desc.
 * Optional tag param filters customers containing that tag.
 */
export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get('businessId');
  const tag        = req.nextUrl.searchParams.get('tag') as CustomerTag | null;

  if (!businessId) {
    return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
  }

  if (tag) {
    const validTags: CustomerTag[] = ['buyer', 'subscriber', 'booking', 'repeat'];
    if (!validTags.includes(tag)) {
      return NextResponse.json(
        { error: `Invalid tag. Must be one of: ${validTags.join(', ')}` },
        { status: 400 },
      );
    }
  }

  try {
    const db = getAdminDb();

    let query: FirebaseFirestore.Query = db
      .collection('businesses').doc(businessId)
      .collection('storeCustomers')
      .orderBy('createdAt', 'desc');

    // array-contains-any can't filter a single tag easily, so we fetch and filter in-memory
    const snap = await query.get();

    let customers = snap.docs.map((d: any) => {
      const data = d.data() as StoreCustomer;
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null,
        lastOrderAt: data.lastOrderAt?.toDate?.()?.toISOString() ?? null,
        subscribedAt: data.subscribedAt?.toDate?.()?.toISOString() ?? null,
      };
    });

    if (tag) {
      customers = customers.filter(c => c.tags.includes(tag));
    }

    return NextResponse.json({ customers });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
