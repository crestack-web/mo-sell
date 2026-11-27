'use client';

import React, { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase-client';
import styles from '../orders/SellOrdersPage.module.css';

type CampaignOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  createdAt: string | null;
  status: 'demo';
  paymentStatus: 'demo';
  lineItems: { productId: string; displayName: string; quantity: number; unitPrice: number; lineTotal: number }[];
  isDemo: true;
};

type CampaignResponse = {
  productName: string;
  orders: CampaignOrder[];
  metrics: { orderCount: number; simulatedVolume: number; averageOrderValue: number };
  financialMeaning: string;
};

const STORAGE_KEY = 'moSellCampaignPreview:follower-to-founder-video';

function formatNgn(value: number) {
  return `₦${Number(value || 0).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
}

function dateLabel(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function CampaignPreviewPage() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [campaign, setCampaign] = useState<CampaignResponse | null>(null);

  useEffect(() => {
    setEnabled(window.localStorage.getItem(STORAGE_KEY) === 'true');
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    if (!enabled) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data: sessionData } = await supabaseClient.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) throw new Error('Please sign in again to view the campaign preview.');
        const response = await fetch('/api/dashboard/campaign-preview', {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: 'no-store',
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Campaign preview could not be loaded.');
        if (!cancelled) setCampaign(body as CampaignResponse);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Campaign preview could not be loaded.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [enabled]);

  const metrics = campaign?.metrics ?? { orderCount: 0, simulatedVolume: 0, averageOrderValue: 0 };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.heading}>Campaign preview</h2>
          <p className={styles.sub}>Separate, read-only preview for follower-to-founder-video. This is not your real order history.</p>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.875rem', fontWeight: 700 }}>
          <input
            type="checkbox"
            role="switch"
            aria-label="Show campaign preview"
            checked={enabled}
            onChange={event => setEnabled(event.target.checked)}
          />
          Show campaign preview
        </label>
      </div>

      {enabled && (
        <>
          <div role="note" aria-live="polite" style={{ padding: 14, borderRadius: 10, border: '2px solid #b45309', background: '#fffbeb', color: '#78350f' }}>
            <strong>CAMPAIGN DEMO — NOT REAL SALES</strong>
            <div style={{ marginTop: 4 }}>All amounts below are simulated sales volume. No payments were verified; these figures are not revenue, earnings, or settlement data.</div>
          </div>

          {error && <div role="alert" className={styles.emptySub}>{error}</div>}
          {loading && <div className={styles.emptySub}>Loading campaign preview…</div>}

          {!loading && !error && (
            <>
              <div className={styles.statStrip}>
                <div className={styles.statCard}><p className={styles.statLabel}>Campaign orders</p><p className={styles.statValue}>{metrics.orderCount}</p><p className={styles.statSub}>Demo records only</p></div>
                <div className={styles.statCard}><p className={styles.statLabel}>Simulated sales volume</p><p className={styles.statValue}>{formatNgn(metrics.simulatedVolume)}</p><p className={styles.statSub}>Not actual revenue</p></div>
                <div className={styles.statCard}><p className={styles.statLabel}>Average order value</p><p className={styles.statValue}>{formatNgn(metrics.averageOrderValue)}</p><p className={styles.statSub}>Simulated campaign average</p></div>
              </div>

              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Campaign order</th><th>Customer</th><th>Product</th><th>Amount</th><th>Record type</th></tr></thead>
                  <tbody>
                    {campaign?.orders.map(order => (
                      <tr key={order.id}>
                        <td><p className={styles.orderNum}>{order.orderNumber || order.id}</p><p className={styles.orderDate}>{dateLabel(order.createdAt)}</p></td>
                        <td><p className={styles.customer}>{order.customerName}</p></td>
                        <td>
                          {order.lineItems.map((item, index) => <p key={`${order.id}-${index}`} className={styles.customer}>{item.displayName}</p>)}
                        </td>
                        <td><span className={styles.total}>{formatNgn(order.total)}</span></td>
                        <td><span className={styles.badge} style={{ background: '#fef3c7', color: '#92400e' }}>DEMO — NOT PAID</span></td>
                      </tr>
                    ))}
                    {campaign?.orders.length === 0 && <tr><td colSpan={5}>No campaign records found. Removing records from the campaign table removes them from this preview on the next load.</td></tr>}
                  </tbody>
                </table>
              </div>
              <p className={styles.sub}>{campaign?.productName} · {campaign?.financialMeaning}</p>
            </>
          )}
        </>
      )}

      {!enabled && <div className={styles.emptySub}>Campaign preview is off. Turn it on to view campaign-only records and simulated metrics.</div>}
    </div>
  );
}
