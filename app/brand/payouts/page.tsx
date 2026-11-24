'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Banknote, Wallet, CheckCircle2, AlertTriangle, ArrowUpRight, Loader2,
  ExternalLink, Clock3, ShieldCheck, CircleDollarSign,
} from 'lucide-react';
import { useBrandWorkspace } from '../_components/BrandWorkspaceProvider';
import { CampaignDetailDrawer } from '../_components/CampaignDetailDrawer';
import { useToast } from '@/components/brand/ToastProvider';
import {
  EmptyState, SectionHead, StatCard, StatusBadge, creatorInitial, formatKobo, relativeDate,
} from '../_components/shared';
import styles from '../brand-studio.module.css';

export default function BrandPayoutsPage() {
  const { brand, orders, payBalance, releasePayout } = useBrandWorkspace();
  const { showSuccess, showError, showInfo } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const balanceDue = useMemo(
    () => orders.filter((o) => ['DRAFT_SUBMITTED', 'APPROVED'].includes(o.status ?? '') && o.paymentStatus !== 'PENDING_BALANCE' && o.paymentStatus !== 'PAID_OUT'),
    [orders]
  );
  const readyToRelease = useMemo(
    () => orders.filter((o) => o.status === 'COMPLETED' && o.finalVideoUrl && typeof o.review === 'string' && o.review.startsWith('approved') && o.paymentStatus !== 'PAID_OUT'),
    [orders]
  );
  const paidOut = useMemo(
    () => orders.filter((o) => o.paymentStatus === 'PAID_OUT'),
    [orders]
  );
  const disputed = useMemo(
    () => orders.filter((o) => o.status === 'DISPUTED'),
    [orders]
  );

  const queue = useMemo(() => {
    const ids = new Set([...balanceDue, ...readyToRelease, ...disputed].map((o) => o.id));
    const rest = orders.filter((o) => !ids.has(o.id) && o.paymentStatus !== 'PAID_OUT' && o.paymentStatus !== 'PENDING_DEPOSIT');
    return [...balanceDue, ...readyToRelease, ...disputed, ...rest];
  }, [orders, balanceDue, readyToRelease, disputed]);

  const selected = orders.find((o) => o.id === selectedId) ?? null;
  const totalBalance = balanceDue.reduce((sum, o) => sum + (o.balanceAmount ?? 0), 0);
  const totalPaid = paidOut.reduce((sum, o) => sum + (o.creatorPayout ?? 0), 0);

  async function run(key: string, action: () => Promise<any>, success: string) {
    setBusy(key);
    try {
      const result = await action();
      if (result?.paystackUrl) {
        window.open(result.paystackUrl, '_blank', 'noopener,noreferrer');
        showInfo('Complete the payment in the new tab.');
      } else {
        showSuccess(success);
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Payment action failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className={styles.pageHead}>
        <div>
          <div className={styles.pageEyebrow}><Banknote size={12} /> Payments</div>
          <h1 className={styles.pageTitle}>Payouts & balances</h1>
          <p className={styles.pageSubtitle}>
            Release the remaining half after you approve a draft, then pay creators once you approve the final video.
          </p>
        </div>
        <button className={styles.ghostButton} onClick={() => window.location.assign('/brand/transactions')}>
          View transaction history <ArrowUpRight size={14} />
        </button>
      </div>

      <div className={`${styles.grid} ${styles.statsGrid}`}>
        <StatCard icon={<Wallet size={17} />} label="Balance to release" value={formatKobo(totalBalance)} tone="warning" foot={`${balanceDue.length} brief${balanceDue.length === 1 ? '' : 's'} awaiting payment`} />
        <StatCard icon={<CheckCircle2 size={17} />} label="Ready to pay out" value={readyToRelease.length} tone="success" foot="Final videos approved" />
        <StatCard icon={<Banknote size={17} />} label="Creator payouts" value={formatKobo(totalPaid)} tone="success" foot={`${paidOut.length} completed transfers`} />
        <StatCard icon={<CircleDollarSign size={17} />} label="Wallet balance" value={`$${Number(brand?.walletBalance ?? 0).toFixed(2)}`} foot="Available for marketplace purchases" />
      </div>

      <div className={styles.infoStrip} style={{ marginTop: 20 }}>
        <ShieldCheck size={15} />
        <span>
          Payments are processed securely through Paystack. Deposits are held until a draft is submitted; creator transfers
          happen only after you approve the final delivery.
        </span>
      </div>

      <SectionHead title="Payment queue" hint="Everything that still needs a payment decision" />

      {queue.length === 0 ? (
        <div className={styles.card}>
          <EmptyState
            icon={<CheckCircle2 size={22} />}
            title="No payments pending"
            text="When a creator submits a draft or final video, the payment actions appear here."
          />
        </div>
      ) : (
        <div className={styles.card}>
          {queue.map((order) => {
            const creatorName = order.creator?.displayName || order.creator?.name || 'Creator';
            const needsBalance = ['DRAFT_SUBMITTED', 'APPROVED'].includes(order.status ?? '') && order.paymentStatus !== 'PENDING_BALANCE' && order.paymentStatus !== 'PAID_OUT';
            const finalApproved = typeof order.review === 'string' && order.review.startsWith('approved');
            const needsPayout = order.status === 'COMPLETED' && order.finalVideoUrl && finalApproved && order.paymentStatus !== 'PAID_OUT';
            const needsApproval = order.status === 'COMPLETED' && order.finalVideoUrl && !finalApproved;
            return (
              <div className={styles.campaignRow} key={order.id}>
                <div className={styles.campaignIcon}>
                  {order.status === 'DISPUTED' ? <AlertTriangle size={17} /> : <Banknote size={17} />}
                </div>
                <div className={styles.campaignMain}>
                  <div className={styles.campaignName}>{order.productName || 'Creative brief'}</div>
                  <div className={styles.campaignDesc}>
                    with {creatorName} · {relativeDate(order.draftSubmittedAt || order.completedAt || order.requestedAt)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <div className={styles.campaignSide}>
                    <StatusBadge status={order.status} />
                    <div className={styles.campaignAmount} style={{ marginTop: 6 }}>
                      {formatKobo(needsBalance ? order.balanceAmount : order.creatorPayout)}
                    </div>
                    <div className={styles.videoCardSub}>{needsBalance ? 'balance due' : 'creator payout'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {needsBalance && (
                      <button
                        className={styles.primaryButton}
                        disabled={busy !== null}
                        onClick={() => run(`pay-${order.id}`, () => payBalance(order.id), 'Balance checkout opened.')}
                      >
                        {busy === `pay-${order.id}` ? <Loader2 size={13} className={styles.spinner} /> : <Wallet size={13} />}
                        Pay balance
                      </button>
                    )}
                    {needsApproval && (
                      <button className={styles.softButton} onClick={() => setSelectedId(order.id)}>
                        <ExternalLink size={13} /> Review final
                      </button>
                    )}
                    {needsPayout && (
                      <button
                        className={styles.primaryButton}
                        disabled={busy !== null}
                        onClick={() => run(`payout-${order.id}`, () => releasePayout(order.id), 'Payout released to the creator.')}
                      >
                        {busy === `payout-${order.id}` ? <Loader2 size={13} className={styles.spinner} /> : <Banknote size={13} />}
                        Release payout
                      </button>
                    )}
                    {order.status === 'DISPUTED' && (
                      <button className={styles.dangerButton} onClick={() => setSelectedId(order.id)}>
                        <AlertTriangle size={13} /> View issue
                      </button>
                    )}
                    <button className={styles.ghostButton} onClick={() => setSelectedId(order.id)}>
                      Details <ArrowUpRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SectionHead title="Completed payouts" hint="Money already sent to creators" />
      {paidOut.length === 0 ? (
        <div className={styles.card}>
          <EmptyState icon={<Clock3 size={22} />} title="No payouts yet" text="Approved final deliveries will appear here after you release payment." />
        </div>
      ) : (
        <div className={styles.card}>
          {paidOut.map((order) => (
            <div className={styles.campaignRow} key={order.id} onClick={() => setSelectedId(order.id)}>
              <div className={styles.campaignIcon}><CheckCircle2 size={17} /></div>
              <div className={styles.campaignMain}>
                <div className={styles.campaignName}>{order.productName || 'Creative brief'}</div>
                <div className={styles.campaignDesc}>
                  <span className={styles.avatarCell} style={{ width: 18, height: 18, fontSize: 8, display: 'inline-grid', marginRight: 6 }}>
                    {creatorInitial(order.creator?.displayName || order.creator?.name)}
                  </span>
                  {order.creator?.displayName || order.creator?.name || 'Creator'} · paid {relativeDate(order.paidOutAt)}
                </div>
              </div>
              <div className={styles.campaignSide}>
                <div className={styles.campaignAmount} style={{ color: 'var(--bs-success)' }}>{formatKobo(order.creatorPayout)}</div>
                <div className={styles.videoCardSub}>{order.paystackTransferCode || 'Transfer complete'}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CampaignDetailDrawer order={selected} onClose={() => setSelectedId(null)} />
    </motion.div>
  );
}
