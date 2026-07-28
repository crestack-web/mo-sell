import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { BookingAvailability } from '@/types/mo-sell.types';

/**
 * GET /api/store/bookings/availability?businessId=xxx
 * Returns the booking availability config for a business.
 */
export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get('businessId');

  if (!businessId) {
    return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const snap = await db
      .collection('businesses').doc(businessId)
      .collection('storeBookingAvailability').doc('config')
      .get();

    if (!snap.exists) {
      return NextResponse.json({ availability: null }, { status: 200 });
    }

    const data = snap.data() as BookingAvailability;

    return NextResponse.json({
      availability: {
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() ?? null,
      },
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/store/bookings/availability
 * Creates or updates the booking availability config.
 * Body: { businessId, slots, slotDurationMinutes, bufferMinutes, blockedDates }
 */
export async function POST(req: NextRequest) {
  let body: {
    businessId?: string;
    slots?: BookingAvailability['slots'];
    slotDurationMinutes?: number;
    bufferMinutes?: number;
    blockedDates?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { businessId, slots, slotDurationMinutes, bufferMinutes, blockedDates } = body;

  if (!businessId || !slots || slotDurationMinutes == null || bufferMinutes == null || !blockedDates) {
    return NextResponse.json(
      { error: 'businessId, slots, slotDurationMinutes, bufferMinutes, and blockedDates are required' },
      { status: 400 },
    );
  }

  try {
    const db = getAdminDb();
    const docRef = db
      .collection('businesses').doc(businessId)
      .collection('storeBookingAvailability').doc('config');

    const existing = await docRef.get();
    const data: Partial<BookingAvailability> = {
      businessId,
      slots,
      slotDurationMinutes,
      bufferMinutes,
      blockedDates,
      updatedAt: FieldValue.serverTimestamp() as any,
    };

    if (existing.exists) {
      await docRef.update(data);
    } else {
      await docRef.set({
        ...data,
        createdAt: FieldValue.serverTimestamp(),
      } as Omit<BookingAvailability, 'createdAt' | 'updatedAt'> & { createdAt: any; updatedAt: any });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
