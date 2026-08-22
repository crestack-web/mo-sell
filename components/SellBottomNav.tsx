'use client';

import React from 'react';
import { useSell } from '../context/SellContext';
import type { SellPageId } from '../context/SellContext';
import styles from './SellBottomNav.module.css';

interface NavItem {
  id: SellPageId;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'overview',
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    id: 'products',
    label: 'Products',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 01-8 0"/>
      </svg>
    ),
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    id: 'content-hub',
    label: 'Content',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.4 7.2L22 9.6l-5.6 4.8 1.6 7.6L12 17.6 6 22l1.6-7.6L2 9.6l7.6-.4L12 2z"/>
      </svg>
    ),
  },
  {
    id: 'more',
    label: 'More',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1"/>
        <circle cx="19" cy="12" r="1"/>
        <circle cx="5" cy="12" r="1"/>
      </svg>
    ),
  },
];

const PRIMARY_IDS = new Set<SellPageId>(['overview', 'products', 'orders', 'content-hub']);

export function SellBottomNav() {
  const { activePage, navigateTo, quickStats } = useSell();

  function handleTap(item: NavItem) {
    navigateTo(item.id);
  }

  return (
    <nav className={styles.bottomNav} role="navigation" aria-label="Mobile navigation">
      {NAV_ITEMS.map(item => {
        const isActive =
          item.id === 'more'
            ? activePage === 'more' || !PRIMARY_IDS.has(activePage)
            : activePage === item.id;

        return (
          <button
            key={item.id}
            className={[styles.navItem, isActive ? styles.navItemActive : ''].join(' ')}
            onClick={() => handleTap(item)}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className={styles.navIcon}>
              {item.icon}
              {item.id === 'orders' && quickStats.pendingOrders > 0 && (
                <span className={styles.badge}>
                  {quickStats.pendingOrders > 99 ? '99+' : quickStats.pendingOrders}
                </span>
              )}
            </span>
            <span className={styles.navLabel}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
