import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabase-server';
import {
  isBusmoConfigured,
  findBusmoBusinessesByEmail,
  fetchBusmoPhysicalProducts,
  getBusmoClient,
} from '@/lib/busmo-client';

async function requireUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return { error: NextResponse.json({ error: 'Server not configured' }, { status: 503 }) };
  }

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const {
    data: { user },
    error,
  } = await userClient.auth.getUser();
  if (error || !user) {
    return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };
  }
  return { user };
}

async function getOwnedBusiness(businessId: string, userId: string, email?: string | null) {
  if (!supabaseServer) return null;
  const { data } = await supabaseServer
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .maybeSingle();
  if (!data) return null;
  return data;
}

/** Write mo_sell_* columns on the Busmo businesses row so Busmo UI shows linked. */
async function writeBusmoReverseLink(params: {
  busmoBusinessId: string;
  moSellBusinessId: string | null;
  linkedAt: string | null;
  storeUrl: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isBusmoConfigured()) {
    return { ok: false, error: 'Busmo client not configured' };
  }
  const busmo = getBusmoClient();
  const payload =
    params.moSellBusinessId == null
      ? {
          mo_sell_business_id: null,
          mo_sell_linked_at: null,
          mo_sell_store_url: null,
        }
      : {
          mo_sell_business_id: params.moSellBusinessId,
          mo_sell_linked_at: params.linkedAt,
          mo_sell_store_url: params.storeUrl,
        };

  const attempt = async () => {
    const { data, error } = await busmo
      .from('businesses')
      .update(payload)
      .eq('id', params.busmoBusinessId)
      .select('id, mo_sell_business_id')
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (params.moSellBusinessId && data?.mo_sell_business_id !== params.moSellBusinessId) {
      throw new Error('Busmo reverse link did not persist (row missing or update ignored)');
    }
    return data;
  };

  try {
    await attempt();
    return { ok: true };
  } catch (e1: any) {
    console.warn('[integrations/busmo] reverse link attempt 1 failed', e1?.message || e1);
    try {
      await new Promise((r) => setTimeout(r, 400));
      await attempt();
      return { ok: true };
    } catch (e2: any) {
      console.error('[integrations/busmo] reverse link failed', e2?.message || e2);
      return { ok: false, error: e2?.message || String(e2) };
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if ('error' in auth && auth.error) return auth.error;
    const user = auth.user!;

    const businessId = req.nextUrl.searchParams.get('businessId') || '';
    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }

    const biz = await getOwnedBusiness(businessId, user.id, user.email);
    if (!biz) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const linked = {
      busmoBusinessId: biz.busmoBusinessId || null,
      busmoLinkedAt: biz.busmoLinkedAt || null,
      busmoLinkedEmail: biz.busmoLinkedEmail || null,
    };

    let candidates: Array<{ id: string; name: string; category?: string | null }> = [];
    let busmoConfigured = isBusmoConfigured();
    if (busmoConfigured && user.email) {
      try {
        candidates = await findBusmoBusinessesByEmail(user.email);
      } catch (e: any) {
        console.error('[integrations/busmo GET]', e?.message || e);
        busmoConfigured = false;
      }
    }

    return NextResponse.json({
      configured: busmoConfigured,
      linked,
      candidates,
      email: user.email,
    });
  } catch (e: any) {
    console.error('[integrations/busmo GET]', e);
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if ('error' in auth && auth.error) return auth.error;
    const user = auth.user!;

    if (!supabaseServer) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');
    const businessId = String(body.businessId || '');
    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }

    const biz = await getOwnedBusiness(businessId, user.id, user.email);
    if (!biz) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    if (action === 'unlink') {
      const previousBusmoId = biz.busmoBusinessId ? String(biz.busmoBusinessId) : null;
      const { error } = await supabaseServer
        .from('businesses')
        .update({
          busmoBusinessId: null,
          busmoLinkedAt: null,
          busmoLinkedEmail: null,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', businessId);
      if (error) throw error;

      if (previousBusmoId) {
        await writeBusmoReverseLink({
          busmoBusinessId: previousBusmoId,
          moSellBusinessId: null,
          linkedAt: null,
          storeUrl: null,
        });
      }

      return NextResponse.json({ ok: true, linked: null });
    }

    if (action === 'link') {
      if (!isBusmoConfigured()) {
        return NextResponse.json(
          { error: 'Busmo integration is not configured on the server' },
          { status: 503 }
        );
      }
      const busmoBusinessId = String(body.busmoBusinessId || '').trim();
      if (!busmoBusinessId) {
        return NextResponse.json({ error: 'busmoBusinessId required' }, { status: 400 });
      }

      const allowDirect = body.fromBusmo === true;
      if (!allowDirect && user.email) {
        const candidates = await findBusmoBusinessesByEmail(user.email);
        if (!candidates.some((c) => c.id === busmoBusinessId) && candidates.length > 0) {
          return NextResponse.json(
            { error: 'That Busmo business is not linked to your email' },
            { status: 403 }
          );
        }
      }

      const now = new Date().toISOString();
      const storeUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mo-sell.store';

      const { error } = await supabaseServer
        .from('businesses')
        .update({
          busmoBusinessId,
          busmoLinkedAt: now,
          busmoLinkedEmail: user.email || null,
          updatedAt: now,
        })
        .eq('id', businessId);
      if (error) throw error;

      const reverse = await writeBusmoReverseLink({
        busmoBusinessId,
        moSellBusinessId: businessId,
        linkedAt: now,
        storeUrl,
      });

      if (!reverse.ok) {
        // Keep Mo-sell link but surface that Busmo UI may still show disconnected
        // until reverse link succeeds (env / migration).
        console.error('[integrations/busmo] link succeeded on Mo-sell but Busmo reverse failed:', reverse.error);
        return NextResponse.json({
          ok: true,
          linked: { busmoBusinessId, busmoLinkedAt: now, busmoLinkedEmail: user.email },
          busmoReverseLinked: false,
          warning:
            reverse.error ||
            'Connected on Mo-sell, but Busmo could not be updated. Check BUSMO_SUPABASE_* env and mo_sell_* columns on Busmo businesses.',
        });
      }

      return NextResponse.json({
        ok: true,
        linked: { busmoBusinessId, busmoLinkedAt: now, busmoLinkedEmail: user.email },
        busmoReverseLinked: true,
      });
    }

    if (action === 'import-products') {
      if (!isBusmoConfigured()) {
        return NextResponse.json(
          { error: 'Busmo integration is not configured on the server' },
          { status: 503 }
        );
      }
      const busmoBusinessId = String(biz.busmoBusinessId || body.busmoBusinessId || '').trim();
      if (!busmoBusinessId) {
        return NextResponse.json({ error: 'Connect Busmo first' }, { status: 400 });
      }

      const products = await fetchBusmoPhysicalProducts(busmoBusinessId);
      let imported = 0;
      let updated = 0;
      const now = new Date().toISOString();

      for (const p of products) {
        const busmoProductId = String(p.id);
        const { data: existing } = await supabaseServer
          .from('storeProducts')
          .select('id')
          .eq('businessId', businessId)
          .eq('busmoProductId', busmoProductId)
          .maybeSingle();

        const row = {
          businessId,
          productType: 'physical',
          displayName: p.name || 'Product',
          description: p.description || '',
          price: Number(p.price) || 0,
          stock: Math.max(0, Math.round(Number(p.stock_level) || 0)),
          sku: p.sku || null,
          category: p.category || null,
          images: p.image_url ? [p.image_url] : [],
          available: true,
          status: 'active',
          busmoProductId,
          updatedAt: now,
        };

        if (existing?.id) {
          await supabaseServer.from('storeProducts').update(row).eq('id', existing.id);
          updated++;
        } else {
          await supabaseServer.from('storeProducts').insert({
            id: `bsp_${busmoProductId}`.slice(0, 40),
            ...row,
            createdAt: now,
          });
          imported++;
        }
      }

      return NextResponse.json({
        ok: true,
        imported,
        updated,
        total: products.length,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    console.error('[integrations/busmo POST]', e);
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
