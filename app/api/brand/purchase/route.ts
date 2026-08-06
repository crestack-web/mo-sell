import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { getDatabase } from '@/lib/database/adapter';
import { convertFromUsd } from '@/lib/currency';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, creatorId, paymentMethod, brandId } = body;

    if (!videoId || !creatorId || !paymentMethod || !brandId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (!['wallet', 'direct'].includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    // Verify user is authenticated via the access token sent by the client
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await import('@/lib/supabase-server').then(m => m.supabaseServer);
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Service unavailable' },
        { status: 503 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
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

    // Get video details
    const videoDoc = await db.doc(`ugc_videos/${videoId}`).get();
    if (!videoDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Video not found' },
        { status: 404 }
      );
    }

    const videoData = videoDoc.data();
    const price = videoData.price || 20; // Default $20

    // Check if already purchased
    const existingPurchase = await db.collection('purchased_videos')
      .where('brandId', '==', brandId)
      .where('videoId', '==', videoId)
      .limit(1)
      .get();

    if (existingPurchase.docs.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Video already purchased' },
        { status: 400 }
      );
    }

    // Handle wallet payment
    if (paymentMethod === 'wallet') {
      const currentBalance = brandData.walletBalance || 0;
      
      if (currentBalance < price) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Insufficient wallet balance',
            insufficientAmount: price - currentBalance,
            currentBalance
          },
          { status: 400 }
        );
      }

      // Deduct from wallet
      const newBalance = currentBalance - price;
      await db.doc(`brands/${brandId}`).update({
        walletBalance: newBalance,
        updatedAt: new Date().toISOString(),
      });

      // Create transaction record
      const addedTx = await db.collection('wallet_transactions').add({
        brandId,
        type: 'purchase',
        amount: -price,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        description: `Purchase of video: ${videoData.title || 'Untitled'}`,
        videoId,
        paymentMethod: 'wallet',
        status: 'completed',
        createdAt: new Date().toISOString(),
      });

      // Create purchased video record
      const addedVideo = await db.collection('purchased_videos').add({
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
        paymentMethod: 'wallet',
        licenseType: 'standard',
        purchaseDate: new Date().toISOString(),
        status: 'active',
        tags: videoData.tags || [],
      });

      return NextResponse.json({
        success: true,
        purchasedVideo: {
          id: addedVideo.id,
          ...videoData,
          price,
          paymentMethod: 'wallet',
          purchaseDate: new Date().toISOString(),
        },
        transaction: {
          id: addedTx.id,
          amount: -price,
          balanceAfter: newBalance,
        },
      });
    }

    // Handle direct payment
    if (paymentMethod === 'direct') {
      const reference = `VIDEO_PURCHASE_${Date.now()}_${brandId}_${videoId}`;
      const amountInNaira = convertFromUsd(price, 'NG');

      // Create pending transaction BEFORE initializing payment so the verify
      // route can resolve it when Paystack redirects back.
      const addedTx = await db.collection('wallet_transactions').add({
        brandId,
        type: 'purchase',
        amount: -price,
        balanceBefore: brandData.walletBalance || 0,
        balanceAfter: brandData.walletBalance || 0, // No wallet change for direct payment
        description: `Direct purchase of video: ${videoData.title || 'Untitled'}`,
        videoId,
        paymentMethod: 'paystack',
        paymentReference: reference,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      const transactionId = addedTx.id;

      const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
      if (!paystackSecret) {
        await db.doc(`wallet_transactions/${transactionId}`).update({ status: 'failed' });
        return NextResponse.json(
          { success: false, error: 'Paystack not configured' },
          { status: 503 },
        );
      }

      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${paystackSecret}`,
        },
        body: JSON.stringify({
          email: brandData.email,
          amount: Math.round(amountInNaira * 100),
          currency: 'NGN',
          reference,
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/brand/purchase/verify?reference=${reference}`,
          metadata: {
            type: 'video_purchase',
            brandId,
            videoId,
            creatorId,
            price,
            reference,
            transactionId,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.status) {
        await db.doc(`wallet_transactions/${transactionId}`).update({ status: 'failed' });
        throw new Error(data.message || 'Failed to initialize payment');
      }

      return NextResponse.json({
        success: true,
        authorizationUrl: data.data?.authorization_url,
        reference,
        transactionId,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Purchase video error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process purchase' },
      { status: 500 }
    );
  }
}