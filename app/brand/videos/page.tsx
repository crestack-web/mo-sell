'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Film, Search, Download, ExternalLink, CheckCircle2, Clock3, Video as VideoIcon,
  Megaphone, Wallet, Tag, CalendarDays,
} from 'lucide-react';
import { useBrandWorkspace } from '../_components/BrandWorkspaceProvider';
import { CampaignDetailDrawer } from '../_components/CampaignDetailDrawer';
import {
  EmptyState, SectionHead, StatusBadge, VideoThumb, creatorInitial, formatKobo, relativeDate,
} from '../_components/shared';
import styles from '../brand-studio.module.css';

interface LibraryVideo {
  id: string;
  title: string;
  creatorName: string;
  creatorUsername?: string;
  thumbnail?: string;
  url: string;
  platform?: string;
  price?: number;
  paymentMethod?: string;
  licenseType?: string;
  purchaseDate?: string;
  tags?: string[];
  source: 'marketplace' | 'brief';
  status?: string;
  paidOut?: boolean;
  orderId?: string;
}

export default function BrandVideosPage() {
  const router = useRouter();
  const { purchases, orders, setBriefModalOpen } = useBrandWorkspace();
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<'all' | 'marketplace' | 'brief'>('all');
  const [sortBy, setSortBy] = useState('date');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const videos = useMemo<LibraryVideo[]>(() => {
    const marketplace: LibraryVideo[] = (purchases ?? []).map((p: any) => ({
      id: p.id,
      title: p.videoTitle || p.title || 'Purchased video',
      creatorName: p.creatorName || 'Creator',
      creatorUsername: p.creatorUsername,
      thumbnail: p.videoThumbnail || p.thumbnail,
      url: p.videoUrl || p.url || '',
      platform: p.platform,
      price: p.price,
      paymentMethod: p.paymentMethod,
      licenseType: p.licenseType,
      purchaseDate: p.purchaseDate,
      tags: p.tags,
      source: 'marketplace',
    }));
    const delivered: LibraryVideo[] = (orders ?? [])
      .filter((o) => !!o.finalVideoUrl)
      .map((o) => ({
        id: `delivery-${o.id}`,
        title: `${o.productName || 'Creative brief'} — final video`,
        creatorName: o.creator?.displayName || o.creator?.name || o.creator?.username || 'Creator',
        creatorUsername: o.creator?.username,
        url: o.finalVideoUrl!,
        thumbnail: undefined,
        purchaseDate: o.completedAt || o.updatedAt,
        price: (o.agreedPrice ?? 0) / 100,
        source: 'brief',
        status: o.status,
        paidOut: o.paymentStatus === 'PAID_OUT',
        orderId: o.id,
      }));
    return [...delivered, ...marketplace];
  }, [purchases, orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return videos
      .filter((v) => {
        if (source !== 'all' && v.source !== source) return false;
        if (!q) return true;
        return [v.title, v.creatorName, v.creatorUsername, ...(v.tags ?? [])]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q));
      })
      .sort((a, b) => {
        if (sortBy === 'creator') return a.creatorName.localeCompare(b.creatorName);
        return new Date(b.purchaseDate ?? 0).getTime() - new Date(a.purchaseDate ?? 0).getTime();
      });
  }, [videos, query, source, sortBy]);

  const selected = orders.find((o) => o.id === selectedId) ?? null;
  const deliveredCount = videos.filter((v) => v.source === 'brief').length;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className={styles.pageHead}>
        <div>
          <div className={styles.pageEyebrow}><Film size={12} /> Content library</div>
          <h1 className={styles.pageTitle}>My videos</h1>
          <p className={styles.pageSubtitle}>
            Every video your brand owns — purchased from the marketplace and delivered through your briefs.
          </p>
        </div>
        <button className={styles.primaryButton} onClick={() => setBriefModalOpen(true)}>New brief</button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {([
            ['all', 'All videos', videos.length],
            ['brief', 'From briefs', deliveredCount],
            ['marketplace', 'Marketplace', videos.length - deliveredCount],
          ] as const).map(([id, label, count]) => (
            <button key={id} className={`${styles.tab} ${source === id ? styles.tabActive : ''}`} onClick={() => setSource(id)}>
              {label}<span className={styles.tabCount}>{count}</span>
            </button>
          ))}
        </div>
        <div className={styles.topSearch} style={{ marginLeft: 'auto', width: 260 }}>
          <Search size={14} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search videos or creators" />
        </div>
        <select className={styles.selectInput} value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort videos">
          <option value="date">Newest first</option>
          <option value="creator">Creator A–Z</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.card}>
          <EmptyState
            icon={<Film size={22} />}
            title={videos.length === 0 ? 'Your library is empty' : 'No videos match this view'}
            text={videos.length === 0
              ? 'Discover ready-made UGC or brief a creator to produce something just for your brand.'
              : 'Try another filter or clear your search.'}
            action={
              videos.length === 0 ? (
                <button className={styles.primaryButton} onClick={() => router.push('/brand/discover')}>Discover creators</button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className={`${styles.grid} ${styles.videoGrid}`}>
          {filtered.map((video) => (
            <div className={styles.videoCard} key={video.id}>
              <VideoThumb url={video.url} poster={video.thumbnail} type={video.source === 'brief' ? 'final' : 'video'} />
              <div className={styles.videoCardBody}>
                <div className={styles.videoCardTitle} title={video.title}>{video.title}</div>
                <div className={styles.videoCardSub} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className={styles.avatarCell} style={{ width: 20, height: 20, fontSize: 9 }}>
                    {creatorInitial(video.creatorName)}
                  </span>
                  {video.creatorName}
                  {video.creatorUsername ? ` · @${video.creatorUsername}` : ''}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  {video.source === 'brief' ? (
                    <span className={`${styles.chip} ${styles.chipAccent}`}><Megaphone size={11} /> From brief</span>
                  ) : (
                    <span className={styles.chip}><Tag size={11} /> Marketplace</span>
                  )}
                  {video.platform && <span className={styles.chip}>{video.platform}</span>}
                  {video.source === 'brief' && <StatusBadge status={video.status} />}
                </div>
                <div className={styles.videoCardSub} style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10 }}>
                  <CalendarDays size={11} /> {relativeDate(video.purchaseDate)}
                  {video.price ? ` · ${video.source === 'brief' ? formatKobo(Math.round(video.price * 100)) : `$${video.price.toFixed(2)}`}` : ''}
                </div>
                {video.source === 'brief' && (
                  <div className={styles.videoCardSub} style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, color: video.paidOut ? 'var(--bs-success)' : 'var(--bs-warning)' }}>
                    {video.paidOut ? <CheckCircle2 size={11} /> : <Clock3 size={11} />}
                    {video.paidOut ? 'Creator paid' : 'Payout pending'}
                  </div>
                )}
                <div className={styles.videoCardFoot}>
                  <a className={styles.ghostButton} href={video.url} target="_blank" rel="noreferrer">
                    <ExternalLink size={13} /> View
                  </a>
                  {video.source === 'brief' ? (
                    <button className={styles.softButton} onClick={() => setSelectedId(video.orderId!)}>
                      <Wallet size={13} /> Details
                    </button>
                  ) : (
                    <a className={styles.softButton} href={video.url} download>
                      <Download size={13} /> Download
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {deliveredCount > 0 && (
        <>
          <SectionHead title="From your briefs" hint="Final videos approved and delivered by creators" />
          <div className={styles.card}>
            {orders.filter((o) => o.finalVideoUrl).map((order) => (
              <div className={styles.campaignRow} key={order.id} onClick={() => setSelectedId(order.id)}>
                <div className={styles.campaignIcon}><VideoIcon size={17} /></div>
                <div className={styles.campaignMain}>
                  <div className={styles.campaignName}>{order.productName || 'Creative brief'}</div>
                  <div className={styles.campaignDesc}>
                    with {order.creator?.displayName || order.creator?.name || 'Creator'} · delivered {relativeDate(order.completedAt)}
                  </div>
                </div>
                <div className={styles.campaignSide}>
                  <StatusBadge status={order.paymentStatus} />
                  <div className={styles.campaignAmount} style={{ marginTop: 6 }}>{formatKobo(order.creatorPayout)}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <CampaignDetailDrawer order={selected} onClose={() => setSelectedId(null)} />
    </motion.div>
  );
}
