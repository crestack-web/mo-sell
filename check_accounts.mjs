import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)="?(.*?)"?\s*$/);
  if (m) env[m[1]] = m[2];
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false } });

const q = async (table, filter = null, limit = 200) => {
  let b = supabase.from(table).select('*').limit(limit);
  if (filter) b = b.ilike(filter.col, filter.val);
  const { data, error } = await b;
  if (error) return { error: error.message };
  return data;
};

const users = await q('users', { col: 'email', val: '%@test.mo-sell.store%' });
console.log('=== users (test accounts) ===');
console.log(JSON.stringify(users?.map(u => ({ id: u.id, email: u.email, businessId: u.businessId, displayName: u.displayName })), null, 1));

const businesses = await q('businesses');
console.log('\n=== businesses ===');
console.log(JSON.stringify(businesses?.map(b => ({ id: b.id, businessName: b.businessName, ownerUserId: b.ownerUserId, storeSlug: b.storeSlug, billingModel: b.billingModel })), null, 1));

const orders = await q('storeOrders');
const oBiz = {};
for (const o of orders ?? []) oBiz[o.businessId] = (oBiz[o.businessId] ?? 0) + 1;
console.log('\n=== storeOrders by businessId ===');
console.log(JSON.stringify(oBiz, null, 1));

const earnings = await q('storeEarnings');
const eBiz = {};
for (const e of earnings ?? []) eBiz[e.businessId] = (eBiz[e.businessId] ?? 0) + 1;
console.log('\n=== storeEarnings by businessId ===');
console.log(JSON.stringify(eBiz, null, 1));

const analytics = await q('storeAnalytics');
const aBiz = {};
for (const a of analytics ?? []) aBiz[a.businessId] = (aBiz[a.businessId] ?? 0) + 1;
console.log('\n=== storeAnalytics by businessId ===');
console.log(JSON.stringify(aBiz, null, 1));
