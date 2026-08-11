'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { THEMES, getThemeType, resolveStoreMode } from '@/themes/registry';
import { useSell } from '@/context/SellContext';
import type { SellPageId } from '@/context/SellContext';
import { getDatabase } from '@/lib/database/adapter';
import { StorefrontSwitchModal } from '@/components/StorefrontSwitchModal';

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
  btnSecondary: {
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
    border: '1px solid var(--sell-border)',
    fontFamily: 'var(--sell-font-body)',
    background: 'var(--sell-surface)',
    color: 'var(--sell-text-1)',
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
  typeTag: {
    fontSize: '0.6rem',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 99,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em',
  },
};

export default function StorefrontPage() {
  const router = useRouter();
  const { user, storeConfig, showToast, navigateTo, refreshStoreConfig } = useSell();
  const currentTheme = (storeConfig?.theme ?? 'luxe') as string;
  const storeMode = resolveStoreMode(storeConfig?.theme, (storeConfig as any)?.mode, (storeConfig as any)?.linkBioTheme);
  const canHaveBoth = ['pro', 'enterprise'].includes((storeConfig as any)?.billingPlan ?? user?.plan ?? '');
  const [pendingTheme, setPendingTheme] = useState<string | null>(null);

  // Link-style main pages go directly to the link-in-bio editor. Stores that
  // run both keep their store on the main URL, so no redirect.
  useEffect(() => {
    if (storeConfig && storeMode !== 'both' && getThemeType(currentTheme) === 'link-style') {
      navigateTo('link-in-bio');
    }
  }, [storeConfig, storeMode, currentTheme, navigateTo]);

  const handleCustomize = (themeId: string) => {
    const type = getThemeType(themeId);
    if (type === 'link-style') {
      router.push('/dashboard/link-in-bio');
    } else {
      router.push('/dashboard/customize');
    }
  };

  const handleApplyAndCustomize = async (themeId: string) => {
    if (!user?.businessId) return;
    const type = getThemeType(themeId);
    try {
      const db = getDatabase();
      const now = new Date().toISOString();

      // Both store + bio active: link-style themes edit the bio page (which
      // lives at /bio/{storeSlug}), e-commerce themes edit the store.
      if (storeMode === 'both') {
        if (type === 'link-style') {
          await db.doc(`businesses/${user.businessId}/store/config`).set(
            { linkBioTheme: themeId, updatedAt: now },
            { merge: true }
          );
          await refreshStoreConfig();
          navigateTo('link-in-bio');
        } else {
          await db.doc(`businesses/${user.businessId}/store/config`).set(
            { theme: themeId, updatedAt: now },
            { merge: true }
          );
          await refreshStoreConfig();
          navigateTo('theme-editor');
        }
        return;
      }

      if (type === 'link-style') {
        // Currently a store: switching the main page to a link-in-bio.
        await db.doc(`businesses/${user.businessId}/store/config`).set({
          theme: themeId,
          mode: 'link-bio',
          linkBioTheme: themeId,
          updatedAt: now,
        }, { merge: true });
        await refreshStoreConfig();
        navigateTo('link-in-bio');
        return;
      }

      if (storeMode === 'store') {
        await db.doc(`businesses/${user.businessId}/store/config`).set(
          { theme: themeId, updatedAt: now },
          { merge: true }
        );
        await refreshStoreConfig();
        navigateTo('theme-editor');
        return;
      }

      // Currently a link-in-bio: applying a store theme means switching to a
      // full storefront — confirm first (create separate vs replace).
      setPendingTheme(themeId);
    } catch {
      showToast('Failed to apply theme', 'error');
    }
  };

  const confirmSwitchFromBio = async () => {
    if (!user?.businessId || !pendingTheme) return;
    const themeId = pendingTheme;
    setPendingTheme(null);
    try {
      const db = getDatabase();
      const currentLinkTheme = getThemeType(currentTheme) === 'link-style'
        ? currentTheme
        : ((storeConfig as any)?.linkBioTheme ?? 'ankara');
      await db.doc(`businesses/${user.businessId}/store/config`).set({
        theme: themeId,
        mode: canHaveBoth ? 'both' : 'store',
        linkBioTheme: currentLinkTheme,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      await refreshStoreConfig();
      navigateTo('theme-editor');
    } catch {
      showToast('Failed to switch', 'error');
    }
  };

  return (
    <div style={s.page}>
      <div>
        <h2 style={s.heading}>Storefront</h2>
        <p style={s.sub}>Choose a theme for your store and customize it to match your brand</p>
      </div>

      <div style={s.grid}>
        {THEMES.map(t => {
          const isActive = storeMode === 'both'
            ? t.id === currentTheme || (getThemeType(t.id) === 'link-style' && t.id === (storeConfig as any)?.linkBioTheme)
            : currentTheme === t.id;
          const isLink = t.type === 'link-style';
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
                  <span
                    style={{
                      ...s.typeTag,
                      background: isLink ? 'var(--sell-primary-lt)' : '#D1FAE5',
                      color: isLink ? 'var(--sell-primary)' : '#065F46',
                    }}
                  >
                    {isLink ? 'Bio Page' : 'Store'}
                  </span>
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
                  {isActive ? (
                    <button
                      style={s.btnPrimary}
                      onClick={() => handleCustomize(t.id)}
                    >
                      Customize
                    </button>
                  ) : (
                    <button
                      style={s.btnPrimary}
                      onClick={() => handleApplyAndCustomize(t.id)}
                    >
                      Preview & Customize
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <StorefrontSwitchModal
        open={pendingTheme !== null}
        canHaveBoth={canHaveBoth}
        onClose={() => setPendingTheme(null)}
        onConfirm={confirmSwitchFromBio}
      />
    </div>
  );
}
