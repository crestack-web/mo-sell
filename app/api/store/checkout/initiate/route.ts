import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';

interface LineItemInput {
  productId: string;
  productType: 'physical' | 'digital' | 'service';
  displayName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface CheckoutInitiateBody {
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

function validateBody(body: Partial<CheckoutInitiateBody>): string | null {
  if (!body.storeSlug)    return 'storeSlug is required';
  if (!body.businessId)   return 'businessId is required';
  if (!body.customerName) return 'customerName is required';
  if (!body.customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.customerEmail))
    return 'valid customerEmail is required';
  if (!body.lineItems?.length) return 'lineItems must not be empty';
  if (typeof body.total !== 'number' || body.total <= 0) return 'total must be > 0';
  for (const item of body.lineItems!) {
    if (!item.displayName || item.quantity < 1 || item.unitPrice < 0)
      return 'Invalid line item';
  }
  return null;
}

/**
 * POST /api/store/checkout/initiate
 *
 * Creates a CheckoutSession, initialises a Paystack transaction,
 * and returns { paystackUrl, sessionId }.
 */
export async function POST(req: NextRequest) {
  let body: Partial<CheckoutInitiateBody>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validationError = validateBody(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const {
    storeSlug, businessId, lineItems, customerName, customerEmail,
    customerPhone, deliveryOption, shippingAddress, shippingZoneId,
    shippingCost, subtotal, total,
  } = body as CheckoutInitiateBody;

  try {
    const supabase = getSupabaseServer();

    // 1. Create CheckoutSession (status: pending)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour TTL
    const sessionId = 'cs_' + crypto.randomUUID();

    const { error: sessionError } = await supabase.from('checkoutSessions').insert({
      id: sessionId,
      storeSlug, businessId, lineItems,
      customerName, customerEmail, customerPhone,
      deliveryOption, shippingAddress, shippingZoneId,
      shippingCost, subtotal, total,
      paystackReference: null,
      status: 'pending',
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    });
    if (sessionError) {
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }

    // 2. Verify store has bank account set up for payouts
    const { data: configRow } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .maybeSingle();
    const storeConfig = configRow ?? null;
    const hasPayoutBank = storeConfig?.payoutAccountName && storeConfig?.payoutAccountNumber && storeConfig?.payoutBankCode;
    if (!hasPayoutBank) {
      return NextResponse.json({ error: 'Store owner has not configured payout bank account. Payments are disabled.' }, { status: 503 });
    }

    // 3. Initialise Paystack transaction
    // If store has verified bank account, use Busmo's keys (managed payments)
    // Otherwise, allow using their own keys if configured
    let paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!hasPayoutBank && storeConfig?.useOwnPaystack && storeConfig?.paystackSecretKey) {
      paystackSecretKey = storeConfig.paystackSecretKey;
    }

    if (!paystackSecretKey) {
      return NextResponse.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    const baseUrl = process.env.PUBLIC_APP_URL ?? 'http://localhost:3000';
    const reference = `mosell_${sessionId}_${Date.now()}`;

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email:        customerEmail,
        amount:       Math.round(total * 100), // kobo
        currency:     'NGN',
        reference,
        metadata:     { sessionId, businessId, storeSlug },
        callback_url: `${baseUrl}/${storeSlug}/order/pending`,
      }),
    });

    const paystackData = await paystackRes.json() as {
      status: boolean;
      data?: { authorization_url: string; reference: string };
      message?: string;
    };

    if (!paystackData.status || !paystackData.data) {
      return NextResponse.json(
        { error: paystackData.message ?? 'Payment initialization failed' },
        { status: 502 }
      );
    }

    // 3. Update session with reference and status
    const { error: updateError } = await supabase
      .from('checkoutSessions')
      .update({
        paystackReference: reference,
        status: 'payment_initiated',
        updatedAt: new Date().toISOString(),
      })
      .eq('id', sessionId);
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update checkout session' }, { status: 500 });
    }

    return NextResponse.json({
      paystackUrl: paystackData.data.authorization_url,
      sessionId,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
