/**
 * Task-scoped store context builder (Phases 8, 11, 12).
 *
 * Retrieves ONLY the data a given task needs from Supabase (the source of
 * truth) and compresses it into a small text block. Never dumps the whole
 * store — no full product/order/customer dumps. All queries are non-fatal:
 * missing data just yields an empty context block.
 */

import { getSupabaseServer } from '@/lib/database/postgresql-adapter';

export interface StoreProfile {
  storeName: string;
  businessName: string;
  businessCategory: string;
  currency: string;
  tagline: string;
  theme: string;
}

export async function getStoreProfile(businessId: string): Promise<StoreProfile | null> {
  if (!businessId) return null;
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from('businesses')
      .select(
        'storeName, businessName, businessCategory, currency, tagline, theme',
      )
      .eq('id', businessId)
      .maybeSingle();
    if (error || !data) return null;
    return {
      storeName: data.storeName ?? '',
      businessName: data.businessName ?? '',
      businessCategory: data.businessCategory ?? '',
      currency: data.currency ?? 'NGN',
      tagline: data.tagline ?? '',
      theme: data.theme ?? '',
    };
  } catch {
    return null;
  }
}

/** Compact, task-relevant product fields for a single product. */
export async function getProductContext(
  businessId: string,
  productId?: string,
  nameFragment?: string,
): Promise<string> {
  if (!businessId) return '';
  try {
    const supabase = getSupabaseServer();
    const select =
      'id, displayName, description, price, category, productType, digitalSubtype, tags, stock, available';
    let query = supabase
      .from('storeProducts')
      .select(select)
      .eq('businessId', businessId)
      .limit(5);

    if (productId) query = query.eq('id', productId);
    else if (nameFragment) {
      query = query.ilike('displayName', `%${nameFragment}%`);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) return '';

    return data
      .map((p: any) =>
        [
          `- ${p.displayName ?? p.id}`,
          p.price != null ? `price ${p.price} ${p.currency ?? ''}`.trim() : '',
          p.category ? `category ${p.category}` : '',
          p.productType ? `type ${p.productType}` : '',
        ]
          .filter(Boolean)
          .join(' · '),
      )
      .join('\n');
  } catch {
    return '';
  }
}

/** Names-only inventory summary (used by the wizard today). */
export async function getInventorySummary(
  businessId: string,
  limit = 10,
): Promise<string> {
  if (!businessId) return '';
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from('storeProducts')
      .select('displayName, price, category, productType')
      .eq('businessId', businessId)
      .eq('available', true)
      .limit(limit);
    if (error || !data || data.length === 0) return '';
    return data
      .map((p: any) => {
        const name = p.displayName ?? '';
        const price = p.price != null ? ` @${p.price}` : '';
        return `${name}${price}`;
      })
      .filter(Boolean)
      .join(', ');
  } catch {
    return '';
  }
}

/**
 * Build the context block for a request. `sections` lets each route opt into
 * exactly what it needs (store profile, inventory, specific product…).
 */
export async function buildTaskContext(
  businessId: string | undefined,
  opts: {
    storeProfile?: boolean;
    inventory?: boolean;
    productId?: string;
    productNameFragment?: string;
  } = {},
): Promise<string> {
  if (!businessId) return '';
  const parts: string[] = [];

  if (opts.storeProfile) {
    const profile = await getStoreProfile(businessId);
    if (profile) {
      const bits = [
        profile.storeName && `Store name: ${profile.storeName}`,
        profile.businessCategory && `Category: ${profile.businessCategory}`,
        profile.currency && `Currency: ${profile.currency}`,
        profile.tagline && `Tagline: ${profile.tagline}`,
        profile.theme && `Theme: ${profile.theme}`,
      ].filter(Boolean);
      if (bits.length) parts.push(bits.join('\n'));
    }
  }

  if (opts.productId || opts.productNameFragment) {
    const product = await getProductContext(
      businessId,
      opts.productId,
      opts.productNameFragment,
    );
    if (product) parts.push(`Relevant product(s):\n${product}`);
  }

  if (opts.inventory) {
    const inventory = await getInventorySummary(businessId);
    if (inventory) parts.push(`Inventory: ${inventory}`);
  }

  return parts.length ? parts.join('\n\n') : '';
}
