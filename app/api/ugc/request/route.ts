import { NextRequest, NextResponse } from 'next/server';
import { getServerFirestore as getAdminDb, FieldValue } from '@/lib/server-firestore';
import { initializeDeposit, calculateUGCPayment } from '@/lib/paystack-ugc';
import { sendPortfolioRequestToCreator, sendPortfolioRequestToGuest } from '@/lib/email-portfolio';

export async function POST(req: NextRequest) {
  try {
    const {
      brandId, creatorId, productName, productUrl, brief, deliverables, deadline, brandEmail,
      guestName, guestEmail, guestCompany, creatorUsername, videoLength,
    } = await req.json();

    if (!creatorId || !productName || !brief || !deliverables) {
      return NextResponse.json({ error: 'creatorId, productName, brief, deliverables required' }, { status: 400 });
    }

    const isGuest = !!guestName && !!guestEmail;
    const email = brandEmail || guestEmail;
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const db = getAdminDb();

    let creator;
    if (creatorUsername) {
      const snap = await db.collection('ugcCreators')
        .where('username', '==', creatorUsername)
        .where('isActive', '==', true)
        .limit(1)
        .get();
      if (snap.empty) return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
      creator = snap.docs[0].data() as any;
    } else {
      const creatorSnap = await db.collection('ugcCreators').doc(creatorId).get();
      if (!creatorSnap.exists) return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
      creator = creatorSnap.data() as any;
    }

    const agreedPrice = videoLength === '60s' ? creator.price60s : creator.price30s;
    const { platformFee, creatorPayout, deposit, balance } = calculateUGCPayment(agreedPrice);

    const orderRef = db.collection('ugcOrders').doc();
    const orderId = orderRef.id;

    const order: Record<string, any> = {
      brandId: brandId ?? null,
      creatorId: creator.userId,
      productName,
      productUrl: productUrl ?? null,
      brief,
      deliverables,
      deadline: deadline ? new Date(deadline) : null,
      videoLength: videoLength ?? '30s',
      guestName: guestName ?? null,
      guestEmail: guestEmail ?? null,
      guestCompany: guestCompany ?? null,
      agreedPrice,
      platformFee,
      creatorPayout,
      depositAmount: deposit,
      balanceAmount: balance,
      paymentStatus: 'PENDING_DEPOSIT',
      paystackRefDeposit: null,
      paystackRefBalance: null,
      paystackTransferCode: null,
      status: 'REQUESTED',
      draftVideoUrl: null,
      finalVideoUrl: null,
      watermarked: true,
      disputeReason: null,
      disputeDescription: null,
      disputeOpenedBy: null,
      disputeOpenedAt: null,
      disputeResolvedAt: null,
      disputeResolution: null,
      rating: null,
      review: null,
      requestedAt: FieldValue.serverTimestamp(),
      acceptedAt: null,
      draftSubmittedAt: null,
      completedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await orderRef.set(order);

    let paystackResult: { authorization_url: string; reference: string } | null = null;
    try {
      paystackResult = await initializeDeposit(orderId, email, agreedPrice);
      await orderRef.update({
        paystackRefDeposit: paystackResult.reference,
        paymentStatus: 'PENDING_DEPOSIT',
      });
    } catch {
      // Payment init failed, order stays at REQUESTED
    }

    // Send emails (non-blocking)
    if (isGuest && guestEmail) {
      const emailData = {
        guestName,
        guestEmail,
        guestCompany,
        creatorName: creator.displayName ?? creator.name ?? 'Creator',
        creatorEmail: creator.email ?? '',
        productName,
        budget: agreedPrice,
        deadline: deadline ?? undefined,
        deposit,
        orderId,
        videoLength: videoLength ?? '30s',
      };
      sendPortfolioRequestToCreator(emailData).catch(() => {});
      sendPortfolioRequestToGuest(emailData).catch(() => {});
    }

    return NextResponse.json({
      orderId,
      paystackUrl: paystackResult?.authorization_url ?? null,
      depositAmount: deposit / 100,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
