'use client';

import React from 'react';
import {
  Lightbulb, Calendar, TrendingUp, Megaphone, BarChart3, Package, Instagram, Video, MessageCircle,
} from 'lucide-react';
import { useContentHub } from './ContentHubContext';
import { s } from './shared';

const PILLARS = [
  {
    title: 'Product demos',
    body: 'Show the product in use. Before/after, unboxing, and “day in the life” clips convert better than static catalog shots.',
    platform: 'Reels · TikTok · Shorts',
  },
  {
    title: 'Social proof',
    body: 'Turn reviews, DMs, and order screenshots into stories. Trust content sells when ads alone feel cold.',
    platform: 'Stories · WhatsApp Status',
  },
  {
    title: 'Offer drops',
    body: 'Flash sales, bundles, and “only X left” posts. Pair with a clear CTA and your store link in bio.',
    platform: 'All platforms',
  },
  {
    title: 'Founder story',
    body: 'Why you started, how it’s made, who it’s for. People buy from people — especially local brands.',
    platform: 'Carousel · Live',
  },
];

const WEEK_PLAN = [
  { day: 'Mon', focus: 'Product spotlight', tip: 'Pick one SKU. 15s demo + price + link.' },
  { day: 'Tue', focus: 'Educational tip', tip: 'Teach one thing related to your niche.' },
  { day: 'Wed', focus: 'Social proof', tip: 'Share a review or customer result.' },
  { day: 'Thu', focus: 'Behind the scenes', tip: 'Packing, sourcing, or your process.' },
  { day: 'Fri', focus: 'Offer / urgency', tip: 'Weekend deal or limited stock reminder.' },
  { day: 'Sat', focus: 'UGC-style clip', tip: 'Film like a customer, not an ad.' },
  { day: 'Sun', focus: 'Community', tip: 'Ask a question; reply to comments in-feed.' },
];

export function StudioTab() {
  const {
    setActiveTab,
    products,
    calendarPosts,
    scheduledCount,
    postedCount,
    storeConfig,
  } = useContentHub();

  const productCount = products.length;
  const upcoming = calendarPosts.filter(p => p.status === 'scheduled').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={s.cardHeader}>
        <div>
          <p style={s.cardTitle}>Content studio for sellers</p>
          <p style={s.cardSub}>
            Plan what to post, generate product-led ideas, and ship content that drives store traffic — not vanity metrics.
          </p>
        </div>
      </div>

      {/* Snapshot */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { label: 'Products', value: productCount, sub: 'ready for content' },
          { label: 'Scheduled', value: upcoming || scheduledCount || 0, sub: 'upcoming posts' },
          { label: 'Posted', value: postedCount || 0, sub: 'marked done' },
        ].map(stat => (
          <div key={stat.label} style={{
            padding: '14px 16px', borderRadius: 12, border: '1px solid var(--sell-border)',
            background: 'var(--sell-bg)',
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--sell-text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--sell-text-1)', marginTop: 4 }}>{stat.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--sell-text-3)', marginTop: 2 }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <p style={{ ...s.cardTitle, fontSize: '0.9rem', marginBottom: 10 }}>Quick actions</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {[
            { id: 'ideas', icon: Package, title: 'Product content', desc: 'Scripts & ideas from your catalog' },
            { id: 'calendar', icon: Calendar, title: 'Content calendar', desc: 'Schedule posts for the week' },
            { id: 'trends', icon: TrendingUp, title: 'Trends', desc: 'Formats that are working now' },
            { id: 'campaigns', icon: Megaphone, title: 'Launch campaign', desc: '7-day push for a product or drop' },
            { id: 'analytics', icon: BarChart3, title: 'Performance', desc: 'What content is driving sales signals' },
            { id: 'ideas', icon: Lightbulb, title: 'Fresh ideas', desc: 'Hooks for Reels, TikTok & carousels' },
          ].map((a, i) => {
            const Icon = a.icon;
            return (
              <button
                key={`${a.id}-${i}`}
                type="button"
                onClick={() => setActiveTab(a.id)}
                style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start', textAlign: 'left',
                  padding: '14px', borderRadius: 12, border: '1px solid var(--sell-border)',
                  background: 'var(--sell-surface)', cursor: 'pointer',
                }}
              >
                <span style={{
                  width: 36, height: 36, borderRadius: 10, displayShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(99,102,241,0.15))',
                  color: 'var(--sell-primary)',
                }}>
                  <Icon size={18} />
                </span>
                <span>
                  <span style={{ display: 'block', fontWeight: 750, fontSize: '0.88rem', color: 'var(--sell-text-1)' }}>{a.title}</span>
                  <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--sell-text-3)', marginTop: 2 }}>{a.desc}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Weekly rhythm */}
      <div>
        <p style={{ ...s.cardTitle, fontSize: '0.9rem', marginBottom: 6 }}>This week’s posting rhythm</p>
        <p style={{ ...s.cardSub, marginBottom: 12 }}>
          A simple cadence for busy founders. Adapt to {storeConfig?.storeName || 'your store'} — consistency beats perfection.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {WEEK_PLAN.map(row => (
            <div key={row.day} style={{
              display: 'grid', gridTemplateColumns: '48px 1fr', gap: 10, alignItems: 'start',
              padding: '10px 12px', borderRadius: 10, border: '1px solid var(--sell-border)',
              background: 'var(--sell-bg)',
            }}>
              <span style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--sell-primary)' }}>{row.day}</span>
              <span>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--sell-text-1)' }}>{row.focus}</span>
                <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--sell-text-3)', marginTop: 2 }}>{row.tip}</span>
              </span>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          style={{
            marginTop: 12, border: 'none', borderRadius: 10, padding: '10px 14px',
            background: 'linear-gradient(135deg, #0EA5E9, #6366F1)', color: '#fff',
            fontWeight: 750, fontSize: '0.85rem', cursor: 'pointer',
          }}
        >
          Open calendar to schedule →
        </button>
      </div>

      {/* Pillars */}
      <div>
        <p style={{ ...s.cardTitle, fontSize: '0.9rem', marginBottom: 10 }}>Content pillars that sell</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {PILLARS.map(p => (
            <div key={p.title} style={{
              padding: 14, borderRadius: 12, border: '1px solid var(--sell-border)', background: 'var(--sell-surface)',
            }}>
              <div style={{ fontWeight: 750, fontSize: '0.88rem', color: 'var(--sell-text-1)' }}>{p.title}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--sell-text-2)', marginTop: 6, lineHeight: 1.45 }}>{p.body}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--sell-text-3)', marginTop: 8 }}>{p.platform}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Platforms */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
        padding: '12px 14px', borderRadius: 12, background: 'var(--sell-bg)', border: '1px solid var(--sell-border)',
      }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--sell-text-2)' }}>Built for</span>
        {[
          { icon: Instagram, label: 'Instagram' },
          { icon: Video, label: 'TikTok / Reels' },
          { icon: MessageCircle, label: 'WhatsApp' },
        ].map(p => (
          <span key={p.label} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 650,
            padding: '6px 10px', borderRadius: 999, background: 'var(--sell-surface)', border: '1px solid var(--sell-border)',
            color: 'var(--sell-text-1)',
          }}>
            <p.icon size={14} /> {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}
