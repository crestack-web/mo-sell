/**
 * Server-only client for the Busmo (studio) Supabase project.
 * Requires BUSMO_SUPABASE_URL + BUSMO_SUPABASE_SERVICE_ROLE_KEY in env.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function isBusmoConfigured(): boolean {
  return Boolean(
    process.env.BUSMO_SUPABASE_URL?.trim() &&
      process.env.BUSMO_SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}

export function getBusmoClient(): SupabaseClient {
  if (client) return client;
  const url = process.env.BUSMO_SUPABASE_URL?.trim();
  const key = process.env.BUSMO_SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      'Busmo is not configured. Set BUSMO_SUPABASE_URL and BUSMO_SUPABASE_SERVICE_ROLE_KEY.'
    );
  }
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export type BusmoBusinessCandidate = {
  id: string;
  name: string;
  category?: string | null;
};

/** Find Busmo businesses owned by this email (users → businesses.owner_id). */
export async function findBusmoBusinessesByEmail(
  email: string
): Promise<BusmoBusinessCandidate[]> {
  const sb = getBusmoClient();
  const normalized = email.trim().toLowerCase();
  if (!normalized) return [];

  const { data: users, error: userErr } = await sb
    .from('users')
    .select('id, email')
    .ilike('email', normalized)
    .limit(20);

  if (userErr) {
    console.error('[busmo] users lookup', userErr.message);
  }

  const userIds = (users || []).map((u: any) => u.id).filter(Boolean);

  if (userIds.length === 0) {
    const { data: byContact } = await sb
      .from('businesses')
      .select('id, name, business_name, category, owner_id')
      .or(`email.ilike.${normalized},contact_email.ilike.${normalized}`)
      .limit(20);
    return (byContact || []).map((b: any) => ({
      id: String(b.id),
      name: String(b.business_name || b.name || 'Business'),
      category: b.category ?? null,
    }));
  }

  const { data: businesses, error: bizErr } = await sb
    .from('businesses')
    .select('id, name, business_name, category, owner_id')
    .in('owner_id', userIds)
    .limit(50);

  if (bizErr) {
    console.error('[busmo] businesses lookup', bizErr.message);
    return [];
  }

  return (businesses || []).map((b: any) => ({
    id: String(b.id),
    name: String(b.business_name || b.name || 'Business'),
    category: b.category ?? null,
  }));
}

export async function fetchBusmoPhysicalProducts(busmoBusinessId: string) {
  const sb = getBusmoClient();
  const { data, error } = await sb
    .from('products')
    .select(
      'id, name, description, category, sku, price, cost, stock_level, image_url, status, unit'
    )
    .eq('business_id', busmoBusinessId)
    .limit(500);

  if (error) throw new Error(error.message);
  return (data || []).filter((p: any) => {
    const status = String(p.status || 'active').toLowerCase();
    return status === 'active' || status === 'true' || status === '';
  });
}

export async function recordBusmoSale(params: {
  busmoBusinessId: string;
  orderNumber: string;
  customerName?: string;
  items: Array<{
    busmoProductId: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  total: number;
}): Promise<void> {
  const sb = getBusmoClient();
  const now = new Date().toISOString();

  for (const item of params.items) {
    const { data: product } = await sb
      .from('products')
      .select('id, stock_level, cost, price')
      .eq('id', item.busmoProductId)
      .eq('business_id', params.busmoBusinessId)
      .maybeSingle();

    if (!product) continue;

    const current = Number(product.stock_level ?? 0);
    const next = Math.max(0, current - item.quantity);
    await sb
      .from('products')
      .update({ stock_level: next, updated_at: now })
      .eq('id', item.busmoProductId)
      .eq('business_id', params.busmoBusinessId);
  }

  const saleItems = params.items.map((i) => ({
    productId: i.busmoProductId,
    name: i.name,
    quantity: i.quantity,
    price: i.unitPrice,
  }));

  const total = params.total;
  await sb.from('sales').insert({
    business_id: params.busmoBusinessId,
    customer_name: params.customerName || 'Online customer',
    items: saleItems,
    total_amount: total,
    total_revenue: total,
    payment_method: 'online',
    status: 'completed',
    metadata: {
      source: 'mo-sell',
      orderNumber: params.orderNumber,
    },
    created_at: now,
  });
}
