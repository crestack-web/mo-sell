import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import { processConfirmedOrder } from '@/lib/services/mo-sell-integration-bridge';
import type { CheckoutSession } from '@/types/mo-sell.types';

/**
 * POST /api/store/orders/confirm
 *
 * Called by /store/[storeSlug]/order/pending after Paystack redirects back.
 * 1. Loads the checkout session
 * 2. Verifies the Paystack transaction
 * 3. Validates amount matches
 * 4. Runs the Integration Bridge (atomic batch)
 * 5. Marks session completed
 * Returns { orderId }
 */
export async function POST(req: NextRequest) {
  let body: { paystackReference: string; sessionId: string; businessId: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { paystackReference, sessionId, businessId } = body;
  if (!paystackReference || !sessionId || !businessId) {
    return NextResponse.json(
      { error: 'paystackReference, sessionId, and businessId are required' },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseServer();

    // 1. Load and validate session
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

    // Reject already-processed sessions
    if (session.status === 'completed') {
      // Idempotent — find the order and return it
      const { data: orderRow } = await supabase
        .from('storeOrders')
        .select('id')
        .eq('businessId', businessId)
        .eq('paystackReference', paystackReference)
        .limit(1)
        .maybeSingle();
      const orderId = orderRow?.id ?? null;
      return NextResponse.json({ orderId });
    }

    if (session.status !== 'payment_initiated') {
      return NextResponse.json(
        { error: `Session in unexpected state: ${session.status}` },
        { status: 400 }
      );
    }

    // Check session hasn't expired
    const expiresAt = session.expiresAt ? new Date(session.expiresAt as unknown as string) : new Date(0);
    if (new Date() > expiresAt) {
      await supabase
        .from('checkoutSessions')
        .update({ status: 'expired', updatedAt: new Date().toISOString() })
        .eq('id', sessionId);
      return NextResponse.json({ error: 'Checkout session expired' }, { status: 410 });
    }

    // 2. Verify with Paystack — use seller's key if configured
    let paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    try {
      const { data: configRow } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .maybeSingle();
      if (configRow) {
        if (configRow.useOwnPaystack && configRow.paystackSecretKey) {
          paystackSecretKey = configRow.paystackSecretKey;
        }
      }
    } catch { /* fall back to Busmo key */ }

    if (!paystackSecretKey) {
      return NextResponse.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(paystackReference)}`,
      { headers: { Authorization: `Bearer ${paystackSecretKey}` } }
    );
    const verifyData = await verifyRes.json() as {
      status: boolean;
      data?: {
        status: string;
        amount: number;
        currency: string;
        reference: string;
        metadata: Record<string, unknown>;
      };
    };

    if (!verifyData.status || !verifyData.data) {
      return NextResponse.json({ error: 'Paystack verification failed' }, { status: 502 });
    }

    const txn = verifyData.data;

    // 3. Validate payment status
    if (txn.status !== 'success') {
      await supabase
        .from('checkoutSessions')
        .update({ status: 'expired', updatedAt: new Date().toISOString() })
        .eq('id', sessionId);
      return NextResponse.json(
        { error: `Payment not successful: ${txn.status}` },
        { status: 402 }
      );
    }

    // 4. Validate amount (kobo)
    const expectedKobo = Math.round(session.total * 100);
    if (txn.amount !== expectedKobo) {
      return NextResponse.json(
        { error: 'Payment amount does not match order total' },
        { status: 400 }
      );
    }

    // 5. Run Integration Bridge
    let bridgeResult: { orderId: string };
    try {
      bridgeResult = await processConfirmedOrder({
        businessId,
        sessionId,
        paystackData: {
          reference: txn.reference,
          status:    txn.status,
          amount:    txn.amount,
          currency:  txn.currency,
          metadata:  txn.metadata,
        },
      });
    } catch {
      return NextResponse.json(
        { error: 'integration_failed', sessionId },
        { status: 202 }
      );
    }

    // 6. Mark session completed
    await supabase
      .from('checkoutSessions')
      .update({ status: 'completed', updatedAt: new Date().toISOString() })
      .eq('id', sessionId);

    return NextResponse.json({ orderId: bridgeResult.orderId });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
