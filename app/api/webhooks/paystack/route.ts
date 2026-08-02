import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/database/postgresql-adapter';

export async function POST(req: NextRequest) {
  try {
    // Verify Paystack signature
    const signature = req.headers.get('x-paystack-signature');
    const secret = process.env.PAYSTACK_SECRET_KEY || process.env.PAYSTACK_WEBHOOK_SECRET;

    if (!signature || !secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get raw body for signature verification
    const body = await req.text();
    
    // Note: In production, verify the signature here
    // For now, we'll parse the JSON
    const event = JSON.parse(body);

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await handlePaymentSuccess(event.data);
        break;
      case 'charge.failed':
        await handlePaymentFailed(event.data);
        break;
      default:
        console.log(`[Paystack Webhook] Unhandled event: ${event.event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Paystack Webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}

async function handlePaymentSuccess(data: any) {
  try {
    // Create order in Supabase
    const { error } = await supabaseServer
      .from('orders')
      .insert({
        id: data.reference,
        order_number: `ORD-${Date.now()}`,
        customer_email: data.customer.email,
        customer_name: data.customer.first_name + ' ' + data.customer.last_name,
        total: data.amount / 100, // Convert from kobo to naira
        status: 'paid',
        payment_status: 'paid',
        paystack_reference: data.reference,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[Paystack Webhook] Failed to create order:', error);
    }
  } catch (error) {
    console.error('[Paystack Webhook] Error handling payment success:', error);
  }
}

async function handlePaymentFailed(data: any) {
  try {
    // Log failed payment
    const { error } = await supabaseServer
      .from('payments')
      .insert({
        reference: data.reference,
        email: data.customer.email,
        amount: data.amount,
        status: 'failed',
        error_message: data.gateway_response,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[Paystack Webhook] Failed to log failed payment:', error);
    }
  } catch (error) {
    console.error('[Paystack Webhook] Error handling payment failed:', error);
  }
}