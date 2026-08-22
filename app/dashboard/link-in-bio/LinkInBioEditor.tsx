'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '@/lib/database/adapter';
import { getStorage } from '@/lib/storage/adapter';
import { supabaseClient } from '@/lib/supabase-client';
import { useSell } from '@/context/SellContext';
import { ExternalLink, X, Pencil } from 'lucide-react';
import styles from './LinkInBioEditor.module.css';

type Social = { platform: string; url: string };

const SOCIAL_PLATFORMS = ['instagram', 'tiktok', 'twitter', 'youtube', 'whatsapp'];

export function LinkInBioEditor() {
  const { user, storeConfig, storeConfigLoading, refreshStoreConfig, showToast } = useSell();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [socials, setSocials] = useState<Social[]>([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (storeConfigLoading) return;
    const lb = (storeConfig as any)?.linkBio || {};
    setName(lb.name ?? storeConfig?.storeName ?? '');
    setBio(lb.bio ?? '');
    setAvatarUrl(lb.avatarUrl ?? null);
    setAvatarPreview(lb.avatarUrl ?? null);
    setSocials(Array.isArray(lb.socials) ? lb.socials : []);
    setDirty(false);
    setReady(true);
  }, [storeConfig, storeConfigLoading]);

  const markDirty = useCallback(() => setDirty(true), []);

  async function handleSave() {
    if (!user?.businessId) return;
    setSaving(true);
    try {
      let nextAvatar = avatarUrl;
      if (avatarFile) {
        const storage = getStorage();
        const path = `link-bio/${user.businessId}/avatar_${Date.now()}_${avatarFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        nextAvatar = await storage.upload(avatarFile, path);
      }

      // Preserve existing linkBio fields (design/products/links) while updating profile
      const prev = ((storeConfig as any)?.linkBio || {}) as Record<string, unknown>;
      const linkBio = {
        ...prev,
        avatarUrl: nextAvatar,
        name: name.trim(),
        bio: bio || '',
        socials: socials.filter(s => (s.url || '').trim()).map(s => ({
          platform: s.platform || 'instagram',
          url: (s.url || '').trim(),
        })),
        updatedAt: new Date().toISOString(),
      };

      const patch: Record<string, unknown> = {
        linkBio,
        updatedAt: new Date().toISOString(),
      };
      if (linkBio.name) patch.storeName = linkBio.name;

      let saved = false;
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session?.access_token) {
          const res = await fetch('/api/store/config', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ businessId: user.businessId, patch }),
          });
          const body = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(body.error || `Save failed (${res.status})`);
          saved = true;
        }
      } catch (apiErr) {
        console.warn('[LinkInBio] API save failed, falling back to client:', apiErr);
      }

      if (!saved) {
        const db = getDatabase();
        await db.doc(`businesses/${user.businessId}/store/config`).set(patch, { merge: true });
      }

      setAvatarUrl(nextAvatar);
      setAvatarFile(null);
      setAvatarPreview(nextAvatar);
      setDirty(false);
      await refreshStoreConfig();
      showToast('Link-in-bio saved', 'success');
    } catch (err: any) {
      console.error('[LinkInBio] save failed:', err);
      showToast(err?.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (!ready) return <div className={styles.loading}>Loading...</div>;

  const bioUrl = storeConfig?.storeSlug ? `/${storeConfig.storeSlug}` : '#';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', background: 'var(--sell-bg, #f8fafc)' }}>
      <div className={styles.page} style={{ flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'var(--sell-font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--sell-text-1)' }}>Link in Bio</h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--sell-text-2)' }}>Edit your profile — name, bio, photo, and socials</p>
          </div>
          {storeConfig?.storeSlug && (
            <a href={bioUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--sell-primary)' }}>
              View live page
            </a>
          )}
        </div>

        <div style={{ display: 'flex', gap: 24, flex: 1, minHeight: 0 }}>
          <div className={styles.previewCol}>
            <div className={styles.phoneFrame}>
              <div className={styles.phoneScreen} style={{ background: '#0A0A0A', color: '#fff', padding: 24, textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', margin: '24px auto 12px', overflow: 'hidden', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700 }}>
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (name || 'M').charAt(0).toUpperCase()
                  )}
                </div>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>{name || 'Your name'}</div>
                <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 16, whiteSpace: 'pre-wrap' }}>{bio || 'Your bio'}</div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {socials.filter(s => s.url).map((s, i) => (
                    <span key={i} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 100, background: 'rgba(255,255,255,0.1)' }}>{s.platform}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={[styles.editorCol, mobileEditorOpen ? styles.editorColOpen : ''].join(' ')}>
            <div className={styles.editorTabs}>
              <button className={[styles.editorTab, styles.editorTabActive].join(' ')} type="button">Profile</button>
              <button className={styles.mobileClose} onClick={() => setMobileEditorOpen(false)} aria-label="Close" type="button"><X size={16} /></button>
            </div>

            <div className={styles.editorContent}>
              <div className={styles.tabContent}>
                <div className={styles.field}>
                  <label className={styles.fLabel}>Profile picture</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
                    <div className={styles.pAvatar} style={{ marginBottom: 0 }}>
                      {avatarPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className={styles.pAvatarImg} src={avatarPreview} alt="Avatar" />
                      ) : (
                        <div className={styles.pAvatarPlaceholder}>{(name || 'M').charAt(0).toUpperCase()}</div>
                      )}
                    </div>
                    <input
                      className={styles.fileInput}
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setAvatarFile(file);
                        markDirty();
                        const reader = new FileReader();
                        reader.onloadend = () => setAvatarPreview(reader.result as string);
                        reader.readAsDataURL(file);
                      }}
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.fLabel}>Name</label>
                  <input
                    className={styles.fInput}
                    value={name}
                    onChange={e => { setName(e.target.value); markDirty(); }}
                    placeholder={storeConfig?.storeName || 'Your name'}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.fLabel}>Bio</label>
                  <textarea
                    className={styles.fTextarea}
                    rows={3}
                    value={bio}
                    onChange={e => { setBio(e.target.value); markDirty(); }}
                    placeholder="Tell people who you are..."
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.fLabel}>Social links</label>
                  {socials.map((s, i) => (
                    <div key={i} className={styles.socialRow}>
                      <select
                        className={styles.fSelect}
                        value={s.platform}
                        onChange={e => {
                          const next = [...socials];
                          next[i] = { ...next[i], platform: e.target.value };
                          setSocials(next);
                          markDirty();
                        }}
                        style={{ width: 110 }}
                      >
                        {SOCIAL_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <input
                        className={styles.fInput}
                        value={s.url}
                        onChange={e => {
                          const next = [...socials];
                          next[i] = { ...next[i], url: e.target.value };
                          setSocials(next);
                          markDirty();
                        }}
                        placeholder="@username"
                      />
                      <button
                        className={styles.iconBtn}
                        type="button"
                        aria-label="Remove"
                        onClick={() => { setSocials(socials.filter((_, j) => j !== i)); markDirty(); }}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                  <p className={styles.fHint}>Username or @handle is enough.</p>
                  <button
                    className={styles.addBtn}
                    type="button"
                    onClick={() => { setSocials([...socials, { platform: 'instagram', url: '' }]); markDirty(); }}
                  >
                    + Add social
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.saveRow}>
              <button
                className={styles.viewBtn}
                type="button"
                onClick={() => storeConfig?.storeSlug && window.open(bioUrl, '_blank')}
              >
                <ExternalLink size={14} /> View
              </button>
              <button className={styles.saveBtn} type="button" onClick={handleSave} disabled={saving || !dirty}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <button
        className={styles.mobileFab}
        type="button"
        onClick={() => setMobileEditorOpen(true)}
        style={{ display: mobileEditorOpen ? 'none' : undefined }}
      >
        <Pencil size={14} /> Edit
      </button>
    </div>
  );
}

export default LinkInBioEditor;
