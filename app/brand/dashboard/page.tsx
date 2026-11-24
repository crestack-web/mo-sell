'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Megaphone, Clock3, Users, Sparkles, ArrowUpRight, Wallet, Video,
  Plus, Compass, Banknote, MoreHorizontal, CheckCircle2, CircleDollarSign,
  Play, ArrowRight,
} from 'lucide-react';
import { useBrandWorkspace } from '../_components/BrandWorkspaceProvider';
import { CampaignDetailDrawer } from '../_components/CampaignDetailDrawer';
import {
  EmptyState, SectionHead, StatCard, StatusBadge, VideoThumb,
  creatorInitial, formatKobo, formatMoney, relativeDate,
} from '../_components/shared';
import styles from '../brand-studio.module.css';

const ACTIVE_STATUSES = ['REQUESTED', 'IN_PROGRESS', 'DRAFT_SUBMITTED', 'APPROVED', 'COMPLETED'];

export default function BrandDashboardPage() {
  const router = useRouter();
  const { brand, orders, purchases, transactions, setBriefModalOpen } = useBrandWorkspace();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = orders.find((o) => o.id === selectedId) ?? null;
  const awaiting = useMemo(
    () => orders.filter((o) =>
      o.status === 'DRAFT_SUBMITTED' ||
      (o.finalVideoUrl && !(typeof o.review === 'string' && o.review.startsWith('approved')) && o.paymentStatus !== 'PAID_OUT')
    ),
    [orders]
  );
  const active = useMemo(() => orders.filter((o) => ACTIVE_STATUSES.includes(o.status ?? '')), [orders]);
  const creators = useMemo(() => new Set(active.map((o) => o.creatorId).filter(Boolean)).size, [active]);
  const spend = useMemo(() => orders.reduce((sum, o) => sum + (o.paymentStatus === 'PENDING_DEPOSIT' ? 0 : o.agreedPrice ?? 0), 0), [orders]);
  const readyToPay = orders.filter((o) => ['DRAFT_SUBMITTED', 'APPROVED'].includes(o.status ?? '') && o.paymentStatus !== 'PENDING_BALANCE' && o.paymentStatus !== 'PAID_OUT');

  const activity = useMemo(() => {
    type Item = { id: string; title: string; time?: string | null; amount?: number; icon: React.ReactNode; kind: string };
    const items: Item[] = [];
    orders.forEach((o) => {
      const stamp = o.paidOutAt || o.completedAt || o.draftSubmittedAt || o.acceptedAt || o.requestedAt;
      items.push({
        id: `order-${o.id}`,
        title: `${o.productName || 'Brief'} · ${o.creator?.displayName || o.creator?.name || 'Creator'}`,
        time: stamp,
        icon: <Megaphone size={14} />,
        kind: 'brief',
      });
    });
    transactions.slice(0, 20).forEach((t) => {
      items.push({
        id: `tx-${t.id}`,
        title: t.description || t.type || 'Wallet activity',
        time: t.createdAt,
        amount: Number(t.amount ?? 0),
        icon: t.type === 'topup' ? <Wallet size={14} /> : <Video size={14} />,
        kind: 'wallet',
      });
    });
    return items.sort((a, b) => new Date(b.time ?? 0).getTime() - new Date(a.time ?? 0).getTime()).slice(0, 6);
  }, [orders, transactions]);

  const spendSeries = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i), 1);
      return { key: d.toISOString().slice(0, 7), label: d.toLocaleDateString(undefined, { month: 'short' }) };
    });
    return months.map((m) => ({
      ...m,
      value: orders
        .filter((o) => (o.createdAt || '').startsWith(m.key) && o.paymentStatus !== 'PENDING_DEPOSIT')
        .reduce((sum, o) => sum + (o.agreedPrice ?? 0), 0),
    }));
  }, [orders]);
  const maxSpend = Math.max(...spendSeries.map((m) => m.value), 1);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <section className={styles.hero}>
        <span className={styles.heroBadge}><Sparkles size={12} /> Your creative studio</span>
        <h1 className={styles.heroTitle}>
          Good to see you, <em>{brand?.brandName || 'creator'}</em>.
        </h1>
        <p className={styles.heroText}>
          Brief creators, review their work, and release payments — all in one shared space. Right now,
          {' '}{awaiting.length === 0 ? 'nothing needs your attention.' : `${awaiting.length} ${awaiting.length === 1 ? 'video is' : 'videos are'} waiting for your review.`}
        </p>
        <div className={styles.heroActions}>
          <button className={styles.primaryButton} onClick={() => setBriefModalOpen(true)}><Plus size={15} /> Send a new brief</button>
          <button className={styles.ghostButton} onClick={() => router.push('/brand/discover')}><Compass size={15} /> Discover creators</button>
          {readyToPay.length > 0 && (
            <button className={styles.softButton} onClick={() => router.push('/brand/payouts')}><Banknote size={15} /> {readyToPay.length} payout{readyToPay.length > 1 ? 's' : ''} ready</button>
          )}
        </div>
        <div className={styles.heroArt} aria-hidden>
          <div className={styles.heroArtCard} style={{ width: 150, height: 112, right: 72, top: 12, transform: 'rotate(-7deg)' }}>
            <div style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={styles.thumbPlay} style={{ position: 'static', width: 26, height: 26 }}><Play size={11} fill="currentColor" /></span>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--bs-muted)' }}>DRAFT READY</span>
            </div>
          </div>
          <div className={styles.heroArtCard} style={{ width: 168, height: 118, left: 8, bottom: 6, transform: 'rotate(6deg)' }}>
            <div style={{ padding: 12 }}>
              <div style={{ fontSize: 9, color: 'var(--bs-subtle)' }}>CREATIVE SPEND</div>
              <div style={{ fontSize: 19, fontWeight: 800, marginTop: 5 }}>{formatKobo(spend)}</div>
              <div style={{ marginTop: 10, height: 5, borderRadius: 99, background: 'rgba(255,255,255,.08)' }}>
                <div style={{ width: '68%', height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,var(--bs-accent),var(--bs-pink))' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className={`${styles.grid} ${styles.statsGrid}`}>
        <StatCard icon={<Megaphone size={17} />} label="Briefs in flight" value={active.length} foot="Across your creative campaigns" onClick={() => router.push('/brand/campaigns')} />
        <StatCard icon={<Clock3 size={17} />} label="Awaiting review" value={awaiting.length} tone="warning" foot={awaiting.length ? 'Videos ready for a decision' : 'You’re all caught up'} onClick={() => router.push('/brand/campaigns')} />
        <StatCard icon={<Users size={17} />} label="Creators collaborating" value={creators} tone="pink" foot="Active partnerships" />
        <StatCard icon={<CircleDollarSign size={17} />} label="Creative spend" value={formatKobo(spend)} tone="success" foot={`Wallet: ${formatMoney(brand?.walletBalance, brand?.currency)}`} onClick={() => router.push('/brand/wallet')} />
      </div>

      <SectionHead
        title="Needs your attention"
        hint="Drafts and final videos waiting on your decision"
        action={<button className={styles.linkButton} onClick={() => router.push('/brand/campaigns')}>View all briefs <ArrowRight size={13} /></button>}
      />
      {awaiting.length === 0 ? (
        <div className={styles.card}>
          <EmptyState
            icon={<CheckCircle2 size={22} />}
            title="Nothing waiting on you"
            text="When a creator submits a draft or final video, it lands here for review."
            action={<button className={styles.softButton} onClick={() => setBriefModalOpen(true)}><Plus size={14} /> Start a collaboration</button>}
          />
        </div>
      ) : (
        <div className={`${styles.grid} ${styles.twoCol}`}>
          {awaiting.slice(0, 4).map((order) => (
            <div className={styles.reviewCard} key={order.id}>
              <VideoThumb url={order.finalVideoUrl || order.draftVideoUrl} type={order.finalVideoUrl ? 'final' : 'draft'} />
              <div className={styles.reviewBody}>
                <div className={styles.reviewTop}>
                  <div>
                    <div className={styles.reviewName}>{order.productName || 'Creative brief'}</div>
                    <div className={styles.reviewMeta}>
                      <span className={styles.avatarCell} style={{ width: 20, height: 20, fontSize: 9 }}>{creatorInitial(order.creator?.displayName || order.creator?.name)}</span>
                      {order.creator?.displayName || order.creator?.name || 'Creator'}
                      <span>·</span>
                      {relativeDate(order.draftSubmittedAt || order.completedAt)}
                    </div>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <p className={styles.reviewBrief}>{order.brief}</p>
                <div className={styles.reviewActions}>
                  <button className={styles.primaryButton} onClick={() => setSelectedId(order.id)}>Review video <ArrowUpRight size={13} /></button>
                  <button className={styles.ghostButton} onClick={() => setSelectedId(order.id)}>View brief</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={`${styles.grid} ${styles.twoCol}`} style={{ marginTop: 24 }}>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <p className={styles.cardTitle}>Active collaborations</p>
              <p className={styles.cardSub}>Every brief, draft and payment in one timeline</p>
            </div>
            <button className={styles.linkButton} onClick={() => router.push('/brand/campaigns')}>Open workspace <ArrowUpRight size={13} /></button>
          </div>
          {active.length === 0 ? (
            <EmptyState icon={<Megaphone size={22} />} title="No active briefs" text="Send your first brief to start collaborating with a creator." />
          ) : (
            active.slice(0, 5).map((order) => (
              <div className={styles.campaignRow} key={order.id} onClick={() => setSelectedId(order.id)}>
                <div className={styles.campaignIcon}><Megaphone size={17} /></div>
                <div className={styles.campaignMain}>
                  <div className={styles.campaignName}>{order.productName || 'Creative brief'}</div>
                  <div className={styles.campaignDesc}>with {order.creator?.displayName || order.creator?.name || 'Creator'} · {order.brief}</div>
                </div>
                <div className={styles.campaignSide}>
                  <StatusBadge status={order.status} />
                  <div className={styles.campaignAmount} style={{ marginTop: 6 }}>{formatKobo(order.agreedPrice)}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <div>
                <p className={styles.cardTitle}>Creative spend</p>
                <p className={styles.cardSub}>Last 6 months</p>
              </div>
              <MoreHorizontal size={16} color="var(--bs-subtle)" />
            </div>
            <div className={styles.cardBody}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 150 }}>
                {spendSeries.map((month) => (
                  <div key={month.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div
                      title={formatKobo(month.value)}
                      style={{
                        width: '100%',
                        maxWidth: 34,
                        height: `${Math.max(6, (month.value / maxSpend) * 110)}px`,
                        borderRadius: '8px 8px 3px 3px',
                        background: month.value > 0 ? 'linear-gradient(180deg,var(--bs-accent),rgba(109,77,255,.25))' : 'rgba(255,255,255,.06)',
                        transition: 'height .4s ease',
                      }}
                    />
                    <span style={{ fontSize: 9.5, color: 'var(--bs-subtle)' }}>{month.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHead}><p className={styles.cardTitle}>Recent activity</p></div>
            <div className={styles.cardBodyTight} style={{ padding: '6px 20px 14px' }}>
              {activity.length === 0 && <p className={styles.cardSub}>Your studio activity will show up here.</p>}
              {activity.map((item) => (
                <div className={styles.activityRow} key={item.id}>
                  <div className={styles.activityIcon}>{item.icon}</div>
                  <div className={styles.activityMain}>
                    <div className={styles.activityTitle}>{item.title}</div>
                    <div className={styles.activityTime}>{relativeDate(item.time)}</div>
                  </div>
                  {item.kind === 'wallet' && item.amount !== undefined && (
                    <div className={`${styles.activityAmount} ${item.amount >= 0 ? styles.positive : styles.negative}`}>
                      {item.amount >= 0 ? '+' : '-'}${Math.abs(item.amount).toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <CampaignDetailDrawer order={selected} onClose={() => setSelectedId(null)} />
    </motion.div>
  );
}
