'use client';

import React from 'react';
import { Play } from 'lucide-react';
import styles from '../brand-studio.module.css';

export function formatKobo(kobo?: number | null): string {
  const value = (kobo ?? 0) / 100;
  return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatMoney(amount?: number | null, currency = 'USD'): string {
  const value = amount ?? 0;
  if (currency === 'NGN') return `₦${value.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
  return `$${value.toFixed(2)}`;
}

export function relativeDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS: Record<string, { label: string; className: string }> = {
  REQUESTED: { label: 'Brief sent', className: styles.chipAccent },
  IN_PROGRESS: { label: 'In progress', className: styles.chipCyan },
  DRAFT_SUBMITTED: { label: 'Draft for review', className: styles.chipWarning },
  APPROVED: { label: 'Draft approved', className: styles.chipSuccess },
  COMPLETED: { label: 'Final delivered', className: styles.chipSuccess },
  DISPUTED: { label: 'Disputed', className: styles.chipDanger },
  REJECTED: { label: 'Rejected', className: styles.chipDanger },
  CANCELLED: { label: 'Cancelled', className: '' },
  REFUNDED: { label: 'Refunded', className: styles.chipWarning },
  PENDING_DEPOSIT: { label: 'Awaiting deposit', className: styles.chipWarning },
  DEPOSIT_HELD: { label: 'Deposit held', className: styles.chipCyan },
  PENDING_BALANCE: { label: 'Balance pending', className: styles.chipWarning },
  PAID_OUT: { label: 'Paid out', className: styles.chipSuccess },
  DISPUTE_HOLD: { label: 'On hold', className: styles.chipDanger },
};

export function StatusBadge({ status, label }: { status?: string | null; label?: string }) {
  const meta = STATUS[status ?? ''] ?? { label: label ?? status ?? 'Unknown', className: '' };
  return <span className={`${styles.chip} ${meta.className}`}><span className={styles.dot} />{meta.label}</span>;
}

export function StatCard({
  icon, label, value, foot, tone = 'accent', onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  foot?: React.ReactNode;
  tone?: 'accent' | 'success' | 'warning' | 'pink';
  onClick?: () => void;
}) {
  const iconClass = tone === 'success' ? styles.statIconSuccess
    : tone === 'warning' ? styles.statIconWarning
    : tone === 'pink' ? styles.statIconPink
    : styles.statIcon;
  return (
    <div
      className={styles.statCard}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <div className={styles.statTop}>
        <div className={`${styles.statIcon} ${iconClass}`}>{icon}</div>
      </div>
      <div className={styles.statLabel}>{label}</div>
      <div className={styles.statValue}>{value}</div>
      {foot && <div className={styles.statFoot}>{foot}</div>}
    </div>
  );
}

export function SectionHead({
  title, hint, action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={styles.sectionHead}>
      <div>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {hint && <p className={styles.sectionHint}>{hint}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon, title, text, action,
}: {
  icon: React.ReactNode;
  title: string;
  text?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>{icon}</div>
      <div className={styles.emptyTitle}>{title}</div>
      {text && <p className={styles.emptyText}>{text}</p>}
      {action}
    </div>
  );
}

export function VideoThumb({
  url, poster, type = 'draft',
}: {
  url?: string | null;
  poster?: string | null;
  type?: string;
}) {
  const thumb = poster || youtubeThumb(url) || undefined;
  return (
    <div className={styles.videoThumb}>
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="Video preview" />
      ) : (
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {type} video
        </span>
      )}
      <span className={styles.thumbPlay}><Play size={14} fill="currentColor" /></span>
    </div>
  );
}

export function youtubeThumb(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  return match ? `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg` : null;
}

export function creatorInitial(name?: string | null): string {
  return (name || 'C').trim().charAt(0).toUpperCase();
}
