'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '@/lib/database/adapter';
import { getStorage } from '@/lib/storage/adapter';
import { useSell } from '@/context/SellContext';
import styles from './SellCollectionsPage.module.css';

export function SellCollectionsPage() {
  const { user, storeConfig, showToast } = useSell();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', productIds: [] as string[] });

  const loadCollections = useCallback(async () => {
    if (!user?.businessId) return;
    try {
      const db = getDatabase();
      const snap = await db.collection('storeCollections')
        .where('businessId', '==', user.businessId)
        .get();
      setCollections(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('[SellCollectionsPage] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.businessId]);

  useEffect(() => { loadCollections(); }, [loadCollections]);

  const handleSave = useCallback(async () => {
    if (!user?.businessId || !form.name.trim()) return;
    setSaving(true);
    try {
      const db = getDatabase();
      const payload = {
        businessId: user.businessId,
        name: form.name.trim(),
        description: form.description.trim(),
        productIds: form.productIds,
        updatedAt: new Date().toISOString(),
      };

      await db.collection('storeCollections').add(payload);
      showToast('Collection created', 'success');
      setForm({ name: '', description: '', productIds: [] });
      loadCollections();
    } catch {
      showToast('Failed to create collection', 'error');
    } finally {
      setSaving(false);
    }
  }, [user, form, showToast, loadCollections]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Delete this collection?')) return;
    try {
      const db = getDatabase();
      await db.doc(`storeCollections/${id}`).delete();
      setCollections(prev => prev.filter(c => c.id !== id));
      showToast('Collection deleted', 'info');
    } catch {
      showToast('Failed to delete collection', 'error');
    }
  }, [showToast]);

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.heading}>Collections</h2>
          <p className={styles.sub}>Organize products into collections</p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.formRow}>
          <input
            className={styles.formInput}
            placeholder="Collection name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
          <input
            className={styles.formInput}
            placeholder="Description (optional)"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
          <button className={styles.btn} onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? 'Creating...' : 'Create Collection'}
          </button>
        </div>
      </div>

      <div className={styles.list}>
        {collections.length === 0 ? (
          <div className={styles.empty}>
            <img className={styles.emptyImg} src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1786305123/Untitled_-_August_08_2026_at_11.22.19_asqb6a.png" alt="No collections yet" />
            <p className={styles.emptyTitle}>No collections yet</p>
            <p className={styles.emptySub}>Group your products into collections so customers can browse your store easily.</p>
          </div>
        ) : (
          collections.map(c => (
            <div key={c.id} className={styles.collectionItem}>
              <div>
                <p className={styles.collectionName}>{c.name}</p>
                {c.description && <p className={styles.collectionDesc}>{c.description}</p>}
              </div>
              <button className={styles.deleteBtn} onClick={() => handleDelete(c.id)}>Delete</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}