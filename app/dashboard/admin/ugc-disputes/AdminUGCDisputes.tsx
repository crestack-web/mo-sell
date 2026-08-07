'use client';

import React, { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';

interface UGCOrder {
  id: string;
  brandId: string;
  creatorId: string;
  productName: string;
  brief: string;
  status: string;
  paymentStatus: string;
  agreedPrice: number;
  platformFee: number;
  creatorPayout: number;
  disputeReason: string | null;
  disputeDescription: string | null;
  disputeOpenedBy: string | null;
  disputeOpenedAt: any;
  disputeResolvedAt: any;
  disputeResolution: string | null;
  createdAt: any;
}

const REASON_LABELS: Record<string, string> = {
  QUALITY: 'Poor Quality',
  BRIEF_MISMATCH: 'Brief Mismatch',
  DEADLINE: 'Missed Deadline',
  NO_RESPONSE: 'No Response',
  SCOPE_CREEP: 'Scope Creep',
  OTHER: 'Other',
};

export function AdminUGCDisputes() {
  // Prevent build-time rendering
  if (typeof window === 'undefined') {
    return null;
  }

  const [orders, setOrders] = useState<UGCOrder[]>([]);
  const [resolving, setResolving] = useState<string | null>(null);
  const [selectedResolution, setSelectedResolution] = useState<Record<string, string>>({});
  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [showPayout, setShowPayout] = useState<string | null>(null);

  const loadOrders = async () => {
    try {
      const res = await fetch('/api/ugc/disputes');
      if (!res.ok) return;
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch {
      // ignore fetch errors
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  async function handleResolve(orderId: string) {
    const resolution = selectedResolution[orderId];
    if (!resolution) return;

    setResolving(orderId);
    try {
      const body: Record<string, any> = { resolution };
      if (resolution !== 'refund_brand') {
        body.accountNumber = accountNumber;
        body.bankCode = bankCode;
      }
      const res = await fetch(`/api/ugc/${orderId}/resolve-dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to resolve');
        return;
      }
      setSelectedResolution(prev => { const n = { ...prev }; delete n[orderId]; return n; });
      setShowPayout(null);
      loadOrders();
    } catch {
      alert('Failed to resolve dispute');
    } finally {
      setResolving(null);
    }
  }

  function formatPrice(kobo: number) {
    return `₦${(kobo / 100).toLocaleString()}`;
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>UGC Dispute Resolution</h1>
        <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0 0' }}>
          {orders.length} open dispute{orders.length !== 1 ? 's' : ''}
        </p>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: '#94a3b8' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No open disputes</p>
          <p style={{ fontSize: '0.85rem' }}>All clear!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map(order => (
            <div key={order.id} style={{
              background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
              padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700 }}>{order.productName}</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                    Order: {order.id.slice(0, 8)}... | {formatPrice(order.agreedPrice)}
                  </p>
                </div>
                <span style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
                  background: '#FEE2E2', color: '#DC2626',
                }}>
                  DISPUTED
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12, fontSize: '0.82rem' }}>
                <div><strong style={{ color: '#475569' }}>Opened by:</strong> {order.disputeOpenedBy === 'brand' ? 'Brand' : 'Creator'}</div>
                <div><strong style={{ color: '#475569' }}>Reason:</strong> {REASON_LABELS[order.disputeReason ?? 'OTHER'] ?? order.disputeReason}</div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong style={{ color: '#475569' }}>Description:</strong> {order.disputeDescription || 'N/A'}
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong style={{ color: '#475569' }}>Brief:</strong> {order.brief?.slice(0, 200)}{order.brief?.length > 200 ? '...' : ''}
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                <p style={{ margin: '0 0 8px', fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>Resolution</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {['refund_brand', 'pay_creator', 'split'].map(res => (
                    <button key={res} onClick={() => {
                      setSelectedResolution(prev => ({ ...prev, [order.id]: res }));
                      if (res === 'pay_creator' || res === 'split') setShowPayout(order.id);
                    }} style={{
                      padding: '6px 14px', borderRadius: 8, border: `1.5px solid ${selectedResolution[order.id] === res ? '#0EA5E9' : '#e2e8f0'}`,
                      background: selectedResolution[order.id] === res ? '#F0F9FF' : '#fff',
                      color: selectedResolution[order.id] === res ? '#0369A1' : '#64748b',
                      fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                    }}>
                      {res === 'refund_brand' ? 'Refund Brand 100%' : res === 'pay_creator' ? 'Pay Creator 100%' : 'Split 50/50'}
                    </button>
                  ))}
                </div>

                {showPayout === order.id && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <input placeholder="Account Number" value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.82rem' }} />
                    <input placeholder="Bank Code" value={bankCode} onChange={e => setBankCode(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.82rem' }} />
                  </div>
                )}

                {selectedResolution[order.id] && (
                  <button onClick={() => handleResolve(order.id)} disabled={resolving === order.id}
                    style={{
                      marginTop: 8, padding: '8px 20px', borderRadius: 8, border: 'none',
                      background: '#0EA5E9', color: '#fff', fontSize: '0.82rem', fontWeight: 700,
                      cursor: resolving === order.id ? 'default' : 'pointer', opacity: resolving === order.id ? 0.6 : 1,
                    }}>
                    {resolving === order.id ? 'Resolving...' : 'Apply Resolution'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
