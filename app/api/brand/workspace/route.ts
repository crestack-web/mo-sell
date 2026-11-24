import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import { supabaseServer } from '@/lib/supabase-server';
import {
  calculateUGCPayment,
  initializeBalance,
  initializeDeposit,
  createTransferRecipient,
  payoutToCreator,
} from '@/lib/paystack-ugc';
import { getCreatorById, incrementCreator } from '@/lib/ugc';

export const dynamic = 'force-dynamic';

type Action =
  | 'create_brief'
  | 'review_video'
  | 'pay_balance'
  | 'release_payout'
  | 'open_dispute'
  | 'update_profile';

async function requireBrand(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (!token || !supabaseServer) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) } as const;
  }

  const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);
  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) } as const;
  }

  const db = getSupabaseServer();
  let { data: brand } = await db.from('brands').select('*').eq('id', user.id).maybeSingle();
  if (!brand) {
    const byUser = await db.from('brands').select('*').eq('userId', user.id).limit(1);
    brand = byUser.data?.[0] ?? null;
  }
  if (!brand) {
    return { error: NextResponse.json({ error: 'Brand profile not found' }, { status: 404 }) } as const;
  }

  return { db, brand, user } as const;
}

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Orders store the creator's userId; portfolio records are keyed by their own id. */
async function findOrderCreator(order: Record<string, any>) {
  const direct = await getCreatorById(order.creatorId);
  if (direct) return direct as any;
  if (!order.creatorId) return null;
  const { data } = await getSupabaseServer()
    .from('ugcCreators')
    .select('*')
    .eq('userId', order.creatorId)
    .limit(1);
  return (data?.[0] as any) ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireBrand(request);
    if ('error' in auth) return auth.error;
    const { db, brand } = auth;

    const ordersRes = await db
      .from('ugcOrders')
      .select('*')
      .eq('brandId', brand.id)
      .order('createdAt', { ascending: false });
    if (ordersRes.error) throw ordersRes.error;

    const orders = (ordersRes.data ?? []) as any[];
    const creatorIds = Array.from(new Set(orders.map((o) => o.creatorId).filter(Boolean)));
    let creators: any[] = [];
    if (creatorIds.length) {
      const [byUserId, byId] = await Promise.all([
        db.from('ugcCreators').select('*').in('userId', creatorIds),
        db.from('ugcCreators').select('*').in('id', creatorIds),
      ]);
      const seen = new Set<string>();
      for (const c of [...(byUserId.data ?? []), ...(byId.data ?? [])] as any[]) {
        if (seen.has(c.id)) continue;
        seen.add(c.id);
        creators.push(c);
      }
    }
    const creatorByUserId = new Map<string, any>();
    creators.forEach((c) => {
      if (c.userId) creatorByUserId.set(c.userId, c);
      creatorByUserId.set(c.id, c);
    });

    const purchasesRes = await db
      .from('purchased_videos')
      .select('*')
      .eq('brandId', brand.id)
      .order('purchaseDate', { ascending: false });
    const transactionsRes = await db
      .from('wallet_transactions')
      .select('*')
      .eq('brandId', brand.id)
      .order('createdAt', { ascending: false })
      .limit(100);

    return NextResponse.json({
      brand,
      orders: orders.map((order) => ({
        ...order,
        creator: creatorByUserId.get(order.creatorId) ?? null,
      })),
      purchases: purchasesRes.data ?? [],
      transactions: transactionsRes.data ?? [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to load workspace';
    return fail(message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireBrand(request);
    if ('error' in auth) return auth.error;
    const { db, brand, user } = auth;
    const body = await request.json();
    const action = body?.action as Action;

    if (action === 'update_profile') {
      const allowed = ['brandName', 'email', 'phone', 'website', 'industry'] as const;
      const patch: Record<string, any> = {};
      for (const field of allowed) {
        if (typeof body[field] === 'string') patch[field] = body[field].trim();
      }
      if (patch.brandName !== undefined && !patch.brandName) return fail('Brand name is required');
      if (!Object.keys(patch).length) return fail('Nothing to update');
      patch.updatedAt = new Date().toISOString();
      const { error } = await db.from('brands').update(patch).eq('id', brand.id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    if (action === 'create_brief') {
      const {
        creatorId, creatorUsername, productName, productUrl, brief, deliverables,
        deadline, videoLength, bidAmount,
      } = body;
      if (!creatorId || !productName || !brief || !deliverables) {
        return fail('Creator, product, brief and deliverables are required');
      }

      let creator = await getCreatorById(creatorId);
      if (!creator && creatorUsername) {
        const { data } = await db.from('ugcCreators').select('*').eq('username', creatorUsername).limit(1);
        creator = (data?.[0] as any) ?? null;
      }
      if (!creator || creator.isBanned) return fail('Creator not found', 404);

      const basePrice = videoLength === '60s' ? (creator.price60s ?? 0) : (creator.price30s ?? 0);
      const agreedPrice = bidAmount ? Math.round(Number(bidAmount) * 100) : basePrice;
      if (!agreedPrice || agreedPrice <= 0) return fail('Creator has no price set for this video length');

      const { platformFee, creatorPayout, deposit, balance } = calculateUGCPayment(agreedPrice);
      const orderId = `ugc_${crypto.randomUUID()}`;
      const now = new Date().toISOString();

      const order: Record<string, any> = {
        id: orderId,
        type: 'brand_brief',
        brandId: brand.id,
        creatorId: creator.userId ?? creator.id,
        productName,
        productUrl: productUrl || null,
        brief,
        deliverables,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        videoLength: videoLength || '30s',
        bidAmount: bidAmount ? Math.round(Number(bidAmount) * 100) : null,
        basePrice,
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
        rejectionReason: null,
        requestedAt: now,
        acceptedAt: null,
        draftSubmittedAt: null,
        completedAt: null,
        paidOutAt: null,
        createdAt: now,
        updatedAt: now,
      };

      const { error: insertError } = await db.from('ugcOrders').insert(order);
      if (insertError) throw insertError;

      let payment = null;
      try {
        const result = await initializeDeposit(orderId, brand.email ?? user.email ?? '', agreedPrice);
        await db.from('ugcOrders').update({ paystackRefDeposit: result.reference }).eq('id', orderId);
        payment = { paystackUrl: result.authorization_url, reference: result.reference };
      } catch {
        // The brief is still created; payment can be retried from the workspace.
      }

      return NextResponse.json({
        success: true,
        orderId,
        depositAmount: deposit / 100,
        ...payment,
      });
    }

    const orderId = body?.orderId as string;
    if (!orderId) return fail('orderId is required');

    const { data: order } = await db.from('ugcOrders').select('*').eq('id', orderId).maybeSingle();
    if (!order) return fail('Order not found', 404);
    if (order.brandId !== brand.id) return fail('This brief does not belong to your brand', 403);

    if (action === 'review_video') {
      const { stage, decision, note } = body;
      const now = new Date().toISOString();
      const approved = decision === 'approve';

      if (stage === 'draft') {
        if (order.status !== 'DRAFT_SUBMITTED' && order.status !== 'APPROVED') {
          return fail('There is no draft waiting for review');
        }
        const patch = approved
          ? {
              status: 'APPROVED',
              review: note ? `draft approved: ${note}` : 'draft approved',
              rejectionReason: null,
              updatedAt: now,
            }
          : { status: 'REJECTED', rejectionReason: note || 'Changes requested', review: null, updatedAt: now };
        const { error } = await db.from('ugcOrders').update(patch).eq('id', orderId);
        if (error) throw error;
        return NextResponse.json({ success: true, status: patch.status });
      }

      if (stage === 'final') {
        if (order.status !== 'COMPLETED') return fail('The final video has not been submitted yet');
        const patch = approved
          ? { review: note ? `approved: ${note}` : 'approved', rejectionReason: null, updatedAt: now }
          : {
              status: 'DISPUTED',
              disputeReason: 'BRIEF_MISMATCH',
              disputeDescription: note || 'Final video does not match the brief',
              disputeOpenedBy: brand.id,
              disputeOpenedAt: now,
              updatedAt: now,
            };
        const { error } = await db.from('ugcOrders').update(patch).eq('id', orderId);
        if (error) throw error;
        return NextResponse.json({ success: true, status: patch.status ?? order.status });
      }

      return fail('stage must be "draft" or "final"');
    }

    if (action === 'pay_balance') {
      if (order.status !== 'DRAFT_SUBMITTED' && order.status !== 'APPROVED') {
        return fail('Approve a draft before paying the balance');
      }
      if (order.paymentStatus === 'PENDING_BALANCE' || order.paymentStatus === 'PAID_OUT') {
        return fail('The balance has already been paid');
      }
      const result = await initializeBalance(orderId, brand.email ?? user.email ?? '', order.agreedPrice ?? 0);
      const { error } = await db.from('ugcOrders').update({
        paystackRefBalance: result.reference,
        updatedAt: new Date().toISOString(),
      }).eq('id', orderId);
      if (error) throw error;
      return NextResponse.json({ success: true, paystackUrl: result.authorization_url, reference: result.reference });
    }

    if (action === 'release_payout') {
      if (order.status !== 'COMPLETED') return fail('The final video must be submitted first');
      if (typeof order.review !== 'string' || !order.review.startsWith('approved')) {
        return fail('Approve the final video before releasing payout');
      }
      if (order.paymentStatus === 'PAID_OUT') return fail('This creator has already been paid');

      const creator: any = await findOrderCreator(order);
      if (!creator?.accountNumber || !creator?.bankCode) {
        return fail('Creator has not added bank details for payout');
      }

      const recipientCode = await createTransferRecipient(
        creator.accountName || creator.displayName || creator.name || 'Creator',
        String(creator.accountNumber),
        String(creator.bankCode)
      );
      const transferCode = await payoutToCreator(
        recipientCode,
        order.creatorPayout ?? 0,
        `UGC Payout for ${order.productName || orderId}`
      );
      const now = new Date().toISOString();
      const { error } = await db.from('ugcOrders').update({
        paystackTransferCode: transferCode,
        paymentStatus: 'PAID_OUT',
        paidOutAt: now,
        updatedAt: now,
      }).eq('id', orderId);
      if (error) throw error;
      await incrementCreator(order.creatorId, { totalEarnings: order.creatorPayout ?? 0 });
      return NextResponse.json({ success: true, transferCode });
    }

    if (action === 'open_dispute') {
      const { reason, note } = body;
      const now = new Date().toISOString();
      const { error } = await db.from('ugcOrders').update({
        status: 'DISPUTED',
        disputeReason: reason || 'OTHER',
        disputeDescription: note || null,
        disputeOpenedBy: brand.id,
        disputeOpenedAt: now,
        updatedAt: now,
      }).eq('id', orderId);
      if (error) throw error;
      return NextResponse.json({ success: true, status: 'DISPUTED' });
    }

    return fail('Unknown action');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Something went wrong';
    return fail(message, 500);
  }
}
