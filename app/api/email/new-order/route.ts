import { NextRequest, NextResponse } from 'next/server';
import { sendNewOrderEmailToMerchant } from '@/lib/services/email/order-emails';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { merchantEmail, orderNumber, customerName, total, storeName, currency } = body;

    if (!merchantEmail || !orderNumber || !storeName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await sendNewOrderEmailToMerchant({
      merchantEmail,
      orderNumber,
      customerName: customerName || 'Customer',
      total: total || 0,
      storeName,
      currency,
    });

    return NextResponse.json({ success: result.success });
  } catch (err) {
    console.error('[New Order Email] Error:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
