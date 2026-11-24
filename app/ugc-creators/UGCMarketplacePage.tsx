'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { initializeFirebase } from '@/lib/firebase';
import {
  Star, Clock, Search, X, Loader2, User as UserIcon,
  ChevronRight, Sparkles, ArrowRight, SlidersHorizontal,
  MessageCircle, CheckCircle2, Camera, WandSparkles,
} from 'lucide-react';
import { VideoEmbed } from '@/components/VideoEmbed';
import { VideoPoster } from '@/components/VideoPoster';

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
  if (num >= 1000000) return (num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + 'K';
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
          size={13}
          fill={i < full || (i === full && half) ? '#F59E0B' : 'none'}
          color={i < full || (i === full && half) ? '#F59E0B' : '#D1D5DB'}
          strokeWidth={i < full || (i === full && half) ? 0 : 1.5}
        />
      ))}
      <span style={{ fontSize: 12, color: '#6B7280', marginLeft: 4, fontWeight: 700 }}>{rating.toFixed(1)}</span>
    </div>
  );
}

const CARD_GRADIENTS = [
  'linear-gradient(135deg,#0EA5E9 0%,#6366F1 100%)',
  'linear-gradient(135deg,#F472B6 0%,#7C3AED 100%)',
  'linear-gradient(135deg,#F59E0B 0%,#EF4444 100%)',
  'linear-gradient(135deg,#10B981 0%,#0EA5E9 100%)',
  'linear-gradient(135deg,#8B5CF6 0%,#EC4899 100%)',
  'linear-gradient(135deg,#14B8A6 0%,#6366F1 100%)',
];

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
  const [menuOpen, setMenuOpen] = useState(false);

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

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement | null)?.closest?.('.ugc-nav-menu')) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

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

  const inputBase: React.CSSProperties = {
    fontFamily: 'var(--font-jakarta), sans-serif',
    fontSize: 14,
    padding: '11px 14px',
    borderRadius: 12,
    border: '1.5px solid #E5E7EB',
    background: '#FFFFFF',
    color: '#111827',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'border-color .15s, box-shadow .15s',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 7, display: 'block',
  };

  return (
    <div className="ugc-root">
      <style>{`
        .ugc-root { font-family: var(--font-jakarta), sans-serif; background:#F7FBFF; color:#0C1A2E; min-height:100dvh; overflow-x:hidden; }
        .ugc-wrap { max-width:1200px; margin:0 auto; padding:0 24px; }
        .ugc-orb { position:absolute; border-radius:999px; filter:blur(80px); pointer-events:none; opacity:.45; }
        @keyframes ugcFloat { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-14px) rotate(2deg)} }
        @keyframes ugcTilt { 0%,100%{transform:rotate(-3deg)} 50%{transform:rotate(3deg)} }
        @keyframes ugcPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
        @keyframes ugcSpin { to{transform:rotate(360deg)} }
        .ugc-float { animation:ugcFloat 6s ease-in-out infinite; }
        .ugc-tilt { animation:ugcTilt 7s ease-in-out infinite; }
        .ugc-pulse { animation:ugcPulse 3s ease-in-out infinite; }
        .ugc-nav-links { display:flex; align-items:center; gap:6px; }
        .ugc-nav-actions { display:flex; align-items:center; gap:10px; }
        .ugc-menu-btn { display:none !important; }
        .ugc-dropdown { display:none !important; }
        .ugc-hero-grid { display:grid; grid-template-columns:1.05fr .95fr; gap:48px; align-items:center; }
        .ugc-hero-art { min-height:400px; }
        .ugc-stats { display:flex; flex-wrap:wrap; gap:26px; }
        .ugc-steps { display:grid; grid-template-columns:repeat(4,1fr); gap:18px; }
        .ugc-filters { display:flex; flex-wrap:wrap; gap:12px; align-items:center; padding:16px; background:#fff; border:1px solid #E0EFFA; border-radius:20px; box-shadow:0 10px 30px rgba(14,88,140,.06); }
        .ugc-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(330px,1fr)); gap:24px; }
        .ugc-card { background:#fff; border:1px solid #E6F0F8; border-radius:24px; overflow:hidden; box-shadow:0 6px 22px rgba(14,88,140,.06); transition:transform .22s ease, box-shadow .22s ease, border-color .22s ease; position:relative; }
        .ugc-card:hover { transform:translateY(-7px); box-shadow:0 22px 46px rgba(14,88,140,.16); border-color:#BAE6FD; }
        .ugc-cover { height:88px; position:relative; overflow:hidden; }
        .ugc-cover:after { content:''; position:absolute; inset:0; background-image:radial-gradient(circle at 20% 30%,rgba(255,255,255,.5) 2px,transparent 2px),radial-gradient(circle at 75% 65%,rgba(255,255,255,.35) 2px,transparent 2px); background-size:26px 26px; }
        .ugc-avatar { width:62px; height:62px; border-radius:20px; border:4px solid #fff; object-fit:cover; background:#fff; flexShrink:0; box-shadow:0 6px 16px rgba(12,26,46,.12); }
        .ugc-chip { font-size:11px; font-weight:700; color:#0369A1; background:#E0F2FE; padding:5px 11px; border-radius:999px; white-space:nowrap; }
        .ugc-social { display:inline-flex; align-items:center; gap:4px; padding:5px 9px; border-radius:999px; border:1px solid #E5E7EB; background:#fff; font-size:11px; font-weight:700; color:#374151; text-decoration:none; }
        .ugc-thumb { flex:1; aspect-ratio:9/16; max-width:33%; border-radius:12px; overflow:hidden; position:relative; background:linear-gradient(135deg,#1E293B,#334155); cursor:pointer; }
        .ugc-request { width:100%; padding:13px 0; border:none; border-radius:14px; color:#fff; font-weight:800; font-size:14px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; background:linear-gradient(135deg,#0EA5E9,#6366F1); box-shadow:0 8px 20px rgba(14,165,233,.28); transition:transform .18s, box-shadow .18s; }
        .ugc-request:hover { transform:translateY(-2px); box-shadow:0 12px 26px rgba(14,165,233,.38); }
        .ugc-nav-btn { display:inline-flex; align-items:center; justify-content:center; padding:10px 18px; border-radius:12px; font-size:14px; font-weight:700; text-decoration:none; white-space:nowrap; }
        @media(max-width:980px){
          .ugc-hero-grid{grid-template-columns:1fr;gap:28px}
          .ugc-hero-art{min-height:auto;max-width:520px;margin:0 auto;width:100%}
          .ugc-steps{grid-template-columns:repeat(2,1fr)}
          .ugc-nav-links{display:none !important}
          .ugc-desktop-actions{display:none !important}
          .ugc-menu-btn{display:inline-flex !important}
          .ugc-dropdown{display:flex !important}
        }
        @media(max-width:620px){
          .ugc-wrap{padding:0 16px}
          .ugc-steps{grid-template-columns:1fr}
          .ugc-stats{gap:16px}
          .ugc-grid{grid-template-columns:1fr}
          .ugc-filters>*{width:100%}
        }
      `}</style>

      {/* NAV */}
      <header style={{ position: 'sticky', top: 0, zIndex: 60, background: 'rgba(247,251,255,.88)', backdropFilter: 'blur(16px)', borderBottom: '1px solid #E0EFFA' }}>
        <div className="ugc-wrap" style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <a href="/welcome" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png" alt="" style={{ height: 38, width: 'auto' }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mo-sell-wordmark.png" alt="MO Sell" style={{ height: 23, width: 'auto' }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#6366F1', letterSpacing: '.07em', textTransform: 'uppercase', borderLeft: '1px solid #E0EFFA', paddingLeft: 10, marginLeft: 2 }}>Creators</span>
          </a>
          <nav className="ugc-nav-links">
            <a href="#how" style={{ color: '#3D5A7A', textDecoration: 'none', fontSize: 14, fontWeight: 700, padding: '8px 10px' }}>How it works</a>
            <a href="#creators" style={{ color: '#3D5A7A', textDecoration: 'none', fontSize: 14, fontWeight: 700, padding: '8px 10px' }}>Discover</a>
            <a href="/creators" style={{ color: '#3D5A7A', textDecoration: 'none', fontSize: 14, fontWeight: 700, padding: '8px 10px' }}>For creators</a>
            <a href="/brands" style={{ color: '#3D5A7A', textDecoration: 'none', fontSize: 14, fontWeight: 700, padding: '8px 10px' }}>For brands</a>
            <a href="/welcome" style={{ color: '#3D5A7A', textDecoration: 'none', fontSize: 14, fontWeight: 700, padding: '8px 10px' }}>Stores</a>
          </nav>
          <div className="ugc-nav-menu" style={{ position: 'relative' }}>
            <div className="ugc-desktop-actions" style={{ display: 'flex', gap: 10 }}>
              <a href="/brand-auth/login" className="ugc-nav-btn" style={{ color: '#0369A1', background: '#E0F2FE', border: '1px solid #BAE6FD' }}>Brand login</a>
              <a href="/brand-auth/register" className="ugc-nav-btn" style={{ color: '#fff', background: 'linear-gradient(135deg,#0EA5E9,#6366F1)', boxShadow: '0 8px 20px rgba(14,165,233,.25)' }}>Get started</a>
            </div>
            <button
              type="button"
              className="ugc-menu-btn"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              style={{ alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: 12, background: '#fff', border: '1px solid #E0EFFA', cursor: 'pointer', color: '#0C1A2E' }}
            >
              {menuOpen ? <X size={19} /> : (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="3" y1="8" x2="21" y2="8" /><line x1="3" y1="16" x2="21" y2="16" />
                </svg>
              )}
            </button>
            {menuOpen && (
              <div className="ugc-dropdown" style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, background: '#fff', border: '1px solid #E0EFFA', borderRadius: 16, boxShadow: '0 18px 44px rgba(12,74,110,.14)', padding: 10, flexDirection: 'column', gap: 6, zIndex: 40, width: 220 }}>
                {[
                  ['/creators', 'For creators'], ['/brands', 'For brands'], ['/welcome', 'Stores'],
                  ['#how', 'How it works'], ['#creators', 'Discover creators'],
                  ['/brand-auth/login', 'Brand login'], ['/brand-auth/register', 'Get started'],
                ].map(([href, label]) => (
                  <a key={href} href={href} onClick={() => setMenuOpen(false)} style={{ padding: '10px 14px', borderRadius: 10, color: '#3D5A7A', fontSize: 14, fontWeight: 700, textDecoration: 'none', background: href === '/brand-auth/register' ? 'linear-gradient(135deg,#0EA5E9,#6366F1)' : 'transparent', colorScheme: 'light' }}>
                    <span style={{ color: href === '/brand-auth/register' ? '#fff' : undefined }}>{label}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '72px 0 84px', background: 'radial-gradient(circle at 12% 18%,rgba(99,102,241,.13),transparent 34%),radial-gradient(circle at 88% 12%,rgba(14,165,233,.16),transparent 34%),linear-gradient(180deg,#F7FBFF 0%,#fff 100%)' }}>
        <div className="ugc-orb" style={{ width: 320, height: 320, background: '#FBCFE8', top: -60, left: '-6%' }} />
        <div className="ugc-orb" style={{ width: 280, height: 280, background: '#BFDBFE', bottom: -80, right: '-4%' }} />
        <div className="ugc-wrap ugc-hero-grid" style={{ position: 'relative', zIndex: 1 }}>
          <div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 999, background: 'rgba(14,165,233,.10)', color: '#0369A1', fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              <Sparkles size={14} /> The creator marketplace inside MO Sell
            </span>
            <h1 style={{ fontFamily: "'Clash Display','Plus Jakarta Sans',sans-serif", fontSize: 'clamp(2.5rem,5.4vw,4.4rem)', lineHeight: 1.04, letterSpacing: '-.045em', margin: '22px 0 18px', fontWeight: 800 }}>
              Find your next<br />
              <span style={{ background: 'linear-gradient(100deg,#0EA5E9 0%,#6366F1 55%,#EC4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>video that sells.</span>
            </h1>
            <p style={{ maxWidth: 560, margin: 0, color: '#3D5A7A', fontSize: 18, lineHeight: 1.75 }}>
              Real creators. Real clips. Real results. Browse authentic UGC talent, send a brief, and get content your customers actually believe — all connected to the store you already run on MO Sell.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 30 }}>
              <a href="#creators" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '15px 26px', borderRadius: 14, color: '#fff', background: 'linear-gradient(135deg,#0EA5E9,#6366F1)', boxShadow: '0 12px 28px rgba(14,165,233,.3)', textDecoration: 'none', fontWeight: 800, fontSize: 15 }}>
                Browse creators <ArrowRight size={17} />
              </a>
              <a href="/creators" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '15px 26px', borderRadius: 14, color: '#0C1A2E', background: '#fff', border: '1.5px solid #E0EFFA', textDecoration: 'none', fontWeight: 800, fontSize: 15 }}>
                I'm a creator <Sparkles size={16} color="#6366F1" />
              </a>
            </div>
            <div className="ugc-stats" style={{ marginTop: 38 }}>
              {[
                ['★', '4.9', 'avg creator rating'],
                ['⚡', '48h', 'average delivery'],
                ['🎬', '1,200+', 'videos delivered'],
              ].map(([icon, value, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 13, background: '#fff', border: '1px solid #E0EFFA', display: 'grid', placeItems: 'center', fontSize: 18, boxShadow: '0 6px 16px rgba(14,88,140,.06)' }}>{icon}</div>
                  <div>
                    <div style={{ fontFamily: "'Clash Display','Plus Jakarta Sans',sans-serif", fontSize: 21, fontWeight: 800, lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: 12, color: '#7A96AD', fontWeight: 600 }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero art: playful stacked UI cards */}
          <div className="ugc-hero-art">
            <div className="ugc-float" style={{ position: 'relative', maxWidth: 430, margin: '0 auto' }}>
              <div style={{ background: '#fff', borderRadius: 26, border: '1px solid #E0EFFA', boxShadow: '0 30px 70px rgba(14,88,140,.16)', padding: 22, transform: 'rotate(-2deg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FF6B6B' }} />
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FFD166' }} />
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#4ADE80' }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#7A96AD', letterSpacing: '.1em' }}>NEW BRIEF</span>
                </div>
                <div style={{ borderRadius: 18, padding: 18, background: 'linear-gradient(135deg,#E0F2FE,#EDE9FE)' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#0369A1', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>Skincare brand · Lagos</div>
                  <div style={{ fontFamily: "'Clash Display','Plus Jakarta Sans',sans-serif", fontSize: 22, fontWeight: 800, lineHeight: 1.2, color: '#0C1A2E' }}>“Show our glow oil in a morning routine”</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                    {['30s video', '₦35,000', '3 days'].map((x) => <span key={x} className="ugc-chip">{x}</span>)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 13, background: 'linear-gradient(135deg,#F472B6,#7C3AED)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800 }}>A</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>Ada · @ada_skin</div>
                    <div style={{ fontSize: 12, color: '#7A96AD' }}>Submitted a draft video</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#16A34A', background: '#DCFCE7', padding: '6px 10px', borderRadius: 999 }}>In review</span>
                </div>
              </div>

              <div className="ugc-tilt" style={{ position: 'absolute', top: -28, right: -22, background: '#fff', borderRadius: 16, padding: '12px 16px', boxShadow: '0 16px 36px rgba(12,26,46,.14)', border: '1px solid #E0EFFA', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: '#DCFCE7', display: 'grid', placeItems: 'center' }}><CheckCircle2 size={18} color="#16A34A" /></div>
                <div><div style={{ fontSize: 12, fontWeight: 800 }}>Brand approved!</div><div style={{ fontSize: 11, color: '#7A96AD' }}>Balance released</div></div>
              </div>

              <div className="ugc-float" style={{ position: 'absolute', bottom: -30, left: -26, background: 'linear-gradient(135deg,#0EA5E9,#6366F1)', color: '#fff', borderRadius: 16, padding: '12px 16px', boxShadow: '0 16px 36px rgba(14,165,233,.32)', display: 'flex', alignItems: 'center', gap: 10, animationDelay: '1.2s' }}>
                <WandSparkles size={18} />
                <div><div style={{ fontSize: 12, fontWeight: 800 }}>Video goes live</div><div style={{ fontSize: 11, opacity: .85 }}>Customers → your MO store</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ padding: '76px 0 82px', background: '#fff' }}>
        <div className="ugc-wrap">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: '#6366F1' }}>The flow</span>
            <h2 style={{ fontFamily: "'Clash Display','Plus Jakarta Sans',sans-serif", fontSize: 'clamp(1.9rem,3.6vw,2.9rem)', letterSpacing: '-.035em', margin: '12px 0 10px' }}>From brief to banger in four steps</h2>
            <p style={{ color: '#3D5A7A', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>Brands and creators meet in the middle — and MO Sell keeps everything moving until both sides are done.</p>
          </div>
          <div className="ugc-steps">
            {[
              { n: '01', icon: <Search size={22} />, title: 'Find your vibe', body: 'Filter creators by niche, price, rating, and content style.', bg: '#E0F2FE', color: '#0369A1' },
              { n: '02', icon: <MessageCircle size={22} />, title: 'Send a brief', body: 'Share your product, deliverables, deadline, and your offer.', bg: '#EDE9FE', color: '#6366F1' },
              { n: '03', icon: <Camera size={22} />, title: 'Creator adds video', body: 'They make the magic and submit the clip for your review.', bg: '#FCE7F3', color: '#DB2777' },
              { n: '04', icon: <CheckCircle2 size={22} />, title: 'Approve & grow', body: 'You approve, they get paid, and the content drives sales to your store.', bg: '#DCFCE7', color: '#16A34A' },
            ].map((s) => (
              <div key={s.n} style={{ background: s.bg, borderRadius: 22, padding: 26, position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontFamily: "'Clash Display','Plus Jakarta Sans',sans-serif", fontSize: 46, fontWeight: 800, color: 'rgba(12,26,46,.09)', position: 'absolute', top: 10, right: 16, lineHeight: 1 }}>{s.n}</div>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: '#fff', display: 'grid', placeItems: 'center', color: s.color, boxShadow: '0 8px 18px rgba(12,26,46,.06)', marginBottom: 18 }}>{s.icon}</div>
                <h3 style={{ margin: '0 0 8px', fontFamily: "'Clash Display','Plus Jakarta Sans',sans-serif", fontSize: 19, color: '#0C1A2E' }}>{s.title}</h3>
                <p style={{ margin: 0, color: '#3D5A7A', fontSize: 14, lineHeight: 1.65 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CREATOR LINEUP */}
      <section id="creators" style={{ padding: '78px 0 88px', background: '#F7FBFF' }}>
        <div className="ugc-wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap', marginBottom: 28 }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', color: '#0EA5E9' }}>The lineup</span>
              <h2 style={{ fontFamily: "'Clash Display','Plus Jakarta Sans',sans-serif", fontSize: 'clamp(1.9rem,3.6vw,2.9rem)', letterSpacing: '-.035em', margin: '12px 0 8px' }}>Meet your next collaborator</h2>
              <p style={{ color: '#3D5A7A', margin: 0, lineHeight: 1.7 }}>Watch their samples, check the vibe, then send a brief in one click.</p>
            </div>
            {!loading && creators.length > 0 && (
              <span style={{ padding: '10px 16px', borderRadius: 999, background: '#fff', border: '1px solid #E0EFFA', fontSize: 13, fontWeight: 800, color: '#0369A1' }}>
                {creators.length} {creators.length === 1 ? 'creator' : 'creators'} found
              </span>
            )}
          </div>

          {/* Filters */}
          <div className="ugc-filters" style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={17} color="#7A96AD" style={{ position: 'absolute', left: 14, pointerEvents: 'none' }} />
              <input
                placeholder="Search a niche — beauty, food, tech…"
                value={nicheInput}
                onChange={(e) => setNicheInput(e.target.value)}
                style={{ ...inputBase, paddingLeft: 40, borderRadius: 12 }}
              />
              {nicheInput && (
                <button onClick={() => { setNicheInput(''); setNiche(''); }} aria-label="Clear search" style={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
                  <X size={15} color="#7A96AD" />
                </button>
              )}
            </div>
            <div style={{ position: 'relative', minWidth: 150 }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#7A96AD', fontWeight: 700, pointerEvents: 'none' }}>₦</span>
              <input placeholder="Max price" type="number" min="0" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} style={{ ...inputBase, paddingLeft: 30, width: 160 }} />
            </div>
            <div style={{ position: 'relative', minWidth: 180 }}>
              <SlidersHorizontal size={15} color="#7A96AD" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                style={{ ...inputBase, paddingLeft: 38, appearance: 'none', cursor: 'pointer', paddingRight: 34, backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%237A96AD\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
              >
                {(Object.keys(SORT_LABELS) as SortOption[]).map((k) => <option key={k} value={k}>{SORT_LABELS[k]}</option>)}
              </select>
            </div>
          </div>

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 80, color: '#0369A1', fontWeight: 700 }}>
              <Loader2 size={28} style={{ animation: 'ugcSpin .8s linear infinite' }} /> Finding creators for you…
            </div>
          )}

          {!loading && creators.length === 0 && (
            <div style={{ textAlign: 'center', padding: '70px 24px', background: '#fff', borderRadius: 24, border: '1px dashed #BAE6FD' }}>
              <div style={{ width: 66, height: 66, borderRadius: 20, background: '#E0F2FE', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}><UserIcon size={30} color="#0EA5E9" /></div>
              <h3 style={{ fontSize: 19, margin: '0 0 8px', fontFamily: "'Clash Display','Plus Jakarta Sans',sans-serif" }}>No creators found</h3>
              <p style={{ fontSize: 14, color: '#7A96AD', margin: 0 }}>Try a different niche or widen your price range.</p>
            </div>
          )}

          {!loading && creators.length > 0 && (
            <div className="ugc-grid">
              {creators.map((creator, idx) => {
                const name = creator.displayName ?? creator.name ?? 'Creator';
                const hasSocials = creator.socialLinks && Object.keys(creator.socialLinks).some((k) => creator.socialLinks![k]);
                return (
                  <div className="ugc-card" key={creator.id}>
                    <div className="ugc-cover" style={{ background: CARD_GRADIENTS[idx % CARD_GRADIENTS.length] }}>
                      <span style={{ position: 'absolute', top: 14, left: 16, zIndex: 1, padding: '5px 11px', borderRadius: 999, background: 'rgba(255,255,255,.9)', color: '#0C1A2E', fontSize: 10, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase' }}>
                        {creator.rating >= 4.8 ? '⭐ Top rated' : creator.deliveryDays <= 2 ? '⚡ Fast delivery' : '🎬 Creator'}
                      </span>
                      {creator.username && (
                        <span style={{ position: 'absolute', bottom: 12, right: 16, zIndex: 1, color: 'rgba(255,255,255,.92)', fontSize: 11, fontWeight: 700 }}>@{creator.username}</span>
                      )}
                    </div>
                    <div style={{ padding: '0 20px 20px' }}>
                      <div
                        onClick={() => { if (creator.username) router.push(`/u/creator/${encodeURIComponent(creator.username)}`); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 13, marginTop: -28, position: 'relative', zIndex: 2, cursor: creator.username ? 'pointer' : 'default' }}
                      >
                        {creator.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={creator.avatarUrl} alt={name} className="ugc-avatar" />
                        ) : (
                          <div className="ugc-avatar" style={{ display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#0EA5E9,#6366F1)', color: '#fff' }}>
                            <UserIcon size={24} />
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0, paddingTop: 26 }}>
                          <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: '#0C1A2E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</h3>
                          <div style={{ marginTop: 3 }}><RatingStars rating={creator.rating} /></div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '16px 0 10px' }}>
                        {(creator.niches ?? []).slice(0, 4).map((n) => <span className="ugc-chip" key={n}>{n}</span>)}
                        {(creator.niches ?? []).length === 0 && <span className="ugc-chip">UGC creator</span>}
                      </div>

                      {hasSocials && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                          {([
                            ['instagram', 'IG', InstagramIconCustom, '#E1306C'],
                            ['tiktok', 'TikTok', TikTokIcon, '#111827'],
                            ['youtube', 'YT', YouTubeIconCustom, '#FF0000'],
                            ['twitter', 'X', XIcon, '#111827'],
                          ] as [string, string, React.FC<{ size?: number; color?: string }>, string][]).map(([key, label, Icon, brandColor]) => {
                            const url = creator.socialLinks![key];
                            if (!url) return null;
                            const count = creator.socialStats?.[key]?.followerCount ?? creator.followerCounts?.[key];
                            const isVerified = creator.socialVerified?.[key] === 'verified';
                            return (
                              <a key={key} href={url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="ugc-social" title={`${label}${count ? ` · ${formatFollowerCount(count)} followers` : ''}`}>
                                <Icon size={12} color={brandColor} /> {label}
                                {isVerified && <CheckCircle2 size={11} color="#059669" />}
                                {count ? <span style={{ color: '#7A96AD', fontWeight: 600 }}>{formatFollowerCount(count)}</span> : null}
                              </a>
                            );
                          })}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 0', borderTop: '1px solid #EDF4FA', borderBottom: '1px solid #EDF4FA', marginBottom: 14 }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#0C1A2E' }}>{formatPrice(creator.price30sDisplay)} <span style={{ fontSize: 12, fontWeight: 600, color: '#7A96AD' }}>/ 30s</span></div>
                          <div style={{ fontSize: 12, color: '#7A96AD', marginTop: 2 }}>{formatPrice(creator.price60sDisplay)} / 60s</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#7A96AD', fontSize: 12, fontWeight: 700 }}>
                          <Clock size={14} /> {creator.deliveryDays}d delivery
                        </div>
                      </div>

                      {(creator.sampleVideos ?? []).length > 0 && (
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                          {creator.sampleVideos.slice(0, 3).map((video, i) => (
                            <div key={video.id || i} className="ugc-thumb" onClick={() => setSelectedVideo({ url: video.url })} title="Watch sample">
                              <VideoPoster video={video} playIconSize={16} />
                            </div>
                          ))}
                        </div>
                      )}

                      <button className="ugc-request" onClick={() => openModal(creator)}>
                        <MessageCircle size={17} /> Send a brief <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CREATOR CROSS-CTA */}
      <section style={{ padding: '70px 0', background: '#fff', borderTop: '1px solid #E0EFFA' }}>
        <div className="ugc-wrap">
          <div style={{ borderRadius: 28, padding: '46px 40px', background: 'linear-gradient(120deg,#0EA5E9 0%,#6366F1 60%,#7C3AED 100%)', color: '#fff', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 28, alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,.1)', right: -60, top: -100 }} />
            <div style={{ position: 'relative' }}>
              <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', opacity: .85 }}>Are you the creator?</span>
              <h2 style={{ fontFamily: "'Clash Display','Plus Jakarta Sans',sans-serif", fontSize: 'clamp(1.8rem,3.4vw,2.7rem)', lineHeight: 1.12, letterSpacing: '-.03em', margin: '12px 0 10px' }}>Get briefs. Make videos. Get paid.</h2>
              <p style={{ margin: 0, opacity: .9, lineHeight: 1.7 }}>Build a free UGC profile on MO Sell, get matched with brands, upload your videos, and track every payment in one place.</p>
            </div>
            <div style={{ position: 'relative', display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <a href="/creators" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '15px 24px', borderRadius: 14, background: '#fff', color: '#0369A1', textDecoration: 'none', fontWeight: 800, boxShadow: '0 12px 28px rgba(0,0,0,.12)' }}>Become a creator <Sparkles size={16} /></a>
              <a href="/welcome" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '15px 24px', borderRadius: 14, border: '1px solid rgba(255,255,255,.5)', color: '#fff', textDecoration: 'none', fontWeight: 800 }}>Explore MO Sell</a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#081526', color: 'rgba(255,255,255,.7)', padding: '32px 0' }}>
        <div className="ugc-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png" alt="MO Sell" style={{ height: 28, width: 'auto' }} />
            <span style={{ fontWeight: 800, color: '#fff', fontFamily: "'Clash Display','Plus Jakarta Sans',sans-serif" }}>MO Sell</span>
            <span style={{ fontSize: 12 }}>creator marketplace</span>
          </div>
          <div style={{ display: 'flex', gap: 18, fontSize: 13, flexWrap: 'wrap' }}>
            <a href="/welcome" style={{ color: 'inherit', textDecoration: 'none' }}>Stores</a>
            <a href="/creators" style={{ color: 'inherit', textDecoration: 'none' }}>For creators</a>
            <a href="/brands" style={{ color: 'inherit', textDecoration: 'none' }}>For brands</a>
            <a href="/pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Pricing</a>
          </div>
          <div style={{ fontSize: 12, opacity: .7 }}>© {new Date().getFullYear()} MO Sell by Busmo.</div>
        </div>
      </footer>

      {/* REQUEST MODAL */}
      {selectedCreator && (
        <div onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }} style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(8,21,38,.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ fontFamily: 'var(--font-jakarta), sans-serif', background: '#fff', borderRadius: 24, maxWidth: 540, width: '100%', maxHeight: '92dvh', overflow: 'auto', padding: 30, position: 'relative', boxShadow: '0 28px 80px rgba(8,21,38,.3)' }}>
            <button onClick={closeModal} aria-label="Close" style={{ position: 'absolute', top: 18, right: 18, background: '#F3F6FA', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 10, display: 'flex', color: '#7A96AD' }}><X size={18} /></button>

            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: '#6366F1' }}>New brief</span>
            <h2 style={{ fontSize: 22, fontFamily: "'Clash Display','Plus Jakarta Sans',sans-serif", fontWeight: 800, margin: '8px 0 4px', color: '#0C1A2E' }}>
              Brief {selectedCreator.displayName ?? selectedCreator.name}
            </h2>
            <p style={{ fontSize: 13, color: '#7A96AD', margin: '0 0 22px' }}>Tell the creator what you need. A 50% deposit starts the work.</p>

            {!user && !authLoading && (
              <div style={{ padding: 16, background: '#FFF7ED', borderRadius: 14, border: '1px solid #FED7AA', marginBottom: 18, textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: '#9A3412', margin: '0 0 12px', fontWeight: 600 }}>Log in to send a brief and pay securely.</p>
                <button onClick={() => router.push('/welcome')} style={{ padding: '11px 24px', background: 'linear-gradient(135deg,#0EA5E9,#6366F1)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 800 }}>Login to continue</button>
              </div>
            )}

            {user && (
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <div style={{ padding: 14, background: '#E0F2FE', borderRadius: 14, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0369A1' }}>{form.bidAmount ? 'Your offer' : 'Creator 30s price'}</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#0369A1' }}>{form.bidAmount ? formatPrice(Number(form.bidAmount)) : formatPrice(selectedCreator.price30sDisplay)}</span>
                </div>

                {error && <div style={{ padding: 12, background: '#FEF2F2', borderRadius: 10, border: '1px solid #FECACA', marginBottom: 16, fontSize: 13, color: '#DC2626' }}>{error}</div>}

                {[
                  { field: 'productName', label: 'Product name *', placeholder: 'e.g. Organic Skincare Set', required: true },
                  { field: 'productUrl', label: 'Product URL (optional)', placeholder: 'https://yourstore.mosell.shop/product', required: false },
                ].map((f) => (
                  <div key={f.field} style={{ marginBottom: 15 }}>
                    <label style={labelStyle}>{f.label}</label>
                    <input placeholder={f.placeholder} value={(form as any)[f.field]} onChange={(e) => handleFormChange(f.field, e.target.value)} style={inputBase} />
                  </div>
                ))}

                <div style={{ marginBottom: 15 }}>
                  <label style={labelStyle}>Brief *</label>
                  <textarea placeholder="Describe your brand, product, and the content you want…" value={form.brief} onChange={(e) => handleFormChange('brief', e.target.value)} rows={4} style={{ ...inputBase, resize: 'vertical', minHeight: 90, lineHeight: 1.55 }} />
                </div>
                <div style={{ marginBottom: 15 }}>
                  <label style={labelStyle}>Deliverables *</label>
                  <textarea placeholder="e.g. 1× 30s video + raw footage" value={form.deliverables} onChange={(e) => handleFormChange('deliverables', e.target.value)} rows={3} style={{ ...inputBase, resize: 'vertical', minHeight: 72, lineHeight: 1.55 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 20 }}>
                  <div>
                    <label style={labelStyle}>Deadline (optional)</label>
                    <input type="date" value={form.deadline} onChange={(e) => handleFormChange('deadline', e.target.value)} style={inputBase} />
                  </div>
                  <div>
                    <label style={labelStyle}>Your offer (optional)</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#7A96AD', fontWeight: 700, pointerEvents: 'none' }}>₦</span>
                      <input placeholder={String(selectedCreator.price30sDisplay)} type="number" min="0" value={form.bidAmount} onChange={(e) => handleFormChange('bidAmount', e.target.value)} style={{ ...inputBase, paddingLeft: 30 }} />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={submitting} className="ugc-request" style={{ padding: '15px 0', opacity: submitting ? .7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}>
                  {submitting ? <><Loader2 size={18} style={{ animation: 'ugcSpin .8s linear infinite' }} /> Processing…</> : <>Submit brief · Pay 50% deposit <ArrowRight size={17} /></>}
                </button>
                <p style={{ textAlign: 'center', fontSize: 11, color: '#7A96AD', margin: '12px 0 0' }}>You'll review the video before the balance is released.</p>
              </form>
            )}
          </div>
        </div>
      )}

      {/* VIDEO LIGHTBOX */}
      {selectedVideo && (
        <div onClick={() => setSelectedVideo(null)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(8,21,38,.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <button onClick={() => setSelectedVideo(null)} aria-label="Close video" style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,.15)', border: 'none', cursor: 'pointer', padding: 11, borderRadius: '50%', display: 'flex', color: '#fff', zIndex: 2 }}><X size={20} /></button>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(430px,100%)' }}><VideoEmbed url={selectedVideo.url} /></div>
        </div>
      )}
    </div>
  );
}
