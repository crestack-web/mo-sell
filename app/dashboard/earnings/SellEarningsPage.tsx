'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '@/lib/database/adapter';
import { useSell } from '@/context/SellContext';
import { isPlatformManaged, getCommissionRate } from '@/lib/pricing';
import styles from './SellEarningsPage.module.css';

export const dynamic = 'force-dynamic';

interface Earning {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  currency: string;
  status: 'pending' | 'available' | 'paid_out';
  payoutRequestId: string | null;
  createdAt: Date;
}

interface PayoutRequest {
  id: string;
  amount: number;
  currency: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  earningIds: string[];
  status: 'requested' | 'sent' | 'processing' | 'completed' | 'rejected';
  rejectionReason: string | null;
  processedAt: Date | null;
  sentAt: Date | null;
  createdAt: Date;
}

interface UgcEarningOrder {
  id: string;
  productName: string;
  brandEmail: string | null;
  guestEmail: string | null;
  guestName: string | null;
  agreedPrice: number;
  platformFee: number;
  creatorPayout: number;
  status: string;
  paymentStatus: string;
  createdAt: Date;
}

function fmt(n: number, currency = 'NGN') {
  const sym = currency === 'NGN' ? '\u20A6' : currency === 'USD' ? '$' : currency + ' ';
  return `${sym}${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pct(n: number) { return `${(n * 100).toFixed(0)}%`; }

function statusBadge(status: Earning['status']) {
  const map = {
    pending:   { bg: 'var(--sell-amber-bg)',  color: 'var(--sell-amber)',  label: 'Pending' },
    available: { bg: 'var(--sell-green-bg)',  color: 'var(--sell-green)',  label: 'Available' },
    paid_out:  { bg: 'var(--sell-primary-lt)', color: 'var(--sell-primary)', label: 'Paid out' },
  };
  const s = map[status] ?? map.pending;
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 100,
      background: s.bg, color: s.color,
      fontSize: '0.72rem', fontWeight: 700,
    }}>
      {s.label}
    </span>
  );
}

function payoutStatusBadge(status: PayoutRequest['status']) {
  const map = {
    requested:  { bg: 'var(--sell-amber-bg)',   color: 'var(--sell-amber)',   label: 'Requested' },
    sent:       { bg: 'var(--sell-primary-lt)', color: 'var(--sell-primary)', label: 'Sent' },
    processing: { bg: 'var(--sell-primary-lt)',  color: 'var(--sell-primary)', label: 'Processing' },
    completed:  { bg: 'var(--sell-green-bg)',    color: 'var(--sell-green)',   label: 'Completed' },
    rejected:   { bg: 'var(--sell-red-bg)',      color: 'var(--sell-red)',     label: 'Rejected' },
  };
  const s = map[status] ?? map.requested;
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 100,
      background: s.bg, color: s.color,
      fontSize: '0.72rem', fontWeight: 700,
    }}>
      {s.label}
    </span>
  );
}

const UGC_ORDER_BADGES: Record<string, { bg: string; color: string; label: string }> = {
  REQUESTED:       { bg: 'var(--sell-amber-bg)',  color: 'var(--sell-amber)',   label: 'Requested' },
  IN_PROGRESS:     { bg: 'var(--sell-primary-lt)', color: 'var(--sell-primary)', label: 'In progress' },
  DRAFT_SUBMITTED: { bg: 'var(--sell-primary-lt)', color: 'var(--sell-primary)', label: 'Draft sent' },
  APPROVED:        { bg: 'var(--sell-green-bg)',   color: 'var(--sell-green)',   label: 'Approved' },
  COMPLETED:       { bg: 'var(--sell-green-bg)',   color: 'var(--sell-green)',   label: 'Completed' },
  CANCELLED:       { bg: 'var(--sell-red-bg)',     color: 'var(--sell-red)',     label: 'Cancelled' },
  DISPUTED:        { bg: 'var(--sell-red-bg)',     color: 'var(--sell-red)',     label: 'Disputed' },
  REJECTED:        { bg: 'var(--sell-red-bg)',     color: 'var(--sell-red)',     label: 'Rejected' },
};

const UGC_PAY_BADGES: Record<string, { bg: string; color: string; label: string }> = {
  PENDING_DEPOSIT: { bg: 'var(--sell-amber-bg)',  color: 'var(--sell-amber)',   label: 'Deposit pending' },
  DEPOSIT_HELD:    { bg: 'var(--sell-primary-lt)', color: 'var(--sell-primary)', label: 'Deposit held' },
  PENDING_BALANCE: { bg: 'var(--sell-amber-bg)',  color: 'var(--sell-amber)',   label: 'Balance pending' },
  PAID_OUT:        { bg: 'var(--sell-green-bg)',   color: 'var(--sell-green)',   label: 'Paid out' },
  DISPUTE_HOLD:    { bg: 'var(--sell-red-bg)',     color: 'var(--sell-red)',     label: 'On hold' },
  REFUNDED:        { bg: 'var(--sell-red-bg)',     color: 'var(--sell-red)',     label: 'Refunded' },
};

function ugcOrderBadge(status: string) {
  const s = UGC_ORDER_BADGES[status] ?? { bg: 'var(--sell-surface-2)', color: 'var(--sell-text-2)', label: status };
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 100,
      background: s.bg, color: s.color,
      fontSize: '0.72rem', fontWeight: 700,
    }}>
      {s.label}
    </span>
  );
}

function ugcPayBadge(status: string) {
  const s = UGC_PAY_BADGES[status] ?? { bg: 'var(--sell-surface-2)', color: 'var(--sell-text-2)', label: status };
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 100,
      background: s.bg, color: s.color,
      fontSize: '0.72rem', fontWeight: 700,
    }}>
      {s.label}
    </span>
  );
}

export function SellEarningsPage() {
  const { user, storeConfig, navigateTo, showToast } = useSell();

  const [earnings,      setEarnings]      = useState<Earning[]>([]);
  const [payouts,       setPayouts]       = useState<PayoutRequest[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [requesting,    setRequesting]    = useState(false);
  const [tab,           setTab]           = useState<'earnings' | 'payouts' | 'ugc'>('earnings');
  const [confirmOpen,   setConfirmOpen]   = useState(false);
  const [payoutStep,    setPayoutStep]    = useState<'confirm' | 'otp'>('confirm');
  const [otpCode,       setOtpCode]       = useState('');
  const [payoutSuccess, setPayoutSuccess] = useState<{ amount: number; currency: string } | null>(null);

  const [hasUgcProfile, setHasUgcProfile] = useState<boolean | null>(null);
  const [ugcOrders,     setUgcOrders]     = useState<UgcEarningOrder[]>([]);
  const [ugcLoading,    setUgcLoading]    = useState(false);
  const [cashoutOpen,   setCashoutOpen]   = useState(false);
  const [cashingOut,    setCashingOut]    = useState(false);
  const [banks,         setBanks]         = useState<{ code: string; name: string }[]>([]);
  const [bankCode,      setBankCode]      = useState('');
  const [acctNumber,    setAcctNumber]    = useState('');
  const [acctName,      setAcctName]      = useState('');
  const [verifyingBank, setVerifyingBank] = useState(false);

  const platformManaged = isPlatformManaged(storeConfig as any);
  const commissionRate = getCommissionRate(storeConfig as any);
  const billingModel = (storeConfig as any)?.billingModel;
  const billingPlan = (storeConfig as any)?.billingPlan;
  const currency = storeConfig?.currency ?? 'NGN';
  const isStandardPlan = billingModel === 'monthly' && billingPlan === 'standard';
  const commissionLabel = isStandardPlan ? '5% \u00B7 10% digital' : pct(commissionRate);

  const promoteEarnings = useCallback(async (biz: string, items: Earning[]) => {
    const db = getDatabase();
    const now = Date.now();
    const toPromote = items.filter(e =>
      e.status === 'pending' &&
      now - e.createdAt.getTime() >= 24 * 60 * 60 * 1000
    );
    for (const e of toPromote) {
      await db.doc(`businesses/${biz}/storeEarnings/${e.id}`).update(
        { status: 'available', updatedAt: new Date().toISOString() }
      );
      e.status = 'available';
    }
    return [...items];
  }, []);

  const load = useCallback(async () => {
    if (!user?.businessId) { setLoading(false); return; }
    setLoading(true);
    try {
      const db = getDatabase();
      const biz = user.businessId;

      const eSnap = await db.collection(`businesses/${biz}/storeEarnings`).limit(1000).get();
      const rawEarnings: Earning[] = eSnap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<Earning, 'id' | 'createdAt'>),
        createdAt: new Date(d.data().createdAt || Date.now()),
      }));
      const promoted = await promoteEarnings(biz, rawEarnings);
      setEarnings(promoted);

      try {
        if (storeConfig?.storeSlug) {
          fetch('/api/store/analytics/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventType: 'page_view',
              storeSlug: storeConfig.storeSlug,
              businessId: biz,
              pageType: 'earnings',
            }),
          }).catch(() => {});
        }
      } catch (err) {
        // silent
      }

      const pSnap = await db.collection(`businesses/${biz}/payoutRequests`).limit(100).get();
      const mappedPayouts: PayoutRequest[] = pSnap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<PayoutRequest, 'id' | 'createdAt' | 'processedAt' | 'sentAt'>),
        createdAt:   new Date(d.data().createdAt || Date.now()),
        processedAt: d.data().processedAt ? new Date(d.data().processedAt) : null,
        sentAt:      d.data().sentAt ? new Date(d.data().sentAt) : null,
      }));
      mappedPayouts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setPayouts(mappedPayouts);
    } catch (err) {
      console.error('[SellEarningsPage] load error:', err);
      showToast('Failed to load earnings', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.businessId, promoteEarnings, showToast]);

  useEffect(() => { load(); }, [load]);

  // Refresh when the tab regains focus so payout status updates after ops/webhook
  useEffect(() => {
    if (!user?.businessId) return;
    const refresh = () => { load(); };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [load, user?.businessId]);

  // Poll while any payout is still in flight (requested / sent)
  useEffect(() => {
    if (!user?.businessId) return;
    const inFlight = payouts.some(p => p.status === 'requested' || p.status === 'sent');
    if (!inFlight) return;
    const id = window.setInterval(() => { load(); }, 30_000);
    return () => window.clearInterval(id);
  }, [payouts, load, user?.businessId]);

  const loadUgc = useCallback(async () => {
    if (!user?.id) { setUgcLoading(false); return; }
    setUgcLoading(true);
    try {
      const db = getDatabase();
      const profileSnap = await db.doc(`ugcCreators/${user.id}`).get();
      const has = profileSnap.exists;
      setHasUgcProfile(has);
      if (!has) { setUgcOrders([]); setUgcLoading(false); return; }

      const snap = await db.collection('ugcOrders').where('creatorId', '==', user.id).get();
      const orders: UgcEarningOrder[] = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          productName: data.productName ?? 'UGC order',
          brandEmail: data.brandEmail ?? null,
          guestEmail: data.guestEmail ?? null,
          guestName: data.guestName ?? null,
          agreedPrice: data.agreedPrice ?? 0,
          platformFee: data.platformFee ?? 0,
          creatorPayout: data.creatorPayout ?? 0,
          status: data.status ?? 'REQUESTED',
          paymentStatus: data.paymentStatus ?? 'PENDING_DEPOSIT',
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
        };
      });
      setUgcOrders(orders);
    } catch (err) {
      console.error('[SellEarningsPage] UGC load error:', err);
    } finally {
      setUgcLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadUgc(); }, [loadUgc]);

  useEffect(() => {
    fetch('/api/sell/verify-bank')
      .then(r => r.json())
      .then((d: { banks?: { code: string; name: string }[] }) => { if (d.banks) setBanks(d.banks); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!platformManaged && hasUgcProfile) setTab('ugc');
  }, [platformManaged, hasUgcProfile]);

  const totalGross     = earnings.reduce((s, e) => s + e.grossAmount, 0);
  const totalCommission = earnings.reduce((s, e) => s + e.commissionAmount, 0);
  const totalNet       = earnings.reduce((s, e) => s + e.netAmount, 0);
  const available      = earnings.filter(e => e.status === 'available').reduce((s, e) => s + e.netAmount, 0);
  const pendingCount   = earnings.filter(e => e.status === 'pending').length;
  const availableCount = earnings.filter(e => e.status === 'available').length;
  const hasAvailable = availableCount > 0;
  const MIN_PAYOUT_AMOUNT = 2000;
  const minPayoutMet = currency !== 'NGN' || available >= MIN_PAYOUT_AMOUNT;

  const ugcCompleted   = ugcOrders.filter(o => o.status === 'COMPLETED');
  const ugcTotalGross  = ugcCompleted.reduce((s, o) => s + (o.agreedPrice ?? 0), 0);
  const ugcTotalFee    = ugcCompleted.reduce((s, o) => s + (o.platformFee ?? 0), 0);
  const ugcTotalNet    = ugcCompleted.reduce((s, o) => s + (o.creatorPayout ?? 0), 0);
  const ugcEligible    = ugcCompleted.filter(o => o.paymentStatus !== 'PAID_OUT');
  const ugcAvailable   = ugcEligible.reduce((s, o) => s + (o.creatorPayout ?? 0), 0);
  const ugcPaidOut     = ugcOrders.filter(o => o.paymentStatus === 'PAID_OUT').reduce((s, o) => s + (o.creatorPayout ?? 0), 0);
  const hasUgcAvailable = ugcEligible.length > 0;

  const handleVerifyBank = useCallback(async () => {
    if (!acctNumber || acctNumber.length !== 10 || !bankCode) {
      showToast('Enter a valid 10-digit account number and select a bank', 'error');
      return;
    }
    setVerifyingBank(true);
    try {
      const res = await fetch('/api/sell/verify-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountNumber: acctNumber, bankCode }),
      });
      const data = await res.json() as { accountName?: string; error?: string };
      if (!res.ok || !data.accountName) {
        showToast(data.error ?? 'Could not verify account', 'error');
        return;
      }
      setAcctName(data.accountName);
      showToast('Account verified!', 'success');
    } catch {
      showToast('Verification failed. Try again.', 'error');
    } finally {
      setVerifyingBank(false);
    }
  }, [acctNumber, bankCode, showToast]);

  const handleUgcCashout = useCallback(async () => {
    if (!user?.id || !hasUgcAvailable || !acctName) {
      showToast('Verify your bank account before cashing out.', 'error');
      return;
    }
    setCashingOut(true);
    try {
      const bank = banks.find(b => b.code === bankCode);
      const res = await fetch('/api/ugc/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          accountNumber: acctNumber,
          bankCode,
          accountName: acctName,
          bankName: bank?.name,
        }),
      });
      const data = await res.json() as { amount?: number; ordersPaid?: number; error?: string };
      if (!res.ok) {
        showToast(data.error ?? 'Cashout failed', 'error');
        return;
      }
      showToast(`Cashout of ${fmt((data.amount ?? 0) / 100, currency)} initiated! Funds sent within 1-3 business days.`, 'success');
      setCashoutOpen(false);
      setAcctNumber('');
      setAcctName('');
      setBankCode('');
      await loadUgc();
    } catch {
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setCashingOut(false);
    }
  }, [user?.id, hasUgcAvailable, acctName, acctNumber, bankCode, banks, currency, loadUgc, showToast]);

  const handleSendPayoutOtp = useCallback(async () => {
    if (!user?.businessId) return;
    const config = storeConfig as any;
    if (!config?.payoutBankName || !config?.payoutBankCode || !config?.payoutAccountNumber || !config?.payoutAccountName) {
      showToast('Add your bank account in Settings before requesting a payout.', 'error');
      navigateTo('settings');
      return;
    }
    setRequesting(true);
    try {
      const res = await fetch('/api/sell/payouts/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: user.businessId, email: user.email || undefined }),
      });
      const data = await res.json() as { success?: boolean; message?: string; error?: string };
      if (!res.ok) {
        showToast(data.error ?? 'Failed to send verification code', 'error');
        return;
      }
      setOtpCode('');
      setPayoutStep('otp');
      showToast(data.message ?? 'Verification code sent to your email.', 'success');
    } catch {
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setRequesting(false);
    }
  }, [user?.businessId, user?.email, storeConfig, showToast, navigateTo]);

  const handleVerifyPayoutOtp = useCallback(async () => {
    if (!user?.businessId) return;
    if (!otpCode || otpCode.length !== 6) {
      showToast('Enter the 6-digit code from your email.', 'error');
      return;
    }
    setRequesting(true);
    try {
      const res = await fetch('/api/sell/payouts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: user.businessId, otp: otpCode }),
      });
      const data = await res.json() as { payoutRequestId?: string; amount?: number; error?: string; message?: string };
      if (!res.ok) {
        showToast(data.error ?? 'Payout failed', 'error');
        return;
      }
      const paid = data.amount ?? 0;
      setPayoutSuccess({ amount: paid, currency });
      setConfirmOpen(false);
      setPayoutStep('confirm');
      setOtpCode('');
      showToast(`Payout of ${fmt(paid, currency)} requested! Funds arrive in 1-3 business days.`, 'success');
      await load();
      setTab('payouts');
    } catch {
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setRequesting(false);
    }
  }, [user?.businessId, otpCode, currency, load, showToast]);

  if (loading || ugcLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading earnings...</p>
        </div>
      </div>
    );
  }

  if (!platformManaged && !hasUgcProfile) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h2 className={styles.heading}>Earnings</h2>
          <p className={styles.sub}>Track sales commissions and request payouts.</p>
        </div>
        <div className={styles.emptyCard}>
          <p className={styles.emptyTitle}>Enable Managed Payments first</p>
          <p className={styles.emptySub}>
            Turn on Managed Payments in Settings to let Busmo collect payments on your behalf.
            A {pct(commissionRate || 0.05)} commission is charged per sale - your net earnings appear here and you can request a payout anytime.
          </p>
          <button className={styles.btnPrimary} onClick={() => navigateTo('settings')}>
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  const showStoreTabs = platformManaged;
  let activeTab: 'earnings' | 'payouts' | 'ugc' = tab;
  if (!hasUgcProfile && activeTab === 'ugc') activeTab = 'earnings';
  if (!showStoreTabs && (activeTab === 'earnings' || activeTab === 'payouts')) activeTab = 'ugc';
  if (!showStoreTabs && !hasUgcProfile) activeTab = 'ugc';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.heading}>Earnings</h2>
          {activeTab === 'ugc' ? (
            <p className={styles.sub}>Track payments from your UGC orders and cash out once a purchase is delivered and completed.</p>
          ) : isStandardPlan ? (
            <p className={styles.sub}>Busmo collects on your behalf and charges 5% commission (10% on digital products). Your monthly fee is only deducted when revenue reaches the plan fee.</p>
          ) : commissionRate > 0 ? (
            <p className={styles.sub}>Busmo collects on your behalf and charges {pct(commissionRate)} commission per sale.</p>
          ) : billingModel === 'monthly' ? (
            <p className={styles.sub}>No per-sale commission - your monthly plan fee is only deducted when your revenue reaches the plan fee.</p>
          ) : (
            <p className={styles.sub}>Busmo collects on your behalf and charges {pct(commissionRate)} commission per sale.</p>
          )}
        </div>
        {activeTab === 'ugc' ? (
          <button
            className={styles.btnPrimary}
            onClick={() => setCashoutOpen(true)}
            disabled={!hasUgcAvailable || cashingOut}
          >
            {cashingOut ? 'Processing...' : `Cash out ${hasUgcAvailable ? `(${fmt(ugcAvailable / 100, currency)})` : ''}`}
          </button>
        ) : (
          <button
            className={styles.btnPrimary}
            onClick={() => { setPayoutStep('confirm'); setOtpCode(''); setConfirmOpen(true); }}
            disabled={!hasAvailable || !minPayoutMet || requesting}
          >
            {requesting ? 'Processing...' : `Request payout ${hasAvailable ? `(${fmt(available, currency)})` : ''}`}
          </button>
        )}
      </div>

      {activeTab !== 'ugc' && (
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Sales</p>
          <p className={styles.statValue}>{fmt(totalGross, currency)}</p>
          <p className={styles.statSub}>{earnings.length} order{earnings.length !== 1 ? 's' : ''}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Commission ({commissionLabel})</p>
          <p className={[styles.statValue, styles.statValueRed].join(' ')}>-{fmt(totalCommission, currency)}</p>
          <p className={styles.statSub}>Platform fee deducted</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Earnings</p>
          <p className={[styles.statValue, styles.statValueGreen].join(' ')}>{fmt(totalNet, currency)}</p>
          <p className={styles.statSub}>After {commissionLabel} commission</p>
        </div>
        <div className={[styles.statCard, styles.statCardHighlight].join(' ')}>
          <p className={styles.statLabel}>Available to Payout</p>
          <p className={[styles.statValue, styles.statValuePrimary].join(' ')}>{fmt(available, currency)}</p>
          <p className={styles.statSub}>
            {pendingCount > 0 && `${pendingCount} pending (clears in 24h)`}
            {pendingCount === 0 && availableCount === 0 && 'No earnings yet'}
            {pendingCount === 0 && availableCount > 0 && `${availableCount} earning${availableCount !== 1 ? 's' : ''} ready`}
          </p>
        </div>
      </div>
      )}

      {activeTab === 'ugc' && (
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total UGC Sales</p>
          <p className={styles.statValue}>{fmt(ugcTotalGross / 100, currency)}</p>
          <p className={styles.statSub}>{ugcCompleted.length} completed order{ugcCompleted.length !== 1 ? 's' : ''}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Platform Fee (15%)</p>
          <p className={[styles.statValue, styles.statValueRed].join(' ')}>-{fmt(ugcTotalFee / 100, currency)}</p>
          <p className={styles.statSub}>Platform fee deducted</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total UGC Earnings</p>
          <p className={[styles.statValue, styles.statValueGreen].join(' ')}>{fmt(ugcTotalNet / 100, currency)}</p>
          <p className={styles.statSub}>After 15% platform fee</p>
        </div>
        <div className={[styles.statCard, styles.statCardHighlight].join(' ')}>
          <p className={styles.statLabel}>Available to Cash Out</p>
          <p className={[styles.statValue, styles.statValuePrimary].join(' ')}>{fmt(ugcAvailable / 100, currency)}</p>
          <p className={styles.statSub}>
            {ugcEligible.length > 0 && `${ugcEligible.length} order${ugcEligible.length !== 1 ? 's' : ''} ready`}
            {ugcEligible.length === 0 && ugcPaidOut > 0 && 'All earnings paid out'}
            {ugcEligible.length === 0 && ugcPaidOut === 0 && 'No completed orders yet'}
          </p>
        </div>
      </div>
      )}

      {activeTab !== 'ugc' && pendingCount > 0 && (
        <div className={styles.infoBanner}>
          <span>{pendingCount} earning{pendingCount !== 1 ? 's are' : ' is'} pending - funds become available 24 hours after the sale to allow for refunds.</span>
        </div>
      )}

      {activeTab !== 'ugc' && hasAvailable && !minPayoutMet && (
        <div className={styles.infoBanner} style={{ background: 'var(--sell-amber-bg)', color: 'var(--sell-amber)' }}>
          <span>
            Payouts have a {fmt(MIN_PAYOUT_AMOUNT, currency)} minimum. You need{' '}
            {fmt(MIN_PAYOUT_AMOUNT - available, currency)} more to request a payout.
          </span>
        </div>
      )}

      <div className={styles.tabs}>
        {showStoreTabs && (
          <>
            <button className={[styles.tab, activeTab === 'earnings' ? styles.tabActive : ''].join(' ')} onClick={() => setTab('earnings')}>
              Earnings
              {earnings.length > 0 && <span className={styles.tabBadge}>{earnings.length}</span>}
            </button>
            <button className={[styles.tab, activeTab === 'payouts' ? styles.tabActive : ''].join(' ')} onClick={() => setTab('payouts')}>
              Payout History
              {payouts.length > 0 && <span className={styles.tabBadge}>{payouts.length}</span>}
            </button>
          </>
        )}
        {hasUgcProfile && (
          <button className={[styles.tab, activeTab === 'ugc' ? styles.tabActive : ''].join(' ')} onClick={() => setTab('ugc')}>
            UGC Earnings
            {ugcOrders.length > 0 && <span className={styles.tabBadge}>{ugcOrders.length}</span>}
          </button>
        )}
      </div>

      {activeTab === 'earnings' && (
        earnings.length === 0 ? (
          <div className={styles.tableEmpty}>
            <p className={styles.emptyTitle}>No earnings yet</p>
            <p>Sales will appear here once orders are paid.</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th className={styles.thRight}>Sale</th>
                  <th className={styles.thRight}>Commission</th>
                  <th className={styles.thRight}>You Earn</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {earnings.map(e => (
                  <tr key={e.id}>
                    <td><span className={styles.orderNum}>{e.orderNumber}</span></td>
                    <td>{e.customerName}</td>
                    <td className={styles.dateCell}>{e.createdAt.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className={styles.tdRight}>{fmt(e.grossAmount, currency)}</td>
                    <td className={[styles.tdRight, styles.commission].join(' ')}>-{fmt(e.commissionAmount, currency)}</td>
                    <td className={[styles.tdRight, styles.netAmount].join(' ')}>{fmt(e.netAmount, currency)}</td>
                    <td>{statusBadge(e.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {activeTab === 'payouts' && (
        payouts.length === 0 ? (
          <div className={styles.tableEmpty}>
            <p className={styles.emptyTitle}>No payout requests yet</p>
            <p>Click "Request payout" when you have available earnings.</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Bank</th>
                  <th>Account</th>
                  <th className={styles.thRight}>Amount</th>
                  <th>Orders</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map(p => (
                  <tr key={p.id}>
                    <td className={styles.dateCell}>
                      {p.createdAt.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {p.sentAt && (p.status === 'sent' || p.status === 'completed') && (
                        <p style={{ fontSize: '0.68rem', color: 'var(--sell-text-3)', marginTop: 3 }}>
                          Sent {p.sentAt.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </td>
                    <td>{p.bankName}</td>
                    <td><span className={styles.acctNum}>{p.accountNumber}</span> {'\u00B7'} {p.accountName}</td>
                    <td className={[styles.tdRight, styles.netAmount].join(' ')}>{fmt(p.amount, currency)}</td>
                    <td>{p.earningIds.length}</td>
                    <td>
                      {payoutStatusBadge(p.status)}
                      {p.status === 'rejected' && p.rejectionReason && (
                        <p style={{ fontSize: '0.7rem', color: 'var(--sell-red)', marginTop: 3 }}>{p.rejectionReason}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {activeTab === 'ugc' && (
        ugcOrders.length === 0 ? (
          <div className={styles.tableEmpty}>
            <p className={styles.emptyTitle}>No UGC orders yet</p>
            <p>Orders appear here once a brand books you and pays the deposit.</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Brand</th>
                  <th>Date</th>
                  <th className={styles.thRight}>Sale</th>
                  <th className={styles.thRight}>Platform Fee</th>
                  <th className={styles.thRight}>You Earn</th>
                  <th>Status</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {ugcOrders.map(o => (
                  <tr key={o.id}>
                    <td><span className={styles.orderNum}>{o.productName || o.id.slice(-6)}</span></td>
                    <td>{o.guestEmail || o.brandEmail || o.guestName || 'Brand'}</td>
                    <td className={styles.dateCell}>{o.createdAt.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className={styles.tdRight}>{fmt((o.agreedPrice ?? 0) / 100, currency)}</td>
                    <td className={[styles.tdRight, styles.commission].join(' ')}>-{fmt((o.platformFee ?? 0) / 100, currency)}</td>
                    <td className={[styles.tdRight, styles.netAmount].join(' ')}>{fmt((o.creatorPayout ?? 0) / 100, currency)}</td>
                    <td>{ugcOrderBadge(o.status)}</td>
                    <td>{ugcPayBadge(o.paymentStatus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {cashoutOpen && (
        <div className={styles.modalBackdrop} onClick={() => setCashoutOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Cash Out UGC Earnings</h3>
            <p className={styles.modalBody}>
              You're cashing out <strong>{fmt(ugcAvailable / 100, currency)}</strong> from {ugcEligible.length} completed order{ugcEligible.length !== 1 ? 's' : ''}. Funds are sent to your bank within 1-3 business days.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
              <select
                value={bankCode}
                onChange={e => { setBankCode(e.target.value); setAcctName(''); }}
                style={{
                  padding: '9px 12px', borderRadius: 8, border: '1px solid var(--sell-border)',
                  fontSize: '0.85rem', background: 'var(--sell-surface)', color: 'var(--sell-text-1)', fontFamily: 'var(--sell-font-body)',
                }}
              >
                <option value="">Select bank</option>
                {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
              </select>
              <input
                value={acctNumber}
                onChange={e => { setAcctNumber(e.target.value.replace(/\D/g, '').slice(0, 10)); setAcctName(''); }}
                placeholder="Account number (10 digits)"
                style={{
                  padding: '9px 12px', borderRadius: 8, border: '1px solid var(--sell-border)',
                  fontSize: '0.85rem', background: 'var(--sell-surface)', color: 'var(--sell-text-1)', fontFamily: 'var(--sell-font-body)',
                }}
              />
              <button
                className={styles.btnSecondary}
                onClick={handleVerifyBank}
                disabled={verifyingBank || acctNumber.length !== 10 || !bankCode}
                style={{ alignSelf: 'flex-start' }}
              >
                {verifyingBank ? 'Verifying...' : 'Verify account'}
              </button>
              {acctName && (
                <p style={{ fontSize: '0.82rem', color: 'var(--sell-green)', fontWeight: 600 }}>{'\u2713'} {acctName}</p>
              )}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setCashoutOpen(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleUgcCashout} disabled={cashingOut || !acctName}>
                {cashingOut ? 'Processing...' : 'Confirm cashout'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmOpen && (
        <div className={styles.modalBackdrop} onClick={() => setConfirmOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            {payoutStep === 'otp' ? (
              <>
                <h3 className={styles.modalTitle}>Verify Payout</h3>
                <p className={styles.modalBody}>
                  We sent a 6-digit code to <strong>{user?.email}</strong>. Enter it below to authorize your{' '}
                  <strong>{fmt(available, currency)}</strong> payout. Funds arrive in 1-3 business days. The code expires in 10 minutes.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
                  <input
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    inputMode="numeric"
                    autoFocus
                    style={{
                      padding: '12px',
                      borderRadius: 8,
                      border: '1px solid var(--sell-border)',
                      fontSize: '1.1rem',
                      letterSpacing: '0.5em',
                      textAlign: 'center',
                      background: 'var(--sell-surface)',
                      color: 'var(--sell-text-1)',
                      fontFamily: 'var(--sell-font-body)',
                    }}
                  />
                  <button
                    className={styles.btnSecondary}
                    onClick={handleSendPayoutOtp}
                    disabled={requesting}
                    style={{ alignSelf: 'center', background: 'transparent', border: 'none', color: 'var(--sell-primary)', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    Resend code
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className={styles.modalTitle}>Confirm Payout Request</h3>
                <p className={styles.modalBody}>
                  You're requesting a payout of <strong>{fmt(available, currency)}</strong> from {availableCount} earning{availableCount !== 1 ? 's' : ''}. We'll email you a one-time code to authorize it.
                </p>
                <p className={styles.modalBody} style={{ marginTop: 8 }}>
                  Funds sent to <strong>{(storeConfig as any)?.payoutAccountName}</strong> at <strong>{(storeConfig as any)?.payoutBankName}</strong> ({(storeConfig as any)?.payoutAccountNumber}) within 1-3 business days.
                </p>
              </>
            )}
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setConfirmOpen(false)}>Cancel</button>
              {payoutStep === 'otp' ? (
                <button className={styles.btnPrimary} onClick={handleVerifyPayoutOtp} disabled={requesting || otpCode.length !== 6}>
                  {requesting ? 'Sending...' : 'Verify & send payout'}
                </button>
              ) : (
                <button className={styles.btnPrimary} onClick={handleSendPayoutOtp} disabled={requesting}>
                  {requesting ? 'Sending code...' : 'Send verification code'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {payoutSuccess && (
        <div className={styles.modalBackdrop} onClick={() => setPayoutSuccess(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <h3 className={styles.modalTitle}>Payout Requested</h3>
            <p className={styles.modalBody}>
              <strong>{fmt(payoutSuccess.amount, payoutSuccess.currency)}</strong> was requested successfully.
              A confirmation email with your reference is on its way. Funds arrive in your bank within <strong>1-3 business days</strong>.
            </p>
            <div className={styles.modalActions} style={{ justifyContent: 'center' }}>
              <button className={styles.btnPrimary} onClick={() => setPayoutSuccess(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
