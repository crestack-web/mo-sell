import { NextRequest, NextResponse } from 'next/server';
import { getServerFirestore as getAdminDb, FieldValue } from '@/lib/server-firestore';
import { whopClient } from '@/lib/whop-sdk';
import { processConfirmedOrder } from '@/lib/services/mo-sell-integration-bridge';

export async function POST(req: NextRequest) {
  try {
    const requestBodyText = await req.text();
    const headers = Object.fromEntries(req.headers);

    let webhookData;
    try {
      webhookData = whopClient.webhooks.unwrap(requestBodyText, { headers });
    } catch {
      return new Response('Invalid signature', { status: 401 });
    }

    const db = getAdminDb();

    if (webhookData.type === 'payment.succeeded') {
      const payment = webhookData.data as any;
      const metadata = payment.metadata ?? {};
      const sessionId = metadata.sessionId as string | undefined;
      const businessId = metadata.businessId as string | undefined;

      if (sessionId && businessId) {
        const sessionRef = db
          .collection('businesses').doc(businessId)
          .collection('checkoutSessions').doc(sessionId);
        const sessionSnap = await sessionRef.get();

        if (!sessionSnap.exists) {
          return new Response('Session not found', { status: 200 });
        }

        const session = sessionSnap.data()!;
        if (session.status === 'completed') {
          return new Response('Already completed', { status: 200 });
        }

        const total = session.total as number;
        const paymentAmount = payment.amount as number;

        if (paymentAmount < total) {
          return new Response('Payment amount insufficient', { status: 200 });
        }

        const settlementDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await processConfirmedOrder({
          businessId,
          sessionId,
          settlementDate,
          paystackData: {
            reference: payment.id,
            status: 'success',
            amount: Math.round(paymentAmount * 100),
            currency: payment.currency ?? 'usd',
            metadata: {
              ...metadata,
              whopPaymentId: payment.id,
              paymentMethod: 'whop',
              settlementDate,
            },
          },
        });

        await sessionRef.update({
          status: 'completed',
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }

    return new Response('OK', { status: 200 });
  } catch {
    return new Response('OK', { status: 200 });
  }
}
