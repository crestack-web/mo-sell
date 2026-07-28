'use client';

import React from 'react';
import { useSell } from '@/context/SellContext';
import { SellSidebar } from './SellSidebar';
import { SellTopbar } from './SellTopbar';
import { SellBottomNav } from './SellBottomNav';
import styles from './SellShell.module.css';

interface SellShellProps {
  children?: React.ReactNode;
}

const FULL_BLEED_PAGES = new Set(['theme-editor', 'ask-mo']);

export function SellShell({ children }: SellShellProps) {
  const { activePage, toast } = useSell();

  const isFullBleed = FULL_BLEED_PAGES.has(activePage);

  return (
    <div className={styles.shell}>
      <SellSidebar />

      <div className={styles.main}>
        <SellTopbar />

        <div className={isFullBleed ? styles.pageAreaFullBleed : styles.pageArea}>
          <div className={isFullBleed ? styles.pageFullBleed : styles.page}>
            {children}
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <SellBottomNav />

      {/* Toast */}
      {toast.visible && (
        <div className={styles.toastWrap}>
          <div className={[
            styles.toast,
            toast.type === 'success' ? styles.toastSuccess :
            toast.type === 'error'   ? styles.toastError   : styles.toastInfo,
          ].join(' ')}>
            {toast.type === 'success' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
            {toast.type === 'error' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            )}
            {toast.type === 'info' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            )}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
