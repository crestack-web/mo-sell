import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import { resolveAuthEmails, type AccountModule } from '@/lib/account-identity';

export const dynamic = 'force-dynamic';

/** Resolves the auth aliases that belong to a real email for one module. */
export async function GET(request: NextRequest) {
  try {
    const params = new URL(request.url).searchParams;
    const email = (params.get('email') || '').trim().toLowerCase();
    const module = params.get('module') as AccountModule | null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }
    if (module !== 'creator' && module !== 'brand') {
      return NextResponse.json({ error: 'Invalid module' }, { status: 400 });
    }

    const authEmails = await resolveAuthEmails(getSupabaseServer().auth, email, module);
    return NextResponse.json({ authEmails });
  } catch (err) {
    console.error('[Account Resolve] Error:', err);
    return NextResponse.json({ error: 'Unable to resolve account' }, { status: 500 });
  }
}
