import { NextRequest, NextResponse } from 'next/server';
import { getServerFirestore as getAdminDb, FieldValue } from '@/lib/server-firestore';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { action, reason } = await req.json();

    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'action must be "accept" or "reject"' }, { status: 400 });
    }

    const db = getAdminDb();
    const orderRef = db.collection('ugcOrders').doc(id);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderSnap.data()!;
    if (order.status !== 'REQUESTED') {
      return NextResponse.json({ error: `Order is already ${order.status}` }, { status: 400 });
    }

    if (action === 'accept') {
      await orderRef.update({
        status: 'IN_PROGRESS',
        acceptedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      await orderRef.update({
        status: 'REJECTED',
        rejectionReason: reason || null,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ success: true, status: action === 'accept' ? 'IN_PROGRESS' : 'REJECTED' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
