'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSell } from '@/context/SellContext';
import { MONTHLY_PLANS } from '@/lib/pricing';
import styles from './SellBillingPage.module.css';

const BILLING_MODEL_PAYG = 'pay_as_you_go';
const BILLING_MODEL_MONTHLY = 'monthly';

interface BillingStatus {
  businessId: string;
  month: string;
  billingModel: string | null;
  billingPlan: string | null;
  billingStatus: string;
  feeNgn: number;
  revenue: number;
  commission: number;
  eligible: boolean;
  subscription: {
    plan?: string;
    status?: string;
    lastBilledMonth?: string | null;
    currentMonth?: string | null;
  } | null;
  charges: Array<{
    id: string;
    month: string;
    plan: string;
    feeUsd: number;
    feeNgn: number;
    status: 'charged' | 'waived';
    revenue: number;
    notes?: string | null;
    createdAt: string;
  }>;
}

const fmtNgn = (n: number) => `₦${Math.round(n).toLocaleString('en-NG')}`;

const commissionDesc = (planId: string | null | undefined) =>
  planId === 'standard' ? '5% commission (10% on digital)' : 'no commission';

export function SellBillingPage() {
  const { user, showToast } = useSell();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<BillingStatus | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const businessId = user?.businessId;

  const load = useCallback(async () => {
    if (!businessId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/billing/status?businessId=${encodeURIComponent(businessId)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load billing status');
      setData(json as BillingStatus);
      setSelectedPlan(json.billingPlan ?? MONTHLY_PLANS[0].id);
    } catch (err) {
      console.error('[SellBillingPage] load error:', err);
      showToast('Failed to load billing', 'error');
    } finally {
      setLoading(false);
    }
  }, [businessId, showToast]);

  useEffect(() => { load(); }, [load]);

  const switchPlan = useCallback(async (planId: string) => {
    if (!businessId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/billing/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, action: 'switch', plan: planId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update plan');
      showToast('Plan updated', 'success');
      await load();
    } catch (err: any) {
      showToast(err.message || 'Failed to update plan', 'error');
    } finally {
      setSaving(false);
    }
  }, [businessId, load, showToast]);

  const cancelMonthly = useCallback(async () => {
    if (!businessId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/billing/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, action: 'cancel' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to cancel plan');
      showToast('Switched to pay-as-you-go', 'success');
      await load();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel plan', 'error');
    } finally {
      setSaving(false);
    }
  }, [businessId, load, showToast]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading billing…</p>
        </div>
      </div>
    );
  }

  if (!data || !businessId) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyCard}>
          <p className={styles.emptyTitle}>No store linked</p>
          <p className={styles.emptySub}>Finish setting up your store to see billing.</p>
        </div>
      </div>
    );
  }

  const isMonthly = data.billingModel === BILLING_MODEL_MONTHLY;
  const activePlan = MONTHLY_PLANS.find(p => p.id === data.billingPlan);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.heading}>Billing</h2>
          <p className={styles.sub}>Manage how you pay for MO Sell.</p>
        </div>
        <span className={[styles.badge, isMonthly ? styles.badgePrimary : styles.badgeGreen].join(' ')}>
          {isMonthly ? (activePlan ? `${activePlan.name} plan` : 'Monthly plan') : 'Pay-as-you-go'}
        </span>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>This Month's Revenue</p>
          <p className={styles.statValue}>{fmtNgn(data.revenue)}</p>
          <p className={styles.statSub}>{data.month}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Commission This Month</p>
          <p className={[styles.statValue, styles.statValueRed].join(' ')}>{fmtNgn(data.commission)}</p>
          <p className={styles.statSub}>Charged on sales</p>
        </div>
        <div className={[styles.statCard, isMonthly ? styles.statCardHighlight : ''].join(' ')}>
          <p className={styles.statLabel}>Monthly Plan Fee</p>
          <p className={styles.statValue}>{isMonthly ? fmtNgn(data.feeNgn) : '—'}</p>
          <p className={styles.statSub}>{isMonthly ? (data.eligible ? 'Due this month' : 'Waived — revenue below fee') : 'No monthly fee'}</p>
        </div>
      </div>

      {/* Current plan */}
      <div className={[styles.planCard, isMonthly ? styles.planCardHighlight : ''].join(' ')}>
        <div className={styles.planRow}>
          <div>
            <div className={styles.planName}>
              {isMonthly
                ? `${activePlan?.name ?? 'Monthly'} plan — ${fmtNgn(data.feeNgn)}/month`
                : 'Pay-as-you-go — 20% commission'}
            </div>
            <div className={styles.planMeta}>
              {isMonthly
                ? `Charges ${commissionDesc(activePlan?.id)}. The monthly fee is only deducted from your earnings when your revenue reaches the plan fee.`
                : 'No monthly fee. MO Sell charges 20% commission on each sale — you keep 80%.'}
            </div>
          </div>
          {isMonthly && (
            <button className={styles.btnGhost} onClick={cancelMonthly} disabled={saving}>
              Switch to pay-as-you-go
            </button>
          )}
        </div>

        {isMonthly && (
          <div className={styles.note}>
            {data.eligible ? (
              <strong>Your revenue this month ({fmtNgn(data.revenue)}) is at or above the {activePlan?.name ?? ''} plan fee ({fmtNgn(data.feeNgn)}), so the fee will be charged.</strong>
            ) : (
              <>Your revenue this month ({fmtNgn(data.revenue)}) is below the plan fee ({fmtNgn(data.feeNgn)}), so <strong>this month's fee is waived</strong>. The fee only applies in months your revenue reaches the plan fee.</>
            )}
          </div>
        )}
      </div>

      {/* Plan selector */}
      <div>
        <h3 style={{ fontFamily: 'var(--sell-font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--sell-text-1)', marginBottom: 12 }}>
          {isMonthly ? 'Switch monthly plan' : 'Switch to a monthly plan'}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--sell-text-2)', marginBottom: 14, maxWidth: 620, lineHeight: 1.6 }}>
          Monthly plans charge a flat fee only in months where your revenue reaches the plan fee —
          otherwise it's waived. The Standard plan charges 5% commission (10% on digital products);
          Pro and Enterprise charge no commission. Switch back to pay-as-you-go anytime.
        </p>
        <div className={styles.plansGrid}>
          {MONTHLY_PLANS.map(plan => (
            <button
              key={plan.id}
              className={[styles.planOption, selectedPlan === plan.id ? styles.planOptionSelected : ''].join(' ')}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <div className={styles.planOptionName}>{plan.name}</div>
              <div className={styles.planOptionPrice}>${plan.priceUsd}<span style={{ fontSize: '0.8rem', color: 'var(--sell-text-3)' }}> /mo</span></div>
              <div className={styles.planOptionMeta}>{fmtNgn(plan.priceUsd * 1550)} when eligible · {commissionDesc(plan.id)}</div>
            </button>
          ))}
        </div>
        {(!isMonthly || selectedPlan !== data.billingPlan) && selectedPlan && (
          <button
            className={styles.btnPrimary}
            style={{ marginTop: 14 }}
            onClick={() => switchPlan(selectedPlan)}
            disabled={saving}
          >
            {saving ? 'Updating…' : `Switch to ${MONTHLY_PLANS.find(p => p.id === selectedPlan)?.name} plan`}
          </button>
        )}
      </div>

      {/* Billing history */}
      <div>
        <h3 style={{ fontFamily: 'var(--sell-font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--sell-text-1)', marginBottom: 12 }}>
          Billing history
        </h3>
        {data.charges.length === 0 ? (
          <div className={styles.emptyCard}>
            <p className={styles.emptyTitle}>No charges yet</p>
            <p className={styles.emptySub}>
              {isMonthly
                ? 'Once your monthly revenue reaches the plan fee, the fee will appear here.'
                : "You're on pay-as-you-go — no monthly charges apply."}
            </p>
          </div>
        ) : (
          <div className={styles.historyList}>
            {data.charges.map(c => (
              <div key={c.id} className={styles.historyItem}>
                <div>
                  <div className={styles.historyTitle}>
                    {c.month} — {c.plan} plan ({c.status === 'charged' ? 'charged' : 'waived'})
                  </div>
                  <div className={styles.historyMeta}>
                    {c.status === 'charged' ? `Deducted from earnings · ` : `Revenue ${fmtNgn(c.revenue)} was below fee · `}
                    {new Date(c.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <span className={[styles.historyAmount, c.status === 'charged' ? styles.historyCharged : styles.historyWaived].join(' ')}>
                  {c.status === 'charged' ? `-${fmtNgn(c.feeNgn)}` : `+${fmtNgn(c.feeNgn)} waived`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
