import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';

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

  // ── Sell payout transfers ────────────────────────────────────────────────
  if (event.event.startsWith('transfer.')) {
    const data = event.data ?? {};
    const transferCode = data.transfer_code as string | undefined;
    const reference = data.reference as string | undefined;
    if (!transferCode && !reference) return NextResponse.json({ received: true });

    const supabase = getSupabaseServer();

    // Match the payout by transferCode first, then by the reference we pass
    // when initiating the transfer (which is the payoutRequestId).
    let payout: any = null;
    if (transferCode) {
      const { data: byCode } = await supabase
        .from('payoutRequests')
        .select('*')
        .eq('transferCode', transferCode)
        .maybeSingle();
      payout = byCode ?? null;
    }
    if (!payout && reference) {
      const { data: byRef } = await supabase
        .from('payoutRequests')
        .select('*')
        .eq('id', reference)
        .maybeSingle();
      payout = byRef ?? null;
    }
    if (!payout) return NextResponse.json({ received: true });

    const ts = new Date().toISOString();
    // Persist the transferCode on first sight of the transfer so later events
    // match by code even if the initiator didn't store it.
    const codePatch = payout.transferCode ? {} : { transferCode };

    if (event.event === 'transfer.success') {
      await supabase
        .from('payoutRequests')
        .update({ status: 'completed', ...codePatch, processedAt: ts, updatedAt: ts })
        .eq('id', payout.id);
    } else {
      // transfer.failed or transfer.reversed — the money did not reach the
      // merchant (or was returned), so the earnings go back to 'available'.
      const reason = event.event === 'transfer.reversed'
        ? (data.complete_message ?? 'Transfer was reversed by the bank')
        : (data.complete_message ?? 'Paystack transfer failed');
      await supabase
        .from('payoutRequests')
        .update({
          status: 'rejected',
          rejectionReason: reason,
          ...codePatch,
          processedAt: ts,
          updatedAt: ts,
        })
        .eq('id', payout.id);

      const ids = Array.isArray(payout.earningIds) ? payout.earningIds : [];
      if (ids.length > 0) {
        await supabase
          .from('storeEarnings')
          .update({ status: 'available', payoutRequestId: null, updatedAt: ts })
          .in('id', ids);
      }
    }
    return NextResponse.json({ received: true });
  }

  if (event.event !== 'charge.success') {
    return NextResponse.json({ received: true });
  }

  const metadata = event.data?.metadata as Record<string, any> | undefined;
  if (!metadata?.type) {
    return NextResponse.json({ received: true });
  }

  const supabase = getSupabaseServer();

  if (metadata.type === 'deposit' || metadata.type === 'balance') {
    const orderId = metadata.orderId as string;
    if (!orderId) return NextResponse.json({ received: true });

    const { data: order } = await supabase
      .from('ugcOrders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();
    if (!order) return NextResponse.json({ received: true });

    if (metadata.type === 'deposit') {
      const { error: updateError } = await supabase
        .from('ugcOrders')
        .update({
          paymentStatus: 'DEPOSIT_HELD',
          status: 'IN_PROGRESS',
          acceptedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq('id', orderId);
      if (updateError) {
        return NextResponse.json({ received: true, note: 'order_update_failed' });
      }

      // Send "accepted" email to guest if this is a portfolio order
      if (order.guestEmail) {
        try {
          const { sendCreatorAcceptedEmailToGuest } = await import('@/lib/email-portfolio');
          const { getCreatorById } = await import('@/lib/ugc');
          const creator = (await getCreatorById(order.creatorId)) ?? ({} as any);
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
      const { error: updateError } = await supabase
        .from('ugcOrders')
        .update({
          paymentStatus: 'PENDING_BALANCE',
          updatedAt: new Date().toISOString(),
        })
        .eq('id', orderId);
      if (updateError) {
        return NextResponse.json({ received: true, note: 'order_update_failed' });
      }
    }
  }

  return NextResponse.json({ received: true });
}
