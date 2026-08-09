import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import {
  BILLING_MODEL_MONTHLY,
  getPlanFeeNgn,
  getMonthlyPlan,
  currentMonthKey,
  nextMonthKey,
} from '@/lib/pricing';

const CRON_SECRET = process.env.BILLING_CRON_SECRET;

/**
 * POST /api/billing/run
 *
 * Conditional billing automation. For every active monthly subscription, evaluate
 * the month's revenue:
 *   - revenue >= plan fee  → deduct the fee from the earnings balance + log a
 *                            'charged' billingCharges entry.
 *   - revenue <  plan fee  → log a 'waived' entry (no charge).
 *
 * Idempotent per (businessId, month): if a charged/waived entry already exists
 * for that month it is skipped.
 *
 * Body: { businessId?, month?, secret? }
 * Guarded by Authorization: Bearer <BILLING_CRON_SECRET> (skipped when unset).
 */
export async function POST(request: NextRequest) {
  try {
    if (CRON_SECRET) {
      const auth = request.headers.get('authorization') ?? '';
      const bodySecret = (await request.json().catch(() => ({})) as { secret?: string }).secret;
      if (auth !== `Bearer ${CRON_SECRET}` && bodySecret !== CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await request.json().catch(() => ({}));
    const requestedBusinessId = (body as { businessId?: string }).businessId;
    const requestedMonth = (body as { month?: string }).month;

    const supabase = getSupabaseServer();

    let targets: { businessId: string }[];
    if (requestedBusinessId) {
      targets = [{ businessId: requestedBusinessId }];
    } else {
      const { data, error } = await supabase
        .from('businesses')
        .select('id')
        .eq('billingModel', BILLING_MODEL_MONTHLY)
        .eq('billingStatus', 'active');
      if (error) throw error;
      targets = (data ?? []).map((d: any) => ({ businessId: d.id }));
    }

    const results: Array<Record<string, unknown>> = [];

    for (const { businessId } of targets) {
      try {
        const { data: config } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', businessId)
          .maybeSingle();
        if (!config || config.billingModel !== BILLING_MODEL_MONTHLY) {
          results.push({ businessId, status: 'skipped', reason: 'not monthly' });
          continue;
        }

        const { data: subscription } = await supabase
          .from('billingSubscriptions')
          .select('*')
          .eq('businessId', businessId)
          .maybeSingle();
        if (!subscription || subscription.status !== 'active') {
          results.push({ businessId, status: 'skipped', reason: 'no active subscription' });
          continue;
        }

        const plan = getMonthlyPlan(subscription.plan);
        if (!plan) {
          results.push({ businessId, status: 'skipped', reason: `unknown plan ${subscription.plan}` });
          continue;
        }

        const month = requestedMonth ?? subscription.currentMonth ?? currentMonthKey();
        const feeNgn = getPlanFeeNgn(plan.id);

        // Idempotency: never charge/waive the same month twice.
        const { data: existing } = await supabase
          .from('billingCharges')
          .select('id')
          .eq('businessId', businessId)
          .eq('month', month);
        if (existing && existing.length > 0) {
          results.push({ businessId, month, status: 'skipped', reason: 'already processed' });
          continue;
        }

        // Revenue rollup (fall back to summing orders if the rollup row is missing).
        let revenue = 0;
        const { data: revenueRow } = await supabase
          .from('businessMonthlyRevenue')
          .select('revenue')
          .eq('businessId', businessId)
          .eq('month', month)
          .maybeSingle();
        if (revenueRow) {
          revenue = Number(revenueRow.revenue ?? 0);
        } else {
          const { data: orders } = await supabase
            .from('storeOrders')
            .select('total')
            .eq('businessId', businessId)
            .eq('paymentStatus', 'paid')
            .gte('createdAt', `${month}-01T00:00:00.000Z`)
            .lt('createdAt', `${nextMonthKey(month)}-01T00:00:00.000Z`);
          revenue = (orders ?? []).reduce((s: number, o: any) => s + Number(o.total ?? 0), 0);
          if (orders && orders.length > 0) {
            await supabase.from('businessMonthlyRevenue').upsert({
              businessId,
              month,
              revenue,
              commission: 0,
              orders: orders.length,
              updatedAt: new Date().toISOString(),
            });
          }
        }

        const timestamp = new Date().toISOString();
        const eligible = revenue >= feeNgn;

        if (eligible) {
          // Charge: log it + deduct from the earnings balance via a negative entry.
          await supabase.from('billingCharges').insert({
            businessId,
            month,
            plan: plan.id,
            feeUsd: plan.priceUsd,
            feeNgn,
            status: 'charged',
            revenue,
            notes: 'Monthly plan fee — revenue met plan fee',
            createdAt: timestamp,
          });

          await supabase.from('storeEarnings').insert({
            businessId,
            type: 'billing_fee',
            customerName: `MO Sell ${plan.name} plan fee (${month})`,
            grossAmount: 0,
            commissionRate: 0,
            commissionAmount: 0,
            netAmount: -feeNgn,
            currency: config.currency ?? 'NGN',
            status: 'available',
            payoutRequestId: null,
            settlementDate: null,
            createdAt: timestamp,
            updatedAt: timestamp,
          });

          results.push({ businessId, month, status: 'charged', feeNgn, revenue });
        } else {
          await supabase.from('billingCharges').insert({
            businessId,
            month,
            plan: plan.id,
            feeUsd: plan.priceUsd,
            feeNgn,
            status: 'waived',
            revenue,
            notes: 'Monthly revenue below plan fee — fee waived',
            createdAt: timestamp,
          });

          results.push({ businessId, month, status: 'waived', feeNgn, revenue });
        }

        await supabase
          .from('billingSubscriptions')
          .update({
            lastBilledMonth: month,
            currentMonth: nextMonthKey(month),
            updatedAt: timestamp,
          })
          .eq('businessId', businessId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[Billing run] failed for ${businessId}:`, msg);
        results.push({ businessId, status: 'error', error: msg });
      }
    }

    return NextResponse.json({ processed: results.length, results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Billing run] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
