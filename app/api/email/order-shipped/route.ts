import { NextRequest, NextResponse } from 'next/server';
import { sendOrderShippedEmail, sendOrderDeliveredEmail } from '@/lib/services/email/order-emails';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, customerName, orderNumber, storeName, event, carrier, trackingNumber, trackingUrl } = body;

    if (!email || !orderNumber || !storeName || !customerName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (event === 'delivered') {
      const result = await sendOrderDeliveredEmail({
        email,
        customerName,
        orderNumber,
        storeName,
      });
      return NextResponse.json({ success: result.success });
    }

    const result = await sendOrderShippedEmail({
      email,
      customerName,
      orderNumber,
      storeName,
      carrier,
      trackingNumber,
      trackingUrl,
    });
    return NextResponse.json({ success: result.success });
  } catch (err) {
    console.error('[Order Status Email] Error:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
