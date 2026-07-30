import { NextRequest, NextResponse } from 'next/server';
import { getServerFirestore as getAdminDb, FieldValue } from '@/lib/server-firestore';
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

    const db = getAdminDb();
    const configRef = db
      .collection('businesses').doc(businessId)
      .collection('store').doc('config');
    const configSnap = await configRef.get();

    if (!configSnap.exists) {
      return NextResponse.json({ error: 'Store config not found' }, { status: 404 });
    }

    const config = configSnap.data()!;
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
      await configRef.update({
        whopCompanyId,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Generate onboarding link for KYC
      const accountLink = await whopClient.accountLinks.create({
        company_id: whopCompanyId!,
        use_case: 'account_onboarding',
        return_url: `${process.env.PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard/earnings?whop_onboarded=1`,
        refresh_url: `${process.env.PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard/earnings`,
      });

      await configRef.update({
        whopOnboardingUrl: (accountLink as any).url,
        updatedAt: FieldValue.serverTimestamp(),
      });

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
    const earningsSnap = await db
      .collection('businesses').doc(businessId)
      .collection('storeEarnings')
      .where('status', '==', 'available')
      .get();

    const earningIds: string[] = [];
    let totalAvailable = 0;
    earningsSnap.forEach((d: any) => {
      const data = d.data();
      if (data.type === 'ask_mo_commission') return;
      earningIds.push(d.id);
      totalAvailable += data.netAmount ?? 0;
    });

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

    const batch = db.batch();
    const payoutRef = db
      .collection('businesses').doc(businessId)
      .collection('payoutRequests').doc();

    batch.set(payoutRef, {
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
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    for (const earningId of earningIds) {
      const ref = db
        .collection('businesses').doc(businessId)
        .collection('storeEarnings').doc(earningId);
      batch.update(ref, {
        status: 'paid_out',
        payoutRequestId: payoutRef.id,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

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
