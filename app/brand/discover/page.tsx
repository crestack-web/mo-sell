'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { initializeFirebase } from '@/lib/firebase';
import { supabaseClient } from '@/lib/supabase-client';
import { ToastProvider, useToast } from '@/components/brand/ToastProvider';
import { Star, Clock, Play, Search, X, Loader2, User as UserIcon, ChevronRight, ShoppingBag, Wallet, CreditCard, Sparkles } from 'lucide-react';

// ── Theme ────────────────────────────────────────────────────────────────────
const THEME = {
  bg: '#0A0A0B',
  surface: '#141416',
  surfaceHover: '#1A1A1D',
  border: '#2A2A2E',
  primary: '#6366F1',
  primaryHover: '#4F46E5',
  text1: '#FFFFFF',
  text2: '#A1A1AA',
  text3: '#71717A',
  success: '#10B981',
  error: '#EF4444',
} as const;

const FONTS = {
  display: "'Inter', system-ui, sans-serif",
  body: "'Inter', system-ui, sans-serif",
};

const TikTokIcon = ({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
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
  if (num >= 1000000) return (num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + 'K';
  return num.toString();
};

const currencySymbol = (currency?: string): string => {
  if (currency === 'NGN') return '₦';
  if (currency === 'USD') return '$';
  if (currency === 'GHS') return 'GH₵';
  return currency ? `${currency} ` : '₦';
};

interface Creator {
  id: string;
  userId: string;
  name: string;
  displayName?: string;
  username: string;
  avatarUrl?: string;
  niches: string[];
  price30s: number;
  price60s: number;
  currency?: string;
  price30sDisplay: number;
  price60sDisplay: number;
  deliveryDays: number;
  rating: number;
  totalOrders: number;
  sampleVideos: { id: string; thumbnailUrl?: string; thumbnail?: string | null; url: string }[];
  socialLinks?: Record<string, string>;
  socialVerified?: Record<string, string>;
  followerCounts?: Record<string, number>;
  socialStats?: Record<string, { followerCount?: number; followingCount?: number; likesCount?: number; postsCount?: number; verified?: boolean; verifiedAt?: string }>;
  score?: number | null;
  grade?: string | null;
  metrics?: {
    er?: number | null;
    avgViews?: number | null;
    topHashtags?: { name: string; count: number }[];
    audienceGuess?: { primary: string; confidence: number } | null;
    followers?: number | null;
  } | null;
}

type SortOption = 'rating' | 'price' | 'orders';

function RatingStars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={14}
          fill={i < full || (i === full && half) ? '#F59E0B' : 'none'}
          color={i < full || (i === full && half) ? '#F59E0B' : '#3F3F46'}
          strokeWidth={i < full || (i === full && half) ? 0 : 1.5}
        />
      ))}
      <span style={{ fontSize: 12, color: THEME.text2, marginLeft: 4, fontWeight: 500 }}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

function BrandDiscoverPageContent() {
  const router = useRouter();
  const { showSuccess, showError, showInfo } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [brand, setBrand] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [niche, setNiche] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sort, setSort] = useState<SortOption>('rating');
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; price: number; title: string; currency?: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'direct'>('wallet');
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  useEffect(() => {
    const { auth } = initializeFirebase();
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const { data: { user: supabaseUser } } = await supabaseClient.auth.getUser();
          if (supabaseUser) {
            setBrand({ id: supabaseUser.id, email: supabaseUser.email });
          }
        } catch (error) {
          console.error('Brand check error:', error);
        }
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    fetchCreators();
  }, [niche, priceMax, sort]);

  const fetchCreators = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (niche) params.set('niche', niche);
      if (priceMax) params.set('priceMax', String((parseFloat(priceMax) || 0) * 100));
      params.set('sort', sort);
      const res = await fetch(`/api/ugc/creators?${params.toString()}`);
      const data = await res.json();
      setCreators(data.creators ?? []);
    } catch {
      setCreators([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (creator: Creator) => {
    if (analyzingId) return;
    const tiktok = creator.socialLinks?.tiktok;
    const instagram = creator.socialLinks?.instagram;
    if (!tiktok && !instagram) {
      showError('This creator has no TikTok or Instagram link to analyze.');
      return;
    }
    setAnalyzingId(creator.id);
    try {
      const res = await fetch('/api/apify/creator-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(tiktok ? { tiktokUrl: tiktok } : {}),
          ...(instagram ? { igHandle: instagram } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Analysis failed');
      }
      setCreators(prev =>
        prev.map(c =>
          c.id === creator.id
            ? {
                ...c,
                score: data.score,
                grade: data.grade,
                metrics: {
                  er: data.er,
                  avgViews: data.avgViews,
                  topHashtags: data.topHashtags,
                  audienceGuess: data.audienceGuess,
                  followers: data.followers,
                },
              }
            : c,
        ),
      );
      showInfo(`@${creator.username} score: ${data.score}/100 (${data.grade}) — avg views ${formatViews(data.avgViews)}, ER ${data.er ?? 0}%`);
    } catch (error: any) {
      showError(error.message || 'Failed to analyze creator');
    } finally {
      setAnalyzingId(null);
    }
  };

  const formatViews = (v: number | null | undefined) => {
    if (v == null) return 'n/a';
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
    return String(v);
  };

  const scoreColor = (grade: string | null | undefined) => {
    switch (grade) {
      case 'A': return THEME.success;
      case 'B': return '#22C55E';
      case 'C': return '#F59E0B';
      case 'D': return '#F97316';
      default: return THEME.error;
    }
  };

  const handleBuyVideo = (video: { url: string; price: number; title: string; currency?: string }) => {
    if (!brand) {
      setSelectedVideo(video);
      setShowAuthModal(true);
    } else {
      setSelectedVideo(video);
      setShowCheckoutModal(true);
    }
  };

  const handleCheckout = async () => {
    if (!selectedVideo || !brand) return;

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      const response = await fetch('/api/brand/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          videoId: selectedVideo.url,
          creatorId: selectedCreator?.id,
          paymentMethod,
          brandId: brand.id,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.insufficientAmount) {
          alert(`Insufficient wallet balance. You need $${data.insufficientAmount.toFixed(2)} more.`);
          return;
        }
        throw new Error(data.error || 'Purchase failed');
      }

      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        showSuccess('Purchase successful! Video added to your library.');
        setShowCheckoutModal(false);
        router.push('/brand/videos');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      showError(error.message || 'Purchase failed');
    }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: THEME.bg }}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: THEME.primary }} />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: FONTS.body }}>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: THEME.text1, fontFamily: FONTS.display, margin: 0, marginBottom: 6 }}>
          Discover Creators
        </h1>
        <p style={{ fontSize: 14, color: THEME.text2, margin: 0 }}>
          Find UGC creators for your brand — check scores, then buy their videos instantly.
        </p>
      </div>

      {/* How it works */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))',
        gap: 14,
        marginBottom: 24,
        padding: 18,
        background: THEME.surface,
        borderRadius: 16,
        border: `1px solid ${THEME.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <Search size={18} color={THEME.primary} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: THEME.text1, margin: '0 0 3px' }}>Browse creators</p>
            <p style={{ fontSize: 12.5, color: THEME.text3, margin: 0, lineHeight: 1.45 }}>Find creators whose style fits your brand</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <Sparkles size={18} color={THEME.primary} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: THEME.text1, margin: '0 0 3px' }}>Check scores</p>
            <p style={{ fontSize: 12.5, color: THEME.text3, margin: 0, lineHeight: 1.45 }}>Analyze views, engagement and audience</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <Play size={18} color={THEME.primary} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: THEME.text1, margin: '0 0 3px' }}>Buy videos</p>
            <p style={{ fontSize: 12.5, color: THEME.text3, margin: 0, lineHeight: 1.45 }}>Pay with wallet or card — instant delivery</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <ShoppingBag size={18} color={THEME.primary} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: THEME.text1, margin: '0 0 3px' }}>Reuse &amp; grow</p>
            <p style={{ fontSize: 12.5, color: THEME.text3, margin: 0, lineHeight: 1.45 }}>Download and run your UGC ads</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        padding: 16,
        borderRadius: 12,
        background: THEME.surface,
        border: `1px solid ${THEME.border}`,
        marginBottom: 24,
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
          <Search size={16} color={THEME.text3} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search creators or niches..."
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              boxSizing: 'border-box',
              background: THEME.bg,
              border: `1px solid ${THEME.border}`,
              borderRadius: 8,
              color: THEME.text1,
              fontSize: 14,
              outline: 'none',
            }}
            onFocus={(e) => e.target.style.borderColor = THEME.primary}
            onBlur={(e) => e.target.style.borderColor = THEME.border}
          />
          {niche && (
            <button
              onClick={() => setNiche('')}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: THEME.text3 }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <input
          type="number"
          placeholder="Max Price ($)"
          value={priceMax}
          onChange={(e) => setPriceMax(e.target.value)}
          style={{
            padding: '10px 12px',
            boxSizing: 'border-box',
            background: THEME.bg,
            border: `1px solid ${THEME.border}`,
            borderRadius: 8,
            color: THEME.text1,
            fontSize: 14,
            width: 140,
          }}
          onFocus={(e) => e.target.style.borderColor = THEME.primary}
          onBlur={(e) => e.target.style.borderColor = THEME.border}
        />

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          style={{
            padding: '10px 12px',
            background: THEME.bg,
            border: `1px solid ${THEME.border}`,
            borderRadius: 8,
            color: THEME.text1,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          <option value="rating">Highest Rated</option>
          <option value="price">Price: Low to High</option>
          <option value="orders">Most Orders</option>
        </select>
      </div>

      {/* Creators Grid */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
          <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', color: THEME.primary }} />
        </div>
      ) : creators.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 64, color: THEME.text3 }}>
          <UserIcon size={56} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: THEME.text1, margin: '0 0 6px' }}>
            No creators found
          </h3>
          <p style={{ fontSize: 13.5, margin: 0 }}>Try adjusting your filters</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap: 20 }}>
          {creators.map((creator) => (
            <div
              key={creator.id}
              style={{
                borderRadius: 16,
                background: THEME.surface,
                border: `1px solid ${THEME.border}`,
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Card Top - Avatar + Info */}
              <div
                onClick={() => { if (creator.username) router.push(`/u/creator/${encodeURIComponent(creator.username)}`); }}
                style={{
                  padding: '18px 18px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  cursor: creator.username ? 'pointer' : 'default',
                }}
                onMouseEnter={(e) => { if (creator.username) e.currentTarget.style.background = THEME.surfaceHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                {creator.avatarUrl ? (
                  <img
                    src={creator.avatarUrl}
                    alt={creator.displayName ?? creator.name}
                    style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                  />
                ) : (
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${THEME.primary}, #8B5CF6)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <UserIcon size={22} color="#FFFFFF" />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontSize: 15.5, fontWeight: 600, margin: '0 0 4px',
                    color: THEME.text1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {creator.displayName ?? creator.name ?? 'Creator'}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <RatingStars rating={Number(creator.rating) || 0} />
                    {creator.username ? (
                      <span style={{ fontSize: 12, color: THEME.primary, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        View Profile →
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Score badge */}
              {creator.score != null && creator.grade && (
                <div style={{ padding: '0 18px 10px' }}>
                  <span
                    title={`Creator score: ${creator.score}/100 — avg views ${formatViews(creator.metrics?.avgViews)}, ER ${creator.metrics?.er ?? 0}%`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '4px 10px', borderRadius: 999,
                      background: `${scoreColor(creator.grade)}18`,
                      border: `1px solid ${scoreColor(creator.grade)}50`,
                      color: scoreColor(creator.grade),
                      fontSize: 12, fontWeight: 700,
                    }}
                  >
                    {creator.grade} · {creator.score}
                    <span style={{ fontWeight: 500, opacity: 0.8 }}>avg views {formatViews(creator.metrics?.avgViews)} · ER {creator.metrics?.er ?? 0}%</span>
                  </span>
                </div>
              )}

              {/* Niches */}
              <div style={{ padding: '0 18px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(creator.niches ?? []).slice(0, 3).map((n, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: 11, fontWeight: 500, color: THEME.primary,
                      background: `${THEME.primary}15`, padding: '3px 10px',
                      borderRadius: 100, whiteSpace: 'nowrap',
                    }}
                  >
                    {n}
                  </span>
                ))}
              </div>

              {/* Social links row */}
              {creator.socialLinks && Object.keys(creator.socialLinks).some(k => creator.socialLinks![k]) && (
                <div style={{ padding: '0 18px 10px', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                  {([
                    ['instagram', 'Instagram', InstagramIconCustom, '#E1306C'],
                    ['tiktok', 'TikTok', TikTokIcon, '#FFFFFF'],
                    ['youtube', 'YouTube', YouTubeIconCustom, '#FF0000'],
                  ] as [string, string, React.FC<{ size?: number; color?: string }>, string][]).map(([key, label, Icon, brandColor]) => {
                    const url = creator.socialLinks![key];
                    if (!url) return null;
                    const count = creator.socialStats?.[key]?.followerCount ?? creator.followerCounts?.[key];
                    const isVerified = creator.socialVerified?.[key] === 'verified';
                    return (
                      <a
                        key={key}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '4px 10px', borderRadius: 100,
                          border: `1px solid ${THEME.border}`,
                          background: THEME.bg,
                          fontSize: 11, fontWeight: 600,
                          color: THEME.text2, textDecoration: 'none', cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = brandColor;
                          e.currentTarget.style.color = brandColor;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = THEME.border;
                          e.currentTarget.style.color = THEME.text2;
                        }}
                      >
                        <Icon size={12} color={brandColor} />
                        <span style={{ fontSize: 11 }}>{label}</span>
                        {isVerified && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="#059669" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                          </svg>
                        )}
                        {count ? (
                          <span style={{ fontSize: 10, color: THEME.text3, fontWeight: 500 }}>
                            ({formatFollowerCount(count)})
                          </span>
                        ) : null}
                      </a>
                    );
                  })}
                  <button
                    onClick={() => handleAnalyze(creator)}
                    disabled={analyzingId !== null}
                    style={{
                      marginLeft: 'auto',
                      padding: '5px 10px',
                      background: 'transparent',
                      border: `1px solid ${THEME.border}`,
                      borderRadius: 100,
                      color: THEME.text2,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: analyzingId !== null ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'all 0.2s',
                      opacity: analyzingId !== null && analyzingId !== creator.id ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = THEME.primary; e.currentTarget.style.color = THEME.primary; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = THEME.border; e.currentTarget.style.color = THEME.text2; }}
                  >
                    {analyzingId === creator.id ? (
                      <>
                        <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                        Analyzing…
                      </>
                    ) : (
                      <>
                        <Sparkles size={12} />
                        Analyze
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Price + Delivery */}
              <div style={{
                padding: '12px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: `1px solid ${THEME.border}`,
                borderBottom: `1px solid ${THEME.border}`,
                gap: 8,
                flexWrap: 'wrap',
              }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: THEME.text1 }}>
                    From {currencySymbol(creator.currency)}{creator.price30sDisplay ?? 0}/30s
                  </div>
                  <div style={{ fontSize: 12.5, color: THEME.text3, marginTop: 2 }}>
                    {currencySymbol(creator.currency)}{creator.price60sDisplay ?? 0}/60s
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: THEME.text3, fontSize: 13 }}>
                  <Clock size={14} />
                  <span>Delivers in {creator.deliveryDays}d</span>
                </div>
              </div>

              {/* Sample videos */}
              <div style={{ padding: '12px 18px', display: 'flex', gap: 8 }}>
                {(creator.sampleVideos ?? []).slice(0, 3).map((video, idx) => {
                  const thumb = video.thumbnailUrl || video.thumbnail || '';
                  return (
                    <div
                      key={video.id || idx}
                      style={{
                        flex: 1, aspectRatio: '9 / 16', maxWidth: '33%',
                        borderRadius: 8, background: 'linear-gradient(135deg, #1E293B, #334155)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative', overflow: 'hidden',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setSelectedCreator(creator);
                        handleBuyVideo({
                          url: video.url,
                          price: creator.price30sDisplay,
                          currency: creator.currency,
                          title: `${creator.displayName || creator.name}'s Video`,
                        });
                      }}
                    >
                      {thumb ? (
                        <img
                          src={thumb}
                          alt=""
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : null}
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.55)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative', zIndex: 1,
                        border: '1px solid rgba(255,255,255,0.3)',
                      }}>
                        <Play size={13} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Buy Button */}
              <div style={{ padding: '0 18px 16px', marginTop: 'auto' }}>
                <button
                  onClick={() => {
                    setSelectedCreator(creator);
                    if (creator.sampleVideos?.[0]) {
                      handleBuyVideo({
                        url: creator.sampleVideos[0].url,
                        price: creator.price30sDisplay,
                        currency: creator.currency,
                        title: `${creator.displayName || creator.name}'s Video`,
                      });
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: 12,
                    background: THEME.primary,
                    border: 'none',
                    borderRadius: 8,
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = THEME.primaryHover}
                  onMouseLeave={(e) => e.currentTarget.style.background = THEME.primary}
                >
                  <ShoppingBag size={17} />
                  Buy Video {currencySymbol(creator.currency)}{creator.price30sDisplay ?? 0}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          zIndex: 100,
        }}>
          <div style={{
            padding: 28,
            borderRadius: 16,
            background: THEME.surface,
            border: `1px solid ${THEME.border}`,
            maxWidth: 420,
            width: '100%',
            maxHeight: '90dvh',
            overflowY: 'auto',
          }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: THEME.text1, fontFamily: FONTS.display, margin: 0, marginBottom: 10 }}>
              Create a Brand Account
            </h2>
            <p style={{ fontSize: 14, color: THEME.text2, margin: '0 0 20px' }}>
              To purchase UGC content, you need to register as a brand
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  router.push('/brand-auth/register');
                }}
                style={{
                  padding: 14,
                  background: THEME.primary,
                  border: 'none',
                  borderRadius: 8,
                  color: 'white',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = THEME.primaryHover}
                onMouseLeave={(e) => e.currentTarget.style.background = THEME.primary}
              >
                Register as Brand
              </button>

              <button
                onClick={() => {
                  setShowAuthModal(false);
                  router.push('/brand-auth/login');
                }}
                style={{
                  padding: 14,
                  background: 'transparent',
                  border: `1px solid ${THEME.border}`,
                  borderRadius: 8,
                  color: THEME.text2,
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = THEME.primary;
                  e.currentTarget.style.color = THEME.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = THEME.border;
                  e.currentTarget.style.color = THEME.text2;
                }}
              >
                Login
              </button>

              <button
                onClick={() => setShowAuthModal(false)}
                style={{
                  padding: 12,
                  background: 'transparent',
                  border: 'none',
                  color: THEME.text3,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Continue as Guest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && selectedVideo && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          zIndex: 100,
        }}>
          <div style={{
            padding: 28,
            borderRadius: 16,
            background: THEME.surface,
            border: `1px solid ${THEME.border}`,
            maxWidth: 440,
            width: '100%',
            maxHeight: '90dvh',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: THEME.text1, fontFamily: FONTS.display, margin: 0 }}>
                Checkout
              </h2>
              <button
                onClick={() => setShowCheckoutModal(false)}
                style={{ background: 'none', border: 'none', color: THEME.text3, cursor: 'pointer', padding: 4 }}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 14, color: THEME.text2, margin: '0 0 6px' }}>
                {selectedVideo.title}
              </p>
              <div style={{ fontSize: 30, fontWeight: 700, color: THEME.text1, fontFamily: FONTS.display }}>
                {currencySymbol(selectedVideo.currency)}{selectedVideo.price.toFixed(2)}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: THEME.text2, marginBottom: 12 }}>
                Choose Payment Method
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button
                  onClick={() => setPaymentMethod('wallet')}
                  style={{
                    padding: 16,
                    background: paymentMethod === 'wallet' ? `${THEME.primary}15` : THEME.bg,
                    border: paymentMethod === 'wallet' ? `2px solid ${THEME.primary}` : `1px solid ${THEME.border}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'all 0.2s',
                    textAlign: 'left',
                  }}
                >
                  <Wallet size={22} color={paymentMethod === 'wallet' ? THEME.primary : THEME.text2} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: paymentMethod === 'wallet' ? THEME.primary : THEME.text1 }}>
                      Pay From Wallet
                    </div>
                    <div style={{ fontSize: 13, color: THEME.text3 }}>
                      Current Balance: ${brand?.walletBalance?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('direct')}
                  style={{
                    padding: 16,
                    background: paymentMethod === 'direct' ? `${THEME.primary}15` : THEME.bg,
                    border: paymentMethod === 'direct' ? `2px solid ${THEME.primary}` : `1px solid ${THEME.border}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'all 0.2s',
                    textAlign: 'left',
                  }}
                >
                  <CreditCard size={22} color={paymentMethod === 'direct' ? THEME.primary : THEME.text2} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: paymentMethod === 'direct' ? THEME.primary : THEME.text1 }}>
                      Pay Direct
                    </div>
                    <div style={{ fontSize: 13, color: THEME.text3 }}>
                      One-time payment via Paystack
                    </div>
                  </div>
                </button>
              </div>

              {paymentMethod === 'wallet' && brand?.walletBalance < selectedVideo.price && (
                <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: `${THEME.error}15`, border: `1px solid ${THEME.error}30` }}>
                  <p style={{ fontSize: 13, color: THEME.error, margin: 0 }}>
                    Insufficient funds. Top up ${(selectedVideo.price - brand.walletBalance).toFixed(2)} or switch to direct payment.
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleCheckout}
              disabled={paymentMethod === 'wallet' && brand?.walletBalance < selectedVideo.price}
              style={{
                width: '100%',
                padding: 14,
                background: paymentMethod === 'wallet' && brand?.walletBalance < selectedVideo.price ? THEME.surfaceHover : THEME.primary,
                border: 'none',
                borderRadius: 8,
                color: 'white',
                fontSize: 15,
                fontWeight: 600,
                cursor: paymentMethod === 'wallet' && brand?.walletBalance < selectedVideo.price ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => !(paymentMethod === 'wallet' && brand?.walletBalance < selectedVideo.price) && (e.currentTarget.style.background = THEME.primaryHover)}
              onMouseLeave={(e) => !(paymentMethod === 'wallet' && brand?.walletBalance < selectedVideo.price) && (e.currentTarget.style.background = THEME.primary)}
            >
              Complete Purchase
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function BrandDiscoverPage() {
  return (
    <ToastProvider>
      <BrandDiscoverPageContent />
    </ToastProvider>
  );
}
