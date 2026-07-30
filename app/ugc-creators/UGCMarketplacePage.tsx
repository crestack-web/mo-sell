'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { initializeFirebase } from '@/lib/firebase';
import { Star, Clock, Play, Filter, Search, X, Loader2, User as UserIcon, ChevronRight } from 'lucide-react';

interface Creator {
  id: string;
  userId: string;
  name: string;
  avatarUrl?: string;
  niches: string[];
  price30s: number;
  price60s: number;
  price30sDisplay: number;
  price60sDisplay: number;
  deliveryDays: number;
  rating: number;
  totalOrders: number;
  sampleVideos: { id: string; thumbnailUrl?: string; url: string }[];
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
          <h1 style={titleStyle}>Hire UGC Creators</h1>
          <p style={subtitleStyle}>Find the perfect creator for your brand</p>
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
                <div style={{ padding: '20px 20px 12px', display: 'flex', alignItems: 'center', gap: 14 }}>
                  {creator.avatarUrl ? (
                    <img
                      src={creator.avatarUrl}
                      alt={creator.name}
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
                      {creator.name}
                    </h3>
                    <RatingStars rating={creator.rating} />
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
                  {(creator.sampleVideos ?? []).slice(0, 3).map((video, idx) => (
                    <div
                      key={video.id || idx}
                      style={{
                        flex: 1, aspectRatio: '9 / 16', maxWidth: '33%',
                        borderRadius: 8, background: 'linear-gradient(135deg, #1E293B, #334155)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        position: 'relative', overflow: 'hidden',
                        cursor: 'pointer',
                      }}
                      onClick={() => window.open(video.url, '_blank')}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Play size={14} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
                      </div>
                    </div>
                  ))}
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
    </div>
  );
}
