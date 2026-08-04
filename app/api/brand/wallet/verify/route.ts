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

    // Verify transaction with Paystack
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const verifyData = await verifyResponse.json();
    if (!verifyData.status) {
      return NextResponse.redirect(new URL('/brand/wallet?error=verification_failed', request.url));
    }

    const paymentData = verifyData.data;
    const metadata = paymentData.metadata;
    
    if (metadata?.type !== 'wallet_topup') {
      return NextResponse.redirect(new URL('/brand/wallet?error=invalid_transaction_type', request.url));
    }

    const brandId = metadata.brandId;
    const amount = metadata.amount;
    const transactionId = metadata.transactionId;

    // Update brand wallet balance
    const db = getDatabase();
    const brandDoc = await db.doc(`brands/${brandId}`).get();
    
    if (!brandDoc.exists) {
      return NextResponse.redirect(new URL('/brand/wallet?error=brand_not_found', request.url));
    }

    const brandData = brandDoc.data();
    const currentBalance = brandData.walletBalance || 0;
    const newBalance = currentBalance + amount;

    await db.doc(`brands/${brandId}`).update({
      walletBalance: newBalance,
      updatedAt: new Date().toISOString(),
    });

    // Update transaction status
    if (transactionId) {
      const transactionDoc = await db.doc(`wallet_transactions/${transactionId}`).get();
      if (transactionDoc.exists) {
        await db.doc(`wallet_transactions/${transactionId}`).update({
          status: 'completed',
          balanceAfter: newBalance,
          metadata: {
            ...transactionDoc.data().metadata,
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