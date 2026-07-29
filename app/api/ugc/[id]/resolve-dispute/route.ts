import { NextRequest, NextResponse } from 'next/server';
import { getServerFirestore as getAdminDb, FieldValue } from '@/lib/server-firestore';
import { refundToBrand, createTransferRecipient, payoutToCreator } from '@/lib/paystack-ugc';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { resolution, accountNumber, bankCode, accountName } = await req.json();
    if (!resolution) {
      return NextResponse.json({ error: 'resolution required (refund_brand | pay_creator | split)' }, { status: 400 });
    }
    if (!['refund_brand', 'pay_creator', 'split'].includes(resolution)) {
      return NextResponse.json({ error: 'resolution must be refund_brand, pay_creator, or split' }, { status: 400 });
    }

    const db = getAdminDb();
    const orderRef = db.collection('ugcOrders').doc(id);
    const snap = await orderRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = snap.data() as any;
    if (order.status !== 'DISPUTED') {
      return NextResponse.json({ error: 'Order is not in DISPUTED status' }, { status: 400 });
    }

    if (resolution === 'refund_brand') {
      if (order.paystackRefDeposit) {
        await refundToBrand(order.paystackRefDeposit);
      }
      if (order.paystackRefBalance) {
        await refundToBrand(order.paystackRefBalance);
      }
    } else if (resolution === 'pay_creator') {
      if (!accountNumber || !bankCode) {
        return NextResponse.json({ error: 'accountNumber and bankCode required for pay_creator' }, { status: 400 });
      }
      const creatorSnap = await db.collection('ugcCreators').doc(order.creatorId).get();
      const creator = creatorSnap.data() as any;
      const displayName = creator?.displayName ?? accountName ?? 'Creator';
      const recipientCode = await createTransferRecipient(displayName, accountNumber, bankCode);
      await payoutToCreator(recipientCode, order.creatorPayout, `UGC Payout for Order ${id}`);
    } else if (resolution === 'split') {
      if (!accountNumber || !bankCode) {
        return NextResponse.json({ error: 'accountNumber and bankCode required for split' }, { status: 400 });
      }
      const creatorSnap = await db.collection('ugcCreators').doc(order.creatorId).get();
      const creator = creatorSnap.data() as any;
      const displayName = creator?.displayName ?? accountName ?? 'Creator';
      const splitAmount = Math.floor(order.creatorPayout / 2);
      const recipientCode = await createTransferRecipient(displayName, accountNumber, bankCode);
      await payoutToCreator(recipientCode, splitAmount, `UGC Split Payout ${id}`);
    }

    await orderRef.update({
      disputeResolvedAt: FieldValue.serverTimestamp(),
      disputeResolution: resolution,
      status: resolution === 'refund_brand' ? 'CANCELLED' : 'COMPLETED',
      paymentStatus: resolution === 'refund_brand' ? 'REFUNDED' : 'PAID_OUT',
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (resolution === 'pay_creator' || resolution === 'split') {
      await db.collection('ugcCreators').doc(order.creatorId).update({
        totalEarnings: FieldValue.increment(resolution === 'split' ? Math.floor(order.creatorPayout / 2) : order.creatorPayout),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
