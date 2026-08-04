import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database/adapter';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.redirect(new URL('/brand/videos?error=missing_reference', request.url));
    }

    // Verify transaction with Paystack
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const verifyData = await verifyResponse.json();
    if (!verifyData.status) {
      return NextResponse.redirect(new URL('/brand/videos?error=verification_failed', request.url));
    }

    const paymentData = verifyData.data;
    const metadata = paymentData.metadata;
    
    if (metadata?.type !== 'video_purchase') {
      return NextResponse.redirect(new URL('/brand/videos?error=invalid_transaction_type', request.url));
    }

    const brandId = metadata.brandId;
    const videoId = metadata.videoId;
    const creatorId = metadata.creatorId;
    const price = metadata.price;
    const transactionId = metadata.transactionId;

    // Get video details
    const db = getDatabase();
    const videoDoc = await db.doc(`ugc_videos/${videoId}`).get();
    
    if (!videoDoc.exists) {
      return NextResponse.redirect(new URL('/brand/videos?error=video_not_found', request.url));
    }

    const videoData = videoDoc.data();

    // Check if already purchased (prevent double processing)
    const existingPurchase = await db.collection('purchased_videos')
      .where('brandId', '==', brandId)
      .where('videoId', '==', videoId)
      .limit(1)
      .get();

    if (existingPurchase.docs.length === 0) {
      // Create purchased video record
      const purchasedVideoRef = db.collection('purchased_videos').doc();
      await purchasedVideoRef.set({
        id: purchasedVideoRef.id,
        brandId,
        videoId,
        creatorId,
        creatorName: videoData.creatorName || 'Unknown',
        creatorUsername: videoData.creatorUsername || 'unknown',
        creatorAvatar: videoData.creatorAvatar,
        videoTitle: videoData.title || 'Untitled',
        videoThumbnail: videoData.thumbnail,
        videoUrl: videoData.url,
        platform: videoData.platform || 'other',
        price,
        paymentMethod: 'direct',
        licenseType: 'standard',
        purchaseDate: new Date().toISOString(),
        status: 'active',
        tags: videoData.tags || [],
      });
    }

    // Update transaction status
    if (transactionId) {
      const transactionDoc = await db.doc(`wallet_transactions/${transactionId}`).get();
      if (transactionDoc.exists) {
        await db.doc(`wallet_transactions/${transactionId}`).update({
          status: 'completed',
          metadata: {
            ...transactionDoc.data().metadata,
            paystackData: paymentData,
            verifiedAt: new Date().toISOString(),
          },
        });
      }
    }

    return NextResponse.redirect(new URL('/brand/videos?success=purchase_completed', request.url));
  } catch (error: any) {
    console.error('Purchase verification error:', error);
    return NextResponse.redirect(new URL('/brand/videos?error=verification_error', request.url));
  }
}