import { NextRequest, NextResponse } from 'next/server';
import { getServerFirestore as getAdminDb, FieldValue } from '@/lib/server-firestore';

const PAYSTACK_SECRET = () => process.env.PAYSTACK_SECRET_KEY ?? '';

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get('reference');
  if (!reference) {
    return NextResponse.json({ status: 'pending' });
  }

  try {
    if (!PAYSTACK_SECRET()) {
      return NextResponse.json({ status: 'pending' });
    }

    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET()}` } }
    );
    const data = await verifyRes.json();
    const paid = data?.status === true && data?.data?.status === 'success';
    if (!paid) {
      return NextResponse.json({ status: 'pending' });
    }

    const db = getAdminDb();
    const snap = await db.collection('ugcOrders')
      .where('paystackRefDeposit', '==', reference)
      .limit(1)
      .get();
    if (!snap.empty) {
      const order = snap.docs[0].data() as any;
      if (order.paymentStatus !== 'DEPOSIT_HELD') {
        await snap.docs[0].ref.update({
          paymentStatus: 'DEPOSIT_HELD',
          status: 'IN_PROGRESS',
          acceptedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }

    return NextResponse.json({ status: 'success' });
  } catch {
    return NextResponse.json({ status: 'pending' });
  }
}
