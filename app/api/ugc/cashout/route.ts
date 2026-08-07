import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import { createTransferRecipient, payoutToCreator } from '@/lib/paystack-ugc';
import { getCreatorById, updateCreator, incrementCreator } from '@/lib/ugc';

export async function POST(req: NextRequest) {
  try {
    const { userId, accountNumber, bankCode, accountName, bankName } = await req.json();
    if (!userId || !accountNumber || !bankCode) {
      return NextResponse.json({ error: 'userId, accountNumber and bankCode required' }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    const { data: ordersRows, error: ordersError } = await supabase
      .from('ugcOrders')
      .select('*')
      .eq('creatorId', userId);
    if (ordersError) throw ordersError;

    const eligible = (ordersRows ?? [])
      .filter((o: any) => o.status === 'COMPLETED' && o.paymentStatus !== 'PAID_OUT')
      .map((o: any) => ({ id: o.id, data: o }));

    if (eligible.length === 0) {
      return NextResponse.json({ error: 'No completed orders available to cash out' }, { status: 400 });
    }

    const creator = (await getCreatorById(userId)) ?? ({} as any);
    const displayName = creator.displayName ?? accountName ?? 'Creator';

    const recipientCode = await createTransferRecipient(displayName, accountNumber, bankCode);

    const totalPayout = eligible.reduce((s: number, o: { data: any }) => s + (o.data.creatorPayout ?? 0), 0);
    const transferCode = await payoutToCreator(
      recipientCode,
      totalPayout,
      `UGC payout for ${eligible.length} order(s)`
    );

    for (const o of eligible) {
      const { error: updateError } = await supabase.from('ugcOrders').update({
        paystackTransferCode: transferCode,
        paymentStatus: 'PAID_OUT',
        paidOutAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).eq('id', o.id);
      if (updateError) throw updateError;
    }

    await updateCreator(userId, {
      bankName: bankName ?? creator.bankName ?? null,
      bankCode,
      accountNumber,
      accountName: accountName ?? null,
      updatedAt: new Date().toISOString(),
    });
    await incrementCreator(userId, { totalEarnings: totalPayout });

    return NextResponse.json({ success: true, ordersPaid: eligible.length, amount: totalPayout, transferCode });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
