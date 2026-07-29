import { NextRequest, NextResponse } from 'next/server';
import { getServerFirestore as getAdminDb, FieldValue } from '@/lib/server-firestore';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { videoUrl, type } = await req.json();
    if (!videoUrl || !type) {
      return NextResponse.json({ error: 'videoUrl and type (draft/final) required' }, { status: 400 });
    }

    const db = getAdminDb();
    const orderRef = db.collection('ugcOrders').doc(id);
    const snap = await orderRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = snap.data() as any;

    if (type === 'draft') {
      if (order.paymentStatus !== 'DEPOSIT_HELD') {
        return NextResponse.json({ error: 'Deposit must be paid before submitting draft' }, { status: 400 });
      }
      await orderRef.update({
        draftVideoUrl: videoUrl,
        status: 'DRAFT_SUBMITTED',
        draftSubmittedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else if (type === 'final') {
      if (order.paymentStatus !== 'PENDING_BALANCE' && order.paymentStatus !== 'PAID_OUT') {
        return NextResponse.json({ error: 'Balance must be paid before submitting final' }, { status: 400 });
      }
      await orderRef.update({
        finalVideoUrl: videoUrl,
        watermarked: false,
        status: 'COMPLETED',
        completedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      return NextResponse.json({ error: 'type must be "draft" or "final"' }, { status: 400 });
    }

    return NextResponse.json({ success: true, status: type === 'draft' ? 'DRAFT_SUBMITTED' : 'COMPLETED' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
