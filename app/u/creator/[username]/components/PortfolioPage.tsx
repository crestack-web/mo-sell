'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Star, Clock, Play, Check, Shield, ChevronRight, Loader2, User as UserIcon, AlertTriangle, Package, Instagram, Music2, Youtube, Twitter, ExternalLink, Mail, X, BadgeCheck } from 'lucide-react';
import { UGCRequestModal } from './UGCRequestModal';
const TikTokIcon = ({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

const XIcon = ({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIconCustom = ({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const YouTubeIconCustom = ({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z" />
    <path d="m10 15 5-3-5-3z" />
  </svg>
);

const formatFollowerCount = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + 'K';
  }
  return num.toString();
};

import { getVideoThumbnail, getVideoEmbedUrl, isDirectVideo } from '@/lib/youtube';

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
  sampleVideos: { id: string; url: string; thumbnailUrl?: string; thumbnail?: string | null }[];
  completedOrders: number;
  avatarUrl?: string;
  socialLinks?: Record<string, string>;
  socialVerified?: Record<string, string>;
  followerCounts?: Record<string, number>;
  socialStats?: Record<string, { followerCount?: number; followingCount?: number; likesCount?: number; postsCount?: number; verified?: boolean; verifiedAt?: string }>;
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
  const [selectedVideo, setSelectedVideo] = useState<{ url: string } | null>(null);

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
                  ['instagram', 'Instagram', InstagramIconCustom],
                  ['tiktok', 'TikTok', TikTokIcon],
                  ['youtube', 'YouTube', YouTubeIconCustom],
                  ['twitter', 'X (Twitter)', XIcon],
                ] as [string, string, React.FC<{ size?: number; color?: string }>][]
              ).map(([key, label, Icon]) => {
                const url = creator.socialLinks![key];
                if (!url) return null;
                return (
                  <a key={key} href={url} target="_blank" rel="noopener noreferrer" style={s.socialPill}>
                    <Icon size={14} color={key === 'instagram' ? '#E1306C' : key === 'tiktok' ? '#000000' : key === 'youtube' ? '#FF0000' : '#000000'} />
                    <span>{label}</span>
                    {creator.socialVerified?.[key] === 'verified' && <BadgeCheck size={12} color="#059669" />}
                    {creator.socialStats?.[key]?.followerCount ? (
                      <span style={s.followerCount}>{creator.socialStats![key].followerCount!.toLocaleString()} followers</span>
                    ) : creator.followerCounts?.[key] ? (
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
            {creator.sampleVideos.map((video) => {
              const thumb = getVideoThumbnail(video);
              return (
                <div key={video.id} style={{ ...s.videoCard, cursor: 'pointer' }} onClick={() => setSelectedVideo({ url: video.url })}>
                  <div style={s.videoThumb}>
                    {thumb ? (
                      <img
                        src={thumb}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div style={s.videoPlaceholder}>
                        <Play size={20} color="#6B7280" />
                      </div>
                    )}
                    <div style={s.videoPlay}>
                      <Play size={18} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
                    </div>
                  </div>
                </div>
              );
            })}
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
        <span>Secure escrow: pay 50% to start — the creator is only paid after you approve the watermarked sample and clear the balance. The original video is then released.</span>
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

      {/* Video Lightbox */}
      {selectedVideo && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
          onClick={() => setSelectedVideo(null)}
        >
          <button
            onClick={() => setSelectedVideo(null)}
            aria-label="Close video"
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer',
              padding: 10, borderRadius: '50%', display: 'flex',
              color: '#FFFFFF', zIndex: 2,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
          >
            <X size={20} />
          </button>
          {(() => {
            const embed = getVideoEmbedUrl(selectedVideo.url);
            if (embed) {
              return (
                <div
                  style={{
                    width: '100%', maxWidth: 420, aspectRatio: '9 / 16', maxHeight: '90dvh',
                    background: '#000', borderRadius: 16, overflow: 'hidden',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <iframe
                    src={embed}
                    title="Video preview"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              );
            }
            if (isDirectVideo(selectedVideo.url)) {
              return (
                <video
                  src={selectedVideo.url}
                  controls
                  autoPlay
                  style={{
                    width: '100%', maxWidth: 420, aspectRatio: '9 / 16', maxHeight: '90dvh',
                    background: '#000', borderRadius: 16,
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              );
            }
            return (
              <div style={{ color: '#FFFFFF', fontSize: 14 }} onClick={(e) => e.stopPropagation()}>
                <a href={selectedVideo.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0EA5E9', fontWeight: 600 }}>
                  Open video
                </a>
              </div>
            );
          })()}
        </div>
      )}
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
    position: 'relative',
  },
  videoPlay: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255,255,255,0.3)',
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
