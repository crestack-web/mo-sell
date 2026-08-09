import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import { isPlatformManaged, getCommissionRate } from '@/lib/pricing';

/**
 * POST /api/sell/payouts/request
 *
 * Creates a payout request for all available (unpaid) earnings.
 * Marks each included storeEarning as 'paid_out' (pending admin processing).
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

    if (!config.payoutAccountNumber || !config.payoutBankName || !config.payoutAccountName) {
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

    const timestamp = new Date().toISOString();

    // 3. Create payout request
    const payoutRequestId = 'pr_' + crypto.randomUUID();
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
      rejectionReason: null,
      processedAt:     null,
      createdAt:       timestamp,
      updatedAt:       timestamp,
    });
    if (payoutError) {
      return NextResponse.json({ error: 'Failed to create payout request' }, { status: 500 });
    }

    // 4. Mark each earning as requested (waiting for payout)
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
      amount:  roundedNet,
      currency: config.currency ?? 'NGN',
      earningsCount: earningIds.length,
    });

  } catch (err) {
    console.error('[payouts/request] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
