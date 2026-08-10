import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import { isPlatformManaged, getCommissionRate } from '@/lib/pricing';
import { createTransferRecipient, payoutToCreator } from '@/lib/paystack-ugc';

/**
 * POST /api/sell/payouts/request
 *
 * Payouts all available (unpaid) earnings by initiating a Paystack transfer of
 * the merchant's NET amount (gross − platform commission) to their bank account.
 * Mirrors the UGC cashout flow.
 *
 * Body: { businessId: string }
 */
export async function POST(req: NextRequest) {
  let body: { businessId?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { businessId } = body;
  if (!businessId) {
    return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();

    // 1. Load store config for bank details
    const { data: config } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .maybeSingle();

    if (!config) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    if (!isPlatformManaged(config)) {
      return NextResponse.json({ error: 'Managed payments not enabled for this store' }, { status: 403 });
    }

    // Full bank details (name/number/code) are required to build a transfer recipient.
    if (!config.payoutAccountName || !config.payoutAccountNumber || !config.payoutBankName || !config.payoutBankCode) {
      return NextResponse.json({ error: 'Payout bank account details are incomplete. Update them in Settings.' }, { status: 400 });
    }

    // 2. Fetch all available earnings (status = 'available')
    const { data: earnings, error: earningsError } = await supabase
      .from('storeEarnings')
      .select('*')
      .eq('businessId', businessId)
      .eq('status', 'available');

    if (earningsError || !earnings?.length) {
      return NextResponse.json({ error: 'No available earnings to pay out.' }, { status: 400 });
    }

    const earningIds = earnings.map((d: any) => d.id);
    const totalNet = earnings.reduce((sum: number, d: any) => sum + (d.netAmount ?? 0), 0);
    const roundedNet = Math.round(totalNet * 100) / 100;

    if (roundedNet <= 0) {
      return NextResponse.json({ error: 'No payable earnings balance.' }, { status: 400 });
    }

    const timestamp = new Date().toISOString();
    const payoutRequestId = 'pr_' + crypto.randomUUID();

    // 3. Build/reuse the Paystack transfer recipient for this store
    let recipientCode = config.payoutRecipientCode as string | undefined;
    if (!recipientCode) {
      recipientCode = await createTransferRecipient(
        config.payoutAccountName,
        config.payoutAccountNumber,
        config.payoutBankCode
      );
    }

    // 4. Initiate the transfer of the NET amount (converted to kobo)
    const transferCode = await payoutToCreator(
      recipientCode,
      Math.round(roundedNet * 100),
      `Sell payout ${payoutRequestId}`
    );

    // 5. Create payout request marked as processing
    const { error: payoutError } = await supabase.from('payoutRequests').insert({
      id: payoutRequestId,
      businessId,
      amount:          roundedNet,
      currency:        config.currency ?? 'NGN',
      bankName:        config.payoutBankName,
      accountNumber:   config.payoutAccountNumber,
      accountName:     config.payoutAccountName,
      commissionRate:  getCommissionRate(config),
      earningIds,
      status:          'processing',
      recipientCode,
      transferCode,
      rejectionReason: null,
      processedAt:     timestamp,
      createdAt:       timestamp,
      updatedAt:       timestamp,
    });
    if (payoutError) {
      return NextResponse.json({ error: 'Failed to create payout request' }, { status: 500 });
    }

    // 6. Cache the recipient code for future payouts
    await supabase
      .from('businesses')
      .update({ payoutRecipientCode: recipientCode, updatedAt: timestamp })
      .eq('id', businessId);

    // 7. Mark each earning as paid out (pending transfer completion)
    for (const earning of earnings as any[]) {
      const { error: updateError } = await supabase
        .from('storeEarnings')
        .update({
          status:          'paid_out',
          payoutRequestId,
          updatedAt:       timestamp,
        })
        .eq('id', earning.id);
      if (updateError) {
        return NextResponse.json({ error: 'Failed to mark earnings' }, { status: 500 });
      }
    }

    return NextResponse.json({
      payoutRequestId,
      amount:       roundedNet,
      currency:     config.currency ?? 'NGN',
      transferCode,
      status:       'processing',
      earningsCount: earningIds.length,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    console.error('[payouts/request] Error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
