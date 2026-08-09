'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSell } from '@/context/SellContext';
import styles from './SellCustomersPage.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  tags: string[];
  lastActive: Date;
}

type FilterKey = 'all' | 'buyers' | 'subscribers' | 'bookings' | 'repeat' | 'newsletter';

interface FilterDef {
  key: FilterKey;
  label: string;
  match: (c: Customer) => boolean;
}

const FILTERS: FilterDef[] = [
  { key: 'all',         label: 'All',          match: () => true },
  { key: 'buyers',      label: 'Buyers',       match: c => c.tags.includes('buyer') },
  { key: 'subscribers', label: 'Subscribers',  match: c => c.tags.includes('subscriber') },
  { key: 'bookings',    label: 'Bookings',     match: c => c.tags.includes('booking') },
  { key: 'repeat',      label: 'Repeat',       match: c => c.totalOrders > 1 },
  { key: 'newsletter',  label: 'Newsletter',    match: c => c.tags.includes('subscriber') },
];

function fmt(n: number, currency = 'NGN') {
  const s = currency === 'NGN' ? '₦' : '$';
  return `${s}${n.toLocaleString()}`;
}

function fmtRelative(d: Date): string {
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function SellCustomersPage() {
  const { user, storeConfig, showToast } = useSell();
  const currency = storeConfig?.currency ?? 'NGN';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const load = useCallback(async () => {
    if (!user?.businessId) return;
    try {
      const res = await fetch(`/api/store/customers?businessId=${user.businessId}`);
      if (!res.ok) throw new Error('Failed to fetch customers');
      const data = await res.json();
      const items: Customer[] = (data.customers ?? data ?? []).map((c: Record<string, unknown>) => ({
        id: (c.id as string) ?? '',
        name: (c.name as string) ?? '',
        email: (c.email as string) ?? '',
        phone: (c.phone as string) ?? '',
        totalOrders: (c.totalOrders as number) ?? 0,
        totalSpent: (c.totalSpent as number) ?? 0,
        tags: (c.tags as string[]) ?? [],
        lastActive: c.lastActive ? new Date(c.lastActive as string | number) : new Date(),
      }));
      items.sort((a, b) => b.lastActive.getTime() - a.lastActive.getTime());
      setCustomers(items);
    } catch (e) {
      console.error(e);
      showToast('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.businessId, showToast]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const filterDef = FILTERS.find(f => f.key === activeFilter) ?? FILTERS[0];
    const q = search.toLowerCase();
    return customers.filter(c => {
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
      return matchSearch && filterDef.match(c);
    });
  }, [customers, search, activeFilter]);

  const counts = useMemo(() => {
    const map: Record<FilterKey, number> = { all: 0, buyers: 0, subscribers: 0, bookings: 0, repeat: 0, newsletter: 0 };
    for (const c of customers) {
      for (const f of FILTERS) {
        if (f.key !== 'all' && f.match(c)) map[f.key]++;
      }
    }
    map.all = customers.length;
    return map;
  }, [customers]);

  // Summary stats
  const totalCustomers = customers.length;
  const totalSubscribers = customers.filter(c => c.tags.includes('subscriber')).length;
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const totalOrders = customers.reduce((s, c) => s + c.totalOrders, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.heading}>Customers</h2>
          <p className={styles.sub}>View and manage everyone who has engaged with your store.</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Total Customers</p>
          <p className={styles.summaryValue}>{totalCustomers}</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Newsletter Members</p>
          <p className={styles.summaryValue}>{totalSubscribers}</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Total Revenue</p>
          <p className={styles.summaryValue}>{fmt(totalRevenue, currency)}</p>
        </div>
        <div className={styles.summaryCard}>
          <p className={styles.summaryLabel}>Avg Order Value</p>
          <p className={styles.summaryValue}>{fmt(avgOrderValue, currency)}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            className={styles.searchInput}
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filterRow}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              className={`${styles.chip} ${activeFilter === f.key ? styles.chipActive : ''}`}
              onClick={() => setActiveFilter(f.key)}
            >
              {f.label}
              <span className={styles.chipCount}>{counts[f.key]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        {loading ? (
          <div className={styles.emptyState}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--sell-text-3)', fontSize: '0.875rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
              Loading customers…
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <img className={styles.emptyImg} src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1786280720/Untitled_-_August_08_2026_at_11.22.19_smrxuk.png" alt="No customers" />
            <p className={styles.emptyTitle}>{customers.length === 0 ? 'No customers yet' : 'No results'}</p>
            <p className={styles.emptySub}>
              {customers.length === 0
                ? "No customers yet. They'll appear here once people place orders or sign up."
                : 'Try clearing your filters or search.'}
            </p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Tags</th>
                <th>Total Orders</th>
                <th>Total Spent</th>
                <th>Last Active</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td><p className={styles.customerName}>{c.name}</p></td>
                  <td><p className={styles.customerEmail}>{c.email || '—'}</p></td>
                  <td><span style={{ fontSize: '0.82rem', color: 'var(--sell-text-2)' }}>{c.phone || '—'}</span></td>
                  <td>
                    <div className={styles.tagsCell}>
                      {c.tags.map(t => (
                        <span
                          key={t}
                          className={`${styles.tag} ${
                            t === 'buyer' ? styles.tagBuyer
                            : t === 'subscriber' ? styles.tagSubscriber
                            : t === 'booking' ? styles.tagBooking
                            : t === 'repeat' ? styles.tagRepeat
                            : ''
                          }`}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td><span className={styles.numCell}>{c.totalOrders}</span></td>
                  <td><span className={styles.numCell}>{fmt(c.totalSpent, currency)}</span></td>
                  <td><span className={styles.lastActive}>{fmtRelative(c.lastActive)}</span></td>
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
