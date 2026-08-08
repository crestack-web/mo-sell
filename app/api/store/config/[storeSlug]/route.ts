import { NextRequest, NextResponse } from 'next/server';
import { getStoreConfigBySlug } from '@/lib/store';

/**
 * GET /api/store/config/[storeSlug]
 * Public — returns store config for a given slug from Supabase.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  const { storeSlug } = await params;

  if (!storeSlug) {
    return NextResponse.json({ error: 'storeSlug is required' }, { status: 400 });
  }

  try {
    const config = await getStoreConfigBySlug(storeSlug);
    if (!config) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Redact seller payout details before exposing config publicly
    const {
      payoutBankName: _payoutBankName,
      payoutBankCode: _payoutBankCode,
      payoutAccountName: _payoutAccountName,
      payoutAccountNumber: _payoutAccountNumber,
      ...publicConfig
    } = config;

    return NextResponse.json({
      ...publicConfig,
      whopEnabled: false,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
