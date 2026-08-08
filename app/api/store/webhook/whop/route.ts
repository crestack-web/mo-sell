import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
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

    const supabase = getSupabaseServer();

    if (webhookData.type === 'payment.succeeded') {
      const payment = webhookData.data as any;
      const metadata = payment.metadata ?? {};
      const sessionId = metadata.sessionId as string | undefined;
      const businessId = metadata.businessId as string | undefined;

      if (sessionId && businessId) {
        const { data: sessionRow } = await supabase
          .from('checkoutSessions')
          .select('*')
          .eq('id', sessionId)
          .eq('businessId', businessId)
          .maybeSingle();

        if (!sessionRow) {
          return new Response('Session not found', { status: 200 });
        }

        const session = sessionRow as any;
        if (session.status === 'completed') {
          return new Response('Already completed', { status: 200 });
        }

        const total = session.total as number;
        const totalCents = Math.round(total * 100);
        const paymentAmount = payment.amount as number;

        // payment.amount is in cents (USD), session.total is in dollars
        if (paymentAmount < totalCents) {
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
            amount: paymentAmount,
            currency: payment.currency ?? 'usd',
            metadata: {
              ...metadata,
              whopPaymentId: payment.id,
              paymentMethod: 'whop',
              settlementDate,
            },
          },
        });

        await supabase
          .from('checkoutSessions')
          .update({
            status: 'completed',
            updatedAt: new Date().toISOString(),
          })
          .eq('id', sessionId);
      }
    }

    return new Response('OK', { status: 200 });
  } catch {
    return new Response('OK', { status: 200 });
  }
}
