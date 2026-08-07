import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import { initializeDeposit, calculateUGCPayment } from '@/lib/paystack-ugc';
import { sendPortfolioRequestToCreator, sendPortfolioRequestToGuest } from '@/lib/email-portfolio';
import { getCreatorById, getCreatorByUsername } from '@/lib/ugc';

export async function POST(req: NextRequest) {
  try {
    const {
      brandId, creatorId, productName, productUrl, brief, deliverables, deadline, brandEmail,
      guestName, guestEmail, guestCompany, creatorUsername, videoLength, bidAmount,
    } = await req.json();

    if (!creatorId || !productName || !brief || !deliverables) {
      return NextResponse.json({ error: 'creatorId, productName, brief, deliverables required' }, { status: 400 });
    }

    const isGuest = !!guestName && !!guestEmail;
    const email = brandEmail || guestEmail;
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    let creator;
    if (creatorUsername) {
      creator = await getCreatorByUsername(creatorUsername, { activeOnly: true });
    } else {
      creator = await getCreatorById(creatorId);
    }
    if (!creator || creator.isBanned === true) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const basePrice = videoLength === '60s' ? (creator.price60s ?? 0) : (creator.price30s ?? 0);
    const agreedPrice = bidAmount ? Math.round(Number(bidAmount) * 100) : basePrice;
    const { platformFee, creatorPayout, deposit, balance } = calculateUGCPayment(agreedPrice);

    const orderId = 'ugc_' + crypto.randomUUID();

    const order: Record<string, any> = {
      id: orderId,
      brandId: brandId ?? null,
      creatorId: creator.userId,
      bidAmount: bidAmount ? Math.round(Number(bidAmount) * 100) : null,
      basePrice,
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
      requestedAt: new Date().toISOString(),
      acceptedAt: null,
      draftSubmittedAt: null,
      completedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { error: insertError } = await supabase.from('ugcOrders').insert(order);
    if (insertError) throw insertError;

    let paystackResult: { authorization_url: string; reference: string } | null = null;
    try {
      paystackResult = await initializeDeposit(orderId, email, agreedPrice);
      await supabase.from('ugcOrders').update({
        paystackRefDeposit: paystackResult.reference,
        paymentStatus: 'PENDING_DEPOSIT',
      }).eq('id', orderId);
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
