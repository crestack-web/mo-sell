import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import {
  normalizeDomain,
  isValidDomainFormat,
  cnamePointsToPlatform,
  getCustomDomainCnameTarget,
} from '@/lib/domain';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dns = require('dns').promises as {
  resolveCname(hostname: string): Promise<string[]>;
  resolve4(hostname: string): Promise<string[]>;
};

/**
 * POST /api/store/domain/verify
 * Verifies that a merchant's custom domain CNAME points at the platform target
 * (default store.busmo.io, overridable via CUSTOM_DOMAIN_CNAME_TARGET).
 *
 * Body: { businessId: string; customDomain: string }
 * Returns: { verified: boolean; resolvedTo: string[]; target: string }
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
      { status: 400 },
    );
  }

  const domain = normalizeDomain(customDomain);
  if (!domain || !isValidDomainFormat(domain)) {
    return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });
  }

  const target = getCustomDomainCnameTarget();

  try {
    const supabase = getSupabaseServer();

    const { data: config, error: configError } = await supabase
      .from('businesses')
      .select('id, customDomain, customDomainStatus')
      .eq('id', businessId)
      .maybeSingle();

    if (configError) {
      console.error('[Domain Verify] Config query error:', configError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (!config) {
      return NextResponse.json({ error: 'Store config not found' }, { status: 404 });
    }

    const storedDomain = normalizeDomain(config.customDomain ?? '');
    if (!storedDomain || storedDomain !== domain) {
      return NextResponse.json(
        { error: 'Domain does not match stored value — save the domain first' },
        { status: 409 },
      );
    }

    // DNS CNAME lookup (strip trailing dots on records)
    let resolved: string[] = [];
    try {
      const records = await dns.resolveCname(domain);
      resolved = records.map((r) => r.toLowerCase().replace(/\.$/, ''));
    } catch {
      // NXDOMAIN / no CNAME — try www variant if merchant used apex
      try {
        if (!domain.startsWith('www.')) {
          const wwwRecords = await dns.resolveCname(`www.${domain}`);
          resolved = wwwRecords.map((r) => r.toLowerCase().replace(/\.$/, ''));
        }
      } catch {
        // still nothing
      }
    }

    const verified = cnamePointsToPlatform(resolved, target);

    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        customDomainStatus: verified ? 'verified' : 'failed',
        customDomainVerifiedAt: verified ? new Date().toISOString() : null,
        // Keep stored domain in normalized form
        customDomain: domain,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', businessId);

    if (updateError) {
      console.error('[Domain Verify] Update error:', updateError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({
      verified,
      resolvedTo: resolved,
      target,
      message: verified
        ? 'Domain verified'
        : resolved.length === 0
          ? `No CNAME found for ${domain}. Point a CNAME to ${target} and wait for DNS (up to 48h).`
          : `CNAME resolves to ${resolved.join(', ')} — expected ${target}.`,
    });
  } catch (err) {
    console.error('[Domain Verify]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
