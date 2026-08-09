import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import {
  BILLING_MODEL_PAYG,
  BILLING_MODEL_MONTHLY,
  MONTHLY_PLANS,
  currentMonthKey,
  getMonthlyPlan,
  getPlanFeeNgn,
} from '@/lib/pricing';

// ─── GET: billing status for a business ──────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const month = searchParams.get('month') ?? currentMonthKey();

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    const { data: config } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .maybeSingle();

    if (!config) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const billingModel = config.billingModel ?? null;
    const billingPlan = config.billingPlan ?? null;
    const billingStatus = config.billingStatus ?? 'none';

    const plan = getMonthlyPlan(billingPlan);
    const feeNgn = plan ? getPlanFeeNgn(plan.id) : 0;

    const { data: revenueRow } = await supabase
      .from('businessMonthlyRevenue')
      .select('*')
      .eq('businessId', businessId)
      .eq('month', month)
      .maybeSingle();

    const revenue = Number(revenueRow?.revenue ?? 0);
    const commission = Number(revenueRow?.commission ?? 0);

    const { data: subscriptionRow } = await supabase
      .from('billingSubscriptions')
      .select('*')
      .eq('businessId', businessId)
      .maybeSingle();

    const { data: charges } = await supabase
      .from('billingCharges')
      .select('*')
      .eq('businessId', businessId)
      .order('createdAt', { ascending: false })
      .limit(12);

    const eligible = billingModel === BILLING_MODEL_MONTHLY && revenue >= feeNgn;

    return NextResponse.json({
      businessId,
      month,
      billingModel,
      billingPlan,
      billingStatus,
      plan,
      feeNgn,
      revenue,
      commission,
      eligible,
      subscription: subscriptionRow ?? null,
      charges: charges ?? [],
      plans: MONTHLY_PLANS,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Billing status] GET error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── POST: switch plan / cancel monthly billing ──────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, action, plan: planId } = body as {
      businessId?: string;
      action?: 'switch' | 'cancel';
      plan?: string;
    };

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const timestamp = new Date().toISOString();

    if (action === 'cancel') {
      await supabase
        .from('businesses')
        .update({
          billingModel: BILLING_MODEL_PAYG,
          billingPlan: null,
          billingStatus: 'canceled',
          updatedAt: timestamp,
        })
        .eq('id', businessId);

      await supabase
        .from('billingSubscriptions')
        .update({ status: 'canceled', updatedAt: timestamp })
        .eq('businessId', businessId);

      return NextResponse.json({
        ok: true,
        billingModel: BILLING_MODEL_PAYG,
        billingStatus: 'canceled',
      });
    }

    if (action === 'switch') {
      const plan = getMonthlyPlan(planId);
      if (!plan) {
        return NextResponse.json({ error: 'Unknown plan' }, { status: 400 });
      }

      await supabase
        .from('businesses')
        .update({
          billingModel: BILLING_MODEL_MONTHLY,
          billingPlan: plan.id,
          billingStatus: 'active',
          updatedAt: timestamp,
        })
        .eq('id', businessId);

      const { data: existing } = await supabase
        .from('billingSubscriptions')
        .select('*')
        .eq('businessId', businessId)
        .maybeSingle();

      const subscriptionData = {
        businessId,
        plan: plan.id,
        status: 'active',
        priceUsd: plan.priceUsd,
        startDate: existing?.startDate ?? timestamp,
        currentMonth: currentMonthKey(),
        lastBilledMonth: existing?.lastBilledMonth ?? null,
        updatedAt: timestamp,
      };

      if (existing) {
        await supabase
          .from('billingSubscriptions')
          .update(subscriptionData)
          .eq('businessId', businessId);
      } else {
        const { data: userRow } = await supabase
          .from('users')
          .select('id')
          .eq('businessId', businessId)
          .maybeSingle();
        await supabase.from('billingSubscriptions').insert({
          ...subscriptionData,
          userId: userRow?.id ?? null,
        });
      }

      return NextResponse.json({
        ok: true,
        billingModel: BILLING_MODEL_MONTHLY,
        billingPlan: plan.id,
        billingStatus: 'active',
      });
    }

    return NextResponse.json({ error: 'action must be "switch" or "cancel"' }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Billing status] POST error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
