import { NextRequest, NextResponse } from 'next/server';
import { getServerFirestore as getAdminDb, FieldValue } from '@/lib/server-firestore';
import { whopClient } from '@/lib/whop-sdk';

interface LineItemInput {
  productId: string;
  productType: string;
  displayName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface WhopInitiateBody {
  storeSlug: string;
  businessId: string;
  lineItems: LineItemInput[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryOption: 'delivery' | 'pickup';
  shippingAddress: string | null;
  shippingZoneId: string | null;
  shippingCost: number;
  subtotal: number;
  total: number;
}

export async function POST(req: NextRequest) {
  let body: Partial<WhopInitiateBody>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const whopKey = process.env.WHOP_API_KEY;
  const whopCompanyId = process.env.WHOP_COMPANY_ID;
  if (!whopKey || !whopCompanyId) {
    return NextResponse.json({ error: 'Whop not configured' }, { status: 500 });
  }

  if (!body.businessId || !body.total || body.total <= 0) {
    return NextResponse.json({ error: 'businessId and total are required' }, { status: 400 });
  }

  const { storeSlug, businessId, lineItems, customerName, customerEmail, customerPhone, deliveryOption, shippingAddress, shippingZoneId, shippingCost, subtotal, total } = body as WhopInitiateBody;

  try {
    const db = getAdminDb();

    // Create CheckoutSession (status: pending)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const sessionRef = db
      .collection('businesses').doc(businessId)
      .collection('checkoutSessions').doc();
    const sessionId = sessionRef.id;

    await sessionRef.set({
      storeSlug, businessId, lineItems,
      customerName, customerEmail, customerPhone,
      deliveryOption, shippingAddress, shippingZoneId,
      shippingCost, subtotal, total,
      paystackReference: null,
      paymentMethod: 'whop',
      status: 'pending',
      expiresAt,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Create Whop checkout configuration
    const baseUrl = process.env.PUBLIC_APP_URL ?? 'http://localhost:3000';

    const checkoutConfig = await whopClient.checkoutConfigurations.create({
      account_id: whopCompanyId,
      plan: {
        initial_price: total,
        plan_type: 'one_time',
        currency: 'usd',
      },
      metadata: {
        sessionId,
        businessId,
        storeSlug,
        source: 'mo-sell',
      },
    });

    const planId = checkoutConfig.plan?.id;
    if (!planId) {
      return NextResponse.json({ error: 'Failed to create Whop checkout' }, { status: 502 });
    }

    // Update session with Whop plan reference
    await sessionRef.update({
      paystackReference: planId,
      status: 'payment_initiated',
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      sessionId,
      planId,
      returnUrl: `${baseUrl}/${storeSlug}/order/pending`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
