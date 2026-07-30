import { NextRequest, NextResponse } from 'next/server';
import { getServerFirestore as getAdminDb } from '@/lib/server-firestore';
import { initializeBalance } from '@/lib/paystack-ugc';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { brandEmail } = await req.json();
    if (!brandEmail) {
      return NextResponse.json({ error: 'brandEmail required' }, { status: 400 });
    }

    const db = getAdminDb();
    const orderRef = db.collection('ugcOrders').doc(id);
    const snap = await orderRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = snap.data() as any;
    if (order.status !== 'DRAFT_SUBMITTED' && order.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Order must be in DRAFT_SUBMITTED or APPROVED status' }, { status: 400 });
    }

    const result = await initializeBalance(id, brandEmail, order.agreedPrice);

    await orderRef.update({
      paystackRefBalance: result.reference,
      updatedAt: new Date(),
    });

    return NextResponse.json({ paystackUrl: result.authorization_url, reference: result.reference });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
