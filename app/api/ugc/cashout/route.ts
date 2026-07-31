import { NextRequest, NextResponse } from 'next/server';
import { getServerFirestore as getAdminDb, FieldValue } from '@/lib/server-firestore';
import { createTransferRecipient, payoutToCreator } from '@/lib/paystack-ugc';

export async function POST(req: NextRequest) {
  try {
    const { userId, accountNumber, bankCode, accountName, bankName } = await req.json();
    if (!userId || !accountNumber || !bankCode) {
      return NextResponse.json({ error: 'userId, accountNumber and bankCode required' }, { status: 400 });
    }

    const db = getAdminDb();

    const ordersSnap = await db.collection('ugcOrders')
      .where('creatorId', '==', userId)
      .get();

    const eligible = ordersSnap.docs
      .map((d: any): { id: string; data: any } => ({ id: d.id, data: d.data() }))
      .filter((o: { data: any }) => o.data.status === 'COMPLETED' && o.data.paymentStatus !== 'PAID_OUT');

    if (eligible.length === 0) {
      return NextResponse.json({ error: 'No completed orders available to cash out' }, { status: 400 });
    }

    const creatorSnap = await db.collection('ugcCreators').doc(userId).get();
    const creator = creatorSnap.exists ? creatorSnap.data() as any : {};
    const displayName = creator.displayName ?? accountName ?? 'Creator';

    const recipientCode = await createTransferRecipient(displayName, accountNumber, bankCode);

    const totalPayout = eligible.reduce((s: number, o: { data: any }) => s + (o.data.creatorPayout ?? 0), 0);
    const transferCode = await payoutToCreator(
      recipientCode,
      totalPayout,
      `UGC payout for ${eligible.length} order(s)`
    );

    const batch = db.batch();
    for (const o of eligible) {
      batch.update(db.collection('ugcOrders').doc(o.id), {
        paystackTransferCode: transferCode,
        paymentStatus: 'PAID_OUT',
        paidOutAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();

    await db.collection('ugcCreators').doc(userId).update({
      totalEarnings: FieldValue.increment(totalPayout),
      bankName: bankName ?? creator.bankName ?? null,
      bankCode,
      accountNumber,
      accountName: accountName ?? null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, ordersPaid: eligible.length, amount: totalPayout, transferCode });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
