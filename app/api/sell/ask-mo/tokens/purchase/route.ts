import { NextRequest, NextResponse } from 'next/server';
import { TOKEN_PACKAGES, TOKEN_DOC_PATH, TOKEN_BALANCE_FIELD, TOKEN_PURCHASED_FIELD } from '@/lib/ask-mo-tokens';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, packageId, email } = body as {
      businessId: string;
      packageId: string;
      email: string;
    };

    if (!businessId || !packageId || !email) {
      return NextResponse.json({ error: 'businessId, packageId, and email required' }, { status: 400 });
    }

    const pkg = TOKEN_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    // Use Busmo's Paystack key for token purchases
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      return NextResponse.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    const baseUrl = process.env.PUBLIC_APP_URL ?? 'http://localhost:3000';
    const reference = `askmo_tokens_${businessId}_${Date.now()}`;

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: pkg.price * 100,
        currency: 'NGN',
        reference,
        metadata: {
          payment_type: 'ask_mo_tokens',
          businessId,
          packageId: pkg.id,
          tokens: pkg.tokens,
          amount: pkg.price,
        },
        callback_url: `${baseUrl}/dashboard/ask-mo`,
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
        { status: 502 },
      );
    }

    return NextResponse.json({
      paystackUrl: paystackData.data.authorization_url,
      reference,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Tokens] Purchase error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
