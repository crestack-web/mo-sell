'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Megaphone, Compass, Film, Banknote, BarChart3,
  Receipt, Wallet, Settings, LogOut, Menu, X, Bell, Plus, Search,
  ArrowUpRight, CheckCircle2, Clock3,
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabase-client';
import { useBrandWorkspace } from './BrandWorkspaceProvider';
import { CreateBriefModal } from './CreateBriefModal';
import styles from '../brand-studio.module.css';

const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { label: 'Overview', path: '/brand/dashboard', icon: LayoutDashboard },
      { label: 'Briefs', path: '/brand/campaigns', icon: Megaphone },
      { label: 'Discover', path: '/brand/discover', icon: Compass },
      { label: 'My Videos', path: '/brand/videos', icon: Film },
      { label: 'Payouts', path: '/brand/payouts', icon: Banknote },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { label: 'Analytics', path: '/brand/analytics', icon: BarChart3 },
      { label: 'Transactions', path: '/brand/transactions', icon: Receipt },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Wallet', path: '/brand/wallet', icon: Wallet },
      { label: 'Settings', path: '/brand/settings', icon: Settings },
    ],
  },
];

export function BrandShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { brand, orders, loading, refreshing, setBriefModalOpen } = useBrandWorkspace();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [search, setSearch] = useState('');

  const awaiting = useMemo(
    () => orders.filter((o) =>
      o.status === 'DRAFT_SUBMITTED' ||
      (o.finalVideoUrl && !(typeof o.review === 'string' && o.review.startsWith('approved')) && o.paymentStatus !== 'PAID_OUT')
    ),
    [orders]
  );
  const readyToPay = useMemo(
    () => orders.filter((o) => ['DRAFT_SUBMITTED', 'APPROVED'].includes(o.status ?? '') && o.paymentStatus !== 'PENDING_BALANCE' && o.paymentStatus !== 'PAID_OUT'),
    [orders]
  );

  const current = NAV_GROUPS.flatMap((g) => g.items).find((item) => item.path === pathname);
  const title = current?.label ?? 'Workspace';

  function navigate(path: string) {
    setSidebarOpen(false);
    setNotifOpen(false);
    router.push(path);
  }

  function handleSearch(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    const q = search.trim().toLowerCase();
    if (!q) return;
    const match = NAV_GROUPS.flatMap((g) => g.items).find((item) => item.label.toLowerCase().includes(q));
    navigate(match ? match.path : `/brand/discover?q=${encodeURIComponent(search.trim())}`);
    setSearch('');
  }

  async function handleLogout() {
    await supabaseClient.auth.signOut();
    router.push('/brand-auth/login');
  }

  return (
    <div className={styles.workspace}>
      <div className={styles.shell}>
        {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
          <button className={styles.closeButton} onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={18} /></button>
          <div className={styles.sidebarHead}>
            <div className={styles.logoMark}>MO</div>
            <div className={styles.logoText}>
              <span className={styles.logoTitle}>MO Sell Studio</span>
              <span className={styles.logoSub}>Brand workspace</span>
            </div>
          </div>

          <nav className={styles.sidebarNav}>
            {NAV_GROUPS.map((group) => (
              <div className={styles.navSection} key={group.label}>
                <div className={styles.navLabel}>{group.label}</div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.path;
                  const badge = item.path === '/brand/campaigns' ? awaiting.length
                    : item.path === '/brand/payouts' ? readyToPay.length : 0;
                  return (
                    <button
                      key={item.path}
                      className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                      onClick={() => navigate(item.path)}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                      {badge > 0 && <span className={styles.navBadge}>{badge}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className={styles.sidebarFoot}>
            <div className={styles.walletCard}>
              <div className={styles.walletLabel}>Available to spend</div>
              <div className={styles.walletAmount}>${Number(brand?.walletBalance ?? 0).toFixed(2)}</div>
              <button className={styles.walletLink} onClick={() => navigate('/brand/wallet')}>
                Top up wallet <ArrowUpRight size={13} />
              </button>
            </div>
            <div className={styles.userRow}>
              <div className={styles.userAvatar}>{(brand?.brandName || 'B').charAt(0).toUpperCase()}</div>
              <div className={styles.userMeta}>
                <div className={styles.userName}>{brand?.brandName || 'Your brand'}</div>
                <div className={styles.userMail}>{brand?.email || ''}</div>
              </div>
            </div>
            <button className={styles.signOut} onClick={handleLogout}>
              <LogOut size={13} style={{ verticalAlign: '-2px', marginRight: 6 }} /> Sign out
            </button>
          </div>
        </aside>

        <div className={styles.main}>
          <header className={styles.topbar}>
            <button className={styles.mobileMenuButton} onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={18} /></button>
            <div className={styles.crumb}>
              <span className={styles.crumbLabel}>{refreshing ? 'Syncing studio…' : 'MO Sell Studio'}</span>
              <span className={styles.crumbTitle}>{title}</span>
            </div>
            <div className={styles.topSearch}>
              <Search size={15} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={handleSearch} placeholder="Jump to a page or creator…" />
              <span className={styles.searchKey}>↵</span>
            </div>
            <button className={styles.iconButton} onClick={() => setNotifOpen((v) => !v)} aria-label="Notifications">
              <Bell size={17} />
              {awaiting.length > 0 && <span className={styles.notifDot} />}
            </button>
            <button className={styles.primaryButton} onClick={() => setBriefModalOpen(true)}>
              <Plus size={15} /> New brief
            </button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  className={styles.notifPanel}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <div className={styles.notifTitle}>Needs your attention</div>
                  {awaiting.length === 0 && <p className={styles.cardSub}>You’re all caught up. New drafts will appear here.</p>}
                  {awaiting.slice(0, 4).map((order) => (
                    <div className={styles.notifItem} key={order.id} onClick={() => navigate('/brand/campaigns')}>
                      <p>{order.finalVideoUrl ? 'Final video ready to review' : 'A creator submitted a draft'} · {order.productName}</p>
                      <span><Clock3 size={10} style={{ verticalAlign: '-1px' }} /> Review now</span>
                    </div>
                  ))}
                  {readyToPay.length > 0 && (
                    <div className={styles.notifItem} onClick={() => navigate('/brand/payouts')}>
                      <p>{readyToPay.length} balance {readyToPay.length === 1 ? 'payment' : 'payments'} ready to release</p>
                      <span><CheckCircle2 size={10} style={{ verticalAlign: '-1px' }} /> Manage payouts</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </header>

          <main className={styles.content}>
            {loading ? (
              <div className={styles.loadingWrap}><div className={styles.spinner} /></div>
            ) : children}
          </main>
        </div>
      </div>
      <CreateBriefModal />
    </div>
  );
}
