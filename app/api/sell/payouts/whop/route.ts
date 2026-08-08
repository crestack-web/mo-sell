import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import { whopClient } from '@/lib/whop-sdk';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId } = body;
    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    }

    const whopKey = process.env.WHOP_API_KEY;
    const whopPlatformId = process.env.WHOP_COMPANY_ID;
    if (!whopKey || !whopPlatformId) {
      return NextResponse.json({ error: 'Whop not configured. Contact support.' }, { status: 500 });
    }

    const supabase = getSupabaseServer();
    const { data: configRow } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .maybeSingle();

    if (!configRow) {
      return NextResponse.json({ error: 'Store config not found' }, { status: 404 });
    }

    const config = configRow as any;
    let whopCompanyId = config.whopCompanyId as string | undefined;

    // Step 1: If no Whop sub-merchant exists, create one + generate onboarding link
    if (!whopCompanyId) {
      const subMerchant = await (whopClient as any).companies.create({
        email: config.contactEmail ?? `${config.storeSlug}@mo-sell.com`,
        parent_company_id: whopPlatformId,
        title: config.storeName ?? config.storeSlug ?? 'Store',
        metadata: {
          businessId,
          storeSlug: config.storeSlug,
        },
      });

      whopCompanyId = (subMerchant as any).id;

      // Store the Whop company ID
      await supabase
        .from('businesses')
        .update({
          whopCompanyId,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', businessId);

      // Generate onboarding link for KYC
      const accountLink = await whopClient.accountLinks.create({
        company_id: whopCompanyId!,
        use_case: 'account_onboarding',
        return_url: `${process.env.PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard/earnings?whop_onboarded=1`,
        refresh_url: `${process.env.PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard/earnings`,
      });

      await supabase
        .from('businesses')
        .update({
          whopOnboardingUrl: (accountLink as any).url,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', businessId);

      return NextResponse.json({
        whopOnboardingUrl: (accountLink as any).url,
        whopCompanyId,
        message: 'Whop account created. Complete KYC to enable payouts.',
      });
    }

    // Step 2: Sub-merchant exists — check KYC/payout method
    let payoutMethods: any;
    try {
      payoutMethods = await whopClient.payouts.methods.list({
        account_id: whopCompanyId,
      });
    } catch {
      return NextResponse.json({
        error: 'Could not verify payout method.',
        whopOnboardingUrl: config.whopOnboardingUrl ?? null,
      }, { status: 400 });
    }

    const defaultMethod = (payoutMethods as any).data?.find((m: any) => m.is_default) as { id: string } | undefined;

    if (!defaultMethod) {
      // Generate fresh onboarding link
      const accountLink = await whopClient.accountLinks.create({
        company_id: whopCompanyId,
        use_case: 'account_onboarding',
        return_url: `${process.env.PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard/earnings?whop_onboarded=1`,
        refresh_url: `${process.env.PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard/earnings`,
      });

      return NextResponse.json({
        error: 'Set up a payout method in Whop first.',
        whopOnboardingUrl: (accountLink as any).url,
      }, { status: 400 });
    }

    // Step 3: Create withdrawal
    const { data: earnings } = await supabase
      .from('storeEarnings')
      .select('*')
      .eq('businessId', businessId)
      .eq('status', 'available');

    const earningIds: string[] = [];
    let totalAvailable = 0;
    for (const d of earnings ?? []) {
      const data = d as any;
      if (data.type === 'ask_mo_commission') continue;
      earningIds.push(data.id);
      totalAvailable += data.netAmount ?? 0;
    }

    if (earningIds.length === 0 || totalAvailable <= 0) {
      return NextResponse.json({ error: 'No available earnings to withdraw' }, { status: 400 });
    }

    const withdrawal = await whopClient.withdrawals.create({
      company_id: whopCompanyId,
      amount: totalAvailable,
      currency: 'usd',
      payout_method_id: defaultMethod.id,
      platform_covers_fees: true,
    });

    const payoutRequestId = 'pr_' + crypto.randomUUID();
    const { error: payoutError } = await supabase.from('payoutRequests').insert({
      id: payoutRequestId,
      businessId,
      amount: totalAvailable,
      currency: 'usd',
      bankName: 'Whop',
      accountNumber: whopCompanyId,
      accountName: config.storeName ?? 'Store',
      earningIds,
      status: 'processing',
      whopWithdrawalId: (withdrawal as any).id,
      rejectionReason: null,
      processedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    if (payoutError) throw payoutError;

    for (const earningId of earningIds) {
      const { error: updateError } = await supabase
        .from('storeEarnings')
        .update({
          status: 'paid_out',
          payoutRequestId,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', earningId);
      if (updateError) throw updateError;
    }

    return NextResponse.json({
      success: true,
      amount: totalAvailable,
      withdrawalId: (withdrawal as any).id,
      message: `$${totalAvailable.toFixed(2)} withdrawal initiated via Whop.`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
