import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * PATCH /api/store/config
 * Auth-required update of businesses row fields (linkBio, theme, etc.).
 * Uses the service role so client RLS cannot block profile saves.
 */
export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !serviceKey || !anonKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = userData.user.id;

    const body = await req.json();
    const { businessId, patch } = body as { businessId?: string; patch?: Record<string, unknown> };
    if (!businessId || !patch || typeof patch !== 'object') {
      return NextResponse.json({ error: 'businessId and patch are required' }, { status: 400 });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userRow } = await admin
      .from('users')
      .select('id, businessId')
      .eq('id', userId)
      .maybeSingle();

    const { data: biz } = await admin
      .from('businesses')
      .select('id, ownerUserId')
      .eq('id', businessId)
      .maybeSingle();

    const owns =
      (userRow?.businessId && userRow.businessId === businessId) ||
      (biz?.ownerUserId && String(biz.ownerUserId) === userId);

    if (!owns) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allowed = new Set([
      'linkBio',
      'linkBioTheme',
      'mode',
      'theme',
      'storeName',
      'storeSlug',
      'logoUrl',
      'tagline',
      'primaryColor',
      'secondaryColor',
      'fontFamily',
      'buttonStyle',
      'bodyTextColor',
      'bgColor',
      'sections',
      'status',
      'updatedAt',
    ]);
    const clean: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    for (const [k, v] of Object.entries(patch)) {
      if (allowed.has(k)) clean[k] = v;
    }

    const { data: updated, error } = await admin
      .from('businesses')
      .update(clean)
      .eq('id', businessId)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('[api/store/config] update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!updated) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[api/store/config]', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
