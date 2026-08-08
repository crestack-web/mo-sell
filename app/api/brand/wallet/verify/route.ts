import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/adapter';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.redirect(new URL('/brand/wallet?error=missing_reference', request.url));
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      return NextResponse.redirect(new URL('/brand/wallet?error=verification_failed', request.url));
    }

    // Verify transaction with Paystack
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    });

    const verifyData = await verifyResponse.json();
    if (!verifyData.status) {
      return NextResponse.redirect(new URL('/brand/wallet?error=verification_failed', request.url));
    }

    const paymentData = verifyData.data;
    const metadata = paymentData.metadata || {};

    if (metadata.type !== 'wallet_topup') {
      return NextResponse.redirect(new URL('/brand/wallet?error=invalid_transaction_type', request.url));
    }

    const brandId = metadata.brandId;
    // The wallet is USD-denominated — credit the USD equivalent of the top-up.
    const amountUsd = Number(metadata.amountUsd ?? metadata.amount ?? 0);

    if (!brandId || amountUsd <= 0) {
      return NextResponse.redirect(new URL('/brand/wallet?error=invalid_amount', request.url));
    }

    // Update brand wallet balance
    const db = getDatabase();
    const brandDoc = await db.doc(`brands/${brandId}`).get();

    if (!brandDoc.exists) {
      return NextResponse.redirect(new URL('/brand/wallet?error=brand_not_found', request.url));
    }

    const brandData = brandDoc.data();
    const currentBalance = Number(brandData.walletBalance || 0);
    const newBalance = Math.round((currentBalance + amountUsd) * 100) / 100;

    await db.doc(`brands/${brandId}`).update({
      walletBalance: newBalance,
      updatedAt: new Date().toISOString(),
    });

    // Update transaction status
    const transactionId = metadata.transactionId;
    if (transactionId) {
      const transactionDoc = await db.doc(`wallet_transactions/${transactionId}`).get();
      if (transactionDoc.exists) {
        await db.doc(`wallet_transactions/${transactionId}`).update({
          status: 'completed',
          amount: Math.round(amountUsd * 100) / 100,
          amountUsd: Math.round(amountUsd * 100) / 100,
          balanceAfter: newBalance,
          metadata: {
            ...(transactionDoc.data().metadata || {}),
            paystackData: paymentData,
            verifiedAt: new Date().toISOString(),
          },
        });
      }
    }

    return NextResponse.redirect(new URL('/brand/wallet?success=topup_completed', request.url));
  } catch (error: any) {
    console.error('Wallet verification error:', error);
    return NextResponse.redirect(new URL('/brand/wallet?error=verification_error', request.url));
  }
}
