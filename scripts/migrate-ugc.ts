/**
 * UGC Marketplace Migration: Firestore -> Supabase
 *
 * Copies `ugcCreators` / `ugcVideos` / `ugc_videos` / `purchased_videos` /
 * `wallet_transactions` from Firebase Firestore into the matching Supabase
 * tables (see migrations 009 and 010).
 *
 * Run AFTER applying supabase/migrations/009_ugc_creators_videos.sql:
 *   npx tsx scripts/migrate-ugc.ts --dry-run   # preview only
 *   npx tsx scripts/migrate-ugc.ts             # perform the migration
 */

import { getServerFirestore as getAdminDb } from '@/lib/server-firestore';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';

const DRY_RUN = process.argv.includes('--dry-run');

function normTimestamp(value: unknown): unknown {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  const v = value as Record<string, unknown>;
  if (typeof v.toDate === 'function') {
    try { return (v as { toDate(): Date }).toDate().toISOString(); } catch { /* fall through */ }
  }
  if (typeof v.toMillis === 'function') {
    try { return new Date((v as { toMillis(): number }).toMillis()).toISOString(); } catch { /* fall through */ }
  }
  return value;
}

const CREATOR_FIELDS: Record<string, string> = {
  userId: 'userId',
  username: 'username',
  name: 'name',
  displayName: 'displayName',
  bio: 'bio',
  avatarUrl: 'avatarUrl',
  email: 'email',
  contactEmail: 'contactEmail',
  niches: 'niches',
  isActive: 'isActive',
  isBanned: 'isBanned',
  price30s: 'price30s',
  price60s: 'price60s',
  currency: 'currency',
  deliveryDays: 'deliveryDays',
  rating: 'rating',
  totalOrders: 'totalOrders',
  totalEarnings: 'totalEarnings',
  socialLinks: 'socialLinks',
  followerCounts: 'followerCounts',
  socialVerified: 'socialVerified',
  socialStats: 'socialStats',
  portfolioImages: 'portfolioImages',
  bankName: 'bankName',
  bankCode: 'bankCode',
  accountNumber: 'accountNumber',
  accountName: 'accountName',
};

async function migrateCreators(supabase: any, db: any): Promise<{ total: number; ok: number; errors: number }> {
  const snap = await db.collection('ugcCreators').get();
  let ok = 0;
  let errors = 0;
  for (const doc of snap.docs) {
    try {
      const raw = doc.data();
      const row: Record<string, unknown> = { id: doc.id };
      for (const [fbKey, col] of Object.entries(CREATOR_FIELDS)) {
        if (raw[fbKey] !== undefined) row[col] = normTimestamp(raw[fbKey]);
      }
      row.createdAt = normTimestamp(raw.createdAt) ?? row.createdAt ?? new Date().toISOString();
      row.updatedAt = normTimestamp(raw.updatedAt) ?? row.updatedAt ?? new Date().toISOString();
      if (row.isActive === undefined) row.isActive = true;
      if (row.isBanned === undefined) row.isBanned = false;
      if (row.currency === undefined || row.currency === null) row.currency = 'NGN';
      if (DRY_RUN) {
        console.log(`  [DRY RUN] creator: ${row.username ?? row.id}`);
        ok++;
        continue;
      }
      const { error } = await supabase.from('ugcCreators').upsert(row, { onConflict: 'id' });
      if (error) throw error;
      ok++;
    } catch (e) {
      errors++;
      console.error(`  ❌ creator ${doc.id}:`, e);
    }
  }
  return { total: snap.size, ok, errors };
}

async function migrateVideos(supabase: any, db: any): Promise<{ total: number; ok: number; errors: number }> {
  const snap = await db.collection('ugcVideos').get();
  let ok = 0;
  let errors = 0;
  for (const doc of snap.docs) {
    try {
      const raw = doc.data();
      const row: Record<string, unknown> = {
        creatorId: raw.creatorId ?? null,
        url: raw.url ?? null,
        thumbnail: raw.thumbnail ?? null,
        title: raw.title ?? null,
        duration: raw.duration ?? null,
        hasWatermark: raw.hasWatermark ?? false,
        tags: raw.tags ?? null,
        createdAt: normTimestamp(raw.createdAt) ?? new Date().toISOString(),
      };
      if (DRY_RUN) {
        console.log(`  [DRY RUN] video: ${doc.id} (creator ${row.creatorId})`);
        ok++;
        continue;
      }
      const { error } = await supabase.from('ugcVideos').insert(row);
      if (error) throw error;
      ok++;
    } catch (e) {
      errors++;
      console.error(`  ❌ video ${doc.id}:`, e);
    }
  }
  return { total: snap.size, ok, errors };
}

async function migrateMarketplace(supabase: any, db: any): Promise<{
  ugcVideos: { total: number; ok: number; errors: number };
  purchasedVideos: { total: number; ok: number; errors: number };
  walletTransactions: { total: number; ok: number; errors: number };
}> {
  const result = {
    ugcVideos: { total: 0, ok: 0, errors: 0 },
    purchasedVideos: { total: 0, ok: 0, errors: 0 },
    walletTransactions: { total: 0, ok: 0, errors: 0 },
  };

  const copy = async (collection: string, table: string, map: (raw: any) => Record<string, unknown>) => {
    const snap = await db.collection(collection).get();
    let ok = 0;
    let errors = 0;
    for (const doc of snap.docs) {
      try {
        const row: Record<string, unknown> = { id: doc.id, ...map(doc.data()) };
        if (DRY_RUN) {
          console.log(`  [DRY RUN] ${collection}: ${doc.id}`);
          ok++;
          continue;
        }
        const { error } = await supabase.from(table).upsert(row, { onConflict: 'id' });
        if (error) throw error;
        ok++;
      } catch (e) {
        errors++;
        console.error(`  ❌ ${collection}/${doc.id}:`, e);
      }
    }
    return { total: snap.size, ok, errors };
  };

  console.log('\n🛒 Migrating ugc_videos (brand marketplace catalog)...');
  result.ugcVideos = await copy('ugc_videos', 'ugc_videos', (raw) => ({
    creatorId: raw.creatorId ?? null,
    title: raw.title ?? null,
    url: raw.url ?? null,
    thumbnail: raw.thumbnail ?? null,
    creatorName: raw.creatorName ?? null,
    creatorUsername: raw.creatorUsername ?? null,
    creatorAvatar: raw.creatorAvatar ?? null,
    platform: raw.platform ?? 'other',
    price: raw.price ?? 20,
    tags: raw.tags ?? null,
    createdAt: normTimestamp(raw.createdAt) ?? new Date().toISOString(),
  }));

  console.log('\n📦 Migrating purchased_videos...');
  result.purchasedVideos = await copy('purchased_videos', 'purchased_videos', (raw) => ({
    brandId: raw.brandId ?? null,
    videoId: raw.videoId ?? null,
    creatorId: raw.creatorId ?? null,
    creatorName: raw.creatorName ?? null,
    creatorUsername: raw.creatorUsername ?? null,
    creatorAvatar: raw.creatorAvatar ?? null,
    videoTitle: raw.videoTitle ?? null,
    videoThumbnail: raw.videoThumbnail ?? null,
    videoUrl: raw.videoUrl ?? null,
    platform: raw.platform ?? 'other',
    price: raw.price ?? 0,
    paymentMethod: raw.paymentMethod ?? null,
    licenseType: raw.licenseType ?? 'standard',
    purchaseDate: normTimestamp(raw.purchaseDate) ?? new Date().toISOString(),
    status: raw.status ?? 'active',
    tags: raw.tags ?? null,
    platformViews: raw.platformViews ?? 0,
    platformLikes: raw.platformLikes ?? 0,
    platformComments: raw.platformComments ?? 0,
    platformShares: raw.platformShares ?? 0,
    createdAt: normTimestamp(raw.createdAt) ?? new Date().toISOString(),
  }));

  console.log('\n💳 Migrating wallet_transactions...');
  result.walletTransactions = await copy('wallet_transactions', 'wallet_transactions', (raw) => ({
    brandId: raw.brandId ?? null,
    type: raw.type ?? null,
    amount: raw.amount ?? 0,
    amountUsd: raw.amountUsd ?? 0,
    amountNgn: raw.amountNgn ?? 0,
    currency: raw.currency ?? null,
    balanceBefore: raw.balanceBefore ?? 0,
    balanceAfter: raw.balanceAfter ?? 0,
    description: raw.description ?? null,
    videoId: raw.videoId ?? null,
    paymentMethod: raw.paymentMethod ?? null,
    paymentReference: raw.paymentReference ?? null,
    status: raw.status ?? 'pending',
    metadata: raw.metadata ?? {},
    createdAt: normTimestamp(raw.createdAt) ?? new Date().toISOString(),
    updatedAt: normTimestamp(raw.updatedAt) ?? new Date().toISOString(),
  }));

  return result;
}

async function migrate() {
  const supabase = getSupabaseServer();
  const db = getAdminDb();

  console.log('\n📦 Migrating UGC creators...');
  const creators = await migrateCreators(supabase, db);
  console.log(`  Done: ${creators.ok}/${creators.total} creators (${creators.errors} errors)`);

  console.log('\n🎬 Migrating UGC videos...');
  const videos = await migrateVideos(supabase, db);
  console.log(`  Done: ${videos.ok}/${videos.total} videos (${videos.errors} errors)`);

  const marketplace = await migrateMarketplace(supabase, db);
  console.log(`  ugc_videos: ${marketplace.ugcVideos.ok}/${marketplace.ugcVideos.total} (${marketplace.ugcVideos.errors} errors)`);
  console.log(`  purchased_videos: ${marketplace.purchasedVideos.ok}/${marketplace.purchasedVideos.total} (${marketplace.purchasedVideos.errors} errors)`);
  console.log(`  wallet_transactions: ${marketplace.walletTransactions.ok}/${marketplace.walletTransactions.total} (${marketplace.walletTransactions.errors} errors)`);

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN - no data was written. Run without --dry-run to migrate.\n');
  } else {
    console.log('\n✅ UGC migration complete.\n');
  }
}

migrate().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
