import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import { processConfirmedOrder } from '@/lib/services/mo-sell-integration-bridge';

export async function POST(req: NextRequest) {
  let body: { storeSlug: string; productId: string; paystackReference: string; customerEmail: string; customerName?: string; customerPhone?: string; bookingId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { storeSlug, productId, paystackReference, customerEmail, customerName, customerPhone, bookingId } = body;
  if (!storeSlug || !productId || !paystackReference || !customerEmail) {
    return NextResponse.json({ error: 'storeSlug, productId, paystackReference, customerEmail required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();

    // 1. Resolve businessId from storeSlug
    let businessId = '';
    let storeData: Record<string, any> | null = null;

    const { data: indexRow } = await supabase
      .from('storeIndex')
      .select('*')
      .eq('id', storeSlug)
      .maybeSingle();
    if (indexRow) {
      businessId = indexRow.businessId ?? '';
      if (businessId) {
        const { data: configRow } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', businessId)
          .maybeSingle();
        if (configRow) storeData = configRow as Record<string, any>;
      }
    }

    if (!storeData) {
      const { data: fallback } = await supabase
        .from('businesses')
        .select('*')
        .eq('storeSlug', storeSlug)
        .limit(1)
        .maybeSingle();
      if (fallback) {
        storeData = fallback as Record<string, any>;
        businessId = fallback.id ?? '';
      }
    }

    if (!businessId || !storeData) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // 2. Load product
    const { data: productRow } = await supabase
      .from('storeProducts')
      .select('*')
      .eq('id', productId)
      .eq('businessId', businessId)
      .maybeSingle();
    if (!productRow) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    const product = { id: productRow.id, ...productRow } as Record<string, any>;
    if (!product.available) {
      return NextResponse.json({ error: 'Product is not available' }, { status: 400 });
    }

    // 3. Resolve Paystack key
    let paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (storeData?.useOwnPaystack && storeData?.paystackSecretKey) {
      paystackSecretKey = storeData.paystackSecretKey;
    }
    if (!paystackSecretKey) {
      return NextResponse.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    // 4. Verify the Paystack transaction
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(paystackReference)}`,
      { headers: { Authorization: `Bearer ${paystackSecretKey}` } }
    );
    const verifyData = await verifyRes.json() as {
      status: boolean;
      data?: { status: string; amount: number; currency: string; reference: string };
    };

    if (!verifyData.status || !verifyData.data) {
      return NextResponse.json({ error: 'Paystack verification failed' }, { status: 502 });
    }

    const txn = verifyData.data;
    if (txn.status !== 'success') {
      return NextResponse.json({ error: `Payment not successful: ${txn.status}` }, { status: 402 });
    }

    // Validate amount matches product price
    const priceKobo = Math.round(product.price * 100);
    if (txn.amount < priceKobo) {
      return NextResponse.json({ error: 'Payment amount does not match product price' }, { status: 400 });
    }

    // 5. Create a checkout session for the single product
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const sessionId = 'cs_' + crypto.randomUUID();

    const lineItem = {
      productId: product.id,
      productType: product.productType ?? 'physical',
      displayName: product.displayName ?? '',
      quantity: 1,
      unitPrice: product.price ?? 0,
      lineTotal: product.price ?? 0,
    };

    const { error: sessionError } = await supabase.from('checkoutSessions').insert({
      id: sessionId,
      storeSlug,
      businessId,
      lineItems: [lineItem],
      customerName: customerName || customerEmail.split('@')[0],
      customerEmail,
      customerPhone: customerPhone || '',
      deliveryOption: product.productType === 'digital' ? 'delivery' : 'delivery',
      shippingAddress: null,
      shippingZoneId: null,
      shippingCost: 0,
      subtotal: product.price ?? 0,
      total: product.price ?? 0,
      paystackReference,
      status: 'payment_confirmed',
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      ...(bookingId ? { metadata: { bookingId } } : {}),
    });
    if (sessionError) {
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }

    // 6. Run Integration Bridge
    const bridgeResult = await processConfirmedOrder({
      businessId,
      sessionId,
      paystackData: {
        reference: txn.reference,
        status: txn.status,
        amount: txn.amount,
        currency: txn.currency,
        metadata: { productId: product.id, storeSlug, source: 'link-in-bio', ...(bookingId ? { bookingId } : {}) },
      },
    });

    const orderId = bridgeResult.orderId;

    if (bookingId) {
      try {
        await supabase
          .from('storeBookings')
          .update({
            status: 'confirmed',
            orderId: orderId || null,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', bookingId)
          .eq('businessId', businessId);
      } catch (err) {
        console.error('[confirm] Failed to update booking status:', err);
      }
    }

    return NextResponse.json({ orderId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
