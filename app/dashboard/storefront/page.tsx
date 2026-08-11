'use client';

import React from 'react';
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
    </div>
  );
}
