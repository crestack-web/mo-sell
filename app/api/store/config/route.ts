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
      .select('id, ownerUserId, linkBio')
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

    // Deep-merge linkBio so socials/name/bio never wipe other design fields,
    // and so a partial client payload still lands socials correctly.
    if (clean.linkBio && typeof clean.linkBio === 'object') {
      const existing =
        biz?.linkBio && typeof biz.linkBio === 'object' && !Array.isArray(biz.linkBio)
          ? (biz.linkBio as Record<string, unknown>)
          : {};
      const incoming = clean.linkBio as Record<string, unknown>;

      // Normalize socials to [{ platform, url }]
      let socials = incoming.socials;
      if (Array.isArray(socials)) {
        socials = socials
          .map((s: any) => ({
            platform: String(s?.platform || 'instagram').toLowerCase().trim(),
            url: String(s?.url || '').trim(),
          }))
          .filter((s: { url: string }) => !!s.url);
      } else if (socials && typeof socials === 'object') {
        // Accept map form { instagram: '@x' }
        socials = Object.entries(socials as Record<string, string>)
          .map(([platform, url]) => ({
            platform: platform.toLowerCase().trim(),
            url: String(url || '').trim(),
          }))
          .filter(s => !!s.url);
      } else {
        socials = Array.isArray(existing.socials) ? existing.socials : [];
      }

      clean.linkBio = {
        ...existing,
        ...incoming,
        socials,
        updatedAt: new Date().toISOString(),
      };
    }

    const { data: updated, error } = await admin
      .from('businesses')
      .update(clean)
      .eq('id', businessId)
      .select('id, linkBio, storeName')
      .maybeSingle();

    if (error) {
      console.error('[api/store/config] update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!updated) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      linkBio: updated.linkBio ?? null,
      storeName: updated.storeName ?? null,
    });
  } catch (err: any) {
    console.error('[api/store/config]', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
