import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { getDatabase } from '@/lib/database/adapter';
import { convertFromUsd } from '@/lib/currency';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const amount = searchParams.get('amount');
    const brandId = searchParams.get('brandId');

    if (!amount || !brandId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
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

    // Initialize Paystack payment
    const reference = `WALLET_TOPUP_${Date.now()}_${brandId}`;
    const amountInNaira = convertFromUsd(amountNum, 'NG');

    const response = await fetch('https://us-central1-bizassistant2-62305643-adad7.cloudfunctions.net/initializePayment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan: 'wallet-topup',
        userId: brandId,
        email: brandData.email,
        amount: amountInNaira,
        currency: 'NGN',
        billing: 'onetime',
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/brand/wallet/verify?reference=${reference}`,
        metadata: {
          type: 'wallet_topup',
          brandId,
          amount: amountNum,
          reference,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to initialize payment');
    }

    // Create pending transaction
    const transactionRef = db.collection('wallet_transactions').doc();
    await transactionRef.set({
      id: transactionRef.id,
      brandId,
      type: 'topup',
      amount: amountNum,
      balanceBefore: brandData.walletBalance || 0,
      balanceAfter: brandData.walletBalance || 0, // Will update after verification
      description: `Wallet top-up of $${amountNum}`,
      paymentMethod: 'paystack',
      paymentReference: reference,
      status: 'pending',
      createdAt: new Date().toISOString(),
      metadata: {
        paystackReference: data.data?.reference,
      },
    });

    return NextResponse.json({
      success: true,
      authorizationUrl: data.data?.authorization_url,
      reference,
      transactionId: transactionRef.id,
    });
  } catch (error: any) {
    console.error('Wallet top-up error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to initialize top-up' },
      { status: 500 }
    );
  }
}