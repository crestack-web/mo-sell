'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSell } from '@/context/SellContext';
import styles from './SellTour.module.css';

const STORAGE_KEY = 'mo-sell-tour-v1';

export type TourStep = {
  id: string;
  title: string;
  body: string;
  emoji: string;
  /** Optional route to open when this step is shown */
  page?: 'overview' | 'products' | 'orders' | 'content-hub' | 'more' | 'settings';
};

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to MO Sell',
    body: 'Your store dashboard is ready. This quick tour shows you where everything lives — it only takes a minute.',
    emoji: '👋',
    page: 'overview',
  },
  {
    id: 'overview',
    title: 'Overview',
    body: 'See revenue, pending orders, and product counts at a glance. Use the setup checklist to finish launching your store.',
    emoji: '📊',
    page: 'overview',
  },
  {
    id: 'products',
    title: 'Products',
    body: 'Add physical, digital, or service products. Upload images, set prices, and manage your catalog here.',
    emoji: '🛍️',
    page: 'products',
  },
  {
    id: 'orders',
    title: 'Orders',
    body: 'Track payments, fulfill orders, and keep customers updated. Pending orders also show a badge on the nav.',
    emoji: '📦',
    page: 'orders',
  },
  {
    id: 'content',
    title: 'Content Hub',
    body: 'Plan posts, generate ideas with Mo, and manage UGC campaigns so you can sell more from social.',
    emoji: '✨',
    page: 'content-hub',
  },
  {
    id: 'nav',
    title: 'Find everything else',
    body: 'On mobile, tap More for collections, shipping, analytics, earnings, settings, and Ask Mo. On desktop, use the sidebar.',
    emoji: '🧭',
    page: 'more',
  },
  {
    id: 'share',
    title: 'Share & go live',
    body: 'When you are ready, publish from Settings, then use Share in the header to copy your store link.',
    emoji: '🚀',
    page: 'settings',
  },
];

function readDone(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeDone() {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* noop */
  }
}

/** Call from settings / overview to re-open the tour */
export function restartSellTour() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
  window.dispatchEvent(new CustomEvent('mo-sell-tour-restart'));
}

export function SellTour() {
  const { user, userLoading, navigateTo, activePage } = useSell();
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [ready, setReady] = useState(false);

  // Wait until user is loaded, then decide whether to show tour
  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setReady(true);
      return;
    }
    // Small delay so the dashboard paints first
    const t = window.setTimeout(() => {
      if (!readDone()) setOpen(true);
      setReady(true);
    }, 600);
    return () => window.clearTimeout(t);
  }, [user, userLoading]);

  // Allow restart from elsewhere
  useEffect(() => {
    const onRestart = () => {
      setStepIndex(0);
      setOpen(true);
    };
    window.addEventListener('mo-sell-tour-restart', onRestart);
    return () => window.removeEventListener('mo-sell-tour-restart', onRestart);
  }, []);

  const step = TOUR_STEPS[stepIndex];
  const isLast = stepIndex === TOUR_STEPS.length - 1;
  const isFirst = stepIndex === 0;

  // Navigate to the page for the current step (best-effort)
  useEffect(() => {
    if (!open || !step?.page) return;
    if (activePage !== step.page) {
      navigateTo(step.page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stepIndex]);

  const finish = useCallback(() => {
    writeDone();
    setOpen(false);
    navigateTo('overview');
  }, [navigateTo]);

  const skip = useCallback(() => {
    writeDone();
    setOpen(false);
  }, []);

  const next = useCallback(() => {
    if (isLast) {
      finish();
      return;
    }
    setStepIndex(i => Math.min(i + 1, TOUR_STEPS.length - 1));
  }, [isLast, finish]);

  const back = useCallback(() => {
    setStepIndex(i => Math.max(i - 1, 0));
  }, []);

  if (!ready || !open || !step) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="sell-tour-title">
      <div className={styles.card}>
        <button type="button" className={styles.skip} onClick={skip} aria-label="Skip tour">
          Skip
        </button>

        <div className={styles.emoji} aria-hidden>
          {step.emoji}
        </div>

        <div className={styles.progress}>
          {TOUR_STEPS.map((s, i) => (
            <span
              key={s.id}
              className={[styles.dot, i === stepIndex ? styles.dotActive : i < stepIndex ? styles.dotDone : ''].join(' ')}
            />
          ))}
        </div>

        <p className={styles.stepLabel}>
          Step {stepIndex + 1} of {TOUR_STEPS.length}
        </p>

        <h2 id="sell-tour-title" className={styles.title}>
          {step.title}
        </h2>
        <p className={styles.body}>{step.body}</p>

        <div className={styles.actions}>
          {!isFirst && (
            <button type="button" className={styles.btnSecondary} onClick={back}>
              Back
            </button>
          )}
          <button type="button" className={styles.btnPrimary} onClick={next}>
            {isLast ? 'Get started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
