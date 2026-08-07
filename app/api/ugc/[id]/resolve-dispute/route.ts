import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import { refundToBrand, createTransferRecipient, payoutToCreator } from '@/lib/paystack-ugc';
import { getCreatorById, incrementCreator } from '@/lib/ugc';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { resolution, accountNumber, bankCode, accountName } = await req.json();
    if (!resolution) {
      return NextResponse.json({ error: 'resolution required (refund_brand | pay_creator | split)' }, { status: 400 });
    }
    if (!['refund_brand', 'pay_creator', 'split'].includes(resolution)) {
      return NextResponse.json({ error: 'resolution must be refund_brand, pay_creator, or split' }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: order, error: orderError } = await supabase
      .from('ugcOrders')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (orderError) throw orderError;
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'DISPUTED') {
      return NextResponse.json({ error: 'Order is not in DISPUTED status' }, { status: 400 });
    }

    if (resolution === 'refund_brand') {
      if (order.paystackRefDeposit) {
        await refundToBrand(order.paystackRefDeposit);
      }
      if (order.paystackRefBalance) {
        await refundToBrand(order.paystackRefBalance);
      }
    } else if (resolution === 'pay_creator') {
      if (!accountNumber || !bankCode) {
        return NextResponse.json({ error: 'accountNumber and bankCode required for pay_creator' }, { status: 400 });
      }
      const creator = (await getCreatorById(order.creatorId)) as any;
      const displayName = creator?.displayName ?? accountName ?? 'Creator';
      const recipientCode = await createTransferRecipient(displayName, accountNumber, bankCode);
      await payoutToCreator(recipientCode, order.creatorPayout, `UGC Payout for Order ${id}`);
    } else if (resolution === 'split') {
      if (!accountNumber || !bankCode) {
        return NextResponse.json({ error: 'accountNumber and bankCode required for split' }, { status: 400 });
      }
      const creator = (await getCreatorById(order.creatorId)) as any;
      const displayName = creator?.displayName ?? accountName ?? 'Creator';
      const splitAmount = Math.floor(order.creatorPayout / 2);
      const recipientCode = await createTransferRecipient(displayName, accountNumber, bankCode);
      await payoutToCreator(recipientCode, splitAmount, `UGC Split Payout ${id}`);
    }

    await supabase.from('ugcOrders').update({
      disputeResolvedAt: new Date().toISOString(),
      disputeResolution: resolution,
      status: resolution === 'refund_brand' ? 'CANCELLED' : 'COMPLETED',
      paymentStatus: resolution === 'refund_brand' ? 'REFUNDED' : 'PAID_OUT',
      updatedAt: new Date().toISOString(),
    }).eq('id', id);

    if (resolution === 'pay_creator' || resolution === 'split') {
      await incrementCreator(order.creatorId, {
        totalEarnings: resolution === 'split' ? Math.floor(order.creatorPayout / 2) : order.creatorPayout,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
