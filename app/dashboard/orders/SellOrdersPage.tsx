'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getDatabase } from '@/lib/database/adapter';
import { useSell } from '@/context/SellContext';
import styles from './SellOrdersPage.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

interface OrderLineItem {
  productId?: string;
  productType?: string;
  displayName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface StatusEntry {
  status: string;
  timestamp?: string | { seconds?: number } | null;
  changedBy?: string;
}

interface StoreOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryOption: 'delivery' | 'pickup';
  shippingAddress: string | null;
  shippingCost: number;
  lineItems: OrderLineItem[];
  subtotal: number;
  total: number;
  paystackReference: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  trackingNumber: string | null;
  carrier: string | null;
  statusHistory: StatusEntry[];
  customerEmailStatus?: string;
  customerEmailSentAt?: string | null;
  downloads?: { productId?: string; productName?: string; downloadedAt?: string; email?: string }[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

// ─── Constants & helpers ──────────────────────────────────────────────────────

const PIPELINE: OrderStatus[] = ['processing', 'shipped', 'delivered'];

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending payment',
  paid: 'Paid',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

const STATUS_COLOR: Record<string, string> = {
  pending_payment: 'statusPending',
  paid: 'statusPaid',
  processing: 'statusProcessing',
  shipped: 'statusShipped',
  delivered: 'statusDelivered',
  cancelled: 'statusCancelled',
  refunded: 'statusRefunded',
};

const PAY_COLOR: Record<string, string> = {
  paid: 'payPaid',
  pending: 'payPending',
  failed: 'payFailed',
  refunded: 'payRefunded',
};

function statusClass(s: string): string {
  return styles[STATUS_COLOR[s] ?? 'statusPending'] ?? '';
}
function payClass(s: string): string {
  return styles[PAY_COLOR[s] ?? 'payPending'] ?? '';
}

/**
 * Digital-only orders are fulfilled the moment the customer checks out:
 * the files are delivered instantly via email and download links. So we
 * surface them as "Delivered" instead of leaving the merchant with an
 * order that looks like it still needs manual processing.
 */
function effectiveStatus(order: StoreOrder): OrderStatus {
  const items = order.lineItems ?? [];
  const allDigital = items.length > 0 && items.every(i => i.productType === 'digital');
  if (allDigital && (order.status === 'paid' || order.status === 'processing')) return 'delivered';
  return order.status;
}

function isDigitalOrder(order: StoreOrder): boolean {
  const items = order.lineItems ?? [];
  return items.length > 0 && items.every(i => i.productType === 'digital');
}

function fmt(n?: number, currency = 'NGN') {
  const s = currency === 'NGN' ? '₦' : '$';
  return `${s}${(n ?? 0).toLocaleString()}`;
}

function fmtDate(v?: string | null) {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(v?: string | { seconds?: number } | null) {
  if (!v) return '—';
  const d = typeof v === 'object' ? new Date((v.seconds ?? 0) * 1000) : new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function itemFulfillment(item: OrderLineItem, order: StoreOrder): { label: string; tone: 'done' | 'progress' | 'todo' | 'muted' } {
  if (item.productType === 'digital') return { label: 'Delivered instantly', tone: 'done' };
  const eff = effectiveStatus(order);
  switch (eff) {
    case 'delivered': return { label: 'Delivered', tone: 'done' };
    case 'shipped':   return { label: 'Shipped', tone: 'progress' };
    case 'processing':return { label: 'Processing', tone: 'progress' };
    case 'paid':      return { label: 'Not started', tone: 'todo' };
    case 'cancelled': return { label: 'Cancelled', tone: 'muted' };
    case 'refunded':  return { label: 'Refunded', tone: 'muted' };
    default:          return { label: STATUS_LABELS[eff] ?? eff, tone: 'todo' };
  }
}

// ─── Order detail slide-over ──────────────────────────────────────────────────

interface OrderSlideOverProps {
  order: StoreOrder;
  currency: string;
  userId: string;
  onClose: () => void;
  onUpdated: () => void;
}

function OrderSlideOver({ order, currency, userId, onClose, onUpdated }: OrderSlideOverProps) {
  const { showToast } = useSell();
  const [busy, setBusy] = useState(false);
  const [trackingNum, setTrackingNum] = useState(order.trackingNumber ?? '');
  const [carrier, setCarrier] = useState(order.carrier ?? '');
  const [showTracking, setShowTracking] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  const items = order.lineItems ?? [];
  const physicalItems = items.filter(i => i.productType === 'physical');
  const digitalItems = items.filter(i => i.productType === 'digital');
  const serviceItems = items.filter(i => i.productType === 'service');
  const allDigital = items.length > 0 && physicalItems.length === 0 && serviceItems.length === 0;
  const eff = effectiveStatus(order);
  const pipelineIndex = PIPELINE.indexOf(eff);

  const writeStatus = useCallback(async (next: OrderStatus, extra?: Record<string, unknown>) => {
    const db = getDatabase();
    const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
    await db.doc(`storeOrders/${order.id}`).set({
      status: next,
      statusHistory: [
        ...history,
        { status: next, timestamp: new Date().toISOString(), changedBy: userId || 'merchant' },
      ],
      updatedAt: new Date().toISOString(),
      ...extra,
    }, { merge: true });
  }, [order.id, order.statusHistory, userId]);

  const advance = useCallback(async () => {
    const next = PIPELINE[pipelineIndex + 1];
    if (!next) return;
    if (next === 'shipped') { setShowTracking(true); return; }
    setBusy(true);
    try {
      await writeStatus(next);
      showToast(`Order marked as ${STATUS_LABELS[next]}`, 'success');
      onUpdated();
    } catch {
      showToast('Failed to update order', 'error');
    } finally {
      setBusy(false);
    }
  }, [pipelineIndex, writeStatus, showToast, onUpdated]);

  const saveTracking = useCallback(async () => {
    setBusy(true);
    try {
      await writeStatus('shipped', {
        trackingNumber: trackingNum || null,
        carrier: carrier || null,
      });
      showToast('Order marked as shipped', 'success');
      setShowTracking(false);
      onUpdated();
    } catch {
      showToast('Failed to update order', 'error');
    } finally {
      setBusy(false);
    }
  }, [trackingNum, carrier, writeStatus, showToast, onUpdated]);

  const cancelOrder = useCallback(async () => {
    setBusy(true);
    try {
      await writeStatus('cancelled');
      showToast('Order cancelled', 'info');
      setShowCancel(false);
      onUpdated();
    } catch {
      showToast('Failed to cancel order', 'error');
    } finally {
      setBusy(false);
    }
  }, [writeStatus, showToast, onUpdated]);

  const nextStatus = PIPELINE[pipelineIndex + 1];
  const canAdvance = !!nextStatus && order.status !== 'cancelled' && order.status !== 'refunded';
  const canCancel = (order.status === 'paid' || order.status === 'processing');

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.slideover}>
        {/* Header */}
        <div className={styles.slideoverHeader}>
          <div>
            <p className={styles.slideoverTitle}>{order.orderNumber}</p>
            <p className={styles.slideoverSub}>{fmtDateTime(order.createdAt)} · {order.customerName}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className={styles.slideoverBody}>
          {/* ── Fulfillment ── */}
          <div>
            <p className={styles.sectionLabel}>Fulfillment</p>

            {allDigital ? (
              <div className={styles.fulfillDone}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                <div>
                  <p className={styles.fulfillDoneTitle}>Fulfilled automatically</p>
                  <p className={styles.fulfillDoneSub}>
                    This is a digital order — the file was delivered instantly via email and download links. No action needed.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.pipeline} style={{ marginBottom: 12 }}>
                  {PIPELINE.map((step, i) => {
                    const isDone = pipelineIndex > i || eff === 'delivered';
                    const isActive = pipelineIndex === i;
                    return (
                      <div key={step} className={styles.pipelineStep}>
                        <div className={[styles.pipelineDot, isDone ? styles.pipelineDotDone : isActive ? styles.pipelineDotActive : ''].join(' ')}>
                          {isDone && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                          )}
                        </div>
                        <span className={[styles.pipelineLabel, isDone ? styles.pipelineLabelDone : isActive ? styles.pipelineLabelActive : ''].join(' ')}>
                          {STATUS_LABELS[step]}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Per-item fulfillment */}
                <div className={styles.fulfillList}>
                  {items.map((item, i) => {
                    const f = itemFulfillment(item, order);
                    return (
                      <div key={i} className={styles.fulfillRow}>
                        <span className={`${styles.typeBadge} ${item.productType === 'digital' ? styles.typeDigital : item.productType === 'service' ? styles.typeService : styles.typePhysical}`}>
                          {item.productType}
                        </span>
                        <span className={styles.fulfillRowName}>{item.displayName}</span>
                        <span className={`${styles.fulfillRowState} ${f.tone === 'done' ? styles.fulfillStateDone : f.tone === 'progress' ? styles.fulfillStateProgress : f.tone === 'muted' ? styles.fulfillStateMuted : ''}`}>
                          {f.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                {(canAdvance || canCancel) && !showTracking && !showCancel && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                    {canAdvance && (
                      <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={advance} disabled={busy}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                        Mark as {STATUS_LABELS[nextStatus]}
                      </button>
                    )}
                    {canCancel && (
                      <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => setShowCancel(true)} disabled={busy}>
                        Cancel order
                      </button>
                    )}
                  </div>
                )}

                {/* Tracking entry */}
                {showTracking && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 14, background: 'var(--sell-surface-2)', borderRadius: 'var(--sell-radius-sm)', border: '1px solid var(--sell-border)', marginTop: 12 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--sell-text-1)' }}>Enter tracking details (optional)</p>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Tracking number</label>
                      <input className={styles.formInput} placeholder="e.g. GIG123456789" value={trackingNum} onChange={e => setTrackingNum(e.target.value)} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Carrier</label>
                      <input className={styles.formInput} placeholder="e.g. GIG Logistics, DHL" value={carrier} onChange={e => setCarrier(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={saveTracking} disabled={busy}>Confirm shipment</button>
                      <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setShowTracking(false)}>Back</button>
                    </div>
                  </div>
                )}

                {/* Cancel confirm */}
                {showCancel && (
                  <div className={styles.confirmBox} style={{ marginTop: 12 }}>
                    <p className={styles.confirmTitle}>Cancel this order?</p>
                    <p className={styles.confirmSub}>This cannot be undone. The order status will be set to Cancelled.</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className={`${styles.btn} ${styles.btnDanger}`} onClick={cancelOrder} disabled={busy}>Yes, cancel</button>
                      <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setShowCancel(false)}>Go back</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Items ── */}
          <div>
            <p className={styles.sectionLabel}>Items</p>
            {items.map((item, i) => (
              <div key={i} className={styles.lineItem}>
                <span className={`${styles.typeBadge} ${item.productType === 'digital' ? styles.typeDigital : item.productType === 'service' ? styles.typeService : styles.typePhysical}`}>
                  {item.productType}
                </span>
                <span className={styles.lineItemName}>{item.displayName}</span>
                <span className={styles.lineItemQty}>× {item.quantity}</span>
                <span className={styles.lineItemPrice}>{fmt(item.lineTotal, currency)}</span>
              </div>
            ))}
            <div className={styles.totalsBox} style={{ marginTop: 10 }}>
              <div className={styles.totalRow}><span>Subtotal</span><span>{fmt(order.subtotal, currency)}</span></div>
              {order.shippingCost > 0 && <div className={styles.totalRow}><span>Shipping</span><span>{fmt(order.shippingCost, currency)}</span></div>}
              <div className={[styles.totalRow, styles.totalRowBold].join(' ')}><span>Total</span><span>{fmt(order.total, currency)}</span></div>
            </div>
          </div>

          {/* ── Customer & delivery ── */}
          <div>
            <p className={styles.sectionLabel}>Customer & delivery</p>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}><p className={styles.infoKey}>Name</p><p className={styles.infoVal}>{order.customerName}</p></div>
              <div className={styles.infoItem}><p className={styles.infoKey}>Email</p><p className={styles.infoVal}>{order.customerEmail}</p></div>
              <div className={styles.infoItem}><p className={styles.infoKey}>Phone</p><p className={styles.infoVal}>{order.customerPhone || '—'}</p></div>
              <div className={styles.infoItem}><p className={styles.infoKey}>Delivery</p><p className={styles.infoVal}>{order.deliveryOption}</p></div>
              {order.shippingAddress && (
                <div className={styles.infoItem} style={{ gridColumn: '1/-1' }}>
                  <p className={styles.infoKey}>Address</p><p className={styles.infoVal}>{order.shippingAddress}</p>
                </div>
              )}
              {(order.trackingNumber || order.carrier) && (
                <div className={styles.infoItem}>
                  <p className={styles.infoKey}>Tracking</p>
                  <p className={styles.infoVal}>{order.trackingNumber || '—'} {order.carrier ? `(${order.carrier})` : ''}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Digital delivery ── */}
          {digitalItems.length > 0 && (
            <div>
              <p className={styles.sectionLabel}>Digital delivery</p>
              <div className={styles.dlRow}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--sell-green)" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                <div>
                  <p className={styles.dlRowTitle}>Download links sent to customer</p>
                  <p className={styles.dlRowSub}>
                    {order.customerEmailStatus === 'sent'
                      ? 'Confirmation email delivered with download links.'
                      : order.customerEmailStatus === 'stub'
                        ? 'Email provider not configured — links are still available on the order page.'
                        : order.customerEmailStatus === 'failed'
                          ? 'Delivery email failed to send — follow up with the customer.'
                          : 'Confirmation email sent at checkout.'}
                  </p>
                </div>
              </div>

              {(order.downloads ?? []).length > 0 && (
                <div className={styles.dlList}>
                  {(order.downloads ?? []).map((d, i) => (
                    <div key={i} className={styles.dlItem}>
                      <span className={styles.dlItemName}>{d.productName || 'File'}</span>
                      <span className={styles.dlItemTime}>Downloaded {fmtDateTime(d.downloadedAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Payment ── */}
          <div>
            <p className={styles.sectionLabel}>Payment</p>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <p className={styles.infoKey}>Status</p>
                <span className={`${styles.badge} ${payClass(order.paymentStatus)}`}><span className={styles.badgeDot} />{order.paymentStatus}</span>
              </div>
              <div className={styles.infoItem}>
                <p className={styles.infoKey}>Reference</p>
                <p className={styles.infoVal} style={{ fontFamily: 'monospace', fontSize: '0.78rem', wordBreak: 'break-all' }}>{order.paystackReference || '—'}</p>
              </div>
            </div>
          </div>

          {/* ── History ── */}
          {(order.statusHistory?.length ?? 0) > 0 && (
            <div>
              <p className={styles.sectionLabel}>History</p>
              <div className={styles.timeline}>
                {[...order.statusHistory].reverse().map((entry, i) => (
                  <div key={i} className={styles.timelineItem}>
                    <div className={styles.timelineDot}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--sell-primary)" strokeWidth="2.5"><circle cx="12" cy="12" r="4" /></svg>
                    </div>
                    <div className={styles.timelineBody}>
                      <p className={styles.timelineStatus}>{STATUS_LABELS[entry.status] ?? entry.status}</p>
                      <p className={styles.timelineTime}>{fmtDateTime(entry.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.slideoverFooter}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={onClose}>Close</button>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function SellOrdersPage() {
  const { user, storeConfig, showToast, refreshQuickStats } = useSell();
  const currency = storeConfig?.currency ?? 'NGN';

  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatus] = useState<'all' | OrderStatus>('all');
  const [payFilter, setPayFilter] = useState<'all' | PaymentStatus>('all');
  const [selected, setSelected] = useState<StoreOrder | null>(null);

  const load = useCallback(async () => {
    if (!user?.businessId) return [];
    try {
      const db = getDatabase();
      const snap = await db.collection('storeOrders')
        .where('businessId', '==', user.businessId)
        .get();
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() })) as StoreOrder[];
      items.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
      setOrders(items);
      return items;
    } catch (err) {
      console.error('[SellOrdersPage] Load error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user?.businessId]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || (o.orderNumber ?? '').toLowerCase().includes(q)
      || (o.customerName ?? '').toLowerCase().includes(q)
      || (o.customerEmail ?? '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || effectiveStatus(o) === statusFilter;
    const matchPay = payFilter === 'all' || o.paymentStatus === payFilter;
    return matchSearch && matchStatus && matchPay;
  }), [orders, search, statusFilter, payFilter]);

  const pending = orders.filter(o => {
    const eff = effectiveStatus(o);
    return eff === 'paid' || eff === 'processing' || eff === 'shipped';
  }).length;
  const delivered = orders.filter(o => effectiveStatus(o) === 'delivered').length;
  const revenue = orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + (o.total ?? 0), 0);

  const onUpdated = useCallback(async () => {
    const items = await load();
    refreshQuickStats();
    setSelected(prev => (prev ? (items.find(o => o.id === prev.id) ?? null) : null));
  }, [load, refreshQuickStats]);

  return (
    <>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.heading}>Orders</h2>
            <p className={styles.sub}>Manage and fulfill orders from your store.</p>
          </div>
        </div>

        {/* Stat strip */}
        <div className={styles.statStrip}>
          <div className={styles.statCard}><p className={styles.statLabel}>To fulfill</p><p className={styles.statValue}>{pending}</p><p className={styles.statSub}>Need action</p></div>
          <div className={styles.statCard}><p className={styles.statLabel}>Total orders</p><p className={styles.statValue}>{orders.length}</p><p className={styles.statSub}>All time</p></div>
          <div className={styles.statCard}><p className={styles.statLabel}>Revenue</p><p className={styles.statValue}>{fmt(revenue, currency)}</p><p className={styles.statSub}>Paid orders</p></div>
          <div className={styles.statCard}><p className={styles.statLabel}>Delivered</p><p className={styles.statValue}>{delivered}</p><p className={styles.statSub}>Completed</p></div>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input className={styles.searchInput} placeholder="Search orders, customers…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatus(e.target.value as typeof statusFilter)}>
            <option value="all">All statuses</option>
            {(['paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] as OrderStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <select className={styles.filterSelect} value={payFilter} onChange={e => setPayFilter(e.target.value as typeof payFilter)}>
            <option value="all">All payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <span className={styles.countPill}>{filtered.length} order{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Table */}
        <div className={styles.tableWrap}>
          {loading ? (
            <div className={styles.empty}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--sell-text-3)', fontSize: '0.875rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
                Loading orders…
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <img className={styles.emptyImg} src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1786280719/Untitled_-_August_08_2026_at_11.22.19_yjkgz1.png" alt="No orders yet" />
              <p className={styles.emptyTitle}>{orders.length === 0 ? 'No orders yet' : 'No results'}</p>
              <p className={styles.emptySub}>
                {orders.length === 0
                  ? 'Orders will appear here when customers complete a purchase.'
                  : 'Try clearing your search or filters.'}
              </p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => {
                  const eff = effectiveStatus(o);
                  return (
                    <tr key={o.id} onClick={() => setSelected(o)}>
                      <td>
                        <p className={styles.orderNum}>{o.orderNumber}</p>
                        <p className={styles.orderDate}>{fmtDate(o.createdAt)}</p>
                      </td>
                      <td>
                        <p className={styles.customer}>{o.customerName}</p>
                        <p className={styles.customerEmail}>{o.customerEmail}</p>
                        {o.customerEmailStatus && o.customerEmailStatus !== 'sent' && (
                          <p className={styles.emailWarn}>
                            {o.customerEmailStatus === 'stub' ? '⚠️ Email not configured' : '⚠️ Delivery email failed'}
                          </p>
                        )}
                      </td>
                      <td><span className={styles.itemCount}>{o.lineItems?.length ?? 0} item{(o.lineItems?.length ?? 0) !== 1 ? 's' : ''}</span></td>
                      <td><span className={styles.total}>{fmt(o.total, currency)}</span></td>
                      <td>
                        <span className={`${styles.badge} ${statusClass(eff)}`}>
                          <span className={styles.badgeDot} />
                          {STATUS_LABELS[eff] ?? eff}
                          {isDigitalOrder(o) && eff === 'delivered' && <span className={styles.autoTag}>auto</span>}
                        </span>
                      </td>
                      <td><span className={`${styles.badge} ${payClass(o.paymentStatus)}`}>{o.paymentStatus}</span></td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className={styles.rowActions}>
                          <button className={styles.iconBtn} onClick={() => setSelected(o)} title="View order">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selected && (
        <OrderSlideOver
          order={selected}
          currency={currency}
          userId={user?.id ?? ''}
          onClose={() => setSelected(null)}
          onUpdated={onUpdated}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
