'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '@/lib/database/adapter';
import { useSell } from '@/context/SellContext';
import styles from './SellEarningsPage.module.css';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
  status: 'requested' | 'processing' | 'completed' | 'rejected';
  rejectionReason: string | null;
  processedAt: Date | null;
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

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const COMMISSION_RATE = 0.05;

function fmt(n: number, currency = 'NGN') {
  const sym = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ';
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

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function SellEarningsPage() {
  const { user, storeConfig, navigateTo, showToast } = useSell();

  const [earnings,      setEarnings]      = useState<Earning[]>([]);
  const [payouts,       setPayouts]       = useState<PayoutRequest[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [requesting,    setRequesting]    = useState(false);
  const [tab,           setTab]           = useState<'earnings' | 'payouts' | 'ugc'>('earnings');
  const [confirmOpen,   setConfirmOpen]   = useState(false);
  const [whopPayoutMethod, setWhopPayoutMethod] = useState(false);

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

  const managedPayments = (storeConfig as any)?.managedPayments === true;
  const currency = storeConfig?.currency ?? 'NGN';

  // Promote pending -> available after 24 h (client-side convenience update)
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

      // Earnings
      const eSnap = await db.collection(`businesses/${biz}/storeEarnings`).limit(1000).get();
      const rawEarnings: Earning[] = eSnap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<Earning, 'id' | 'createdAt'>),
        createdAt: new Date(d.data().createdAt || Date.now()),
      }));
      const promoted = await promoteEarnings(biz, rawEarnings);
      setEarnings(promoted);

      // Fire-and-forget analytics: record earnings page view
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

      // Payout requests
      const pSnap = await db.collection(`businesses/${biz}/payoutRequests`).limit(100).get();
      setPayouts(pSnap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<PayoutRequest, 'id' | 'createdAt' | 'processedAt'>),
        createdAt:   new Date(d.data().createdAt || Date.now()),
        processedAt: d.data().processedAt ? new Date(d.data().processedAt) : null,
      })));
    } catch (err) {
      console.error('[SellEarningsPage] load error:', err);
      showToast('Failed to load earnings', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.businessId, promoteEarnings, showToast]);

  useEffect(() => { load(); }, [load]);

  // ── UGC earnings ──
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

  // Bank list for cashout form
  useEffect(() => {
    fetch('/api/sell/verify-bank')
      .then(r => r.json())
      .then((d: { banks?: { code: string; name: string }[] }) => { if (d.banks) setBanks(d.banks); })
      .catch(() => {});
  }, []);

  // Default to UGC tab when user has a UGC profile but no managed payments
  useEffect(() => {
    if (!managedPayments && hasUgcProfile) setTab('ugc');
  }, [managedPayments, hasUgcProfile]);

  // Stats
  const totalGross     = earnings.reduce((s, e) => s + e.grossAmount, 0);
  const totalCommission = earnings.reduce((s, e) => s + e.commissionAmount, 0);
  const totalNet       = earnings.reduce((s, e) => s + e.netAmount, 0);
  const available      = earnings.filter(e => e.status === 'available').reduce((s, e) => s + e.netAmount, 0);
  const pendingCount   = earnings.filter(e => e.status === 'pending').length;
  const availableCount = earnings.filter(e => e.status === 'available').length;

  const hasAvailable = availableCount > 0;

  // UGC stats
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
      showToast(`Cashout of ${fmt((data.amount ?? 0) / 100, currency)} initiated! Funds sent within 1–3 business days.`, 'success');
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

  const handleRequestPayout = useCallback(async () => {
    if (!user?.businessId) return;
    const config = storeConfig as any;
    if (!config?.payoutBankName || !config?.payoutAccountNumber || !config?.payoutAccountName) {
      showToast('Add your bank account in Settings before requesting a payout.', 'error');
      navigateTo('settings');
      return;
    }
    setRequesting(true);
    setConfirmOpen(false);
    try {
      const res = await fetch('/api/sell/payouts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: user.businessId }),
      });
      const data = await res.json() as { payoutRequestId?: string; amount?: number; error?: string };
      if (!res.ok) {
        showToast(data.error ?? 'Payout request failed', 'error');
        return;
      }
      showToast(`Payout of ${fmt(data.amount ?? 0, currency)} requested! We'll process it within 1–3 business days.`, 'success');
      await load();
      setTab('payouts');
    } catch {
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setRequesting(false);
    }
  }, [user?.businessId, storeConfig, currency, load, showToast, navigateTo]);

  const handleWhopPayout = useCallback(async () => {
    if (!user?.businessId) return;
    setRequesting(true);
    setConfirmOpen(false);
    try {
      const res = await fetch('/api/sell/payouts/whop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: user.businessId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.whopOnboardingUrl) {
          showToast('Complete KYC to enable Whop payouts.', 'info');
          window.open(data.whopOnboardingUrl, '_blank');
        } else {
          showToast(data.error ?? 'Whop payout failed', 'error');
        }
        return;
      }
      showToast(data.message ?? 'Whop payout initiated!', 'success');
      await load();
      setTab('payouts');
    } catch {
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setRequesting(false);
    }
  }, [user?.businessId, load, showToast]);

  // â”€â”€ Not opted in â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (loading || ugcLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading earnings…</p>
        </div>
      </div>
    );
  }

  if (!managedPayments && !hasUgcProfile) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h2 className={styles.heading}>Earnings</h2>
          <p className={styles.sub}>Track sales commissions and request payouts.</p>
        </div>
        <div className={styles.emptyCard}>
          <div className={styles.emptyIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
            </svg>
          </div>
          <p className={styles.emptyTitle}>Enable Managed Payments first</p>
          <p className={styles.emptySub}>
            Turn on Managed Payments in Settings to let Busmo collect payments on your behalf.
            A 5% commission is charged per sale — your net earnings appear here and you can request a payout anytime.
          </p>
          <button
            className={styles.btnPrimary}
            onClick={() => navigateTo('settings')}
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  const showStoreTabs = managedPayments;
  let activeTab: 'earnings' | 'payouts' | 'ugc' = tab;
  if (!hasUgcProfile && activeTab === 'ugc') activeTab = 'earnings';
  if (!showStoreTabs && (activeTab === 'earnings' || activeTab === 'payouts')) activeTab = 'ugc';
  if (!showStoreTabs && !hasUgcProfile) activeTab = 'ugc';

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.heading}>Earnings</h2>
          {activeTab === 'ugc' ? (
            <p className={styles.sub}>Track payments from your UGC orders and cash out once a purchase is delivered and completed.</p>
          ) : (
            <p className={styles.sub}>Busmo collects on your behalf and charges {pct(COMMISSION_RATE)} commission per sale.</p>
          )}
        </div>
        {activeTab === 'ugc' ? (
          <button
            className={styles.btnPrimary}
            onClick={() => setCashoutOpen(true)}
            disabled={!hasUgcAvailable || cashingOut}
          >
            {cashingOut ? (
              <><span className={styles.spinner} />Processing…</>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="17 11 21 7 17 3"/><path d="M21 7H3"/>
                  <polyline points="7 21 3 17 7 13"/><path d="M15 17H3"/>
                </svg>
                Cash out {hasUgcAvailable ? `(${fmt(ugcAvailable / 100, currency)})` : ''}
              </>
            )}
          </button>
        ) : (
          <button
            className={styles.btnPrimary}
            onClick={() => setConfirmOpen(true)}
            disabled={!hasAvailable || requesting}
          >
            {requesting ? (
              <><span className={styles.spinner} />Processing…</>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="17 11 21 7 17 3"/><path d="M21 7H3"/>
                  <polyline points="7 21 3 17 7 13"/><path d="M15 17H3"/>
                </svg>
                Request payout {hasAvailable ? `(${fmt(available, currency)})` : ''}
              </>
            )}
          </button>
        )}
      </div>

      {/* Stats row — store */}
      {activeTab !== 'ugc' && (
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Sales</p>
          <p className={styles.statValue}>{fmt(totalGross, currency)}</p>
          <p className={styles.statSub}>{earnings.length} order{earnings.length !== 1 ? 's' : ''}</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Commission ({pct(COMMISSION_RATE)})</p>
          <p className={[styles.statValue, styles.statValueRed].join(' ')}>-{fmt(totalCommission, currency)}</p>
          <p className={styles.statSub}>Platform fee deducted</p>
        </div>
        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Earnings</p>
          <p className={[styles.statValue, styles.statValueGreen].join(' ')}>{fmt(totalNet, currency)}</p>
          <p className={styles.statSub}>After {pct(COMMISSION_RATE)} commission</p>
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

      {/* Stats row — UGC */}
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

      {/* Info note about pending -> available */}
      {activeTab !== 'ugc' && pendingCount > 0 && (
        <div className={styles.infoBanner}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{pendingCount} earning{pendingCount !== 1 ? 's are' : ' is'} pending — funds become available 24 hours after the sale to allow for refunds.</span>
        </div>
      )}

      {/* UGC info banner */}
      {activeTab === 'ugc' && (
        <div className={styles.infoBanner}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>Buyers pay a 50% deposit upfront (held in escrow), then the remaining balance after they approve your video. Earnings become available to cash out once the order is marked completed. Busmo charges a 15% platform fee.</span>
        </div>
      )}

      {/* Tabs */}
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

      {/* Earnings table */}
      {activeTab === 'earnings' && (
        earnings.length === 0 ? (
          <div className={styles.tableEmpty}>
            <p>No earnings yet. Sales will appear here once orders are paid.</p>
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

      {/* Payout history */}
      {activeTab === 'payouts' && (
        payouts.length === 0 ? (
          <div className={styles.tableEmpty}>
            <p>No payout requests yet. Click &quot;Request payout&quot; when you have available earnings.</p>
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
                    <td className={styles.dateCell}>{p.createdAt.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td>{p.bankName}</td>
                    <td><span className={styles.acctNum}>{p.accountNumber}</span> · {p.accountName}</td>
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

      {/* UGC earnings table */}
      {activeTab === 'ugc' && (
        ugcOrders.length === 0 ? (
          <div className={styles.tableEmpty}>
            <p>No UGC orders yet. Orders appear here once a brand books you and pays the deposit.</p>
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

      {/* Cash out modal */}
      {cashoutOpen && (
        <div className={styles.modalBackdrop} onClick={() => setCashoutOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Cash Out UGC Earnings</h3>
            <p className={styles.modalBody}>
              You&apos;re cashing out <strong>{fmt(ugcAvailable / 100, currency)}</strong> from {ugcEligible.length} completed order{ugcEligible.length !== 1 ? 's' : ''}. Funds are sent to your bank within 1–3 business days.
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
                {verifyingBank ? 'Verifying…' : 'Verify account'}
              </button>
              {acctName && (
                <p style={{ fontSize: '0.82rem', color: 'var(--sell-green)', fontWeight: 600 }}>✓ {acctName}</p>
              )}
            </div>

            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setCashoutOpen(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={handleUgcCashout} disabled={cashingOut || !acctName}>
                {cashingOut ? 'Processing…' : 'Confirm cashout'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm payout modal */}
      {confirmOpen && (
        <div className={styles.modalBackdrop} onClick={() => setConfirmOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Confirm Payout Request</h3>
            <p className={styles.modalBody}>
              You&apos;re requesting a payout of <strong>{fmt(available, currency)}</strong> from {availableCount} earning{availableCount !== 1 ? 's' : ''}.
            </p>

            {/* Payout method toggle */}
            <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
              <button
                onClick={() => setWhopPayoutMethod(false)}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                  border: `2px solid ${!whopPayoutMethod ? 'var(--sell-primary)' : 'var(--sell-border)'}`,
                  background: !whopPayoutMethod ? 'rgba(99,102,241,0.06)' : 'transparent',
                  fontWeight: 600, fontSize: '0.8rem',
                  color: !whopPayoutMethod ? 'var(--sell-primary)' : 'var(--sell-text-2)',
                }}
              >
                💳 Bank Transfer
              </button>
              <button
                onClick={() => setWhopPayoutMethod(true)}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                  border: `2px solid ${whopPayoutMethod ? 'var(--sell-primary)' : 'var(--sell-border)'}`,
                  background: whopPayoutMethod ? 'rgba(99,102,241,0.06)' : 'transparent',
                  fontWeight: 600, fontSize: '0.8rem',
                  color: whopPayoutMethod ? 'var(--sell-primary)' : 'var(--sell-text-2)',
                }}
              >
                🌍 Whop (International)
              </button>
            </div>

            {whopPayoutMethod ? (
              <p className={styles.modalBody}>
                Payout via Whop — funds sent to your Whop balance. <strong>Settlement: ~7 business days</strong> for international payments. Requires completed KYC.
              </p>
            ) : (
              <p className={styles.modalBody} style={{ marginTop: 8 }}>
                Funds sent to <strong>{(storeConfig as any)?.payoutAccountName}</strong> at <strong>{(storeConfig as any)?.payoutBankName}</strong> ({(storeConfig as any)?.payoutAccountNumber}) within 1–3 business days.
              </p>
            )}
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button className={styles.btnPrimary} onClick={whopPayoutMethod ? handleWhopPayout : handleRequestPayout} disabled={requesting}>
                {requesting ? 'Processing…' : 'Confirm payout'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

