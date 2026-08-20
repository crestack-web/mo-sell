import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { sendPayoutCompletedEmail } from '@/lib/services/email/payout-emails';

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-paystack-signature');
    const secret = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_WEBHOOK_SECRET;

    if (!signature || !secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.text();

    // Verify HMAC signature when a real secret is configured
    const hash = crypto.createHmac('sha512', secret).update(body).digest('hex');
    if (hash !== signature) {
      console.warn('[Paystack Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const eventName: string = event?.event ?? '';

    switch (eventName) {
      case 'charge.success':
        await handlePaymentSuccess(event.data);
        break;
      case 'charge.failed':
        await handlePaymentFailed(event.data);
        break;
      case 'transfer.success':
        await handleTransferSuccess(event.data);
        break;
      case 'transfer.failed':
      case 'transfer.reversed':
        await handleTransferFailed(event.data, eventName);
        break;
      default:
        console.log(`[Paystack Webhook] Unhandled event: ${eventName}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Paystack Webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}

async function handlePaymentSuccess(data: any) {
  try {
    const { getSupabaseServer } = await import('@/lib/database/postgresql-adapter');
    const supabaseServer = getSupabaseServer();

    const { error } = await supabaseServer
      .from('orders')
      .insert({
        id: data.reference,
        order_number: `ORD-${Date.now()}`,
        customer_email: data.customer?.email,
        customer_name: [data.customer?.first_name, data.customer?.last_name].filter(Boolean).join(' '),
        total: (data.amount ?? 0) / 100,
        status: 'paid',
        payment_status: 'paid',
        paystack_reference: data.reference,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[Paystack Webhook] Failed to create order:', error);
    }
  } catch (error) {
    console.error('[Paystack Webhook] Error handling payment success:', error);
  }
}

async function handlePaymentFailed(data: any) {
  try {
    const { getSupabaseServer } = await import('@/lib/database/postgresql-adapter');
    const supabaseServer = getSupabaseServer();

    const { error } = await supabaseServer
      .from('payments')
      .insert({
        reference: data.reference,
        email: data.customer?.email,
        amount: data.amount,
        status: 'failed',
        error_message: data.gateway_response,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[Paystack Webhook] Failed to log failed payment:', error);
    }
  } catch (error) {
    console.error('[Paystack Webhook] Error handling payment failed:', error);
  }
}

/**
 * Match a Paystack transfer payload to a MO Sell payout request.
 * Preference order:
 *  1. data.reference  (set to payoutRequestId when we initiate the transfer)
 *  2. data.transfer_code stored on the payout row
 */
async function findPayout(supabase: any, data: any) {
  const reference = data?.reference as string | undefined;
  const transferCode = data?.transfer_code as string | undefined;

  if (reference) {
    const { data: byRef } = await supabase
      .from('payoutRequests')
      .select('*')
      .eq('id', reference)
      .maybeSingle();
    if (byRef) return byRef;
  }

  if (transferCode) {
    const { data: byCode } = await supabase
      .from('payoutRequests')
      .select('*')
      .eq('transferCode', transferCode)
      .maybeSingle();
    if (byCode) return byCode;
  }

  return null;
}

async function handleTransferSuccess(data: any) {
  try {
    const { getSupabaseServer } = await import('@/lib/database/postgresql-adapter');
    const supabase = getSupabaseServer();

    const payout = await findPayout(supabase, data);
    if (!payout) {
      console.warn('[Paystack Webhook] transfer.success: no matching payout', {
        reference: data?.reference,
        transfer_code: data?.transfer_code,
      });
      return;
    }

    // Idempotent: only transition from requested/sent → completed
    if (payout.status === 'completed') {
      console.log('[Paystack Webhook] Payout already completed:', payout.id);
      return;
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('payoutRequests')
      .update({
        status: 'completed',
        processedAt: now,
        updatedAt: now,
        ...(data?.transfer_code && !payout.transferCode
          ? { transferCode: data.transfer_code }
          : {}),
      })
      .eq('id', payout.id);

    if (updateError) {
      console.error('[Paystack Webhook] Failed to mark payout completed:', updateError);
      return;
    }

    console.log('[Paystack Webhook] Payout marked completed:', payout.id);

    // Notify the merchant that money has landed in their bank
    try {
      const { data: config } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', payout.businessId)
        .maybeSingle();

      const email =
        config?.contactEmail ||
        config?.ownerEmail ||
        config?.email ||
        null;

      if (email) {
        await sendPayoutCompletedEmail({
          email,
          name: config?.ownerName ?? config?.businessName ?? config?.storeName ?? undefined,
          amount: Number(payout.amount) || 0,
          currency: payout.currency ?? config?.currency ?? 'NGN',
          storeName: config?.storeName ?? config?.businessName ?? 'MO Sell',
          accountName: payout.accountName ?? config?.payoutAccountName,
          accountNumber: payout.accountNumber ?? config?.payoutAccountNumber,
          bankName: payout.bankName ?? config?.payoutBankName,
          payoutRequestId: payout.id,
          transferCode: data?.transfer_code ?? payout.transferCode,
        });
      } else {
        console.warn('[Paystack Webhook] No email on business for payout completed notice:', payout.businessId);
      }
    } catch (emailErr) {
      // Never fail the webhook because of email
      console.error('[Paystack Webhook] Completed email failed:', emailErr);
    }
  } catch (error) {
    console.error('[Paystack Webhook] Error handling transfer.success:', error);
  }
}

async function handleTransferFailed(data: any, eventName: string) {
  try {
    const { getSupabaseServer } = await import('@/lib/database/postgresql-adapter');
    const supabase = getSupabaseServer();

    const payout = await findPayout(supabase, data);
    if (!payout) {
      console.warn(`[Paystack Webhook] ${eventName}: no matching payout`, {
        reference: data?.reference,
        transfer_code: data?.transfer_code,
      });
      return;
    }

    if (payout.status === 'completed' || payout.status === 'rejected') {
      console.log(`[Paystack Webhook] Payout already terminal (${payout.status}):`, payout.id);
      return;
    }

    const now = new Date().toISOString();
    const reason =
      data?.gateway_response ||
      data?.reason ||
      (eventName === 'transfer.reversed' ? 'Transfer reversed by Paystack' : 'Transfer failed');

    const { error: updateError } = await supabase
      .from('payoutRequests')
      .update({
        status: 'rejected',
        rejectionReason: String(reason).slice(0, 500),
        processedAt: now,
        updatedAt: now,
      })
      .eq('id', payout.id);

    if (updateError) {
      console.error('[Paystack Webhook] Failed to mark payout rejected:', updateError);
      return;
    }

    console.log('[Paystack Webhook] Payout marked rejected:', payout.id, reason);
  } catch (error) {
    console.error(`[Paystack Webhook] Error handling ${eventName}:`, error);
  }
}
