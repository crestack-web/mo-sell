import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import {
  attachReferral,
  ensureBusinessReferralCode,
  REFERRAL_FIRST_SALE_REWARD_NGN,
} from '@/lib/referrals';

function userClientFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export async function GET(req: NextRequest) {
  try {
    const client = userClientFromRequest(req);
    if (!client) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: userData, error: userErr } = await client.auth.getUser();
    if (userErr || !userData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const businessId = req.nextUrl.searchParams.get('businessId');
    if (!businessId) return NextResponse.json({ error: 'businessId required' }, { status: 400 });

    const supabase = getSupabaseServer();
    const { data: userRow } = await supabase
      .from('users')
      .select('id, businessId')
      .eq('id', userData.user.id)
      .maybeSingle();

    if (!userRow || userRow.businessId !== businessId) {
      // Allow if business owner matches loosely for older accounts
      const { data: biz } = await supabase.from('businesses').select('id, ownerId, userId').eq('id', businessId).maybeSingle();
      const owner = (biz as any)?.ownerId || (biz as any)?.userId;
      if (owner && owner !== userData.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const code = await ensureBusinessReferralCode(businessId);
    const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const shareUrl = `${origin.replace(/\/$/, '')}/signup?ref=${encodeURIComponent(code)}`;

    const { data: biz } = await supabase
      .from('businesses')
      .select('referralBalance, referralTotalEarned')
      .eq('id', businessId)
      .maybeSingle();

    const { data: list } = await supabase
      .from('referrals')
      .select('id, referredBusinessId, status, rewardAmount, createdAt, rewardedAt')
      .eq('referrerBusinessId', businessId)
      .order('createdAt', { ascending: false })
      .limit(50);

    const referrals = list || [];
    const signedUp = referrals.filter(r => r.status === 'signed_up' || r.status === 'rewarded').length;
    const rewarded = referrals.filter(r => r.status === 'rewarded').length;

    return NextResponse.json({
      code,
      shareUrl,
      rewardPerSaleNgn: REFERRAL_FIRST_SALE_REWARD_NGN,
      balance: Number(biz?.referralBalance || 0),
      totalEarned: Number(biz?.referralTotalEarned || 0),
      stats: { total: referrals.length, signedUp, rewarded },
      referrals,
    });
  } catch (err) {
    console.error('[referrals GET]', err);
    return NextResponse.json({ error: 'Failed to load referrals' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    if (action === 'attach') {
      const { referralCode, referredBusinessId, referredUserId } = body;
      if (!referralCode || !referredBusinessId) {
        return NextResponse.json({ error: 'referralCode and referredBusinessId required' }, { status: 400 });
      }
      const result = await attachReferral({
        referralCode,
        referredBusinessId,
        referredUserId,
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('[referrals POST]', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
