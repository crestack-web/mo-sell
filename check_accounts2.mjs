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

const { data: users, error } = await supabase.from('users').select('*').limit(500);
if (error) { console.log('ERR', error.message); process.exit(1); }

console.log('=== ALL users ===');
for (const u of users) {
  console.log(JSON.stringify({ id: u.id, email: u.email, businessId: u.businessId, displayName: u.displayName, plan: u.plan, fromBusmo: u.fromBusmo }));
}

// Check for duplicate businessIds among users
const seen = {};
for (const u of users) {
  if (u.businessId) {
    seen[u.businessId] = (seen[u.businessId] ?? []).concat(u.email);
  }
}
console.log('\n=== businessId -> users (duplicates = bad) ===');
for (const [biz, emails] of Object.entries(seen)) {
  if (emails.length > 1) console.log(biz, '->', emails);
}
console.log('(only duplicates above; none shown = all unique)');

const { data: brands } = await supabase.from('brands').select('id, email, businessName').limit(200);
console.log('\n=== brands ===');
console.log(JSON.stringify(brands, null, 1));
