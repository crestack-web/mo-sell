import { NextRequest, NextResponse } from 'next/server';
import { getServerFirestore as getAdminDb, FieldValue } from '@/lib/server-firestore';
import type { StoreCustomer, CustomerTag } from '@/types/mo-sell.types';

/**
 * POST /api/store/customers/subscribe
 * Creates or updates a customer record for email/newsletter signup.
 * Body: { businessId, storeSlug, email, name? }
 *
 * If a customer with this email already exists:
 *   - Updates subscribedAt and ensures 'subscriber' tag is present
 * If not:
 *   - Creates new customer with tags: ['subscriber']
 */
export async function POST(req: NextRequest) {
  let body: {
    businessId?: string;
    storeSlug?: string;
    email?: string;
    name?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { businessId, storeSlug, email, name } = body;

  if (!businessId || !storeSlug || !email) {
    return NextResponse.json(
      { error: 'businessId, storeSlug, and email are required' },
      { status: 400 },
    );
  }

  // Basic email format validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  try {
    const db = getAdminDb();

    // Check if customer already exists with this email
    const existingSnap = await db
      .collection('businesses').doc(businessId)
      .collection('storeCustomers')
      .where('email', '==', email.toLowerCase().trim())
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      // Update existing customer
      const customerDoc = existingSnap.docs[0];
      const customerData = customerDoc.data() as StoreCustomer;
      const currentTags = customerData.tags ?? [];

      const updates: Record<string, any> = {
        subscribedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (name && !customerData.name) {
        updates.name = name;
      }

      // Add 'subscriber' tag if not already present
      if (!currentTags.includes('subscriber')) {
        updates.tags = FieldValue.arrayUnion('subscriber');
      }

      await customerDoc.ref.update(updates);

      return NextResponse.json({
        customerId: customerDoc.id,
        updated: true,
      });
    } else {
      // Create new customer
      const newCustomer: Omit<StoreCustomer, 'createdAt' | 'updatedAt'> & { createdAt: any; updatedAt: any } = {
        businessId,
        storeSlug,
        name: name ?? '',
        email: email.toLowerCase().trim(),
        phone: null,
        tags: ['subscriber'] as CustomerTag[],
        totalOrders: 0,
        totalSpent: 0,
        lastOrderAt: null,
        subscribedAt: FieldValue.serverTimestamp() as any,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      const docRef = await db
        .collection('businesses').doc(businessId)
        .collection('storeCustomers')
        .add(newCustomer);

      return NextResponse.json({
        customerId: docRef.id,
        updated: false,
      }, { status: 201 });
    }
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
