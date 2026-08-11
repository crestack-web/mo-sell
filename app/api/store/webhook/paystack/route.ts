import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import { processConfirmedOrder } from '@/lib/services/mo-sell-integration-bridge';
import type { CheckoutSession } from '@/types/mo-sell.types';

/**
 * POST /api/store/webhook/paystack
 *
 * Receives Paystack charge.success events server-side.
 * This is the reliable fallback for when clients close the browser
 * before the /store/[storeSlug]/order/pending page finishes polling.
 *
 * Register this URL in your Paystack dashboard:
 *   Settings → API Keys & Webhooks → Webhook URL
 *   → https://yourdomain.com/api/store/webhook/paystack
 */
export async function POST(req: NextRequest) {
  // 1. Verify Paystack signature
  const signature = req.headers.get('x-paystack-signature');
  const secret    = process.env.PAYSTACK_SECRET_KEY;

  if (!secret) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const rawBody = await req.text();

  if (signature) {
    const expected = crypto
      .createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');

    if (expected !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  let event: { event: string; data: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // 2. Only handle successful charges
  if (event.event !== 'charge.success') {
    return NextResponse.json({ received: true });
  }

  const txn       = event.data as Record<string, unknown> & {
    reference?: string;
    status?: string;
    amount?: number;
    currency?: string;
    metadata?: Record<string, unknown>;
  };
  const reference = txn?.reference;
  const metadata  = txn?.metadata;

  if (!reference) {
    return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
  }

  // 3. Handle Ask MO token purchases
  const paymentType = metadata?.payment_type as string | undefined;
  if (paymentType === 'ask_mo_tokens') {
    const bizId = metadata?.businessId as string | undefined;
    const tokens = metadata?.tokens as number | undefined;

    if (!bizId || !tokens || txn.status !== 'success') {
      return NextResponse.json({ received: true });
    }

    try {
      const supabase = getSupabaseServer();
      const { error: balanceError } = await supabase.rpc('increment_business_field', {
        p_business_id: bizId,
        p_field: 'askMoTokenBalance',
        p_amount: tokens,
      });
      const { error: purchasedError } = await supabase.rpc('increment_business_field', {
        p_business_id: bizId,
        p_field: 'askMoTotalPurchased',
        p_amount: tokens,
      });
      if (balanceError || purchasedError) {
        return NextResponse.json({ received: true, note: 'token_credit_pending' });
      }
      return NextResponse.json({ received: true });
    } catch {
      return NextResponse.json({ received: true, note: 'token_credit_pending' });
    }
  }

  // 4. Extract sessionId + businessId from Paystack metadata
  //    (set when initiating checkout in /api/store/checkout/initiate)
  const sessionId  = metadata?.sessionId  as string | undefined;
  const businessId = metadata?.businessId as string | undefined;

  if (!sessionId || !businessId) {
    return NextResponse.json({ received: true });
  }

  try {
    const supabase = getSupabaseServer();

    // 5. Load and validate session
    const { data: sessionRow } = await supabase
      .from('checkoutSessions')
      .select('*')
      .eq('id', sessionId)
      .eq('businessId', businessId)
      .maybeSingle();

    if (!sessionRow) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = sessionRow as unknown as CheckoutSession;

    // 6. Idempotency — already processed by client polling
    if (session.status === 'completed') {
      return NextResponse.json({ received: true });
    }

    // 7. Validate payment status from event
    if (txn.status !== 'success') {
      return NextResponse.json({ received: true });
    }

    // 8. Validate amount (kobo)
    const expectedKobo = Math.round(session.total * 100);
    if (txn.amount !== expectedKobo) {
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
    }

    // 9. Check session hasn't expired
    const expiresAt = session.expiresAt ? new Date(session.expiresAt as unknown as string) : new Date(0);
    if (new Date() > expiresAt) {
      await supabase
        .from('checkoutSessions')
        .update({ status: 'expired', updatedAt: new Date().toISOString() })
        .eq('id', sessionId);
      return NextResponse.json({ error: 'Session expired' }, { status: 410 });
    }

    // 10. Run Integration Bridge (same as client-side confirm route)
    await processConfirmedOrder({
      businessId,
      sessionId,
      paystackData: {
        reference: txn.reference ?? '',
        status:    txn.status ?? '',
        amount:    txn.amount ?? 0,
        currency:  txn.currency ?? '',
        metadata:  (txn.metadata ?? {}) as Record<string, unknown>,
      },
    });

    // 11. Mark session completed
    await supabase
      .from('checkoutSessions')
      .update({
        status:    'completed',
        updatedAt: new Date().toISOString(),
      })
      .eq('id', sessionId);

    return NextResponse.json({ received: true });

  } catch {
    // Return 200 so Paystack doesn't retry indefinitely for Integration Bridge errors
    return NextResponse.json({ received: true, note: 'integration_pending' });
  }
}
