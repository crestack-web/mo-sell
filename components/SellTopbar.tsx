'use client';

import React, { useCallback, useState } from 'react';
import { useSell } from '../context/SellContext';
import styles from './SellTopbar.module.css';
import { MoSellAvatar } from './MoSellAvatar';

const LOGO_URL = 'https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png';

export function SellTopbar() {
  const {
    toggleTheme, theme,
    user, storeConfig, navigateTo, showToast,
  } = useSell();

  const storeSlug   = storeConfig?.storeSlug;
  const storeStatus = storeConfig?.status ?? null;

  const [linkCopied, setLinkCopied] = useState(false);


  const displayHost = storeSlug
    ? (storeConfig?.customDomain && storeConfig?.customDomainStatus === 'verified'
        ? storeConfig.customDomain
        : storeSlug)
    : '';

  const copyStoreLink = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!storeSlug) return;
    const url = `${window.location.origin}/store/${storeSlug}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      showToast('Store link copied!', 'success');
      window.setTimeout(() => setLinkCopied(false), 1800);
    }).catch(() => {
      showToast('Failed to copy link', 'error');
    });
  }, [storeSlug, showToast]);

  const badgeClass =
    storeStatus === 'active' ? styles.badgeActive :
    storeStatus === 'draft'  ? styles.badgeDraft  :
    storeStatus === 'paused' ? styles.badgePaused : styles.badgeNone;

  const dotClass =
    storeStatus === 'active' ? styles.dotActive :
    storeStatus === 'draft'  ? styles.dotDraft  :
    storeStatus === 'paused' ? styles.dotPaused : styles.dotNone;

  const statusLabel =
    storeStatus === 'active' ? 'Live' :
    storeStatus === 'draft'  ? 'Draft' :
    storeStatus === 'paused' ? 'Paused' : 'Not configured';

  return (
    <header className={styles.topbar}>
      {/* App logo — always visible */}
      <button
        type="button"
        className={styles.logoBtn}
        onClick={() => navigateTo('overview')}
        aria-label="Mo-sell home"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_URL}
          alt="Mo-sell"
          className={styles.logoImg}
        />
      </button>

      {/* App name (not page title) */}
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>Mo-sell</h1>
        {storeConfig?.storeName && (
          <p className={styles.subtitle}>{storeConfig.storeName}</p>
        )}
      </div>

      {/* Actions */}
      <div className={styles.actions}>

        {/* Store status badge */}
        {storeConfig && (
          <button
            className={[styles.statusBadge, badgeClass].join(' ')}
            onClick={() => navigateTo('settings')}
            title="Store status — click to manage"
          >
            <span className={[styles.statusDot, dotClass].join(' ')} />
            {statusLabel}
          </button>
        )}

        {/* Store link — open site + copy */}
        {storeSlug && (
          <div className={styles.storeLinkPill} title="Open your store">
            <a
              href={`/store/${storeSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.storeLinkMain}
            >
              <span className={styles.storeLinkDot} aria-hidden />
              <span className={styles.storeLinkName}>{displayHost}</span>
            </a>
            <button
              type="button"
              className={styles.storeLinkCopy}
              onClick={copyStoreLink}
              aria-label="Copy store link"
              title="Copy link"
            >
              {linkCopied ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              )}
            </button>
          </div>
        )}

        {/* Theme toggle */}
        <button className={styles.iconBtn} onClick={toggleTheme} title="Toggle theme">
          {theme === 'light' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          )}
        </button>

        <div className={styles.divider} />

        {/* User chip */}
        {user && (
          <button className={styles.userChip}>
            <MoSellAvatar
              className={styles.avatar}
              photoURL={user.photoURL}
              label={user.shortName || 'Profile'}
              iconSize={14}
            />
            <span className={styles.userName}>{user.shortName}</span>
          </button>
        )}
      </div>
    </header>
  );
}
