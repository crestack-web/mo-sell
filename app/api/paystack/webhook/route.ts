import { NextRequest, NextResponse } from 'next/server';
import { getServerFirestore as getAdminDb, FieldValue } from '@/lib/server-firestore';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-paystack-signature');
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const rawBody = await req.text();

  if (signature) {
    const crypto = require('crypto');
    const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
    if (expected !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  let event: { event: string; data: Record<string, any> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (event.event !== 'charge.success') {
    return NextResponse.json({ received: true });
  }

  const metadata = event.data?.metadata as Record<string, any> | undefined;
  if (!metadata?.type) {
    return NextResponse.json({ received: true });
  }

  const db = getAdminDb();

  if (metadata.type === 'deposit' || metadata.type === 'balance') {
    const orderId = metadata.orderId as string;
    if (!orderId) return NextResponse.json({ received: true });

    const orderRef = db.collection('ugcOrders').doc(orderId);
    const snap = await orderRef.get();
    if (!snap.exists) return NextResponse.json({ received: true });

    const order = snap.data() as any;

    if (metadata.type === 'deposit') {
      await orderRef.update({
        paymentStatus: 'DEPOSIT_HELD',
        status: 'IN_PROGRESS',
        acceptedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Send "accepted" email to guest if this is a portfolio order
      if (order.guestEmail) {
        try {
          const { sendCreatorAcceptedEmailToGuest } = await import('@/lib/email-portfolio');
          const creatorSnap = await db.collection('ugcCreators').doc(order.creatorId).get();
          const creator = creatorSnap.exists ? creatorSnap.data() as any : {};
          await sendCreatorAcceptedEmailToGuest({
            guestName: order.guestName ?? 'there',
            guestEmail: order.guestEmail,
            creatorName: creator.displayName ?? creator.name ?? 'Creator',
            creatorEmail: creator.email ?? '',
            productName: order.productName,
            budget: order.agreedPrice,
            deposit: order.depositAmount,
            orderId,
            videoLength: order.videoLength ?? '30s',
          });
        } catch {
          // Email failure is non-critical
        }
      }
    } else if (metadata.type === 'balance') {
      await orderRef.update({
        paymentStatus: 'PENDING_BALANCE',
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  return NextResponse.json({ received: true });
}
