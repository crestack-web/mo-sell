import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import { isPlatformManaged, getCommissionRate } from '@/lib/pricing';
import { verifyPayoutOtp } from '@/lib/payout-otp';
import { sendPayoutConfirmedEmail } from '@/lib/services/email/payout-emails';

/**
 * POST /api/sell/payouts/request
 *
 * Records a payout request for all available (unpaid) earnings, delivering the
 * merchant's NET amount (gross − platform commission) to their bank account.
 * The transfer is fulfilled by the platform within 1–3 business days.
 *
 * A one-time verification code (sent via /api/sell/payouts/send-otp) is
 * REQUIRED in the body — the payout is only recorded after it is verified.
 *
 * Body: { businessId: string, otp: string }
 */
export async function POST(req: NextRequest) {
  let body: { businessId?: string; otp?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { businessId, otp } = body;
  if (!businessId) {
    return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
  }
  if (!otp) {
    return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();

    // 0. Verify the payout OTP before recording the payout
    const verified = await verifyPayoutOtp(businessId, otp);
    if (!verified.ok) {
      return NextResponse.json({ error: verified.error ?? 'Invalid verification code' }, { status: 400 });
    }

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

    // Full bank details (name/number/code) are required for the transfer.
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

    // 3. Create payout request — fulfilled by the platform within 1–3 business days
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
      status:          'requested',
      recipientCode:   null,
      transferCode:    null,
      rejectionReason: null,
      processedAt:     null,
      createdAt:       timestamp,
      updatedAt:       timestamp,
    });
    if (payoutError) {
      return NextResponse.json({ error: 'Failed to create payout request' }, { status: 500 });
    }

    // 4. Mark each earning as paid out (allocated to this payout request)
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

    // 5. Notify the store owner that the payout was received (non-blocking)
    sendPayoutConfirmedEmail({
      email: verified.email ?? config.contactEmail ?? '',
      name: config.ownerName ?? config.businessName ?? config.storeName ?? undefined,
      amount:       roundedNet,
      currency:     config.currency ?? 'NGN',
      storeName:    config.storeName ?? config.businessName ?? 'MO Sell',
      accountName:  config.payoutAccountName,
      accountNumber: config.payoutAccountNumber,
      bankName:     config.payoutBankName,
      payoutRequestId,
    }).catch((emailError) => {
      console.error('[payouts/request] Failed to send confirmation email:', emailError);
    });

    return NextResponse.json({
      payoutRequestId,
      amount:       roundedNet,
      currency:     config.currency ?? 'NGN',
      status:       'requested',
      earningsCount: earningIds.length,
    });

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    console.error('[payouts/request] Error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
