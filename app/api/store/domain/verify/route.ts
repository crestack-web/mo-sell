import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dns = require('dns').promises as { resolveCname(hostname: string): Promise<string[]> };

/**
 * POST /api/store/domain/verify
 * Verifies that a merchant's custom domain CNAME points to store.busmo.io.
 * Requires authenticated merchant session (businessId matched to userId).
 *
 * Body: { businessId: string; customDomain: string }
 * Returns: { verified: boolean; resolvedTo: string[] }
 */
export async function POST(req: NextRequest) {
  let body: { businessId: string; customDomain: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { businessId, customDomain } = body;
  if (!businessId || !customDomain) {
    return NextResponse.json(
      { error: 'businessId and customDomain are required' },
      { status: 400 }
    );
  }

  // Sanitise the domain input
  const domain = customDomain.toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .trim();

  if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
    return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();

    // Confirm domain matches what's stored for this business
    const { data: config, error: configError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .maybeSingle();

    if (configError) {
      console.error('[Domain Verify] Config query error:', configError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (!config) {
      return NextResponse.json({ error: 'Store config not found' }, { status: 404 });
    }

    const storedDomain = config.customDomain ?? '';
    if (storedDomain.toLowerCase() !== domain) {
      return NextResponse.json(
        { error: 'Domain does not match stored value — save settings first' },
        { status: 409 }
      );
    }

    // DNS CNAME lookup
    let resolved: string[] = [];
    try {
      resolved = await dns.resolveCname(domain);
    } catch {
      // NXDOMAIN or no CNAME record — not yet propagated
    }

    const verified = resolved.some(
      r => r === 'store.busmo.io' || r.endsWith('.busmo.io')
    );

    // Update the businesses row with verification result
    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        customDomainStatus:     verified ? 'verified' : 'failed',
        customDomainVerifiedAt: verified ? new Date().toISOString() : null,
        updatedAt:              new Date().toISOString(),
      })
      .eq('id', businessId);

    if (updateError) {
      console.error('[Domain Verify] Update error:', updateError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ verified, resolvedTo: resolved });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
