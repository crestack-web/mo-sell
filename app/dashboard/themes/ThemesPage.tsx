'use client';

import React, { useState, useCallback } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import { useSell } from '@/context/SellContext';
import { THEMES, getThemeType } from '@/themes/registry';
import type { ThemeLayoutType } from '@/themes/registry';
import styles from './ThemesPage.module.css';

type Tab = 'link-style' | 'e-commerce';

const TAB_LABELS: Record<Tab, string> = {
  'link-style': 'Link-in-Bio Themes',
  'e-commerce': 'Storefront Themes',
};

function fmtCurrency(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const THEME_PREVIEW_COLORS: Record<string, string> = {
  link:  '#0D0D0D',
  glow:  '#1a1a2e',
  pulse: '#111827',
  vault: '#111111',
  spark: '#F9FAFB',
  luxe:  '#0A0A0A',
  market:'#FFF7ED',
  creator:'#0F172A',
  atlas: '#F8FAFC',
  bazaar:'#ECFDF5',
};

export function ThemesPage() {
  const { user, storeConfig, refreshStoreConfig, showToast, navigateTo } = useSell();
  const [tab, setTab] = useState<Tab>('link-style');
  const [applying, setApplying] = useState<string | null>(null);

  const linkThemes = THEMES.filter(t => t.type === 'link-style');
  const storeThemes = THEMES.filter(t => t.type === 'e-commerce');

  const currentTheme = storeConfig?.theme ?? 'luxe';

  const handleApply = useCallback(async (themeId: string) => {
    if (!user?.businessId) return;
    setApplying(themeId);
    try {
      const { firestore } = initializeFirebase();
      await setDoc(
        doc(firestore, 'businesses', user.businessId, 'store', 'config'),
        { theme: themeId, updatedAt: serverTimestamp() },
        { merge: true }
      );
      await refreshStoreConfig();

      const themeType = getThemeType(themeId);
      if (themeType === 'link-style') {
        navigateTo('link-in-bio');
      } else {
        navigateTo('theme-editor');
      }
      showToast(`"${THEMES.find(t => t.id === themeId)?.name}" applied!`, 'success');
    } catch {
      showToast('Failed to apply theme', 'error');
    } finally {
      setApplying(null);
    }
  }, [user?.businessId, refreshStoreConfig, navigateTo, showToast]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Choose Your Theme</h1>
        <p className={styles.subtitle}>Pick a style that fits your brand. You can switch anytime.</p>
      </div>

      <div className={styles.tabs}>
        {(['link-style', 'e-commerce'] as Tab[]).map(t => (
          <button
            key={t}
            className={[styles.tab, tab === t ? styles.tabActive : ''].join(' ')}
            onClick={() => setTab(t)}
          >
            {TAB_LABELS[t]}
            <span className={styles.tabCount}>
              {t === 'link-style' ? linkThemes.length : storeThemes.length}
            </span>
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {(tab === 'link-style' ? linkThemes : storeThemes).map(theme => {
          const isActive = currentTheme === theme.id;
          const isLoading = applying === theme.id;
          const isLink = theme.type === 'link-style';

          return (
            <div
              key={theme.id}
              className={[styles.card, isActive ? styles.cardActive : ''].join(' ')}
              onClick={() => handleApply(theme.id)}
              style={{ cursor: isActive ? 'default' : 'pointer' }}
            >
              <div
                className={styles.preview}
                style={{ background: THEME_PREVIEW_COLORS[theme.id] || theme.previewBg }}
              >
                <div className={styles.phoneFrame}>
                  {isLink ? (
                    <div className={styles.linkPreview}>
                      <div className={styles.linkAvatar} style={{
                        background: theme.previewAccent,
                        boxShadow: `0 0 0 2px ${theme.previewAccent}44`,
                      }}>
                        {theme.name.charAt(0)}
                      </div>
                      <div className={styles.linkName} style={{ color: theme.id === 'spark' ? '#111' : '#fff' }}>
                        {theme.name}
                      </div>
                      <div className={styles.linkBio} style={{ color: theme.id === 'spark' ? '#666' : '#aaa' }}>
                        Your bio here
                      </div>
                      <div className={styles.linkSocials}>
                        {['instagram', 'tiktok', 'x'].map(s => (
                          <div key={s} className={styles.linkSocialDot} style={{ background: theme.previewAccent }} />
                        ))}
                      </div>
                      <div className={styles.linkProducts}>
                        <div className={styles.linkProductPill} style={{
                          background: theme.id === 'spark' ? '#fff' : theme.previewAccent,
                          color: theme.id === 'spark' ? '#111' : '#fff',
                        }}>
                          Product 1
                        </div>
                        <div className={styles.linkProductPill} style={{
                          background: theme.id === 'spark' ? '#fff' : theme.previewAccent,
                          color: theme.id === 'spark' ? '#111' : '#fff',
                        }}>
                          Product 2
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.storePreview}>
                      <div className={styles.storeBar} style={{ background: theme.previewAccent }} />
                      <div className={styles.storeGrid}>
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className={styles.storeCard}>
                            <div className={styles.storeCardImg} style={{ background: `${theme.previewAccent}33` }} />
                            <div className={styles.storeCardLine} style={{ background: `${theme.previewAccent}44` }} />
                            <div className={styles.storeCardLineShort} style={{ background: `${theme.previewAccent}44` }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {!isLink && <span className={styles.badge}>E-COMMERCE</span>}
              </div>

              <div className={styles.info}>
                <div className={styles.infoTop}>
                  <h3 className={styles.themeName}>{theme.name}</h3>
                  {theme.badge && (
                    <span className={styles.themeBadge} style={{ color: theme.badge.color, background: theme.badge.bg }}>
                      {theme.badge.label}
                    </span>
                  )}
                </div>
                <p className={styles.themeDesc}>{theme.description}</p>
                {theme.bestFor.length > 0 && (
                  <div className={styles.bestFor}>
                    {theme.bestFor.map(b => <span key={b} className={styles.bestForTag}>{b}</span>)}
                  </div>
                )}
              </div>

              <button
                className={[styles.applyBtn, isActive ? styles.appliedBtn : ''].join(' ')}
                style={isActive ? { background: '#10B981', color: '#fff' } : {}}
                onClick={(e) => { e.stopPropagation(); handleApply(theme.id); }}
                disabled={isActive || isLoading}
              >
                {isLoading ? 'Applying...' : isActive ? 'Active' : 'Use Theme'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
