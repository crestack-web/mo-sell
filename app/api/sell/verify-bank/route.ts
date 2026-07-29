import { NextRequest, NextResponse } from 'next/server';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

// GET: List banks from Paystack API
export async function GET() {
  if (!PAYSTACK_SECRET || PAYSTACK_SECRET === 'your-paystack-secret-key') {
    return NextResponse.json({ banks: [] });
  }

  try {
    const allBanks: { code: string; name: string }[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const res = await fetch(
        `https://api.paystack.co/bank?page=${page}&perPage=100`,
        { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } }
      );
      const data = await res.json() as {
        status: boolean;
        data?: { code?: string; name?: string }[];
        meta?: { page: number; perPage: number; total: number; pageCount: number };
      };

      if (!data.status || !data.data) break;

      for (const bank of data.data) {
        if (bank.code && bank.name) {
          allBanks.push({ code: bank.code, name: bank.name });
        }
      }

      const meta = data.meta;
      if (meta && meta.page < meta.pageCount) {
        page++;
      } else {
        hasMore = false;
      }
    }

    return NextResponse.json({ banks: allBanks });
  } catch {
    return NextResponse.json({ banks: [] });
  }
}

// POST: Verify account number
export async function POST(request: NextRequest) {
  try {
    const { accountNumber, bankCode } = await request.json();

    if (!accountNumber || accountNumber.length !== 10) {
      return NextResponse.json({ error: 'Account number must be 10 digits' }, { status: 400 });
    }
    if (!bankCode) {
      return NextResponse.json({ error: 'Bank code is required' }, { status: 400 });
    }

    if (!PAYSTACK_SECRET || PAYSTACK_SECRET === 'your-paystack-secret-key') {
      return NextResponse.json({ error: 'Paystack not configured. Add PAYSTACK_SECRET_KEY to .env.local' }, { status: 503 });
    }

    const res = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: data.message ?? `Paystack error (${res.status})` }, { status: 400 });
    }

    if (!data.status || !data.data?.account_name) {
      return NextResponse.json({ error: data.message ?? 'Could not verify account. Check the account number and bank.' }, { status: 400 });
    }

    return NextResponse.json({
      accountName: data.data.account_name,
      accountNumber: data.data.account_number,
      bankCode: data.data.bank_code,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to verify account';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
