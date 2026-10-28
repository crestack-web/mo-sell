import { getSupabaseServer } from '@/lib/database/postgresql-adapter';

/** Reward paid to referrer when a referred store completes its first paid sale. */
export const REFERRAL_FIRST_SALE_REWARD_NGN = 2000;

/** Optional small credit when a referred merchant finishes signup. */
export const REFERRAL_SIGNUP_BONUS_NGN = 0;

export function generateReferralCode(seed?: string): string {
  const base = (seed || 'MO')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4);
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base || 'MO'}${rand}`;
}

export async function ensureBusinessReferralCode(businessId: string, seed?: string): Promise<string> {
  const supabase = getSupabaseServer();
  const { data: biz } = await supabase
    .from('businesses')
    .select('id, referralCode, storeName, name')
    .eq('id', businessId)
    .maybeSingle();

  if (biz?.referralCode) return biz.referralCode as string;

  let code = generateReferralCode(seed || biz?.storeName || biz?.name || businessId);
  for (let i = 0; i < 5; i++) {
    const { data: clash } = await supabase
      .from('businesses')
      .select('id')
      .eq('referralCode', code)
      .maybeSingle();
    if (!clash) break;
    code = generateReferralCode(seed || businessId);
  }

  await supabase
    .from('businesses')
    .update({ referralCode: code, updatedAt: new Date().toISOString() })
    .eq('id', businessId);

  return code;
}

/**
 * Attach a new business to a referrer via public referral code.
 * Idempotent per referred business.
 */
export async function attachReferral(opts: {
  referralCode: string;
  referredBusinessId: string;
  referredUserId?: string | null;
}): Promise<{ ok: boolean; reason?: string }> {
  const code = opts.referralCode.trim().toUpperCase();
  if (!code) return { ok: false, reason: 'missing_code' };

  const supabase = getSupabaseServer();

  const { data: referrer } = await supabase
    .from('businesses')
    .select('id, referralCode')
    .eq('referralCode', code)
    .maybeSingle();

  if (!referrer?.id) return { ok: false, reason: 'invalid_code' };
  if (referrer.id === opts.referredBusinessId) return { ok: false, reason: 'self_referral' };

  const { data: existing } = await supabase
    .from('referrals')
    .select('id')
    .eq('referredBusinessId', opts.referredBusinessId)
    .maybeSingle();
  if (existing) return { ok: true, reason: 'already_attached' };

  await supabase
    .from('businesses')
    .update({
      referredByBusinessId: referrer.id,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', opts.referredBusinessId);

  await supabase.from('referrals').insert({
    referrerBusinessId: referrer.id,
    referredBusinessId: opts.referredBusinessId,
    referredUserId: opts.referredUserId || null,
    referralCode: code,
    status: 'signed_up',
    rewardAmount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  if (REFERRAL_SIGNUP_BONUS_NGN > 0) {
    await creditReferrer({
      referrerBusinessId: referrer.id,
      referredBusinessId: opts.referredBusinessId,
      amount: REFERRAL_SIGNUP_BONUS_NGN,
      type: 'signup_bonus',
      note: 'Signup bonus',
    });
  }

  return { ok: true };
}

export async function creditReferrer(opts: {
  referrerBusinessId: string;
  referredBusinessId?: string;
  amount: number;
  type: 'signup_bonus' | 'first_sale' | 'adjustment';
  note?: string;
  referralId?: string;
}): Promise<void> {
  if (!opts.amount || opts.amount <= 0) return;
  const supabase = getSupabaseServer();

  const { data: biz } = await supabase
    .from('businesses')
    .select('id, referralBalance, referralTotalEarned')
    .eq('id', opts.referrerBusinessId)
    .maybeSingle();
  if (!biz) return;

  const balance = Number(biz.referralBalance || 0) + opts.amount;
  const total = Number(biz.referralTotalEarned || 0) + opts.amount;

  await supabase
    .from('businesses')
    .update({
      referralBalance: balance,
      referralTotalEarned: total,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', opts.referrerBusinessId);

  let referralId = opts.referralId;
  if (!referralId && opts.referredBusinessId) {
    const { data: ref } = await supabase
      .from('referrals')
      .select('id')
      .eq('referredBusinessId', opts.referredBusinessId)
      .maybeSingle();
    referralId = ref?.id;
  }

  await supabase.from('referralTransactions').insert({
    referrerBusinessId: opts.referrerBusinessId,
    referralId: referralId || null,
    type: opts.type,
    amount: opts.amount,
    currency: 'NGN',
    note: opts.note || null,
    createdAt: new Date().toISOString(),
  });

  if (referralId && opts.type === 'first_sale') {
    await supabase
      .from('referrals')
      .update({
        status: 'rewarded',
        rewardAmount: opts.amount,
        rewardedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', referralId);
  }
}

/** Call when a referred store records its first paid order. */
export async function maybeRewardFirstSale(referredBusinessId: string): Promise<void> {
  if (!referredBusinessId) return;
  const supabase = getSupabaseServer();

  const { data: referral } = await supabase
    .from('referrals')
    .select('id, referrerBusinessId, status')
    .eq('referredBusinessId', referredBusinessId)
    .maybeSingle();

  if (!referral || referral.status === 'rewarded') return;

  await creditReferrer({
    referrerBusinessId: referral.referrerBusinessId,
    referredBusinessId,
    referralId: referral.id,
    amount: REFERRAL_FIRST_SALE_REWARD_NGN,
    type: 'first_sale',
    note: 'First paid sale from referred store',
  });
}
