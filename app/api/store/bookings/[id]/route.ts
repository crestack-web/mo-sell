import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { BookingStatus } from '@/types/mo-sell.types';

/**
 * PATCH /api/store/bookings/[id]
 * Updates a booking's status.
 * Body: { businessId, status }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: { businessId?: string; status?: BookingStatus };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { businessId, status } = body;

  if (!businessId || !status) {
    return NextResponse.json(
      { error: 'businessId and status are required' },
      { status: 400 },
    );
  }

  const validStatuses: BookingStatus[] = ['pending', 'confirmed', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
      { status: 400 },
    );
  }

  try {
    const db = getAdminDb();
    const docRef = db
      .collection('businesses').doc(businessId)
      .collection('storeBookings').doc(id);

    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    await docRef.update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
