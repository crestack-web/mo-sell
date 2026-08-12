'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getDatabase } from '@/lib/database/adapter';
import { useSell } from '@/context/SellContext';
import { getStorePublicUrl } from '@/lib/store-url';
import styles from './SellAnalyticsPage.module.css';

export const dynamic = 'force-dynamic';

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrderData {
  id: string;
  orderNumber?: string;
  total: number;
  subtotal?: number;
  shippingCost?: number;
  paymentStatus: string;
  status: string;
  createdAt: Date;
  customerName?: string;
  customerEmail?: string;
  lineItems?: { productId?: string; displayName: string; quantity: number; lineTotal: number }[];
}

interface AnalyticsEvent {
  eventType: string;
  timestamp?: { seconds?: number; _seconds?: number } | null;
  createdAt?: string | null;
  pageType?: string | null;
  productId?: string | null;
  collectionId?: string | null;
}

interface DailyRevenue { label: string; amount: number; }
interface TopProduct   { name: string; units: number; revenue: number; share: number; views: number; conv: string; }
interface Insight      { tone: 'good' | 'warn' | 'info'; text: string; }

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number, currency = 'NGN') {
  const s = currency === 'NGN' ? '₦' : '$';
  if (n >= 1_000_000) return `${s}${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${s}${(n / 1_000).toFixed(1)}K`;
  return `${s}${Number.isInteger(n) ? n.toLocaleString() : n.toFixed(2)}`;
}

function pct(cur: number, prev: number): number | null {
  if (prev <= 0) return null;
  return ((cur - prev) / prev) * 100;
}

function eventDate(e: AnalyticsEvent): Date {
  if (e.timestamp && typeof e.timestamp === 'object' && 'seconds' in e.timestamp) {
    const secs = (e.timestamp as { seconds?: number }).seconds;
    if (secs) return new Date(secs * 1000);
  }
  const raw = (e.timestamp ?? e.createdAt) as unknown;
  if (raw) {
    const d = new Date(raw as string | number | Date);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function SellAnalyticsPage() {
  if (typeof window === 'undefined') {
    return null;
  }

  const { user, storeConfig, navigateTo, showToast } = useSell();
  const currency = storeConfig?.currency ?? 'NGN';

  const [orders, setOrders]   = useState<OrderData[]>([]);
  const [events, setEvents]   = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange]     = useState<'30d' | '90d' | '12m'>('30d');

  const load = useCallback(async () => {
    if (!user?.businessId) return;
    setLoading(true);
    try {
      const db = getDatabase();
      const biz = user.businessId;

      const ordersSnap = await db.collection(`businesses/${biz}/storeOrders`).limit(1000).get();
      const orderList = ordersSnap.docs.map(d => ({
        ...d.data(),
        id: d.id,
        createdAt: new Date(d.data().createdAt || Date.now()),
      })) as OrderData[];
      setOrders(orderList);

      const evSnap = await db.collection(`businesses/${biz}/storeAnalytics`).limit(1000).get();
      setEvents(evSnap.docs.map(d => d.data() as AnalyticsEvent));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user?.businessId]);

  useEffect(() => { load(); }, [load]);

  // ── Time windows ──────────────────────────────────────────────────────────
  const rangeMs = useMemo(() => {
    if (range === '30d') return 30 * 86400000;
    if (range === '90d') return 90 * 86400000;
    return 365 * 86400000;
  }, [range]);

  const now = useMemo(() => new Date(), []);

  const cutoff = useMemo(() => new Date(now.getTime() - rangeMs), [now, rangeMs]);
  const prevCutoff = useMemo(() => new Date(cutoff.getTime() - rangeMs), [cutoff, rangeMs]);

  const allOrders = useMemo(
    () => orders.filter(o => o.paymentStatus === 'paid'),
    [orders]
  );

  const rangeOrders = useMemo(
    () => allOrders.filter(o => o.createdAt >= cutoff),
    [allOrders, cutoff]
  );
  const prevOrders = useMemo(
    () => allOrders.filter(o => o.createdAt >= prevCutoff && o.createdAt < cutoff),
    [allOrders, prevCutoff, cutoff]
  );

  const eventsInRange = useMemo(
    () => events.filter(e => eventDate(e) >= cutoff),
    [events, cutoff]
  );

  // ── KPI metrics with period-over-period deltas ────────────────────────────
  const totalRevenue = rangeOrders.reduce((s, o) => s + (o.total ?? 0), 0);
  const totalOrders  = rangeOrders.length;
  const prevRevenue  = prevOrders.reduce((s, o) => s + (o.total ?? 0), 0);
  const prevOrdersCount = prevOrders.length;

  const aov    = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const prevAov = prevOrdersCount > 0 ? prevRevenue / prevOrdersCount : 0;

  const customersInRange = new Set(rangeOrders.map(o => (o.customerEmail ?? '').toLowerCase()).filter(Boolean)).size;
  const prevCustomers    = new Set(prevOrders.map(o => (o.customerEmail ?? '').toLowerCase()).filter(Boolean)).size;

  const revenueDelta   = pct(totalRevenue, prevRevenue);
  const ordersDelta    = pct(totalOrders, prevOrdersCount);
  const customersDelta = pct(customersInRange, prevCustomers);
  const aovDelta       = pct(aov, prevAov);

  // ── Funnel (range-aware) ──────────────────────────────────────────────────
  const pageViews       = eventsInRange.filter(e => e.eventType === 'page_view').length;
  const bioPageViews    = eventsInRange.filter(e => e.eventType === 'page_view' && e.pageType === 'bio').length;
  const storefrontViews = eventsInRange.filter(e => e.eventType === 'page_view' && e.pageType === 'home').length;
  const addToCart       = eventsInRange.filter(e => e.eventType === 'add_to_cart').length;
  const checkoutStarted = eventsInRange.filter(e => e.eventType === 'checkout_initiated').length;
  const funnelMax       = Math.max(pageViews, 1);

  const conversionRate   = checkoutStarted > 0 ? (totalOrders / checkoutStarted) * 100 : null;
  const storefrontConv   = pageViews > 0 ? (totalOrders / pageViews) * 100 : null;
  const bioConv          = bioPageViews > 0 ? (totalOrders / bioPageViews) * 100 : null;

  const funnelSteps = [
    { label: 'Page views',         count: pageViews,       color: '#0EA5E9' },
    { label: 'Add to cart',        count: addToCart,       color: '#6366F1' },
    { label: 'Checkout initiated', count: checkoutStarted, color: '#8B5CF6' },
    { label: 'Orders completed',   count: totalOrders,     color: '#16A34A' },
  ];

  // ── Product-level performance (units, revenue, views, conversion) ─────────
  const productViewsForProducts = useMemo(() => {
    const m: Record<string, number> = {};
    eventsInRange.forEach(e => {
      if (e.eventType === 'page_view' && e.pageType === 'product' && e.productId) {
        m[e.productId] = (m[e.productId] ?? 0) + 1;
      }
    });
    return m;
  }, [eventsInRange]);

  const totalProductViews = useMemo(() => {
    return Object.values(productViewsForProducts).reduce((sum, v) => sum + v, 0);
  }, [productViewsForProducts]);

  const topProducts = useMemo((): TopProduct[] => {
    const map: Record<string, TopProduct & { pid?: string }> = {};
    rangeOrders.forEach(o => {
      (o.lineItems ?? []).forEach(item => {
        const key = item.productId ?? item.displayName;
        if (!map[key]) map[key] = { name: item.displayName, pid: item.productId, units: 0, revenue: 0, share: 0, views: 0, conv: '—' };
        map[key].units   += item.quantity;
        map[key].revenue += item.lineTotal;
      });
    });
    return Object.values(map)
      .sort((a, b) => b.units - a.units)
      .slice(0, 6)
      .map(p => {
        const views = p.pid ? (productViewsForProducts[p.pid] ?? 0) : 0;
        return {
          name: p.name,
          units: p.units,
          revenue: p.revenue,
          share: totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0,
          views,
          conv: views > 0 ? `${((p.units / views) * 100).toFixed(1)}%` : '—',
        };
      });
  }, [rangeOrders, productViewsForProducts, totalRevenue]);

  // ── Weekday revenue ───────────────────────────────────────────────────────
  const weekdayData = useMemo(() => {
    const buckets = WEEKDAYS.map(() => 0);
    rangeOrders.forEach(o => { buckets[o.createdAt.getDay()] += o.total ?? 0; });
    return WEEKDAYS.map((label, i) => ({ label, amount: buckets[i] }));
  }, [rangeOrders]);
  const weekdayMax = Math.max(...weekdayData.map(d => d.amount), 1);

  // ── Customer breakdown (new vs returning, repeat rate) ────────────────────
  const firstOrderByEmail = useMemo(() => {
    const m: Record<string, Date> = {};
    allOrders.forEach(o => {
      const e = (o.customerEmail ?? '').trim().toLowerCase();
      if (e && (!m[e] || o.createdAt < m[e])) m[e] = o.createdAt;
    });
    return m;
  }, [allOrders]);

  const orderCountByEmail = useMemo(() => {
    const m: Record<string, number> = {};
    allOrders.forEach(o => {
      const e = (o.customerEmail ?? '').trim().toLowerCase();
      if (e) m[e] = (m[e] ?? 0) + 1;
    });
    return m;
  }, [allOrders]);

  const custStats = useMemo(() => {
    const emails = new Set<string>();
    let repeat = 0, fresh = 0, returning = 0;
    rangeOrders.forEach(o => {
      const e = (o.customerEmail ?? '').trim().toLowerCase();
      if (!e || emails.has(e)) return;
      emails.add(e);
      if ((orderCountByEmail[e] ?? 0) >= 2) repeat++;
      const first = firstOrderByEmail[e];
      if (first && first < cutoff) returning++; else fresh++;
    });
    return { total: emails.size, repeat, fresh, returning };
  }, [rangeOrders, orderCountByEmail, firstOrderByEmail, cutoff]);

  const repeatRate   = custStats.total > 0 ? Math.round((custStats.repeat / custStats.total) * 100) : 0;
  const newPct       = custStats.total > 0 ? Math.round((custStats.fresh / custStats.total) * 100) : 0;
  const returningPct = custStats.total > 0 ? Math.round((custStats.returning / custStats.total) * 100) : 0;
  const avgOrdersPerCust = custStats.total > 0 ? (totalOrders / custStats.total).toFixed(1) : '0';

  // ── Smart insights ────────────────────────────────────────────────────────
  const insights = useMemo((): Insight[] => {
    const out: Insight[] = [];

    if (totalRevenue > 0) {
      if (revenueDelta !== null) {
        const up = revenueDelta >= 0;
        out.push({
          tone: up ? 'good' : 'warn',
          text: `Revenue is ${up ? 'up' : 'down'} ${Math.abs(revenueDelta).toFixed(0)}% compared with the previous ${range} period.`,
        });
      } else {
        out.push({ tone: 'good', text: `You made your first paid sales in this ${range} window — keep the momentum going.` });
      }
    } else if (allOrders.length === 0) {
      out.push({ tone: 'info', text: 'No sales recorded yet. Share your store link to start seeing real insights here.' });
    } else if (rangeOrders.length === 0) {
      out.push({ tone: 'info', text: 'No sales in this period yet. Try promoting your store on social media or sending a newsletter.' });
    }

    if (conversionRate !== null) {
      if (conversionRate < 2) {
        out.push({ tone: 'warn', text: `Checkout conversion is ${conversionRate.toFixed(1)}% — most stores see 1–3%. Consider free shipping or a first-purchase discount.` });
      } else {
        out.push({ tone: 'good', text: `Checkout conversion of ${conversionRate.toFixed(1)}% is strong — above the typical 1–3% range.` });
      }
    }

    const abandoned = addToCart - totalOrders;
    if (addToCart > 0 && abandoned > 0) {
      const abRate = Math.round((abandoned / addToCart) * 100);
      if (abRate >= 60) {
        out.push({ tone: 'warn', text: `${abandoned} shoppers added to cart but didn't check out (${abRate}% cart abandonment). An exit discount could recover some of these.` });
      }
    }

    const top = topProducts[0];
    if (top && totalRevenue > 0 && top.share >= 60) {
      out.push({ tone: 'info', text: `"${top.name}" drives ${Math.round(top.share)}% of your revenue — a strong bestseller. Bundle it with other products to lift average order value.` });
    }

    const bestDay = weekdayData.reduce((a, b) => (b.amount > a.amount ? b : a), weekdayData[0]);
    if (bestDay && bestDay.amount > 0) {
      out.push({ tone: 'info', text: `${bestDay.label} is your best selling day. Time promos and new product drops around it.` });
    }

    if (custStats.total > 0) {
      if (repeatRate > 0) {
        out.push({ tone: 'good', text: `${repeatRate}% of customers bought from you more than once — repeat buyers are your most profitable audience.` });
      } else {
        out.push({ tone: 'info', text: 'No repeat customers yet. A follow-up email or loyalty offer can bring buyers back.' });
      }
    }

    return out.slice(0, 6);
  }, [totalRevenue, revenueDelta, range, allOrders.length, rangeOrders.length, conversionRate, addToCart, totalOrders, topProducts, weekdayData, custStats.total, repeatRate]);

  // ── Recent orders ─────────────────────────────────────────────────────────
  const recentOrders = useMemo(
    () => rangeOrders.slice().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 8),
    [rangeOrders]
  );

  // ── CSV export ────────────────────────────────────────────────────────────
  const exportCsv = useCallback(() => {
    const rows = [
      ['Order', 'Date', 'Customer', 'Email', 'Items', 'Subtotal', 'Shipping', 'Total', 'Status'],
      ...rangeOrders.slice().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).map(o => [
        o.orderNumber ?? o.id,
        o.createdAt.toLocaleDateString('en-GB'),
        o.customerName ?? '',
        o.customerEmail ?? '',
        String(o.lineItems?.length ?? 0),
        String(o.subtotal ?? ''),
        String(o.shippingCost ?? ''),
        String(o.total ?? 0),
        o.status ?? o.paymentStatus,
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Orders exported', 'success');
  }, [rangeOrders, showToast]);

  // ── Chart data ────────────────────────────────────────────────────────────
  const chartData = useMemo((): DailyRevenue[] => {
    if (range === '12m') {
      const buckets: Record<string, number> = {};
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        buckets[`${MONTHS[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`] = 0;
      }
      rangeOrders.forEach(o => {
        const key = `${MONTHS[o.createdAt.getMonth()]} ${o.createdAt.getFullYear().toString().slice(2)}`;
        if (key in buckets) buckets[key] = (buckets[key] ?? 0) + (o.total ?? 0);
      });
      return Object.entries(buckets).map(([label, amount]) => ({ label, amount }));
    }
    const days = range === '30d' ? 30 : 90;
    const buckets: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = `${d.getDate()}/${d.getMonth() + 1}`;
      buckets[key] = 0;
    }
    rangeOrders.forEach(o => {
      const key = `${o.createdAt.getDate()}/${o.createdAt.getMonth() + 1}`;
      if (key in buckets) buckets[key] = (buckets[key] ?? 0) + (o.total ?? 0);
    });
    const entries = Object.entries(buckets).map(([label, amount]) => ({ label, amount }));
    const step = range === '30d' ? 5 : 10;
    return entries.map((e, i) => ({ ...e, label: i % step === 0 ? e.label : '' }));
  }, [rangeOrders, range, now]);

  const chartMax = Math.max(...chartData.map(d => d.amount), 1);
  const chartDays = range === '30d' ? 30 : range === '90d' ? 90 : 12;
  const chartAvg = chartDays > 0 ? totalRevenue / chartDays : 0;
  const avgPx = chartMax > 0 ? (chartAvg / chartMax) * 180 : 0;

  const liveUrl = storeConfig?.storeSlug
    ? getStorePublicUrl(storeConfig.storeSlug, storeConfig.customDomain, storeConfig.customDomainStatus === 'verified')
    : null;

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}><div><h2 className={styles.heading}>Analytics</h2></div></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--sell-text-3)', fontSize: '0.875rem', padding: '40px 0' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
          Loading analytics…
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div><h2 className={styles.heading}>Analytics</h2><p className={styles.sub}>How your store is performing.</p></div>
        <div className={styles.headerActions}>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={exportCsv}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export CSV
          </button>
          <select className={styles.filterSelect} value={range} onChange={e => setRange(e.target.value as typeof range)}>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="12m">Last 12 months</option>
          </select>
        </div>
      </div>

      {/* Store URL card */}
      {liveUrl && (
        <div className={styles.urlCard}>
          <div className={styles.urlCardIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>
          </div>
          <div className={styles.urlCardBody}>
            <p className={styles.urlCardTitle}>Your store is live</p>
            <p className={styles.urlCardUrl}>{liveUrl}</p>
          </div>
          <div className={styles.urlCardActions}>
            <a href={`/${storeConfig?.storeSlug}`} target="_blank" rel="noopener noreferrer" className={`${styles.btn} ${styles.btnPrimary}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Link-in-bio
            </a>
            <a href={`/store/${storeConfig?.storeSlug}`} target="_blank" rel="noopener noreferrer" className={`${styles.btn} ${styles.btnSecondary}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3zM21 9H3M21 15H3M12 3v18"/></svg>
              Storefront
            </a>
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => navigateTo('settings')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06-.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
              Settings
            </button>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className={styles.kpiGrid}>
        {[
          { label: 'Revenue', value: fmt(totalRevenue, currency), sub: `${range} · paid orders`, delta: revenueDelta,
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
            bg: 'var(--sell-primary-lt)', color: 'var(--sell-primary)' },
          { label: 'Orders', value: String(totalOrders), sub: 'Completed & paid', delta: ordersDelta,
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
            bg: 'var(--sell-amber-bg)', color: 'var(--sell-amber)' },
          { label: 'Customers', value: String(customersInRange), sub: 'Unique in period', delta: customersDelta,
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
            bg: 'var(--sell-teal-bg)', color: 'var(--sell-teal)' },
          { label: 'Avg order value', value: fmt(aov, currency), sub: 'Per paid order', delta: aovDelta,
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
            bg: 'var(--sell-purple-bg)', color: 'var(--sell-purple)' },
          { label: 'Conversion', value: conversionRate === null ? '—' : `${conversionRate.toFixed(1)}%`, sub: 'Checkout → order', delta: null,
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
            bg: 'var(--sell-green-bg)', color: 'var(--sell-green)' },
          { label: 'Link-in-bio views', value: String(bioPageViews), sub: 'Bio page visits', delta: null,
            icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
            bg: 'var(--sell-blue-bg)', color: 'var(--sell-primary)' },
        ].map(k => (
          <div key={k.label} className={styles.kpiCard}>
            <div className={styles.kpiIcon} style={{ background: k.bg, color: k.color }}>{k.icon}</div>
            <div className={styles.kpiBody}>
              <p className={styles.kpiLabel}>{k.label}</p>
              <p className={styles.kpiValue}>{k.value}</p>
              <p className={styles.kpiSub}>{k.sub}</p>
              {k.delta !== null && k.delta !== undefined && (
                <p className={k.delta >= 0 ? styles.kpiUp : styles.kpiDown}>
                  {k.delta >= 0 ? '▲' : '▼'} {Math.abs(k.delta).toFixed(1)}% vs prev {range}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <p className={styles.chartTitle}>Revenue — {range === '30d' ? 'last 30 days' : range === '90d' ? 'last 90 days' : 'last 12 months'}</p>
          {totalRevenue > 0 && <p className={styles.chartHint}>Avg {fmt(chartAvg, currency)}/day</p>}
        </div>
        {totalRevenue === 0 ? (
          <div className={styles.emptyChart}>
            <img className={styles.emptyImg} src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1786280717/Untitled_-_August_08_2026_at_11.22.19_qtubsr.png" alt="No revenue data" />
            <p>No revenue data for this period yet</p>
          </div>
        ) : (
          <div className={styles.chartWrap}>
            {chartAvg > 0 && avgPx > 0 && (
              <>
                <div className={styles.chartAvgLine} style={{ bottom: `${4 + avgPx}px` }} />
                <span className={styles.chartAvgLabel} style={{ bottom: `${4 + avgPx}px` }}>avg</span>
              </>
            )}
            <div className={styles.chartArea}>
              {chartData.map((d, i) => (
                <div key={i} className={styles.chartBarWrap}>
                  <div
                    className={`${styles.chartBar}${d.amount === chartMax && chartMax > 0 ? ' ' + styles.chartBarTop : ''}`}
                    style={{ height: `${Math.max((d.amount / chartMax) * 180, 4)}px` }}
                    title={d.amount > 0 ? fmt(d.amount, currency) : ''}
                  />
                  <span className={styles.chartBarLabel}>{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Smart insights */}
      {insights.length > 0 && (
        <div className={styles.insightCard}>
          <div className={styles.insightHeader}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 00-4 12.7c.6.5 1 1.2 1 2h6c0-.8.4-1.5 1-2A7 7 0 0012 2z"/></svg>
            Smart insights
          </div>
          <div className={styles.insightList}>
            {insights.map((ins, i) => (
              <div key={i} className={`${styles.insightItem} ${styles['tone-' + ins.tone]}`}>
                <span className={styles.insightDot} />
                <span className={styles.insightText}>{ins.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Funnel + Top products */}
      <div className={styles.twoCol}>
        {/* Funnel */}
        <div className={styles.funnelCard}>
          <p className={styles.funnelTitle}>Conversion funnel</p>
          {pageViews === 0 ? (
            <div style={{ color: 'var(--sell-text-3)', fontSize: '0.85rem', padding: '20px 0', textAlign: 'center' }}>No storefront activity recorded yet</div>
          ) : (
            <>
              {funnelSteps.map((step, i) => {
                const pctVal = i === 0 ? null : funnelSteps[i - 1].count > 0 ? (step.count / funnelSteps[i - 1].count) * 100 : null;
                return (
                  <div key={step.label} className={styles.funnelStep}>
                    <div className={styles.funnelBar} style={{ background: step.color, width: `${Math.max((step.count / funnelMax) * 100, 8)}%`, minWidth: 0 }}>
                      {step.count > 0 && step.count}
                    </div>
                    <span className={styles.funnelMeta}>{step.label}</span>
                    <span className={styles.funnelDrop}>{pctVal === null ? '—' : `${pctVal.toFixed(0)}%`}</span>
                  </div>
                );
              })}
              {storefrontConv !== null && (
                <div className={styles.funnelFooter}>
                  Overall storefront conversion: <strong>{storefrontConv.toFixed(2)}%</strong> of visitors placed an order
                </div>
              )}
            </>
          )}
        </div>

        {/* Link-in-bio metrics */}
        <div className={styles.funnelCard}>
          <p className={styles.funnelTitle}>Link-in-bio performance</p>
          {bioPageViews === 0 && storefrontViews === 0 ? (
            <div style={{ color: 'var(--sell-text-3)', fontSize: '0.85rem', padding: '20px 0', textAlign: 'center' }}>No link-in-bio activity recorded yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--sell-border)' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--sell-text-1)' }}>Bio page views</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--sell-text-3)' }}>Link-in-bio page visits</p>
                </div>
                <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--sell-primary)' }}>{bioPageViews}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--sell-border)' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--sell-text-1)' }}>Storefront views</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--sell-text-3)' }}>E-commerce storefront visits</p>
                </div>
                <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--sell-amber)' }}>{storefrontViews}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--sell-border)' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--sell-text-1)' }}>Product views</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--sell-text-3)' }}>Individual product page visits</p>
                </div>
                <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--sell-teal)' }}>{totalProductViews}</p>
              </div>
              {bioConv !== null && (
                <div style={{ padding: '12px 0', background: 'var(--sell-primary-lt)', borderRadius: 8, marginTop: 8 }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--sell-text-2)' }}>
                    Link-in-bio conversion: <strong>{bioConv.toFixed(2)}%</strong> of bio visitors placed an order
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top products */}
        <div className={styles.topCard}>
          <p className={styles.topCardTitle}>Top products</p>
          {topProducts.length === 0 ? (
            <div style={{ color: 'var(--sell-text-3)', fontSize: '0.85rem', padding: '20px 16px' }}>No product sales in this period</div>
          ) : (
            <table className={styles.topTable}>
              <thead><tr><th>#</th><th>Product</th><th>Units</th><th>Revenue</th><th>Views</th><th>Conv.</th></tr></thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={p.name}>
                    <td><span className={styles.rank}>{i + 1}</span></td>
                    <td>
                      <span className={styles.topProductName}>{p.name}</span>
                      {i === 0 && <span className={styles.topBadge}>Top</span>}
                      <div className={styles.topShare}>{Math.round(p.share)}% of revenue</div>
                      <div className={styles.bar} style={{ width: `${p.share}%`, marginTop: 4 }} />
                    </td>
                    <td style={{ fontWeight: 600 }}>{p.units}</td>
                    <td style={{ fontWeight: 700 }}>{fmt(p.revenue, currency)}</td>
                    <td>{p.views > 0 ? p.views : '—'}</td>
                    <td>{p.conv}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Weekday + Customers */}
      <div className={styles.twoCol}>
        {/* Weekday sales */}
        <div className={styles.funnelCard}>
          <p className={styles.funnelTitle}>Sales by day of week</p>
          {weekdayMax <= 1 ? (
            <div style={{ color: 'var(--sell-text-3)', fontSize: '0.85rem', padding: '20px 0', textAlign: 'center' }}>No sales to break down yet</div>
          ) : (
            weekdayData.map(d => (
              <div key={d.label} className={styles.dayRow}>
                <span className={styles.dayLabel}>{d.label}</span>
                <div className={styles.dayTrack}>
                  <div className={styles.dayBar} style={{ width: `${(d.amount / weekdayMax) * 100}%` }} />
                </div>
                <span className={styles.dayAmount}>{d.amount > 0 ? fmt(d.amount, currency) : '—'}</span>
              </div>
            ))
          )}
        </div>

        {/* Customer breakdown */}
        <div className={styles.funnelCard}>
          <p className={styles.funnelTitle}>Customer breakdown</p>
          {custStats.total === 0 ? (
            <div style={{ color: 'var(--sell-text-3)', fontSize: '0.85rem', padding: '20px 0', textAlign: 'center' }}>No customers in this period yet</div>
          ) : (
            <>
              <div className={styles.custBar}>
                <div className={styles.custBarNew} style={{ width: `${newPct}%` }} />
                <div className={styles.custBarRet} style={{ width: `${returningPct}%` }} />
              </div>
              <div className={styles.custLegend}>
                <span><i className={styles.dotNew} /> New ({custStats.fresh})</span>
                <span><i className={styles.dotRet} /> Returning ({custStats.returning})</span>
              </div>
              <div className={styles.custStats}>
                <div>
                  <p className={styles.custStatLabel}>Repeat buyers</p>
                  <p className={styles.custStatValue}>{repeatRate}%</p>
                </div>
                <div>
                  <p className={styles.custStatLabel}>Avg orders / customer</p>
                  <p className={styles.custStatValue}>{avgOrdersPerCust}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className={styles.topCard}>
        <p className={styles.topCardTitle}>Recent orders</p>
        {recentOrders.length === 0 ? (
          <div style={{ color: 'var(--sell-text-3)', fontSize: '0.85rem', padding: '20px 16px' }}>No orders in this period</div>
        ) : (
          <table className={styles.topTable}>
            <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {recentOrders.map(o => (
                <tr key={o.id}>
                  <td className={styles.orderNum}>{o.orderNumber ?? o.id.slice(0, 8)}</td>
                  <td>{o.customerName || o.customerEmail || '—'}</td>
                  <td>{o.lineItems?.length ?? 0}</td>
                  <td className={styles.orderTotal}>{fmt(o.total, currency)}</td>
                  <td><span className={`${styles.statusChip} ${styles.statusPaid}`}>{o.status ?? o.paymentStatus}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
