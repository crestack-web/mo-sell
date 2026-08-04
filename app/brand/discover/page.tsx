'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { initializeFirebase } from '@/lib/firebase';
import { supabaseClient } from '@/lib/supabase-client';
import { ToastProvider, useToast } from '@/components/brand/ToastProvider';
import { Star, Clock, Play, Filter, Search, X, Loader2, User as UserIcon, ChevronRight, Building, ShoppingBag, Wallet, CreditCard } from 'lucide-react';

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
}

type SortOption = 'rating' | 'price' | 'orders';

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
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; price: number; title: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'direct'>('wallet');

  useEffect(() => {
    const { auth } = initializeFirebase();
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Check if user has brand account
        try {
          const { data: { user: supabaseUser } } = await supabaseClient.auth.getUser();
          if (supabaseUser) {
            // We'll need to implement brand check via Supabase
            // For now, we'll assume brand account exists
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
  };

  const handleBuyVideo = (video: { url: string; price: number; title: string }) => {
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
      const response = await fetch('/api/brand/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: selectedVideo.url, // This should be the actual video ID
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
        // Wallet payment successful
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
    <div style={{ minHeight: '100vh', background: THEME.bg, fontFamily: FONTS.body }}>
      {/* Header */}
      <header style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 50, 
        background: `${THEME.surface}80`, 
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${THEME.border}`,
        padding: '16px 24px',
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: THEME.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building size={24} color="white" />
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: THEME.text1, fontFamily: FONTS.display }}>
              UGC Marketplace
            </span>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => router.push('/brand/discover')}
              style={{
                padding: '10px 20px',
                background: `${THEME.primary}20`,
                border: 'none',
                borderRadius: 8,
                color: THEME.primary,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Browse
            </button>
            <button
              onClick={() => router.push('/ugc-creators')}
              style={{
                padding: '10px 20px',
                background: 'transparent',
                border: 'none',
                borderRadius: 8,
                color: THEME.text2,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Creators
            </button>

            {brand ? (
              <button
                onClick={() => router.push('/brand/dashboard')}
                style={{
                  padding: '10px 20px',
                  background: THEME.primary,
                  border: 'none',
                  borderRadius: 8,
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => router.push('/brand/login')}
                  style={{
                    padding: '10px 20px',
                    background: 'transparent',
                    border: `1px solid ${THEME.border}`,
                    borderRadius: 8,
                    color: THEME.text2,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Login
                </button>
                <button
                  onClick={() => router.push('/brand/register')}
                  style={{
                    padding: '10px 20px',
                    background: THEME.primary,
                    border: 'none',
                    borderRadius: 8,
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Register as Brand
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: 32 }}>
        {/* Filters */}
        <div style={{ 
          padding: 20, 
          borderRadius: 12, 
          background: THEME.surface, 
          border: `1px solid ${THEME.border}`,
          marginBottom: 32,
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={18} color={THEME.text3} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search creators or niches..."
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                background: THEME.bg,
                border: `1px solid ${THEME.border}`,
                borderRadius: 8,
                color: THEME.text1,
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          <input
            type="number"
            placeholder="Max Price ($)"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            style={{
              padding: '10px 16px',
              background: THEME.bg,
              border: `1px solid ${THEME.border}`,
              borderRadius: 8,
              color: THEME.text1,
              fontSize: 14,
              width: 140,
            }}
          />

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            style={{
              padding: '10px 16px',
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
            <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: THEME.primary }} />
          </div>
        ) : creators.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: THEME.text3 }}>
            <UserIcon size={64} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h3 style={{ fontSize: 20, fontWeight: 600, color: THEME.text1, marginBottom: 8 }}>
              No creators found
            </h3>
            <p style={{ fontSize: 14 }}>Try adjusting your filters</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {creators.map((creator) => (
              <div
                key={creator.id}
                style={{
                  borderRadius: 16,
                  background: THEME.surface,
                  border: `1px solid ${THEME.border}`,
                  overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Sample Video */}
                {creator.sampleVideos?.[0] && (
                  <div style={{ position: 'relative', aspectRatio: '9/16', background: THEME.bg, cursor: 'pointer' }}>
                    <img
                      src={creator.sampleVideos[0].thumbnailUrl || creator.sampleVideos[0].thumbnail || ''}
                      alt={creator.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ 
                      position: 'absolute', 
                      inset: 0, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      background: 'rgba(0,0,0,0.3)',
                    }}>
                      <div style={{ 
                        width: 56, 
                        height: 56, 
                        borderRadius: '50%', 
                        background: 'rgba(255,255,255,0.9)',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                      }}>
                        <Play size={24} color={THEME.bg} fill={THEME.bg} />
                      </div>
                    </div>
                    <div style={{ 
                      position: 'absolute', 
                      bottom: 12, 
                      right: 12, 
                      padding: '6px 12px', 
                      borderRadius: 6, 
                      background: `${THEME.primary}90`,
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'white',
                    }}>
                      ${creator.price30sDisplay}
                    </div>
                  </div>
                )}

                {/* Creator Info */}
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ 
                      width: 44, 
                      height: 44, 
                      borderRadius: '50%', 
                      background: THEME.surfaceHover,
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: 18,
                      fontWeight: 700,
                      color: THEME.text2,
                    }}>
                      {creator.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: THEME.text1, marginBottom: 2 }}>
                        {creator.displayName || creator.name}
                      </h3>
                      <p style={{ fontSize: 13, color: THEME.text3 }}>
                        @{creator.username}
                      </p>
                    </div>
                  </div>

                  {/* Rating */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
                    <Star size={14} fill={THEME.success} color={THEME.success} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: THEME.text1 }}>
                      {creator.rating.toFixed(1)}
                    </span>
                    <span style={{ fontSize: 13, color: THEME.text3 }}>
                      ({creator.totalOrders} orders)
                    </span>
                  </div>

                  {/* Niches */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                    {creator.niches.slice(0, 3).map((niche, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 4,
                          background: `${THEME.primary}15`,
                          color: THEME.primary,
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        {niche}
                      </span>
                    ))}
                  </div>

                  {/* Social Links */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    {creator.socialLinks?.tiktok && (
                      <TikTokIcon size={16} color={THEME.text3} />
                    )}
                    {creator.socialLinks?.instagram && (
                      <InstagramIconCustom size={16} color={THEME.text3} />
                    )}
                    {creator.socialLinks?.youtube && (
                      <YouTubeIconCustom size={16} color={THEME.text3} />
                    )}
                  </div>

                  {/* Buy Button */}
                  <button
                    onClick={() => {
                      setSelectedCreator(creator);
                      if (creator.sampleVideos?.[0]) {
                        handleBuyVideo({
                          url: creator.sampleVideos[0].url,
                          price: creator.price30sDisplay,
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
                    <ShoppingBag size={18} />
                    Buy Video ${creator.price30sDisplay}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0,0,0,0.7)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 100,
        }}>
          <div style={{ 
            padding: 32, 
            borderRadius: 16, 
            background: THEME.surface, 
            border: `1px solid ${THEME.border}`,
            maxWidth: 440,
            width: '90%',
          }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: THEME.text1, fontFamily: FONTS.display, marginBottom: 12 }}>
              Create a Brand Account
            </h2>
            <p style={{ fontSize: 14, color: THEME.text2, marginBottom: 24 }}>
              To purchase UGC content, you need to register as a brand
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  router.push('/brand/register');
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
                  router.push('/brand/login');
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
          zIndex: 100,
        }}>
          <div style={{ 
            padding: 32, 
            borderRadius: 16, 
            background: THEME.surface, 
            border: `1px solid ${THEME.border}`,
            maxWidth: 480,
            width: '90%',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: THEME.text1, fontFamily: FONTS.display }}>
                Checkout
              </h2>
              <button
                onClick={() => setShowCheckoutModal(false)}
                style={{ background: 'none', border: 'none', color: THEME.text3, cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 14, color: THEME.text2, marginBottom: 8 }}>
                {selectedVideo.title}
              </p>
              <div style={{ fontSize: 32, fontWeight: 700, color: THEME.text1, fontFamily: FONTS.display }}>
                ${selectedVideo.price.toFixed(2)}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
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
                  }}
                >
                  <Wallet size={24} color={paymentMethod === 'wallet' ? THEME.primary : THEME.text2} />
                  <div style={{ textAlign: 'left' }}>
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
                  }}
                >
                  <CreditCard size={24} color={paymentMethod === 'direct' ? THEME.primary : THEME.text2} />
                  <div style={{ textAlign: 'left' }}>
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
                  <p style={{ fontSize: 13, color: THEME.error }}>
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