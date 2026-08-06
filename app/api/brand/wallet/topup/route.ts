import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/adapter';
import { convertFromUsd, convertToUsd } from '@/lib/currency';

export const dynamic = 'force-dynamic';

const SUPPORTED_CURRENCIES = ['USD', 'NGN'];
const MIN_TOPUP_USD = 10;

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const amountParam = searchParams.get('amount');
    const brandId = searchParams.get('brandId');
    const currency = (searchParams.get('currency') || 'USD').toUpperCase();

    if (!amountParam || !brandId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (!SUPPORTED_CURRENCIES.includes(currency)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported currency' },
        { status: 400 }
      );
    }

    const amount = parseFloat(amountParam);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Paystack only settles in NGN — convert USD → NGN before charging.
    // The wallet itself is USD-denominated — convert NGN → USD for the credit.
    const amountNgn = currency === 'NGN'
      ? Math.round(amount)
      : Math.round(convertFromUsd(amount, 'NG'));
    const amountUsd = currency === 'NGN'
      ? convertToUsd(amount, 'NG')
      : amount;

    if (amountUsd < MIN_TOPUP_USD) {
      return NextResponse.json(
        { success: false, error: `Minimum top-up amount is $${MIN_TOPUP_USD}` },
        { status: 400 }
      );
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      return NextResponse.json(
        { success: false, error: 'Payment service not configured' },
        { status: 500 }
      );
    }

    // Verify user is authenticated
    const supabase = await import('@/lib/supabase-server').then(m => m.supabaseServer);
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Service unavailable' },
        { status: 503 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify brand ownership
    const db = getDatabase();
    const brandDoc = await db.doc(`brands/${brandId}`).get();

    if (!brandDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Brand not found' },
        { status: 404 }
      );
    }

    const brandData = brandDoc.data();
    if (brandData.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const reference = `WALLET_TOPUP_${Date.now()}_${brandId}`;

    // Record a pending transaction first so the verify callback can update it.
    // Non-blocking: a failed insert (e.g. missing table) must not block checkout.
    let transactionId: string | null = null;
    try {
      const added = await db.collection('wallet_transactions').add({
        brandId,
        type: 'topup',
        amount: Math.round(amountUsd * 100) / 100,
        amountUsd: Math.round(amountUsd * 100) / 100,
        amountNgn,
        currency,
        balanceBefore: Number(brandData.walletBalance || 0),
        balanceAfter: Number(brandData.walletBalance || 0),
        description: currency === 'NGN'
          ? `Wallet top-up of ₦${amountNgn.toLocaleString()}`
          : `Wallet top-up of $${amountUsd.toFixed(2)}`,
        paymentMethod: 'paystack',
        paymentReference: reference,
        status: 'pending',
        createdAt: new Date().toISOString(),
        metadata: {},
      });
      transactionId = added.id;
    } catch (err) {
      console.error('[Wallet Topup] Failed to record pending transaction:', err);
    }

    // Initialize Paystack directly (transaction/initialize)
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: brandData.email,
        amount: Math.round(amountNgn * 100), // kobo
        currency: 'NGN',
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/brand/wallet/verify?reference=${reference}`,
        metadata: {
          type: 'wallet_topup',
          brandId,
          amountUsd,
          amountNgn,
          currency,
          reference,
          transactionId,
        },
      }),
    });

    const data = await response.json() as {
      status: boolean;
      message?: string;
      data?: { authorization_url: string; reference: string };
    };

    if (!response.ok || !data.status || !data.data?.authorization_url) {
      throw new Error(data.message || 'Failed to initialize payment');
    }

    // Persist the brand's currency preference for the next visit.
    try {
      await db.doc(`brands/${brandId}`).update({ topupCurrency: currency });
    } catch (err) {
      console.warn('[Wallet Topup] Failed to persist currency preference:', err);
    }

    return NextResponse.json({
      success: true,
      authorizationUrl: data.data.authorization_url,
      reference,
      transactionId,
    });
  } catch (error: any) {
    console.error('Wallet top-up error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to initialize top-up' },
      { status: 500 }
    );
  }
}
