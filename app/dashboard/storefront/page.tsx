'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { THEMES } from '@/themes/registry';
import { useSell } from '@/context/SellContext';
import type { SellPageId } from '@/context/SellContext';
import { getDatabase } from '@/lib/database/adapter';

export const dynamic = 'force-dynamic';

const s = {
  page: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 22,
    width: '100%',
    maxWidth: 1200,
  },
  heading: {
    fontFamily: 'var(--sell-font-display)',
    fontSize: '1.35rem',
    fontWeight: 700,
    color: 'var(--sell-text-1)',
    marginBottom: 4,
  },
  sub: {
    fontSize: '0.875rem',
    color: 'var(--sell-text-2)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 16,
  },
  card: {
    background: 'var(--sell-surface)',
    border: '1px solid var(--sell-border)',
    borderRadius: 'var(--sell-radius-lg)',
    overflow: 'hidden',
    boxShadow: 'var(--sell-shadow-sm)',
    transition: 'box-shadow 0.2s, border-color 0.2s',
    position: 'relative' as const,
  },
  cardActive: {
    borderColor: 'var(--sell-primary)',
    boxShadow: '0 0 0 2px var(--sell-primary-glow)',
  },
  cardHeaderRow: {
    padding: '16px 20px',
    borderBottom: '1px solid var(--sell-border-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  preview: {
    height: 160,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.78rem',
    fontWeight: 700,
    color: '#fff',
    position: 'relative' as const,
  },
  body: {
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  name: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--sell-text-1)',
  },
  desc: {
    fontSize: '0.78rem',
    color: 'var(--sell-text-2)',
    lineHeight: 1.5,
  },
  badge: {
    display: 'inline-block',
    fontSize: '0.65rem',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 99,
    alignSelf: 'flex-start',
  },
  bestFor: {
    fontSize: '0.72rem',
    color: 'var(--sell-text-3)',
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap' as const,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  btnPrimary: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    padding: '9px 16px',
    borderRadius: 'var(--sell-radius-sm)',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    fontFamily: 'var(--sell-font-body)',
    background: 'linear-gradient(135deg, var(--sell-primary), var(--sell-accent))',
    color: '#fff',
  },
  activeTag: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    fontSize: '0.65rem',
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: 99,
    background: 'var(--sell-primary)',
    color: '#fff',
  },
  linkHint: {
    fontSize: '0.72rem',
    color: 'var(--sell-text-3)',
    marginTop: 6,
  },
};

export default function StorefrontPage() {
  const { user, storeConfig, showToast, navigateTo, refreshStoreConfig } = useSell();
  const currentTheme = (storeConfig?.theme ?? 'luxe') as string;

  // Custom domain state (mirrors the domain config on the Settings page)
  const [customDomain, setCustomDomain] = useState('');
  const [domainDirty, setDomainDirty] = useState(false);
  const [savingDomain, setSavingDomain] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!storeConfig) return;
    setCustomDomain((storeConfig as any).customDomain ?? '');
  }, [storeConfig]);

  const handleSaveDomain = useCallback(async () => {
    if (!user?.businessId) return;
    setSavingDomain(true);
    try {
      const db = getDatabase();
      const savedDomain = (storeConfig as any)?.customDomain ?? '';
      const newDomain = customDomain.trim();
      await db.doc(`businesses/${user.businessId}/store/config`).set({
        customDomain: newDomain || null,
        customDomainStatus: !newDomain || newDomain !== savedDomain ? 'pending' : ((storeConfig as any)?.customDomainStatus ?? 'pending'),
        customDomainVerifiedAt: !newDomain || newDomain !== savedDomain ? null : ((storeConfig as any)?.customDomainVerifiedAt ?? null),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      await refreshStoreConfig();
      setDomainDirty(false);
      showToast(newDomain ? 'Domain saved — add the DNS record below, then verify' : 'Domain removed', 'success');
    } catch {
      showToast('Failed to save domain', 'error');
    } finally {
      setSavingDomain(false);
    }
  }, [user?.businessId, customDomain, storeConfig, refreshStoreConfig, showToast]);

  const handleVerifyDomain = useCallback(async () => {
    if (!customDomain.trim() || !user?.businessId) return;

    // Guard: domain in the input must match what's saved in database
    if (customDomain.trim() !== (storeConfig as any)?.customDomain) {
      showToast('Save your domain first before verifying', 'error');
      return;
    }

    setVerifying(true);
    try {
      const res = await fetch('/api/store/domain/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: user.businessId, customDomain: customDomain.trim() }),
      });
      const data = await res.json() as { verified?: boolean; error?: string };

      if (!res.ok) {
        showToast(data.error ?? 'Verification failed', 'error');
        return;
      }

      await refreshStoreConfig();
      showToast(
        data.verified
          ? 'Domain verified!'
          : 'CNAME not found yet — DNS can take up to 48 hours',
        data.verified ? 'success' : 'error',
      );
    } catch {
      showToast('Verification failed — please try again', 'error');
    } finally {
      setVerifying(false);
    }
  }, [customDomain, storeConfig, user?.businessId, refreshStoreConfig, showToast]);

  // The storefront page only lists e-commerce themes — link-in-bio themes are
  // chosen in the separate "Link in Bio" editor.
  const ecommerceThemes = THEMES.filter(t => t.type === 'e-commerce');

  const handleCustomize = (themeId: string) => {
    navigateTo('theme-editor' as SellPageId);
  };

  const handleApplyAndCustomize = async (themeId: string) => {
    if (!user?.businessId) return;
    try {
      const db = getDatabase();
      await db.doc(`businesses/${user.businessId}/store/config`).set(
        { theme: themeId, updatedAt: new Date().toISOString() },
        { merge: true }
      );
      await refreshStoreConfig();
      navigateTo('theme-editor' as SellPageId);
    } catch {
      showToast('Failed to apply theme', 'error');
    }
  };

  const domStatus = (storeConfig as any)?.customDomainStatus ?? 'pending';
  const domainStatusLabel =
    domStatus === 'verified' ? 'Verified' :
    domStatus === 'failed'   ? 'Failed' :
    customDomain             ? 'Pending DNS' : 'Not set';
  const domainStatusColor =
    domStatus === 'verified' ? 'var(--sell-green)' :
    domStatus === 'failed'   ? 'var(--sell-red)' :
    customDomain             ? 'var(--sell-amber)' : 'var(--sell-text-3)';
  const domainStatusBg =
    domStatus === 'verified' ? 'var(--sell-green-bg)' :
    domStatus === 'failed'   ? 'var(--sell-red-bg)' :
    customDomain             ? 'var(--sell-amber-bg)' : 'var(--sell-surface-2)';

  return (
    <div style={s.page}>
      <div>
        <h2 style={s.heading}>Storefront</h2>
        <p style={s.sub}>Choose a theme for your store and customize it to match your brand</p>
      </div>

      <div style={s.grid}>
        {ecommerceThemes.map(t => {
          const isActive = currentTheme === t.id;
          return (
            <div key={t.id} style={{ ...s.card, ...(isActive ? s.cardActive : {}) }}>
              {/* Preview strip */}
              <div
                style={{
                  ...s.preview,
                  background: `linear-gradient(135deg, ${t.previewBg}, ${t.previewAccent}22)`,
                  color: t.previewAccent,
                  fontFamily: t.previewFont,
                }}
              >
                {t.name}
                {isActive && <span style={s.activeTag}>Active</span>}
              </div>

              {/* Body */}
              <div style={s.body}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={s.name}>{t.name}</span>
                </div>
                <span style={s.desc}>{t.description}</span>

                {t.badge && (
                  <span style={{ ...s.badge, background: t.badge.bg, color: t.badge.color }}>
                    {t.badge.label}
                  </span>
                )}

                {t.bestFor.length > 0 && (
                  <span style={s.bestFor}>
                    Best for: {t.bestFor.map((b, i) => (
                      <span key={b} style={{ fontWeight: 600, color: 'var(--sell-text-2)' }}>
                        {b}{i < t.bestFor.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </span>
                )}

                {/* Actions */}
                <div style={s.actions}>
                  <button
                    style={s.btnPrimary}
                    onClick={() => isActive ? handleCustomize(t.id) : handleApplyAndCustomize(t.id)}
                  >
                    {isActive ? 'Customize' : 'Preview & Customize'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p style={s.linkHint}>
        Looking for your link-in-bio page? Open the &quot;Link in Bio&quot; editor from the sidebar — it&apos;s a
        separate page with its own themes and URL.
      </p>

      {/* Custom domain */}
      <div style={s.card}>
        <div style={s.cardHeaderRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sell-surface-2)', color: 'var(--sell-text-2)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--sell-text-1)' }}>Custom domain</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--sell-text-3)' }}>Connect your own domain to your store</p>
            </div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 700, color: domainStatusColor, background: domainStatusBg }}>{domainStatusLabel}</span>
        </div>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {domStatus === 'failed' && customDomain && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 10, background: 'var(--sell-red-bg)', color: 'var(--sell-red)', fontSize: '0.8rem', lineHeight: 1.5 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 2 }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span><strong>{customDomain}</strong> is not pointing to Busmo yet. Check your DNS settings and try verifying again.</span>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--sell-text-2)' }}>Domain name</label>
            <input
              value={customDomain}
              onChange={e => { setCustomDomain(e.target.value.toLowerCase().trim()); setDomainDirty(true); }}
              placeholder="shop.yourbrand.com"
              style={{ padding: '9px 12px', borderRadius: 'var(--sell-radius-sm)', border: '1.5px solid var(--sell-border)', background: 'var(--sell-bg)', fontSize: '0.875rem', fontFamily: 'var(--sell-font-body)', color: 'var(--sell-text-1)', outline: 'none', width: '100%', boxSizing: 'border-box' }}
            />
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--sell-text-3)' }}>Enter your domain without https:// — e.g. shop.yourbrand.com</p>
          </div>

          {customDomain && (
            <div style={{ background: 'var(--sell-surface-2)', border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.82rem', color: 'var(--sell-text-1)' }}>Add this DNS record at your registrar:</p>
              {[
                ['Type', 'CNAME'],
                ['Host', customDomain.split('.').slice(0, -2).join('.') || '@'],
                ['Value', 'store.busmo.io'],
                ['TTL', '3600'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--sell-text-3)', fontWeight: 600, width: 60, flexShrink: 0 }}>{k}</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--sell-text-1)', background: 'var(--sell-surface)', border: '1px solid var(--sell-border)', padding: '3px 8px', borderRadius: 5 }}>{v}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={handleSaveDomain}
              disabled={savingDomain || !domainDirty}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 'var(--sell-radius-sm)', fontSize: '0.85rem', fontWeight: 600, border: 'none', fontFamily: 'var(--sell-font-body)', background: 'linear-gradient(135deg, var(--sell-primary), var(--sell-accent))', color: '#fff', boxShadow: '0 4px 14px var(--sell-primary-glow)', opacity: savingDomain || !domainDirty ? 0.5 : 1, cursor: savingDomain || !domainDirty ? 'not-allowed' : 'pointer' }}
            >
              {savingDomain ? 'Saving…' : 'Save domain'}
            </button>
            {customDomain && (
              <button
                onClick={handleVerifyDomain}
                disabled={verifying}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 'var(--sell-radius-sm)', fontSize: '0.85rem', fontWeight: 600, border: '1px solid var(--sell-border)', fontFamily: 'var(--sell-font-body)', background: 'var(--sell-surface)', color: 'var(--sell-text-1)', opacity: verifying ? 0.5 : 1, cursor: verifying ? 'not-allowed' : 'pointer' }}
              >
                {verifying ? 'Verifying…' : 'Verify domain'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
