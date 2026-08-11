import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import { createTransferRecipient, initiateTransfer } from '@/lib/paystack-ugc';

const SEND_SECRET = process.env.PAYOUT_SEND_SECRET;

/**
 * POST /api/sell/payouts/send
 *
 * Admin/ops endpoint that dispatches a payout request to the merchant's bank.
 * It creates (or reuses) a Paystack transfer recipient for the store, initiates
 * the transfer with `reference = payoutRequestId`, and moves the payout from
 * 'requested' to 'sent'. The Paystack webhook is the source of truth for the
 * final outcome ('completed' on transfer.success, 'rejected' on
 * transfer.failed / transfer.reversed).
 *
 * Body: { payoutRequestId: string }
 * Guarded by Authorization: Bearer <PAYOUT_SEND_SECRET> (skipped when unset).
 */
export async function POST(request: NextRequest) {
  try {
    if (SEND_SECRET) {
      const auth = request.headers.get('authorization') ?? '';
      if (auth !== `Bearer ${SEND_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    let body: { payoutRequestId?: string };
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

    const { payoutRequestId } = body;
    if (!payoutRequestId) {
      return NextResponse.json({ error: 'payoutRequestId is required' }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    // 1. Load the payout request — only 'requested' payouts can be sent
    const { data: payout } = await supabase
      .from('payoutRequests')
      .select('*')
      .eq('id', payoutRequestId)
      .maybeSingle();
    if (!payout) {
      return NextResponse.json({ error: 'Payout request not found' }, { status: 404 });
    }
    if (payout.status !== 'requested') {
      return NextResponse.json({ error: `Payout is already '${payout.status}'` }, { status: 409 });
    }
    if (!payout.accountNumber || !payout.accountName || !payout.bankName) {
      return NextResponse.json({ error: 'Payout bank details are incomplete' }, { status: 400 });
    }

    // 2. Load the store config for the bank code + cached recipient
    const { data: config } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', payout.businessId)
      .maybeSingle();
    if (!config) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }
    const bankCode = config.payoutBankCode ?? null;
    if (!bankCode) {
      return NextResponse.json({ error: 'Store payout bank code is missing' }, { status: 400 });
    }

    // 3. Ensure a Paystack transfer recipient exists (cached on the business)
    let recipientCode = config.payoutRecipientCode ?? null;
    if (!recipientCode) {
      recipientCode = await createTransferRecipient(
        payout.accountName || config.storeName || config.businessName || 'MO Sell Merchant',
        payout.accountNumber,
        bankCode,
      );
      await supabase
        .from('businesses')
        .update({ payoutRecipientCode: recipientCode, updatedAt: new Date().toISOString() })
        .eq('id', payout.businessId);
    }

    // 4. Initiate the transfer with the payout id as the reference so the
    //    webhook can match the payout even if transferCode isn't stored yet.
    const amountKobo = Math.round(Number(payout.amount) * 100);
    if (!(amountKobo > 0)) {
      return NextResponse.json({ error: 'Payout amount is invalid' }, { status: 400 });
    }
    const transferCode = await initiateTransfer(
      recipientCode,
      amountKobo,
      `MO Sell payout — ${payout.businessId}`,
      payoutRequestId,
    );

    // 5. Mark the payout as sent
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('payoutRequests')
      .update({ status: 'sent', recipientCode, transferCode, sentAt: now, updatedAt: now })
      .eq('id', payoutRequestId);
    if (updateError) {
      console.error('[payouts/send] Update error:', updateError);
      return NextResponse.json({ error: 'Transfer initiated but failed to mark payout as sent' }, { status: 500 });
    }

    return NextResponse.json({
      payoutRequestId,
      transferCode,
      status: 'sent',
      amount: Number(payout.amount),
      currency: payout.currency ?? 'NGN',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    console.error('[payouts/send] Error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
