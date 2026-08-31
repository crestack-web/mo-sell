import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';

const BUSMO_APP_URL = process.env.BUSMO_APP_URL?.replace(/\/$/, '') || 'https://busmo.app';

/**
 * Verify a Busmo-issued handoff token, ensure Mo-sell auth user exists,
 * return hashed token for client session.
 */
export async function POST(req: NextRequest) {
  try {
    let body: { token?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const token = String(body.token || '').trim();
    if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 });

    const verifyRes = await fetch(
      `${BUSMO_APP_URL}/api/integrations/mo-sell/handoff?token=${encodeURIComponent(token)}`,
      { cache: 'no-store' }
    );
    const verified = await verifyRes.json().catch(() => ({}));
    if (!verifyRes.ok || !verified.email) {
      return NextResponse.json(
        { error: verified.error || 'Invalid or expired Busmo token' },
        { status: 401 }
      );
    }

    const email = String(verified.email).toLowerCase().trim();
    const fullName = String(verified.fullName || email.split('@')[0]);

    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    let userId: string | null = null;
    const list = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list.data?.users?.find((u) => u.email?.toLowerCase() === email);
    if (existing) {
      userId = existing.id;
    } else {
      const created = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          name: fullName,
          source: 'busmo_handoff',
          busmoUserId: verified.busmoUserId || null,
        },
      });
      if (created.error || !created.data.user) {
        console.error('[busmo-handoff] createUser', created.error?.message);
        return NextResponse.json(
          { error: created.error?.message || 'Could not create account' },
          { status: 500 }
        );
      }
      userId = created.data.user.id;
    }

    const link = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });
    if (link.error || !link.data) {
      console.error('[busmo-handoff] generateLink', link.error?.message);
      return NextResponse.json(
        { error: link.error?.message || 'Could not create session' },
        { status: 500 }
      );
    }

    const props = link.data.properties as {
      hashed_token?: string;
      email_otp?: string;
    };

    return NextResponse.json({
      email,
      fullName,
      userId,
      hashedToken: props?.hashed_token || null,
    });
  } catch (e: any) {
    console.error('[busmo-handoff]', e?.message || e);
    return NextResponse.json({ error: e?.message || 'Handoff failed' }, { status: 500 });
  }
}
