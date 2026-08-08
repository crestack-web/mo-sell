import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import { createTransferRecipient, payoutToCreator, calculateUGCPayment } from '@/lib/paystack-ugc';
import { getCreatorById, incrementCreator } from '@/lib/ugc';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { accountNumber, bankCode, accountName } = await req.json();
    if (!accountNumber || !bankCode) {
      return NextResponse.json({ error: 'accountNumber and bankCode required' }, { status: 400 });
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

    if (order.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Order must be COMPLETED' }, { status: 400 });
    }
    if (order.paymentStatus === 'PAID_OUT') {
      return NextResponse.json({ error: 'Already paid out' }, { status: 400 });
    }

    const creator = (await getCreatorById(order.creatorId)) as any;
    const displayName = creator?.displayName ?? accountName ?? 'Creator';

    const recipientCode = await createTransferRecipient(displayName, accountNumber, bankCode);
    const transferCode = await payoutToCreator(
      recipientCode,
      order.creatorPayout,
      `UGC Payout for Order ${id}`
    );

    await supabase.from('ugcOrders').update({
      paystackTransferCode: transferCode,
      paymentStatus: 'PAID_OUT',
      updatedAt: new Date().toISOString(),
    }).eq('id', id);

    await incrementCreator(order.creatorId, { totalEarnings: order.creatorPayout });

    return NextResponse.json({ success: true, transferCode });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
