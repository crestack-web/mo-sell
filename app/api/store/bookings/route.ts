import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Booking, BookingStatus } from '@/types/mo-sell.types';

/**
 * GET /api/store/bookings?businessId=xxx&status=pending
 * Returns all bookings for a business, ordered by date desc.
 */
export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get('businessId');
  const status     = req.nextUrl.searchParams.get('status') as BookingStatus | null;

  if (!businessId) {
    return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    let query = db
      .collection('businesses').doc(businessId)
      .collection('storeBookings') as FirebaseFirestore.Query;

    if (status) {
      query = query.where('status', '==', status);
    }

    query = query.orderBy('date', 'desc');

    const snap = await query.get();

    const bookings = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null,
      };
    });

    return NextResponse.json({ bookings });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/store/bookings
 * Creates a new booking.
 * Body: { businessId, storeSlug, productId, productName, customerName,
 *         customerEmail, customerPhone, date, startTime, endTime, notes? }
 */
export async function POST(req: NextRequest) {
  let body: {
    businessId?: string;
    storeSlug?: string;
    productId?: string;
    productName?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    notes?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    businessId, storeSlug, productId, productName,
    customerName, customerEmail, customerPhone,
    date, startTime, endTime, notes,
  } = body;

  if (
    !businessId || !storeSlug || !productId || !productName ||
    !customerName || !customerEmail || !customerPhone ||
    !date || !startTime || !endTime
  ) {
    return NextResponse.json(
      {
        error:
          'businessId, storeSlug, productId, productName, customerName, customerEmail, customerPhone, date, startTime, and endTime are required',
      },
      { status: 400 },
    );
  }

  try {
    const db = getAdminDb();

    // Check slot is still available (no duplicate bookings)
    const existingSnap = await db
      .collection('businesses').doc(businessId)
      .collection('storeBookings')
      .where('date', '==', date)
      .where('startTime', '==', startTime)
      .where('status', 'in', ['pending', 'confirmed'])
      .get();

    if (!existingSnap.empty) {
      return NextResponse.json(
        { error: 'This time slot is no longer available' },
        { status: 409 },
      );
    }

    const bookingData: Omit<Booking, 'createdAt' | 'updatedAt'> & { createdAt: any; updatedAt: any } = {
      businessId,
      storeSlug,
      productId,
      productName,
      customerName,
      customerEmail,
      customerPhone,
      date,
      startTime,
      endTime,
      notes: notes ?? null,
      status: 'pending' as BookingStatus,
      orderId: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await db
      .collection('businesses').doc(businessId)
      .collection('storeBookings')
      .add(bookingData);

    // Tag the customer with 'booking'
    try {
      const customersSnap = await db
        .collection('businesses').doc(businessId)
        .collection('storeCustomers')
        .where('email', '==', customerEmail)
        .limit(1)
        .get();

      if (!customersSnap.empty) {
        const customerDoc = customersSnap.docs[0];
        await customerDoc.ref.update({
          tags: FieldValue.arrayUnion('booking'),
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        await db
          .collection('businesses').doc(businessId)
          .collection('storeCustomers')
          .add({
            businessId,
            storeSlug,
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            tags: ['booking'],
            totalOrders: 0,
            totalSpent: 0,
            lastOrderAt: null,
            subscribedAt: null,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
      }
    } catch {
      // Customer tagging is best-effort; don't fail the booking
    }

    return NextResponse.json({ bookingId: docRef.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
