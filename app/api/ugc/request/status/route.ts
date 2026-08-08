import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';

const PAYSTACK_SECRET = () => process.env.PAYSTACK_SECRET_KEY ?? '';

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get('reference');
  if (!reference) {
    return NextResponse.json({ status: 'pending' });
  }

  try {
    if (!PAYSTACK_SECRET()) {
      return NextResponse.json({ status: 'pending' });
    }

    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET()}` } }
    );
    const data = await verifyRes.json();
    const paid = data?.status === true && data?.data?.status === 'success';
    if (!paid) {
      return NextResponse.json({ status: 'pending' });
    }

    const supabase = getSupabaseServer();
    const { data: orders, error } = await supabase
      .from('ugcOrders')
      .select('*')
      .eq('paystackRefDeposit', reference)
      .limit(1);
    if (!error && orders && orders.length > 0) {
      const order = orders[0];
      if (order.paymentStatus !== 'DEPOSIT_HELD') {
        await supabase.from('ugcOrders').update({
          paymentStatus: 'DEPOSIT_HELD',
          status: 'IN_PROGRESS',
          acceptedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }).eq('id', order.id);
      }
    }

    return NextResponse.json({ status: 'success' });
  } catch {
    return NextResponse.json({ status: 'pending' });
  }
}
