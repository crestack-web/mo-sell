'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Star, Clock, Play, Check, Shield, ChevronRight, Loader2, User as UserIcon, AlertTriangle, Package, Instagram, Music2, Youtube, Twitter, ExternalLink, Mail } from 'lucide-react';
import { UGCRequestModal } from './UGCRequestModal';

interface CreatorData {
  id: string;
  userId: string;
  name: string;
  displayName?: string;
  email?: string;
  username: string;
  niches: string[];
  price30s: number;
  price60s: number;
  deliveryDays: number;
  bio?: string;
  sampleVideos: { id: string; url: string; thumbnailUrl?: string }[];
  completedOrders: number;
  avatarUrl?: string;
  socialLinks?: Record<string, string>;
  followerCounts?: Record<string, number>;
  portfolioImages?: string[];
  contactEmail?: string;
}

interface PortfolioPageProps {
  username: string;
}

function formatPrice(cents: number): string {
  const naira = cents / 100;
  if (naira >= 1_000_000) return `₦${(naira / 1_000_000).toFixed(1)}M`;
  if (naira >= 1_000) return `₦${(naira / 1_000).toFixed(1)}K`;
  return `₦${naira.toLocaleString()}`;
}

export function PortfolioPage({ username }: PortfolioPageProps) {
  const [creator, setCreator] = useState<CreatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/ugc/creator/${encodeURIComponent(username)}`);
        if (!res.ok) {
          if (res.status === 404) setError('not-found');
          else setError('error');
          setLoading(false);
          return;
        }
        const data = await res.json();
        setCreator(data.creator);
      } catch {
        setError('error');
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  const handleCTAClick = useCallback(() => {
    setShowModal(true);
  }, []);

  if (loading) {
    return (
      <div style={s.container}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80dvh' }}>
          <div style={{ textAlign: 'center' }}>
            <Loader2 size={40} color="#0EA5E9" style={{ animation: 'spin 0.8s linear infinite' }} />
            <p style={{ marginTop: 16, color: '#6B7280', fontSize: 14 }}>Loading creator...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error === 'not-found' || !creator) {
    return (
      <div style={s.container}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80dvh' }}>
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <AlertTriangle size={48} color="#D1D5DB" style={{ marginBottom: 16 }} />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Creator Not Found</h1>
            <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
              This creator doesn&apos;t exist or their portfolio is not public yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const creatorName = creator.displayName ?? creator.name ?? 'Creator';

  return (
    <div style={s.container}>
      {/* Hero */}
      <div style={s.hero}>
        <div style={s.heroInner}>
          <div style={s.avatarWrap}>
            {creator.avatarUrl ? (
              <img src={creator.avatarUrl} alt={creatorName} style={s.avatar} />
            ) : (
              <div style={s.avatarPlaceholder}>
                <UserIcon size={36} color="#FFFFFF" />
              </div>
            )}
          </div>
          <h1 style={s.name}>{creatorName}</h1>
          {creator.bio && <p style={s.bio}>{creator.bio}</p>}
          <div style={s.meta}>
            <div style={s.metaItem}>
              <span style={s.priceValue}>{formatPrice(creator.price30s)}</span>
              <span style={s.priceLabel}>/ 30s</span>
            </div>
            <div style={s.metaDot} />
            <div style={s.metaItem}>
              <span style={s.priceValue}>{formatPrice(creator.price60s)}</span>
              <span style={s.priceLabel}>/ 60s</span>
            </div>
            <div style={s.metaDot} />
            <div style={s.metaItem}>
              <Clock size={16} color="#6B7280" />
              <span style={s.priceLabel}>{creator.deliveryDays}d delivery</span>
            </div>
          </div>
          <div style={s.nicheList}>
            {(creator.niches ?? []).map((n) => (
              <span key={n} style={s.nicheBadge}>{n}</span>
            ))}
          </div>
          {creator.completedOrders > 0 && (
            <div style={s.completedBadge}>
              <Check size={14} color="#059669" />
              <span>{creator.completedOrders} order{creator.completedOrders !== 1 ? 's' : ''} completed</span>
            </div>
          )}

          {/* Social Links */}
          {creator.socialLinks && Object.keys(creator.socialLinks).some(k => creator.socialLinks![k]) && (
            <div style={s.socialRow}>
              {((
                [
                  ['instagram', 'Instagram', Instagram],
                  ['tiktok', 'TikTok', Music2],
                  ['youtube', 'YouTube', Youtube],
                  ['twitter', 'X (Twitter)', Twitter],
                ] as [string, string, React.FC<{ size?: number; color?: string }>][]
              ).map(([key, label, Icon]) => {
                const url = creator.socialLinks![key];
                if (!url) return null;
                return (
                  <a key={key} href={url} target="_blank" rel="noopener noreferrer" style={s.socialPill}>
                    <Icon size={14} color="#0EA5E9" />
                    <span>{label}</span>
                    {creator.followerCounts?.[key] ? (
                      <span style={s.followerCount}>{creator.followerCounts![key].toLocaleString()} followers</span>
                    ) : null}
                    <ExternalLink size={10} color="#9CA3AF" />
                  </a>
                );
              }))}
            </div>
          )}
        </div>
      </div>

      {/* Portfolio Images Gallery */}
      {creator.portfolioImages && creator.portfolioImages.length > 0 && (
        <div style={s.content}>
          <h2 style={s.sectionTitle}>Gallery</h2>
          <div style={s.grid}>
            {creator.portfolioImages.map((url, idx) => (
              <div key={idx} style={s.imageCard}>
                <img src={url} alt={`Portfolio ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Videos */}
      <div style={s.content}>
        <h2 style={s.sectionTitle}>{creator.portfolioImages?.length ? 'Videos' : 'Portfolio'}</h2>
        {creator.sampleVideos && creator.sampleVideos.length > 0 ? (
          <div style={s.grid}>
            {creator.sampleVideos.map((video) => (
              <div key={video.id} style={s.videoCard}>
                <div style={s.videoThumb}>
                  {video.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={s.videoPlaceholder}>
                      <Play size={20} color="#6B7280" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={s.emptyPortfolio}>
            <Package size={32} color="#D1D5DB" />
            <p>No portfolio videos yet</p>
          </div>
        )}
      </div>

      {/* Contact Email */}
      {creator.contactEmail && (
        <div style={s.content}>
          <a href={`mailto:${creator.contactEmail}`} style={s.emailLink}>
            <Mail size={16} color="#0EA5E9" />
            <span>{creator.contactEmail}</span>
          </a>
        </div>
      )}

      {/* Trust Badge */}
      <div style={s.trustBar}>
        <Shield size={14} color="#059669" />
        <span>Pay securely with Paystack. 50% deposit to start, balance on delivery.</span>
      </div>

      {/* Sticky CTA */}
      <div style={s.stickyCta}>
        <button onClick={handleCTAClick} style={s.ctaButton}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#0284C7'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#0EA5E9'; }}
        >
          Request Video from {creatorName}
          <ChevronRight size={18} />
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <UGCRequestModal
        open={showModal}
        onClose={() => setShowModal(false)}
        creatorId={creator.userId}
        creatorName={creatorName}
        price30s={creator.price30s}
        price60s={creator.price60s}
        deliveryDays={creator.deliveryDays}
      />
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: 'var(--font-jakarta), sans-serif',
    background: '#FFFFFF',
    minHeight: '100dvh',
    color: '#111827',
    paddingBottom: 100,
  },
  hero: {
    background: 'linear-gradient(180deg, #F0F9FF 0%, #FFFFFF 100%)',
    borderBottom: '1px solid #F3F4F6',
    padding: '48px 24px 32px',
    textAlign: 'center' as const,
  },
  heroInner: {
    maxWidth: 640,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  avatar: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #0EA5E9, #6366F1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 28,
    fontWeight: 700,
    margin: 0,
    color: '#111827',
  },
  bio: {
    fontSize: 14,
    color: '#6B7280',
    margin: 0,
    lineHeight: 1.6,
    maxWidth: 480,
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: '#D1D5DB',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 700,
    color: '#059669',
  },
  priceLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  nicheList: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 6,
    justifyContent: 'center',
  },
  socialRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
    justifyContent: 'center',
    marginTop: 4,
  },
  socialPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    borderRadius: 100,
    border: '1px solid #E5E7EB',
    background: '#FFFFFF',
    fontSize: 12,
    fontWeight: 600,
    color: '#374151',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'box-shadow 0.15s',
  },
  followerCount: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: 500,
  },
  imageCard: {
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid #F3F4F6',
    background: '#F9FAFB',
    aspectRatio: '1',
  },
  emailLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    color: '#0EA5E9',
    fontWeight: 600,
    textDecoration: 'none',
    padding: '8px 16px',
    borderRadius: 100,
    border: '1px solid #E5E7EB',
    background: '#FFFFFF',
  },
  nicheBadge: {
    fontSize: 12,
    fontWeight: 500,
    color: '#0EA5E9',
    background: '#F0F9FF',
    padding: '4px 12px',
    borderRadius: 100,
  },
  completedBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    color: '#059669',
    fontWeight: 600,
    background: '#ECFDF5',
    padding: '6px 14px',
    borderRadius: 100,
  },
  content: {
    maxWidth: 800,
    margin: '0 auto',
    padding: '32px 24px',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    margin: '0 0 16px',
    color: '#111827',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 16,
  },
  videoCard: {
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid #F3F4F6',
    background: '#F9FAFB',
  },
  videoThumb: {
    aspectRatio: '9 / 16',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1E293B, #334155)',
    overflow: 'hidden',
  },
  videoPlaceholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  emptyPortfolio: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 8,
    padding: '48px 20px',
    color: '#9CA3AF',
    fontSize: 14,
  },
  trustBar: {
    maxWidth: 800,
    margin: '0 auto',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    color: '#059669',
    fontWeight: 500,
  },
  stickyCta: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: '16px 24px',
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(8px)',
    borderTop: '1px solid #F3F4F6',
    zIndex: 100,
  },
  ctaButton: {
    width: '100%',
    maxWidth: 400,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '14px 0',
    background: '#0EA5E9',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 600,
    fontFamily: 'var(--font-jakarta), sans-serif',
  },
};
