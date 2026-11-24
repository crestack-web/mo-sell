'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X, Check, XCircle, Wallet, Banknote, AlertTriangle, ExternalLink,
  CalendarDays, Loader2, Video as VideoIcon, FileText, Sparkles,
} from 'lucide-react';
import { useBrandWorkspace, WorkspaceOrder } from './BrandWorkspaceProvider';
import { useToast } from '@/components/brand/ToastProvider';
import {
  StatusBadge, VideoThumb, formatDate, formatKobo, relativeDate, creatorInitial,
} from './shared';
import styles from '../brand-studio.module.css';

export function CampaignDetailDrawer({
  order, onClose,
}: {
  order: WorkspaceOrder | null;
  onClose: () => void;
}) {
  const { reviewVideo, payBalance, releasePayout, openDispute } = useBrandWorkspace();
  const { showSuccess, showError, showInfo } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState('');

  if (!order) return null;

  const creatorName = order.creator?.displayName || order.creator?.name || order.creator?.username || 'Creator';
  // `review` holds the draft decision first; only an "approved" prefix means
  // the final video itself has been approved and payout can be released.
  const finalApproved = typeof order.review === 'string' && order.review.startsWith('approved');

  async function run(key: string, action: () => Promise<any>, success: string) {
    setBusy(key);
    try {
      const result = await action();
      showSuccess(result?.message || success);
      setNote('');
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setBusy(null);
    }
  }

  function openPayment(url?: string | null) {
    if (!url) return showInfo('Payment link is not available yet. Refresh and try again.');
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  const timeline = [
    { label: 'Brief sent', time: order.requestedAt, done: true, text: `Sent to ${creatorName}` },
    { label: 'Creator accepted', time: order.acceptedAt, done: !!order.acceptedAt, text: 'Work is in progress' },
    { label: 'Draft submitted', time: order.draftSubmittedAt, done: !!order.draftSubmittedAt, text: 'Ready for your review' },
    { label: 'Draft approved', time: order.status === 'APPROVED' || order.status === 'COMPLETED' ? order.updatedAt : null, done: ['APPROVED', 'COMPLETED'].includes(order.status ?? ''), text: 'Balance can be released' },
    { label: 'Final delivered', time: order.completedAt, done: !!order.completedAt, text: 'Final video is in your library' },
    { label: 'Creator paid', time: order.paidOutAt, done: !!order.paidOutAt, text: formatKobo(order.creatorPayout) },
  ];

  return (
    <div className={styles.drawerWrap} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.aside
        className={styles.drawer}
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
      >
        <div className={styles.modalHead}>
          <div style={{ minWidth: 0 }}>
            <div className={styles.pageEyebrow}><Sparkles size={12} /> Collaboration</div>
            <h2 className={styles.modalTitle}>{order.productName || 'Creative brief'}</h2>
            <p className={styles.modalSub}>with {creatorName} · {formatKobo(order.agreedPrice)}</p>
          </div>
          <button className={styles.iconButton} onClick={onClose} aria-label="Close details"><X size={17} /></button>
        </div>

        <div className={styles.modalBody}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
            <StatusBadge status={order.status} />
            <StatusBadge status={order.paymentStatus} />
            {order.videoLength && <span className={styles.chip}>{order.videoLength}</span>}
          </div>

          <div className={styles.infoStrip} style={{ marginBottom: 20 }}>
            <FileText size={15} />
            <div>
              <strong style={{ color: 'var(--bs-text)' }}>The brief</strong>
              <div style={{ marginTop: 4 }}>{order.brief}</div>
              <div style={{ marginTop: 8, color: 'var(--bs-text)' }}><strong>Deliverables:</strong> {order.deliverables}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                <CalendarDays size={12} /> Due {formatDate(order.deadline)}
              </div>
            </div>
          </div>

          {/* Draft review */}
          {order.draftVideoUrl && (
            <div className={styles.card} style={{ marginBottom: 18 }}>
              <div className={styles.cardHead}>
                <div>
                  <p className={styles.cardTitle}>Draft for review</p>
                  <p className={styles.cardSub}>Submitted {relativeDate(order.draftSubmittedAt)}</p>
                </div>
                <a className={styles.ghostButton} href={order.draftVideoUrl} target="_blank" rel="noreferrer">
                  <ExternalLink size={13} /> Open
                </a>
              </div>
              <div className={styles.cardBody}>
                <VideoThumb url={order.draftVideoUrl} type="draft" />
                <textarea
                  className={styles.textarea}
                  style={{ marginTop: 12, minHeight: 70 }}
                  placeholder="Leave a note for the creator (optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  <button
                    className={styles.primaryButton}
                    disabled={busy !== null}
                    onClick={() => run('approve_draft', () => reviewVideo(order.id, 'draft', 'approve', note || undefined), 'Draft approved. You can release the balance now.')}
                  >
                    {busy === 'approve_draft' ? <Loader2 size={14} className={styles.spinner} /> : <Check size={14} />} Approve draft
                  </button>
                  <button
                    className={styles.dangerButton}
                    disabled={busy !== null}
                    onClick={() => run('reject_draft', () => reviewVideo(order.id, 'draft', 'reject', note || 'Please revise this draft'), 'Revision requested from the creator.')}
                  >
                    <XCircle size={14} /> Request changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Balance payment */}
          {(order.status === 'DRAFT_SUBMITTED' || order.status === 'APPROVED') && (
            <div className={styles.card} style={{ marginBottom: 18 }}>
              <div className={styles.cardBody}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                  <div className={`${styles.statIcon} ${styles.statIconSuccess}`}><Wallet size={17} /></div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 4px', fontSize: 12.5, fontWeight: 750 }}>Release the remaining balance</p>
                    <p className={styles.cardSub} style={{ margin: 0 }}>
                      {formatKobo(order.balanceAmount)} — the creator uploads the final video once this is paid.
                    </p>
                    <button
                      className={styles.softButton}
                      style={{ marginTop: 12 }}
                      disabled={busy !== null || order.paymentStatus === 'PENDING_BALANCE' || order.paymentStatus === 'PAID_OUT'}
                      onClick={() => run('pay_balance', async () => {
                        const result = await payBalance(order.id);
                        if (result.paystackUrl) openPayment(result.paystackUrl);
                        return { message: 'Balance checkout opened in a new tab.' };
                      }, 'Balance checkout opened.')}
                    >
                      <Wallet size={14} /> Pay {formatKobo(order.balanceAmount)}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Final review & payout */}
          {order.finalVideoUrl && (
            <div className={styles.card} style={{ marginBottom: 18 }}>
              <div className={styles.cardHead}>
                <div>
                  <p className={styles.cardTitle}>Final video</p>
                  <p className={styles.cardSub}>Delivered {relativeDate(order.completedAt)}</p>
                </div>
                <a className={styles.ghostButton} href={order.finalVideoUrl} target="_blank" rel="noreferrer">
                  <ExternalLink size={13} /> Open
                </a>
              </div>
              <div className={styles.cardBody}>
                <VideoThumb url={order.finalVideoUrl} type="final" />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                  <button
                    className={styles.primaryButton}
                    disabled={busy !== null || finalApproved}
                    onClick={() => run('approve_final', () => reviewVideo(order.id, 'final', 'approve', note || undefined), 'Final video approved.')}
                  >
                    <Check size={14} /> {finalApproved ? 'Approved' : 'Approve final video'}
                  </button>
                  <button
                    className={styles.dangerButton}
                    disabled={busy !== null || finalApproved}
                    onClick={() => run('dispute', () => openDispute(order.id, 'BRIEF_MISMATCH', note || 'Final video does not match the brief'), 'Dispute opened for review.')}
                  >
                    <AlertTriangle size={14} /> Raise an issue
                  </button>
                </div>
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--bs-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 12.5, fontWeight: 750 }}>Creator payout</p>
                      <p className={styles.cardSub} style={{ margin: 0 }}>{formatKobo(order.creatorPayout)} to {creatorName}</p>
                    </div>
                    <button
                      className={styles.primaryButton}
                      disabled={busy !== null || order.paymentStatus === 'PAID_OUT' || !finalApproved}
                      onClick={() => run('payout', () => releasePayout(order.id), 'Payout released to the creator.')}
                    >
                      <Banknote size={14} /> {order.paymentStatus === 'PAID_OUT' ? 'Paid out' : 'Release payout'}
                    </button>
                  </div>
                  {!finalApproved && <p className={styles.helper} style={{ marginTop: 8 }}>Approve the final video before releasing the payout.</p>}
                  {order.paystackTransferCode && <p className={styles.helper} style={{ marginTop: 8 }}>Transfer: {order.paystackTransferCode}</p>}
                </div>
              </div>
            </div>
          )}

          {order.rejectionReason && (
            <div className={styles.infoStrip} style={{ borderColor: 'rgba(251,128,149,.25)', background: 'var(--bs-danger-soft)', marginBottom: 18 }}>
              <XCircle size={15} />
              <span>Revision requested: {order.rejectionReason}</span>
            </div>
          )}

          {/* Timeline */}
          <h3 className={styles.cardTitle} style={{ marginBottom: 14 }}>Activity</h3>
          <div className={styles.timeline}>
            {timeline.map((item) => (
              <div className={styles.timelineItem} key={item.label}>
                <div className={styles.timelineRail}>
                  <span className={`${styles.timelineDot} ${item.done ? styles.timelineDotDone : styles.timelineDotPending}`} />
                </div>
                <div className={styles.timelineContent}>
                  <div className={styles.timelineLabel}>{item.label}</div>
                  <div className={styles.timelineText}>{item.text}</div>
                  {item.time && <div className={styles.timelineTime}>{formatDate(item.time)} · {relativeDate(item.time)}</div>}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.infoStrip} style={{ marginTop: 18 }}>
            <VideoIcon size={15} />
            <span>Everything here is shared with the creator’s dashboard in real time, so decisions and payments stay in sync.</span>
          </div>
        </div>
      </motion.aside>
    </div>
  );
}
