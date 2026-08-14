'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/* ─── Types ─────────────────────────────────────────────── */

export interface Product {
  id: string;
  displayName: string;
  price: number;
  productType: string;
  images: string[];
  category: string;
  description?: string;
  tags?: string[];
}

export interface CampaignDay {
  day: number;
  task: string;
  done: boolean;
}

export interface Campaign {
  id: string;
  productId: string;
  productName: string;
  days: CampaignDay[];
  createdAt: number;
}

export interface UGCRequest {
  id: string;
  brand: string;
  product: string;
  status: string;
  budget: number;
  createdAt: number;
}

export interface UGCOrder {
  id: string;
  brand: string;
  product: string;
  status: string;
  amount: number;
  dueDate: string;
}

export interface CalendarPost {
  id: string;
  title: string;
  platform: string;
  productId?: string;
  productName?: string;
  date: string;
  time?: string;
  notes?: string;
  status: 'scheduled' | 'posted';
  postedUrl?: string;
  createdAt: number;
}

export interface SocialProfile {
  platform: string;
  url: string;
  followerCount?: number;
  followingCount?: number;
  postsCount?: number;
  likesCount?: number;
  verified?: boolean;
  verifiedAt?: string;
}

export interface RecommendationIdea {
  hook: string;
  format: string;
  cta: string;
  platforms?: string[];
  bestDay?: string;
  bestTime?: string;
}

export interface ApiResponse {
  ideas: RecommendationIdea[];
  scripts?: any[];
  tips?: any[];
  audienceNote?: string;
  error?: string;
}

/* ─── Constants ─────────────────────────────────────────── */

export const PLATFORMS: { key: string; label: string; icon: string }[] = [
  { key: 'instagram', label: 'Instagram', icon: '📷' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵' },
  { key: 'youtube', label: 'YouTube', icon: '▶️' },
  { key: 'twitter', label: 'X (Twitter)', icon: '🐦' },
  { key: 'facebook', label: 'Facebook', icon: '👍' },
];

export const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const AddFormDefault = {
  title: '', platform: 'instagram', date: '', time: '12:00', productId: '', notes: '',
};

/* ─── Helpers ───────────────────────────────────────────── */

export function formatCount(n?: number) {
  if (typeof n !== 'number' || isNaN(n)) return '';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

export function toDateInput(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function nextWeekdayDate(dayName?: string) {
  const target = dayName ? daysOfWeek.indexOf(dayName.charAt(0).toUpperCase() + dayName.slice(1)) : -1;
  const d = new Date();
  if (target >= 0) {
    const current = (d.getDay() + 6) % 7;
    let diff = target - current;
    if (diff <= 0) diff += 7;
    d.setDate(d.getDate() + diff);
  }
  return toDateInput(d);
}

export function parseBestTime(bestTime?: string) {
  if (!bestTime) return '12:00';
  const m = bestTime.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!m) return '12:00';
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  const ap = (m[3] || '').toLowerCase();
  if (ap === 'pm' && h < 12) h += 12;
  if (ap === 'am' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export function Md({ text }: { text: string }) {
  return (
    <div className="content-md">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}

export const Spinner = ({ size = 18, color = 'var(--sell-text-3)' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" style={{ width: size, height: size, animation: 'spin 0.7s linear infinite' }}>
    <path d="M21 12a9 9 0 11-6.219-8.56" />
  </svg>
);

/* ─── Shared styles ─────────────────────────────────────── */

export const s = {
  page: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: 22,
    width: '100%',
    maxWidth: 1200,
  },
  card: {
    background: 'var(--sell-surface)',
    border: '1px solid var(--sell-border)',
    borderRadius: 'var(--sell-radius-lg)',
    overflow: 'hidden' as const,
    boxShadow: 'var(--sell-shadow-sm)',
  },
  cardHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid var(--sell-border-subtle)',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    gap: 12,
    flexWrap: 'wrap' as const,
  },
  cardTitle: {
    fontFamily: 'var(--sell-font-display)',
    fontSize: '0.95rem',
    fontWeight: 700 as const,
    color: 'var(--sell-text-1)',
  },
  cardSub: {
    fontSize: '0.78rem',
    color: 'var(--sell-text-3)',
    marginTop: 2,
  },
  cardBody: {
    padding: 20,
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: 16,
  },
  btnPrimary: {
    display: 'flex',
    alignItems: 'center' as const,
    gap: 7,
    padding: '9px 16px',
    borderRadius: 'var(--sell-radius-sm)',
    fontSize: '0.85rem',
    fontWeight: 600 as const,
    cursor: 'pointer' as const,
    border: 'none',
    fontFamily: 'var(--sell-font-body)',
    background: 'linear-gradient(135deg, var(--sell-primary), var(--sell-accent))',
    color: '#fff',
    boxShadow: '0 4px 14px var(--sell-primary-glow)',
    whiteSpace: 'nowrap' as const,
  },
  btnSecondary: {
    display: 'flex',
    alignItems: 'center' as const,
    gap: 7,
    padding: '9px 16px',
    borderRadius: 'var(--sell-radius-sm)',
    fontSize: '0.85rem',
    fontWeight: 600 as const,
    cursor: 'pointer' as const,
    border: '1px solid var(--sell-border)',
    fontFamily: 'var(--sell-font-body)',
    background: 'var(--sell-surface)',
    color: 'var(--sell-text-1)',
    whiteSpace: 'nowrap' as const,
  },
  btnGhost: {
    display: 'flex',
    alignItems: 'center' as const,
    gap: 7,
    padding: '9px 16px',
    borderRadius: 'var(--sell-radius-sm)',
    fontSize: '0.85rem',
    fontWeight: 600 as const,
    cursor: 'pointer' as const,
    border: '1px solid var(--sell-border)',
    fontFamily: 'var(--sell-font-body)',
    background: 'none',
    color: 'var(--sell-text-2)',
    whiteSpace: 'nowrap' as const,
  },
  formInput: {
    padding: '9px 12px',
    borderRadius: 'var(--sell-radius-sm)',
    border: '1.5px solid var(--sell-border)',
    background: 'var(--sell-bg)',
    fontSize: '0.875rem',
    fontFamily: 'var(--sell-font-body)',
    color: 'var(--sell-text-1)',
    outline: 'none',
    width: '100%',
  },
  formLabel: {
    fontSize: '0.78rem',
    fontWeight: 600 as const,
    color: 'var(--sell-text-2)',
  },
  formSelect: {
    padding: '9px 12px',
    borderRadius: 'var(--sell-radius-sm)',
    border: '1.5px solid var(--sell-border)',
    background: 'var(--sell-bg)',
    fontSize: '0.875rem',
    fontFamily: 'var(--sell-font-body)',
    color: 'var(--sell-text-1)',
    outline: 'none',
    cursor: 'pointer' as const,
    width: '100%',
  },
  heading: {
    fontFamily: 'var(--sell-font-display)',
    fontSize: '1.35rem',
    fontWeight: 700 as const,
    color: 'var(--sell-text-1)',
    marginBottom: 4,
  },
  sub: {
    fontSize: '0.875rem',
    color: 'var(--sell-text-2)',
  },
};
