import { getSupabaseServer } from '@/lib/database/postgresql-adapter';

export interface UgcCreator {
  id: string;
  userId?: string | null;
  username?: string | null;
  name?: string | null;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  email?: string | null;
  contactEmail?: string | null;
  niches?: unknown;
  isActive?: boolean;
  isBanned?: boolean;
  price30s?: number;
  price60s?: number;
  currency?: string | null;
  deliveryDays?: number;
  rating?: number;
  totalOrders?: number;
  totalEarnings?: number;
  socialLinks?: unknown;
  followerCounts?: unknown;
  socialVerified?: unknown;
  socialStats?: unknown;
  portfolioImages?: unknown;
  bankName?: string | null;
  bankCode?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface UgcVideo {
  id: string;
  creatorId?: string | null;
  url?: string | null;
  thumbnail?: string | null;
  title?: string | null;
  duration?: number;
  hasWatermark?: boolean;
  tags?: unknown;
  createdAt?: string | null;
}

function db() {
  return getSupabaseServer();
}

export async function getCreatorById(id: string): Promise<UgcCreator | null> {
  const { data, error } = await db().from('ugcCreators').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`[ugc] getCreatorById failed: ${error.message}`);
  return (data as UgcCreator) ?? null;
}

export async function getCreatorByUsername(
  username: string,
  opts: { activeOnly?: boolean } = {}
): Promise<UgcCreator | null> {
  let q = db().from('ugcCreators').select('*').ilike('username', username).limit(1);
  if (opts.activeOnly) q = q.eq('isActive', true);
  const { data, error } = await q.maybeSingle();
  if (error) throw new Error(`[ugc] getCreatorByUsername failed: ${error.message}`);
  return (data as UgcCreator) ?? null;
}

export async function listActiveCreators(limit = 200): Promise<UgcCreator[]> {
  const { data, error } = await db()
    .from('ugcCreators')
    .select('*')
    .eq('isActive', true)
    .limit(limit);
  if (error) throw new Error(`[ugc] listActiveCreators failed: ${error.message}`);
  return (data as UgcCreator[]) ?? [];
}

export async function listVideos(opts: {
  creatorId?: string;
  hasWatermark?: boolean;
  limit?: number;
} = {}): Promise<UgcVideo[]> {
  let q = db().from('ugcVideos').select('*');
  if (opts.creatorId) q = q.eq('creatorId', opts.creatorId);
  if (opts.hasWatermark != null) q = q.eq('hasWatermark', opts.hasWatermark);
  q = q.order('createdAt', { ascending: false }).limit(opts.limit ?? 50);
  const { data, error } = await q;
  if (error) throw new Error(`[ugc] listVideos failed: ${error.message}`);
  return (data as UgcVideo[]) ?? [];
}

export async function updateCreator(id: string, patch: Record<string, unknown>): Promise<void> {
  const { error } = await db().from('ugcCreators').update(patch).eq('id', id);
  if (error) throw new Error(`[ugc] updateCreator failed: ${error.message}`);
}

export async function incrementCreator(id: string, increments: Record<string, number>): Promise<void> {
  for (const [field, amount] of Object.entries(increments)) {
    const { error } = await db().rpc('increment_creator_field', {
      p_creator_id: id,
      p_field: field,
      p_amount: amount,
    });
    if (error) throw new Error(`[ugc] incrementCreator failed: ${error.message}`);
  }
}
