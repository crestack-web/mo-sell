'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getDatabase } from '@/lib/database/adapter';
import { getStorage } from '@/lib/storage/adapter';
import { initializeFirebase } from '@/lib/firebase';
import { useSell } from '@/context/SellContext';
import styles from './LinkInBioEditor.module.css';

export function LinkInBioEditor() {
  const { user, storeConfig, refreshStoreConfig, showToast } = useSell();
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const linkInBio = (storeConfig as any)?.linkInBio;
    if (!linkInBio) return;
    setForm({
      bio: linkInBio.bio || '',
      avatarUrl: linkInBio.avatarUrl || null,
      links: linkInBio.links || [],
      theme: linkInBio.theme || 'light',
      showBusmoBadge: linkInBio.showBusmoBadge ?? true,
    });
    setAvatarPreview(linkInBio.avatarUrl || null);
  }, [storeConfig]);

  const handleSave = useCallback(async () => {
    if (!user?.businessId || !form) return;
    setSaving(true);
    try {
      const db = getDatabase();
      let avatarUrl = form.avatarUrl;

      if (avatarFile) {
        const storage = getStorage();
        const path = `link-bio/${user.businessId}/avatar_${Date.now()}_${avatarFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        avatarUrl = await storage.upload(avatarFile, path);
      }

      await db.collection('businesses').doc(user.businessId).set({
        linkInBio: {
          ...form,
          avatarUrl,
          updatedAt: new Date().toISOString(),
        },
      }, { merge: true });

      await refreshStoreConfig();
      showToast('Link-in-bio saved', 'success');
    } catch {
      showToast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }, [user, form, avatarFile, refreshStoreConfig, showToast]);

  if (!form) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.heading}>Link in Bio</h2>
          <p className={styles.sub}>Create a simple page with your important links</p>
        </div>
        <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Bio</label>
          <textarea
            className={styles.textarea}
            value={form.bio}
            onChange={e => setForm({ ...form, bio: e.target.value })}
            placeholder="Tell people who you are..."
            rows={3}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Profile Picture</label>
          <div className={styles.avatarRow}>
            {avatarPreview && (
              <img src={avatarPreview} alt="Avatar" className={styles.avatarPreview} />
            )}
            <button className={styles.uploadBtn} onClick={() => fileRef.current?.click()}>
              Upload Image
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                setAvatarFile(file);
                const reader = new FileReader();
                reader.onloadend = () => setAvatarPreview(reader.result as string);
                reader.readAsDataURL(file);
              }}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Links</label>
          {form.links.map((link: any, i: number) => (
            <div key={i} className={styles.linkRow}>
              <input
                className={styles.input}
                value={link.title}
                onChange={e => {
                  const newLinks = [...form.links];
                  newLinks[i] = { ...newLinks[i], title: e.target.value };
                  setForm({ ...form, links: newLinks });
                }}
                placeholder="Link title"
              />
              <input
                className={styles.input}
                value={link.url}
                onChange={e => {
                  const newLinks = [...form.links];
                  newLinks[i] = { ...newLinks[i], url: e.target.value };
                  setForm({ ...form, links: newLinks });
                }}
                placeholder="https://..."
              />
              <button
                className={styles.removeBtn}
                onClick={() => setForm({ ...form, links: form.links.filter((_: any, j: number) => j !== i) })}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            className={styles.addBtn}
            onClick={() => setForm({ ...form, links: [...form.links, { title: '', url: '' }] })}
          >
            + Add Link
          </button>
        </div>
      </div>
    </div>
  );
}