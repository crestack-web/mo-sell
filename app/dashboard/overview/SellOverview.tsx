'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSell } from '@/context/SellContext';
import { restartSellTour } from '@/components/SellTour';
import { getStorePublicUrl } from '@/lib/store-url';
import styles from './SellOverview.module.css';

const WELCOME_DISMISS_KEY = 'mo-sell-welcome-dismissed';

// ─── Stat Card ─────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent: string;
  bg: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

function StatCard({ label, value, sub, accent, bg, icon, onClick }: StatCardProps) {
  return (
    <button className={styles.statCard} onClick={onClick} style={{ '--card-accent': accent, '--card-bg': bg } as React.CSSProperties}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statBody}>
        <p className={styles.statLabel}>{label}</p>
        <p className={styles.statValue}>{value}</p>
        {sub && <p className={styles.statSub}>{sub}</p>}
      </div>
    </button>
  );
}

// ─── MO Prompt Card ────────────────────────────────────────────────────────

interface PromptCardProps {
  title: string;
  body: string;
  cta: string;
  onCta: () => void;
}

function MOPromptCard({ title, body, cta, onCta }: PromptCardProps) {
  return (
    <div className={styles.promptCard}>
      <div className={styles.promptMoAvatar}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1784636144/mo_sell_chat_ucbw3x.png" alt="Mo" width={34} height={34} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
      </div>
      <div className={styles.promptBody}>
        <p className={styles.promptTitle}>{title}</p>
        <p className={styles.promptText}>{body}</p>
        <button className={styles.promptCta} onClick={onCta}>{cta}</button>
      </div>
    </div>
  );
}

// ─── Quick Action ──────────────────────────────────────────────────────────

interface ActionProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

function QuickAction({ label, icon, onClick, variant = 'secondary' }: ActionProps) {
  return (
    <button
      className={[styles.quickAction, variant === 'primary' ? styles.quickPrimary : styles.quickSecondary].join(' ')}
      onClick={onClick}
    >
      <span className={styles.qaIcon}>{icon}</span>
      <span className={styles.qaLabel}>{label}</span>
    </button>
  );
}

// ─── Setup Step ────────────────────────────────────────────────────────────

interface SetupStepProps {
  number: number;
  label: string;
  done: boolean;
  onClick: () => void;
}

function SetupStep({ number, label, done, onClick }: SetupStepProps) {
  return (
    <button className={[styles.setupStep, done ? styles.stepDone : styles.stepTodo].join(' ')} onClick={onClick}>
      <div className={styles.stepNum}>
        {done ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        ) : number}
      </div>
      <span className={styles.stepLabel}>{label}</span>
      {!done && (
        <svg className={styles.stepArrow} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      )}
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export function SellOverview() {
  const { storeConfig, quickStats, navigateTo, user, showToast } = useSell();
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const currency = storeConfig?.currency ?? 'NGN';
  const symbol   = currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ';

  const revenueFormatted = useMemo(() => {
    const n = quickStats.monthlyRevenue;
    if (n >= 1_000_000) return `${symbol}${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${symbol}${(n / 1_000).toFixed(1)}K`;
    return `${symbol}${n.toLocaleString()}`;
  }, [quickStats.monthlyRevenue, symbol]);

  // First-session activation checklist (not domain / billing)
  const hasStore     = !!storeConfig;
  const hasProducts  = quickStats.totalProducts > 0;
  const isLive       = storeConfig?.status === 'active';
  const storeUrl     = storeConfig?.storeSlug
    ? getStorePublicUrl(
        storeConfig.storeSlug,
        storeConfig.customDomain,
        storeConfig.customDomainStatus === 'verified'
      )
    : '';

  // Show checklist until they have at least one product (core activation)
  const setupDone = hasStore && hasProducts;
  const setupProgress = [hasStore, hasProducts, isLive || linkCopied].filter(Boolean).length;

  // Welcome modal after signup (?welcome=1)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('welcome') !== '1') return;
    try {
      if (localStorage.getItem(WELCOME_DISMISS_KEY) === '1') return;
    } catch { /* noop */ }
    setWelcomeOpen(true);
    // Clean URL without reload
    const url = new URL(window.location.href);
    url.searchParams.delete('welcome');
    window.history.replaceState({}, '', url.pathname + url.search);
  }, []);

  const dismissWelcome = () => {
    setWelcomeOpen(false);
    try {
      localStorage.setItem(WELCOME_DISMISS_KEY, '1');
    } catch { /* noop */ }
  };

  const copyStoreLink = async () => {
    if (!storeUrl) return;
    try {
      await navigator.clipboard.writeText(storeUrl);
      setLinkCopied(true);
      showToast('Store link copied — share it anywhere', 'success');
    } catch {
      showToast('Could not copy link', 'error');
    }
  };

  const openStorePreview = () => {
    if (!storeConfig?.storeSlug) return;
    window.open(`/store/${storeConfig.storeSlug}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={styles.overview}>

      {/* ── First-session welcome modal ── */}
      {welcomeOpen && (
        <div className={styles.welcomeOverlay} role="dialog" aria-modal="true" aria-labelledby="welcome-title">
          <div className={styles.welcomeModal}>
            <button type="button" className={styles.welcomeClose} onClick={dismissWelcome} aria-label="Close">
              ×
            </button>
            <div className={styles.welcomeEmoji}>🎉</div>
            <h2 id="welcome-title" className={styles.welcomeTitle}>Your store is live</h2>
            <p className={styles.welcomeBody}>
              Three quick steps and you can start selling. No tech setup — just add something to sell and share your link.
            </p>
            <ol className={styles.welcomeList}>
              <li><strong>Add your first product</strong> — photo, name, and price</li>
              <li><strong>Preview your store</strong> — see what customers see</li>
              <li><strong>Share your link</strong> — Instagram, WhatsApp, TikTok…</li>
            </ol>
            <button
              type="button"
              className={[styles.quickAction, styles.quickPrimary].join(' ')}
              style={{ width: '100%', justifyContent: 'center', padding: '14px 20px' }}
              onClick={() => {
                dismissWelcome();
                navigateTo('products');
              }}
            >
              Add my first product →
            </button>
            <button
              type="button"
              className={styles.welcomeSkip}
              onClick={dismissWelcome}
            >
              I&apos;ll explore first
            </button>
          </div>
        </div>
      )}

      {/* ── Welcome header ── */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.heading}>
            {storeConfig
              ? hasProducts
                ? `Welcome back, ${user?.shortName} 👋`
                : `Your store is ready, ${user?.shortName} 👋`
              : `Let's set up your store, ${user?.shortName} 👋`}
          </h2>
          <p className={styles.subheading}>
            {storeConfig
              ? hasProducts
                ? "Here's how your store is performing this month."
                : 'Add a product and share your link — that\'s how first sales start.'
              : 'MO Sell gives you a beautiful online store in minutes.'}
          </p>
        </div>

        {storeConfig && (
          <div className={styles.headerActions}>
            <QuickAction
              label="Add Product"
              variant="primary"
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}
              onClick={() => navigateTo('products')}
            />
            <QuickAction
              label="View Orders"
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
              onClick={() => navigateTo('orders')}
            />
            <QuickAction
              label="Tour"
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              }
              onClick={() => restartSellTour()}
            />
          </div>
        )}
      </div>

      {/* ── First-session activation checklist ── */}
      {!setupDone && (
        <div className={styles.setupCard}>
          <div className={styles.setupCardHeader}>
            <div>
              <p className={styles.setupCardTitle}>
                {storeConfig ? 'Get your first sale' : 'Set up your store'}
              </p>
              <p className={styles.setupCardSub}>
                {storeConfig
                  ? `${setupProgress} of 3 steps · start with a product, then share`
                  : 'Create your store, then add something to sell.'}
              </p>
            </div>
            {storeConfig && (
              <div className={styles.setupProgress}>
                <div className={styles.setupProgressBar}>
                  <div className={styles.setupProgressFill} style={{ width: `${(setupProgress / 3) * 100}%` }} />
                </div>
                <span className={styles.setupProgressLabel}>{Math.round((setupProgress / 3) * 100)}%</span>
              </div>
            )}
          </div>
          {storeConfig ? (
            <div className={styles.setupSteps}>
              <SetupStep
                number={1}
                label="Add your first product"
                done={hasProducts}
                onClick={() => navigateTo('products')}
              />
              <SetupStep
                number={2}
                label="Preview your store"
                done={false}
                onClick={openStorePreview}
              />
              <SetupStep
                number={3}
                label={linkCopied ? 'Link copied — share it' : 'Share your store link'}
                done={linkCopied}
                onClick={copyStoreLink}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
              <button
                className={[styles.quickAction, styles.quickPrimary].join(' ')}
                onClick={() => navigateTo('setup-wizard')}
              >
                Chat with MO →
              </button>
              <button
                className={[styles.quickAction, styles.quickSecondary].join(' ')}
                onClick={() => restartSellTour()}
              >
                Take a quick tour
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── KPI stat cards ── */}
      {storeConfig && (
        <div className={styles.statsGrid}>
          <StatCard
            label="Revenue this month"
            value={revenueFormatted}
            sub="From online sales"
            accent="var(--sell-primary)"
            bg="var(--sell-primary-lt)"
            onClick={() => navigateTo('analytics')}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
              </svg>
            }
          />
          <StatCard
            label="Orders pending"
            value={String(quickStats.pendingOrders)}
            sub={quickStats.pendingOrders > 0 ? 'Need your attention' : 'All caught up'}
            accent={quickStats.pendingOrders > 0 ? 'var(--sell-amber)' : 'var(--sell-green)'}
            bg={quickStats.pendingOrders > 0 ? 'var(--sell-amber-bg)' : 'var(--sell-green-bg)'}
            onClick={() => navigateTo('orders')}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            }
          />
          <StatCard
            label="Products listed"
            value={String(quickStats.totalProducts)}
            sub={quickStats.totalProducts === 0 ? 'Add your first product' : 'In your catalog'}
            accent="var(--sell-teal)"
            bg="var(--sell-teal-bg)"
            onClick={() => navigateTo('products')}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
              </svg>
            }
          />
          <StatCard
            label="Store status"
            value={isLive ? 'Live' : storeConfig.status === 'draft' ? 'Draft' : 'Paused'}
            sub={isLive ? (storeConfig.customDomain && storeConfig.customDomainStatus === 'verified' ? storeConfig.customDomain : `${process.env.NEXT_PUBLIC_APP_URL}/store/${storeConfig.storeSlug}`) : 'Not published yet'}
            accent={isLive ? 'var(--sell-green)' : 'var(--sell-amber)'}
            bg={isLive ? 'var(--sell-green-bg)' : 'var(--sell-amber-bg)'}
            onClick={() => navigateTo('settings')}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
              </svg>
            }
          />
        </div>
      )}

      {/* ── Quick actions strip ── */}
      {storeConfig && (
        <div className={styles.actionsRow}>
          <p className={styles.actionsLabel}>Quick actions</p>
          <div className={styles.actionsGrid}>
            {[
              { label: 'Add product',     img: 'https://res.cloudinary.com/dzjoqbg2u/image/upload/v1786280719/Untitled_-_August_08_2026_at_11.22.19_g5daal.png', page: 'products' as const },
              { label: 'View orders',     img: 'https://res.cloudinary.com/dzjoqbg2u/image/upload/v1786280713/Untitled_-_August_08_2026_at_11.22.19_cw6drr.png', page: 'orders' as const },
              { label: 'Manage shipping', img: 'https://res.cloudinary.com/dzjoqbg2u/image/upload/v1786280714/Untitled_-_August_08_2026_at_11.22.19_grw18t.png', page: 'shipping' as const },
              { label: 'See analytics',   img: 'https://res.cloudinary.com/dzjoqbg2u/image/upload/v1786280714/Untitled_-_August_08_2026_at_11.22.19_geseuq.png', page: 'analytics' as const },
              { label: 'Store settings',  img: 'https://res.cloudinary.com/dzjoqbg2u/image/upload/v1786280708/Untitled_-_August_08_2026_at_11.22.19_mats40.png', page: 'settings' as const },
            ].map(a => (
              <button key={a.page} className={styles.actionTile} onClick={() => navigateTo(a.page)}>
                <img className={styles.actionImg} src={a.img} alt={a.label} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── MO prompt cards ── */}
      <div className={styles.prompts}>
        {!storeConfig && (
          <MOPromptCard
            title="MO is ready to set up your store"
            body="Tell MO what you sell and it will generate your store name, colors, collections, and product descriptions automatically."
            cta="Start with MO →"
            onCta={() => navigateTo('setup-wizard')}
          />
        )}
        {storeConfig && quickStats.totalProducts === 0 && (
          <MOPromptCard
            title="Your store has no products yet"
            body="Want MO to generate product descriptions from your Busmo inventory? It takes about 30 seconds."
            cta="Add products →"
            onCta={() => navigateTo('products')}
          />
        )}
        {storeConfig && quickStats.totalProducts > 0 && !isLive && (
          <MOPromptCard
            title="Your store isn't live yet"
            body="Everything looks ready. Publish your store so customers can find and buy from you."
            cta="Publish store →"
            onCta={() => navigateTo('settings')}
          />
        )}
        {isLive && quickStats.pendingOrders > 0 && (
          <MOPromptCard
            title={`${quickStats.pendingOrders} order${quickStats.pendingOrders > 1 ? 's' : ''} waiting`}
            body="You have orders that need to be processed. Keep customers happy by fulfilling quickly."
            cta="View orders →"
            onCta={() => navigateTo('orders')}
          />
        )}
      </div>
    </div>
  );
}
