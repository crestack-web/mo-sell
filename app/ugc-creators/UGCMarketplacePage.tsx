'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { initializeFirebase } from '@/lib/firebase';
import { Star, Clock, Play, Filter, Search, X, Loader2, User as UserIcon, ChevronRight } from 'lucide-react';
import { getVideoThumbnail, getVideoEmbedUrl, isDirectVideo } from '@/lib/youtube';
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
}

type SortOption = 'rating' | 'price' | 'orders';

const SORT_LABELS: Record<SortOption, string> = {
  rating: 'Highest Rated',
  price: 'Price: Low to High',
  orders: 'Most Orders',
};

function formatPrice(price: number): string {
  if (price >= 1_000_000) return `\u20A6${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `\u20A6${(price / 1_000).toFixed(1)}K`;
  return `\u20A6${price.toLocaleString()}`;
}

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
          color={i < full || (i === full && half) ? '#F59E0B' : '#D1D5DB'}
          strokeWidth={i < full || (i === full && half) ? 0 : 1.5}
        />
      ))}
      <span style={{ fontSize: 12, color: '#6B7280', marginLeft: 4, fontWeight: 500 }}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

export function UGCMarketplacePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [niche, setNiche] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sort, setSort] = useState<SortOption>('rating');
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<{ url: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    productName: '',
    productUrl: '',
    brief: '',
    deliverables: '',
    deadline: '',
    bidAmount: '',
  });

  const nicheTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [nicheInput, setNicheInput] = useState('');

  useEffect(() => {
    const { auth } = initializeFirebase();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const fetchCreators = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (niche) params.set('niche', niche);
      if (priceMax) params.set('priceMax', String(parseFloat(priceMax) * 100));
      params.set('sort', sort);
      const res = await fetch(`/api/ugc/creators?${params.toString()}`);
      const data = await res.json();
      setCreators(data.creators ?? []);
    } catch {
      setCreators([]);
    } finally {
      setLoading(false);
    }
  }, [niche, priceMax, sort]);

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

  useEffect(() => {
    if (nicheTimer.current) clearTimeout(nicheTimer.current);
    nicheTimer.current = setTimeout(() => setNiche(nicheInput), 400);
    return () => {
      if (nicheTimer.current) clearTimeout(nicheTimer.current);
    };
  }, [nicheInput]);

  const openModal = useCallback((creator: Creator) => {
    setError('');
    setForm({ productName: '', productUrl: '', brief: '', deliverables: '', deadline: '', bidAmount: '' });
    setSelectedCreator(creator);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedCreator(null);
    setError('');
    setSubmitting(false);
  }, []);

  const handleFormChange = useCallback((field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!user || !selectedCreator) return;
    if (!form.productName.trim() || !form.brief.trim() || !form.deliverables.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/ugc/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brandId: user.uid,
            creatorId: selectedCreator.id,
            productName: form.productName.trim(),
            productUrl: form.productUrl.trim() || null,
            brief: form.brief.trim(),
            deliverables: form.deliverables.trim(),
            deadline: form.deadline || null,
            brandEmail: user.email,
            bidAmount: form.bidAmount ? form.bidAmount.trim() : null,
          }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Request failed');
        setSubmitting(false);
        return;
      }
      if (data.paystackUrl) {
        router.push(data.paystackUrl);
      } else {
        setError('Payment initialization failed. Please try again.');
        setSubmitting(false);
      }
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  }, [user, selectedCreator, form, router]);

  const containerStyle: React.CSSProperties = {
    fontFamily: 'var(--font-jakarta), sans-serif',
    background: '#FFFFFF',
    minHeight: '100dvh',
    color: '#111827',
  };

  const innerStyle: React.CSSProperties = {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '48px 24px 80px',
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: 40,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 32,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    margin: 0,
    color: '#111827',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 0,
  };

  const howStepStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
  };

  const filtersStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
    marginBottom: 36,
    padding: 16,
    background: '#F9FAFB',
    borderRadius: 12,
    border: '1px solid #F3F4F6',
  };

  const inputBase: React.CSSProperties = {
    fontFamily: 'var(--font-jakarta), sans-serif',
    fontSize: 14,
    padding: '9px 12px',
    borderRadius: 8,
    border: '1.5px solid #E5E7EB',
    background: '#FFFFFF',
    color: '#111827',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  const inputFocus: React.CSSProperties = {
    borderColor: '#0EA5E9',
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: 24,
  };

  const cardStyle: React.CSSProperties = {
    background: '#FFFFFF',
    borderRadius: 16,
    border: '1px solid #F3F4F6',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
    overflow: 'hidden',
    transition: 'box-shadow 0.2s, transform 0.2s',
  };

  const avatarSize = 56;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 999,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  };

  const modalStyle: React.CSSProperties = {
    fontFamily: 'var(--font-jakarta), sans-serif',
    background: '#FFFFFF',
    borderRadius: 20,
    maxWidth: 520,
    width: '100%',
    maxHeight: '90dvh',
    overflow: 'auto',
    padding: 32,
    position: 'relative',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 6,
    display: 'block',
  };

  return (
    <div style={containerStyle}>
      <div style={innerStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <img
              src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png"
              alt="MO Sell"
              style={{ height: 40, width: 'auto', objectFit: 'contain' }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <a
                href="/brand-auth/register"
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #E0F2FE',
                  background: '#F0F9FF',
                  color: '#0C4A6E',
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                🏢 For Brands
              </a>
              <a
                href="/brand-auth/login"
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #E0F2FE',
                  background: '#F0F9FF',
                  color: '#0C4A6E',
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Brand Login
              </a>
              <a
                href="/brand-auth/register"
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(14,165,233,0.28)',
                }}
              >
                Brand Register →
              </a>
            </div>
          </div>
          <h1 style={titleStyle}>Hire UGC Creators</h1>
          <p style={subtitleStyle}>Find the perfect creator for your brand</p>
        </div>

        {/* How it works */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 40,
          padding: 20,
          background: '#F0F9FF',
          borderRadius: 16,
          border: '1px solid #E0F2FE',
        }}>
          <div style={howStepStyle}>
            <Search size={20} color="#0EA5E9" />
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0C4A6E', margin: '0 0 4px' }}>Browse creators</p>
              <p style={{ fontSize: 13, color: '#0E7490', margin: 0, lineHeight: 1.45 }}>
                Find creators whose style fits your brand
              </p>
            </div>
          </div>
          <div style={howStepStyle}>
            <Clock size={20} color="#0EA5E9" />
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0C4A6E', margin: '0 0 4px' }}>Send a brief</p>
              <p style={{ fontSize: 13, color: '#0E7490', margin: 0, lineHeight: 1.45 }}>
                Share your product, ideas and deadline
              </p>
            </div>
          </div>
          <div style={howStepStyle}>
            <Play size={20} color="#0EA5E9" />
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0C4A6E', margin: '0 0 4px' }}>Approve videos</p>
              <p style={{ fontSize: 13, color: '#0E7490', margin: 0, lineHeight: 1.45 }}>
                Review clips before anything is posted
              </p>
            </div>
          </div>
          <div style={howStepStyle}>
            <Star size={20} color="#0EA5E9" />
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0C4A6E', margin: '0 0 4px' }}>Post &amp; grow</p>
              <p style={{ fontSize: 13, color: '#0E7490', margin: 0, lineHeight: 1.45 }}>
                Publish authentic content that sells
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={filtersStyle}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flex: 1,
            minWidth: 180,
            position: 'relative',
          }}>
            <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: 12, pointerEvents: 'none' }} />
            <input
              placeholder="Search niche..."
              value={nicheInput}
              onChange={(e) => setNicheInput(e.target.value)}
              style={{ ...inputBase, paddingLeft: 36 }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#0EA5E9'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
            />
            {nicheInput && (
              <button
                onClick={() => { setNicheInput(''); setNiche(''); }}
                style={{
                  position: 'absolute', right: 8, background: 'none', border: 'none',
                  cursor: 'pointer', padding: 4, display: 'flex',
                }}
              >
                <X size={14} color="#9CA3AF" />
              </button>
            )}
          </div>
          <div style={{ position: 'relative', minWidth: 120 }}>
            <span style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              fontSize: 13, color: '#6B7280', fontWeight: 500, pointerEvents: 'none',
            }}>&#x20A6;</span>
            <input
              placeholder="Max price"
              type="number"
              min="0"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              style={{ ...inputBase, paddingLeft: 28, width: 130 }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#0EA5E9'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Filter size={14} color="#6B7280" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              style={{
                ...inputBase,
                width: 165,
                paddingLeft: 30,
                appearance: 'none',
                cursor: 'pointer',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236B7280\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
                paddingRight: 30,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#0EA5E9'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
            >
              <option value="rating">{SORT_LABELS.rating}</option>
              <option value="price">{SORT_LABELS.price}</option>
              <option value="orders">{SORT_LABELS.orders}</option>
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
            <Loader2 size={32} color="#0EA5E9" style={{ animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {/* Empty state */}
        {!loading && creators.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <UserIcon size={48} color="#D1D5DB" style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px', color: '#374151' }}>No creators found</h3>
            <p style={{ fontSize: 14, color: '#9CA3AF', margin: 0 }}>
              Try adjusting your filters or search term
            </p>
          </div>
        )}

        {/* Creator Grid */}
        {!loading && creators.length > 0 && (
          <div style={gridStyle}>
            {creators.map((creator) => (
              <div
                key={creator.id}
                style={cardStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Card Top - Avatar + Info */}
                <div
                  onClick={() => {
                    if (creator.username) router.push(`/u/creator/${encodeURIComponent(creator.username)}`);
                  }}
                  style={{
                    padding: '20px 20px 12px', display: 'flex', alignItems: 'center', gap: 14,
                    cursor: creator.username ? 'pointer' : 'default',
                  }}
                  onMouseEnter={(e) => { if (creator.username) e.currentTarget.style.background = '#F9FAFB'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {creator.avatarUrl ? (
                    <img
                      src={creator.avatarUrl}
                      alt={creator.displayName ?? creator.name}
                      style={{
                        width: avatarSize, height: avatarSize, borderRadius: '50%',
                        objectFit: 'cover', flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div style={{
                      width: avatarSize, height: avatarSize, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0EA5E9, #6366F1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <UserIcon size={22} color="#FFFFFF" />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      fontSize: 16, fontWeight: 600, margin: 0,
                      color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {creator.displayName ?? creator.name ?? 'Creator'}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <RatingStars rating={creator.rating} />
                      <span style={{ fontSize: 12, color: '#0EA5E9', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        View Profile {'\u2192'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Niches */}
                <div style={{ padding: '0 20px 12px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(creator.niches ?? []).slice(0, 4).map((nicheItem) => (
                    <span
                      key={nicheItem}
                      style={{
                        fontSize: 11, fontWeight: 500, color: '#0EA5E9',
                        background: '#F0F9FF', padding: '3px 10px',
                        borderRadius: 100, whiteSpace: 'nowrap',
                      }}
                    >
                      {nicheItem}
                    </span>
                  ))}
                </div>
                  {/* Social links row */}
                  {creator.socialLinks && Object.keys(creator.socialLinks).some(k => creator.socialLinks![k]) && (
                    <div style={{ padding: '0 20px 12px', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                      {([
                        ['instagram', 'Instagram', InstagramIconCustom, '#E1306C'],
                        ['tiktok', 'TikTok', TikTokIcon, '#000000'],
                        ['youtube', 'YouTube', YouTubeIconCustom, '#FF0000'],
                        ['twitter', 'X', XIcon, '#000000'],
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
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '4px 10px',
                              borderRadius: 100,
                              border: '1px solid #E5E7EB',
                              background: '#FFFFFF',
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#374151',
                              textDecoration: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)';
                              e.currentTarget.style.borderColor = brandColor;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.boxShadow = 'none';
                              e.currentTarget.style.borderColor = '#E5E7EB';
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
                              <span style={{ fontSize: 10, color: '#6B7280', fontWeight: 500 }}>
                                ({formatFollowerCount(count)})
                              </span>
                            ) : null}
                          </a>
                        );
                      })}
                    </div>
                  )}

                {/* Price + Delivery */}
                <div style={{
                  padding: '12px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid #F3F4F6',
                  borderBottom: '1px solid #F3F4F6',
                }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>
                      From {formatPrice(creator.price30sDisplay)}/30s
                    </div>
                    <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                      {formatPrice(creator.price60sDisplay)}/60s
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6B7280', fontSize: 13 }}>
                    <Clock size={14} />
                    <span>Delivers in {creator.deliveryDays}d</span>
                  </div>
                </div>

                {/* Sample Videos */}
                <div style={{ padding: '12px 20px', display: 'flex', gap: 8 }}>
                  {(creator.sampleVideos ?? []).slice(0, 3).map((video, idx) => {
                    const thumb = getVideoThumbnail(video);
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
                        onClick={() => setSelectedVideo({ url: video.url })}
                      >
                        {thumb ? (
                          <img
                            src={thumb}
                            alt=""
                            style={{
                              position: 'absolute', inset: 0, width: '100%', height: '100%',
                              objectFit: 'cover',
                            }}
                            loading="lazy"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : null}
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'rgba(0,0,0,0.55)',
                          backdropFilter: 'blur(4px)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          position: 'relative', zIndex: 1,
                          border: '1px solid rgba(255,255,255,0.3)',
                        }}>
                          <Play size={14} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Request Button */}
                <div style={{ padding: '12px 20px 20px' }}>
                  <button
                    onClick={() => openModal(creator)}
                    style={{
                      width: '100%', padding: '11px 0',
                      background: '#0EA5E9', color: '#FFFFFF',
                      border: 'none', borderRadius: 10, cursor: 'pointer',
                      fontSize: 14, fontWeight: 600,
                      fontFamily: 'var(--font-jakarta), sans-serif',
                      transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#0284C7'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#0EA5E9'; }}
                  >
                    Request Video
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Modal */}
      {selectedCreator && (
        <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={closeModal}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 6, borderRadius: 8, display: 'flex',
                color: '#9CA3AF', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#374151'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#9CA3AF'; }}
            >
              <X size={18} />
            </button>

            <h2 style={{
              fontSize: 20, fontWeight: 700, margin: '0 0 4px',
              color: '#111827',
            }}>
              Request Video from {selectedCreator.name}
            </h2>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 24px' }}>
              Tell the creator what you need
            </p>

            {/* Auth check */}
            {!user && !authLoading && (
              <div style={{
                padding: 16, background: '#FFF7ED', borderRadius: 10,
                border: '1px solid #FED7AA', marginBottom: 20,
                textAlign: 'center',
              }}>
                <p style={{ fontSize: 14, color: '#9A3412', margin: '0 0 10px' }}>
                  You need to log in to request a video
                </p>
                <button
                  onClick={() => router.push('/welcome')}
                  style={{
                    padding: '10px 24px', background: '#0EA5E9', color: '#FFFFFF',
                    border: 'none', borderRadius: 8, cursor: 'pointer',
                    fontSize: 14, fontWeight: 600,
                    fontFamily: 'var(--font-jakarta), sans-serif',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#0284C7'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#0EA5E9'; }}
                >
                  Login to Request
                </button>
              </div>
            )}

            {user && (
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                {/* Price breakdown */}
                <div style={{
                  padding: 14, background: '#F0F9FF', borderRadius: 10,
                  border: '1px solid #BAE6FD', marginBottom: 20,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0369A1' }}>
                    {form.bidAmount ? 'Your Bid' : '30s Video Price'}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#0369A1' }}>
                    {form.bidAmount ? formatPrice(Number(form.bidAmount)) : formatPrice(selectedCreator.price30sDisplay)}
                  </span>
                </div>

                {error && (
                  <div style={{
                    padding: 12, background: '#FEF2F2', borderRadius: 8,
                    border: '1px solid #FECACA', marginBottom: 16,
                    fontSize: 13, color: '#DC2626',
                  }}>
                    {error}
                  </div>
                )}

                {/* Product Name */}
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Product Name *</label>
                  <input
                    placeholder="e.g. Organic Skincare Set"
                    value={form.productName}
                    onChange={(e) => handleFormChange('productName', e.target.value)}
                    style={inputBase}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#0EA5E9'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
                  />
                </div>

                {/* Product URL */}
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Product URL <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optional)</span></label>
                  <input
                    placeholder="https://yourstore.com/product"
                    value={form.productUrl}
                    onChange={(e) => handleFormChange('productUrl', e.target.value)}
                    style={inputBase}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#0EA5E9'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
                  />
                </div>

                {/* Brief */}
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Brief *</label>
                  <textarea
                    placeholder="Describe your brand, product, and the type of content you want..."
                    value={form.brief}
                    onChange={(e) => handleFormChange('brief', e.target.value)}
                    rows={4}
                    style={{ ...inputBase, resize: 'vertical', minHeight: 80, lineHeight: 1.5 }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#0EA5E9'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
                  />
                </div>

                {/* Deliverables */}
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Deliverables *</label>
                  <textarea
                    placeholder="Specify what you need: e.g. 1x 30s video, 1x 60s video, raw footage..."
                    value={form.deliverables}
                    onChange={(e) => handleFormChange('deliverables', e.target.value)}
                    rows={3}
                    style={{ ...inputBase, resize: 'vertical', minHeight: 70, lineHeight: 1.5 }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#0EA5E9'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
                  />
                </div>

                {/* Deadline */}
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Deadline <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optional)</span></label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) => handleFormChange('deadline', e.target.value)}
                    style={inputBase}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#0EA5E9'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
                  />
                </div>

                {/* Bid Amount */}
                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>Your Offer (Bid) <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(optional — leave blank to use creator's price)</span></label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                      fontSize: 15, color: '#6B7280', fontWeight: 600, pointerEvents: 'none',
                    }}>&#x20A6;</span>
                    <input
                      placeholder={String(selectedCreator.price30sDisplay)}
                      type="number"
                      min="0"
                      value={form.bidAmount}
                      onChange={(e) => handleFormChange('bidAmount', e.target.value)}
                      style={{ ...inputBase, paddingLeft: 28 }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#0EA5E9'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: '100%', padding: '13px 0',
                    background: submitting ? '#9CA3AF' : '#0EA5E9',
                    color: '#FFFFFF', border: 'none', borderRadius: 10,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    fontSize: 15, fontWeight: 600,
                    fontFamily: 'var(--font-jakarta), sans-serif',
                    transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                  onMouseEnter={(e) => {
                    if (!submitting) e.currentTarget.style.background = '#0284C7';
                  }}
                  onMouseLeave={(e) => {
                    if (!submitting) e.currentTarget.style.background = '#0EA5E9';
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
                      Processing...
                    </>
                  ) : (
                    'Submit Request \u2192 Pay 50% Deposit'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Video Lightbox */}
      {selectedVideo && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
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
