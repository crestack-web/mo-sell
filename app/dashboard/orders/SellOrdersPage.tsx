'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '@/lib/database/adapter';
import { useSell } from '@/context/SellContext';
import styles from './SellOrdersPage.module.css';

export function SellOrdersPage() {
  const { user, showToast } = useSell();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    if (!user?.businessId) return;
    try {
      const db = getDatabase();
      const snap = await db.collection('storeOrders')
        .where('businessId', '==', user.businessId)
        .get();
      const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      orders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(orders);
    } catch (err) {
      console.error('[SellOrdersPage] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.businessId]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const updateStatus = useCallback(async (orderId: string, status: string) => {
    try {
      const db = getDatabase();
      await db.doc(`storeOrders/${orderId}`).set({
        status,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      showToast(`Order marked as ${status}`, 'success');
      loadOrders();
    } catch {
      showToast('Failed to update order', 'error');
    }
  }, [showToast, loadOrders]);

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.heading}>Orders</h2>
          <p className={styles.sub}>Manage customer orders</p>
        </div>
      </div>

      <div className={styles.tableWrap}>
        {orders.length === 0 ? (
          <div className={styles.empty}>No orders yet</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>#{order.orderNumber}</td>
                  <td>{order.customerName}</td>
                  <td>₦{order.total?.toLocaleString()}</td>
                  <td>
                    <span className={`${styles.status} ${styles[order.status]}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}