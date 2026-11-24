'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Plus, Search, Filter, ArrowUpRight } from 'lucide-react';
import { useBrandWorkspace } from '../_components/BrandWorkspaceProvider';
import { CampaignDetailDrawer } from '../_components/CampaignDetailDrawer';
import {
  EmptyState, SectionHead, StatusBadge, creatorInitial, formatDate, formatKobo, relativeDate,
} from '../_components/shared';
import styles from '../brand-studio.module.css';

const TABS = [
  { id: 'all', label: 'All briefs' },
  { id: 'active', label: 'In progress' },
  { id: 'review', label: 'For review' },
  { id: 'payments', label: 'Payments' },
  { id: 'done', label: 'Completed' },
];

export default function BrandCampaignsPage() {
  const { orders, setBriefModalOpen } = useBrandWorkspace();
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const counts = useMemo(() => ({
    all: orders.length,
    active: orders.filter((o) => ['REQUESTED', 'IN_PROGRESS', 'APPROVED'].includes(o.status ?? '')).length,
    review: orders.filter((o) => o.status === 'DRAFT_SUBMITTED' || (o.finalVideoUrl && !(typeof o.review === 'string' && o.review.startsWith('approved')))).length,
    payments: orders.filter((o) => ['DRAFT_SUBMITTED', 'APPROVED', 'COMPLETED'].includes(o.status ?? '') && o.paymentStatus !== 'PAID_OUT').length,
    done: orders.filter((o) => o.status === 'COMPLETED' || o.paymentStatus === 'PAID_OUT').length,
  }), [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((order) => {
      const status = order.status ?? '';
      if (tab === 'active' && !['REQUESTED', 'IN_PROGRESS', 'APPROVED'].includes(status)) return false;
      if (tab === 'review' && !(status === 'DRAFT_SUBMITTED' || (order.finalVideoUrl && !(typeof order.review === 'string' && order.review.startsWith('approved'))))) return false;
      if (tab === 'payments' && !(order.paymentStatus !== 'PAID_OUT' && ['DRAFT_SUBMITTED', 'APPROVED', 'COMPLETED'].includes(status))) return false;
      if (tab === 'done' && !(status === 'COMPLETED' || order.paymentStatus === 'PAID_OUT')) return false;
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (!q) return true;
      return [order.productName, order.brief, order.creator?.displayName, order.creator?.name, order.creator?.username]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [orders, tab, query, statusFilter]);

  const selected = orders.find((o) => o.id === selectedId) ?? null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className={styles.pageHead}>
        <div>
          <div className={styles.pageEyebrow}><Megaphone size={12} /> Collaborations</div>
          <h1 className={styles.pageTitle}>Briefs & campaigns</h1>
          <p className={styles.pageSubtitle}>
            Everything your brand and creators are working on together — from the first brief to the final payout.
          </p>
        </div>
        <button className={styles.primaryButton} onClick={() => setBriefModalOpen(true)}><Plus size={15} /> New brief</button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {TABS.map((item) => (
            <button key={item.id} className={`${styles.tab} ${tab === item.id ? styles.tabActive : ''}`} onClick={() => setTab(item.id)}>
              {item.label}<span className={styles.tabCount}>{counts[item.id as keyof typeof counts]}</span>
            </button>
          ))}
        </div>
        <div className={styles.topSearch} style={{ marginLeft: 'auto', width: 240 }}>
          <Search size={14} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search briefs or creators" />
        </div>
        <select className={styles.selectInput} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
          <option value="all">All statuses</option>
          {['REQUESTED', 'IN_PROGRESS', 'DRAFT_SUBMITTED', 'APPROVED', 'COMPLETED', 'DISPUTED', 'REJECTED'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.card}>
          <EmptyState
            icon={<Megaphone size={22} />}
            title={orders.length === 0 ? 'Your first brief starts here' : 'No briefs match this view'}
            text={orders.length === 0
              ? 'Choose a creator, write the brief, and fund the deposit. They’ll see it in their dashboard instantly.'
              : 'Try another tab or clear your filters.'}
            action={orders.length === 0 ? <button className={styles.primaryButton} onClick={() => setBriefModalOpen(true)}><Plus size={14} /> Send a brief</button> : undefined}
          />
        </div>
      ) : (
        <div className={styles.card}>
          {filtered.map((order) => {
            const creator = order.creator?.displayName || order.creator?.name || order.creator?.username || 'Creator';
            return (
              <div className={styles.campaignRow} key={order.id} onClick={() => setSelectedId(order.id)}>
                <div className={styles.campaignIcon}><Megaphone size={17} /></div>
                <div className={styles.campaignMain}>
                  <div className={styles.campaignName}>{order.productName || 'Creative brief'}</div>
                  <div className={styles.campaignDesc}>
                    with {creator} · {order.videoLength || '30s'} · sent {relativeDate(order.requestedAt)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <div className={styles.campaignSide}>
                    <StatusBadge status={order.status} />
                    <div className={styles.campaignAmount} style={{ marginTop: 6 }}>{formatKobo(order.agreedPrice)}</div>
                    <div className={styles.videoCardSub}>Due {formatDate(order.deadline)}</div>
                  </div>
                  <button className={styles.ghostButton} onClick={(e) => { e.stopPropagation(); setSelectedId(order.id); }}>
                    Open <ArrowUpRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SectionHead
        title="How collaborations work"
        hint="One shared brief, visible on both sides"
      />
      <div className={`${styles.grid} ${styles.threeCol}`}>
        {[
          { icon: <Megaphone size={17} />, title: '1. Send the brief', text: 'Pick a creator, describe the deliverables and fund the 50% deposit.' },
          { icon: <Filter size={17} />, title: '2. Review the draft', text: 'Approve it or request changes with a note. The creator sees it instantly.' },
          { icon: <ArrowUpRight size={17} />, title: '3. Pay & collect', text: 'Release the balance, get the final video, then approve and pay out.' },
        ].map((item) => (
          <div className={styles.card} key={item.title}>
            <div className={styles.cardBody}>
              <div className={styles.statIcon} style={{ marginBottom: 12 }}>{item.icon}</div>
              <p style={{ margin: '0 0 6px', fontSize: 12.5, fontWeight: 750 }}>{item.title}</p>
              <p className={styles.cardSub} style={{ margin: 0, lineHeight: 1.6 }}>{item.text}</p>
            </div>
          </div>
        ))}
      </div>

      <CampaignDetailDrawer order={selected} onClose={() => setSelectedId(null)} />
    </motion.div>
  );
}
