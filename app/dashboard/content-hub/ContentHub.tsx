'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getDatabase } from '@/lib/database/adapter';
import {
  Lightbulb, Calendar, TrendingUp, Megaphone, BarChart3, Users,
  Copy, Check, Bell, BellOff, Eye, EyeOff, BadgeCheck,
  Sparkles, Package, X, Plus, Star, Camera, Instagram, Music2, Youtube, Twitter, Trash2, Upload,
  ChevronLeft, ChevronRight, CalendarClock, Send, CheckCircle2, Target,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
import { useSell } from '@/context/SellContext';
import { ContentGenerator } from './ContentGenerator';
import { ProductContentCard } from './ProductContentCard';
import generatorStyles from './ContentHub.module.css';

const TABS = [
  { id: 'ideas',     label: 'Ideas',     icon: Lightbulb },
  { id: 'calendar',  label: 'Calendar',  icon: Calendar },
  { id: 'trends',    label: 'Trends',    icon: TrendingUp },
  { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'ugc',       label: 'UGC',       icon: Users },
] as const;

type TabId = (typeof TABS)[number]['id'];

const s = {
  page: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: 22,
    width: '100%',
    maxWidth: 1200,
  },
  header: {
    display: 'flex' as const,
    alignItems: 'flex-start' as const,
    justifyContent: 'space-between' as const,
    gap: 16,
    flexWrap: 'wrap' as const,
  },
  heading: {
    fontFamily: 'var(--sell-font-display)',
    fontSize: '1.35rem',
    fontWeight: 700,
    color: 'var(--sell-text-1)',
    marginBottom: 4,
  },
  sub: {
    fontSize: '0.875rem',
    color: 'var(--sell-text-2)',
  },
  tabs: {
    display: 'flex' as const,
    borderBottom: '1px solid var(--sell-border)',
    background: 'var(--sell-bg)',
    overflowX: 'auto' as const,
  },
  tab: (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '12px 16px',
    border: 'none',
    background: 'none',
    fontSize: '0.82rem',
    fontWeight: 600,
    color: active ? 'var(--sell-primary)' : 'var(--sell-text-3)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderBottom: active ? '2px solid var(--sell-primary)' : '2px solid transparent',
    transition: 'color 0.15s, border-color 0.15s',
    whiteSpace: 'nowrap' as const,
  }),
  tabContent: {
    padding: 18,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 14,
  },
  card: {
    background: 'var(--sell-surface)',
    border: '1px solid var(--sell-border)',
    borderRadius: 'var(--sell-radius-lg)',
    overflow: 'hidden',
    boxShadow: 'var(--sell-shadow-sm)',
  },
  cardHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid var(--sell-border-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap' as const,
  },
  cardTitle: {
    fontFamily: 'var(--sell-font-display)',
    fontSize: '0.95rem',
    fontWeight: 700,
    color: 'var(--sell-text-1)',
  },
  cardSub: {
    fontSize: '0.78rem',
    color: 'var(--sell-text-3)',
    marginTop: 2,
  },
  cardBody: {
    padding: 20,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 16,
  },
  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '9px 16px',
    borderRadius: 'var(--sell-radius-sm)',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    fontFamily: 'var(--sell-font-body)',
    background: 'linear-gradient(135deg, var(--sell-primary), var(--sell-accent))',
    color: '#fff',
    boxShadow: '0 4px 14px var(--sell-primary-glow)',
    whiteSpace: 'nowrap' as const,
  },
  btnSecondary: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '9px 16px',
    borderRadius: 'var(--sell-radius-sm)',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: '1px solid var(--sell-border)',
    fontFamily: 'var(--sell-font-body)',
    background: 'var(--sell-surface)',
    color: 'var(--sell-text-1)',
    whiteSpace: 'nowrap' as const,
  },
  btnGhost: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '9px 16px',
    borderRadius: 'var(--sell-radius-sm)',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: '1px solid var(--sell-border)',
    fontFamily: 'var(--sell-font-body)',
    background: 'none',
    color: 'var(--sell-text-2)',
    whiteSpace: 'nowrap' as const,
  },
  formInput: {
    padding: '9px 12px',
    borderRadius: 'var(--sell-radius-sm)',
    border: '1.5px solid var(--sell-border)',
    background: 'var(--sell-bg)',
    fontSize: '0.875rem',
    fontFamily: 'var(--sell-font-body)',
    color: 'var(--sell-text-1)',
    outline: 'none',
    width: '100%',
  },
  formLabel: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--sell-text-2)',
  },
  formSelect: {
    padding: '9px 12px',
    borderRadius: 'var(--sell-radius-sm)',
    border: '1.5px solid var(--sell-border)',
    background: 'var(--sell-bg)',
    fontSize: '0.875rem',
    fontFamily: 'var(--sell-font-body)',
    color: 'var(--sell-text-1)',
    outline: 'none',
    cursor: 'pointer',
    width: '100%',
  },
};

/* ─── Types ─────────────────────────────────────────────── */

interface Product {
  id: string;
  displayName: string;
  price: number;
  productType: string;
  images: string[];
  category: string;
  description?: string;
}

interface CampaignDay {
  day: number;
  task: string;
  done: boolean;
}

interface Campaign {
  id: string;
  productId: string;
  productName: string;
  days: CampaignDay[];
  createdAt: number;
}

interface UGCRequest {
  id: string;
  brand: string;
  product: string;
  status: string;
  budget: number;
  createdAt: number;
}

interface UGCOrder {
  id: string;
  brand: string;
  product: string;
  status: string;
  amount: number;
  dueDate: string;
}

interface CalendarPost {
  id: string;
  title: string;
  platform: string;
  productId?: string;
  productName?: string;
  date: string;
  time?: string;
  notes?: string;
  status: 'scheduled' | 'posted';
  postedUrl?: string;
  createdAt: number;
}

interface SocialProfile {
  platform: string;
  url: string;
  followerCount?: number;
  followingCount?: number;
  postsCount?: number;
  likesCount?: number;
  verified?: boolean;
  verifiedAt?: string;
}

const PLATFORMS: { key: string; label: string; icon: string }[] = [
  { key: 'instagram', label: 'Instagram', icon: '📷' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵' },
  { key: 'youtube', label: 'YouTube', icon: '▶️' },
  { key: 'twitter', label: 'X (Twitter)', icon: '🐦' },
  { key: 'facebook', label: 'Facebook', icon: '👍' },
];

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* ─── Component ─────────────────────────────────────────── */

export function ContentHub() {
  const { user, storeConfig, showToast } = useSell();
  const currency = storeConfig?.currency ?? 'NGN';

  const [activeTab, setActiveTab] = useState<TabId>('ideas');
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [reminderOn, setReminderOn] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignLoading, setCampaignLoading] = useState(false);

  const [calendarPosts, setCalendarPosts] = useState<CalendarPost[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calMonth, setCalMonth] = useState(() => new Date());
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [addForm, setAddForm] = useState<{ title: string; platform: string; date: string; time: string; productId: string; notes: string }>({
    title: '', platform: 'instagram', date: '', time: '12:00', productId: '', notes: '',
  });

  const [socialProfiles, setSocialProfiles] = useState<Record<string, SocialProfile>>({});
  const [socialProfileLoading, setSocialProfileLoading] = useState<Record<string, boolean>>({});
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [newSocialPlatform, setNewSocialPlatform] = useState('instagram');
  const [showAddProfile, setShowAddProfile] = useState(false);

  const [analyticsEvents, setAnalyticsEvents] = useState<any[]>([]);
  const [analyticsOrders, setAnalyticsOrders] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [moRecommendations, setMoRecommendations] = useState<any>(null);
  const [recommending, setRecommending] = useState(false);
  const [recommendError, setRecommendError] = useState('');

  const [ugcView, setUgcView] = useState<'apply' | 'dashboard'>('apply');
  const [niches, setNiches] = useState<string[]>([]);
  const [nicheInput, setNicheInput] = useState('');
  const [price30s, setPrice30s] = useState('');
  const [price60s, setPrice60s] = useState('');
  const [deliveryDays, setDeliveryDays] = useState('');
  const [sampleVideos, setSampleVideos] = useState<string[]>(['', '', '']);
  const [bio, setBio] = useState('');
  const [ugcUsername, setUgcUsername] = useState('');
  const [savingUgc, setSavingUgc] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [followerCounts, setFollowerCounts] = useState<Record<string, number>>({});
  const [socialVerified, setSocialVerified] = useState<Record<string, string>>({});
  const [socialVerifyError, setSocialVerifyError] = useState<Record<string, string>>({});
  const [socialStats, setSocialStats] = useState<Record<string, { name?: string; followerCount?: number; followingCount?: number; likesCount?: number; postsCount?: number; verified?: boolean; verifiedAt?: string }>>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [contactEmail, setContactEmail] = useState('');

  const [ugcProfile, setUgcProfile] = useState<any>(null);
  const [ugcRequests, setUgcRequests] = useState<UGCRequest[]>([]);
  const [ugcOrders, setUgcOrders] = useState<UGCOrder[]>([]);
  const [loadingUgcData, setLoadingUgcData] = useState(false);

  const [ideasRequestId, setIdeasRequestId] = useState<string | null>(null);
  const [generatedIdeas, setGeneratedIdeas] = useState<any>(null);
  const [generatingIdeas, setGeneratingIdeas] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(prev => prev?.id === product.id ? null : product);
  };

  const loadProducts = useCallback(async () => {
    if (!user?.businessId) return;
    setProductsLoading(true);
    try {
      const db = getDatabase();
      const snap = await db.collection(`businesses/${user.businessId}/storeProducts`).limit(1000).get();
      const items = snap.docs.map(d => ({
        id: d.id,
        displayName: d.data().displayName ?? '',
        price: d.data().price ?? 0,
        productType: d.data().productType ?? 'physical',
        images: d.data().images ?? [],
        category: d.data().category ?? '',
        description: d.data().description ?? '',
      })) as Product[];
      items.sort((a, b) => a.displayName.localeCompare(b.displayName));
      setProducts(items);
    } catch (err) {
      console.error('[ContentHub] Load products error:', err);
    } finally {
      setProductsLoading(false);
    }
  }, [user?.businessId]);

  const loadCampaigns = useCallback(async () => {
    if (!user?.businessId) return;
    setCampaignLoading(true);
    try {
      const db = getDatabase();
      const snap = await db.collection(`businesses/${user.businessId}/campaigns`).limit(100).get();
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Campaign));
      setCampaigns(items);
    } catch (err) {
      console.error('[ContentHub] Load campaigns error:', err);
    } finally {
      setCampaignLoading(false);
    }
  }, [user?.businessId]);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { loadCampaigns(); }, [loadCampaigns]);

  const loadCalendarPosts = useCallback(async () => {
    if (!user?.businessId) return;
    setCalendarLoading(true);
    try {
      const db = getDatabase();
      const snap = await db.collection(`businesses/${user.businessId}/contentCalendar`).limit(100).get();
      const posts = snap.docs.map(d => ({ id: d.id, ...d.data() } as CalendarPost));
      posts.sort((a, b) => (a.date + (a.time || '')) < (b.date + (b.time || '')) ? -1 : 1);
      setCalendarPosts(posts);
    } catch (err) {
      console.error('[ContentHub] Load calendar error:', err);
    } finally {
      setCalendarLoading(false);
    }
  }, [user?.businessId]);

  const loadSocialProfiles = useCallback(async () => {
    if (!user?.businessId) return;
    try {
      const db = getDatabase();
      const snap = await db.collection(`businesses/${user.businessId}/socialProfiles`).limit(10).get();
      const profiles: Record<string, SocialProfile> = {};
      snap.docs.forEach(d => {
        const p = d.data() as SocialProfile;
        profiles[p.platform] = p;
      });
      setSocialProfiles(profiles);
    } catch (err) {
      console.error('[ContentHub] Load social profiles error:', err);
    }
  }, [user?.businessId]);

  const loadAnalytics = useCallback(async () => {
    if (!user?.businessId) return;
    setAnalyticsLoading(true);
    try {
      const db = getDatabase();
      const biz = user.businessId;
      const evSnap = await db.collection(`businesses/${biz}/storeAnalytics`).limit(500).get();
      setAnalyticsEvents(evSnap.docs.map(d => d.data() as any));
      const ordersSnap = await db.collection(`businesses/${biz}/storeOrders`).limit(1000).get();
      setAnalyticsOrders(ordersSnap.docs.map(d => ({
        ...d.data(),
        createdAt: new Date(d.data().createdAt || Date.now()),
      })));
    } catch (err) {
      console.error('[ContentHub] Load analytics error:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [user?.businessId]);

  useEffect(() => { loadCalendarPosts(); }, [loadCalendarPosts]);
  useEffect(() => { loadSocialProfiles(); }, [loadSocialProfiles]);
  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const loadUgcData = useCallback(async () => {
    if (!user?.id) return;
    setLoadingUgcData(true);
    try {
      const db = getDatabase();
      const profileSnap = await db.doc(`ugcCreators/${user.id}`).get();
      if (profileSnap.exists) {
        const data = profileSnap.data();
        setUgcProfile(data);
        setBio(data.bio || '');
        setNiches(data.niches || []);
        setPrice30s(data.price30s ? String(data.price30s / 100) : '');
        setPrice60s(data.price60s ? String(data.price60s / 100) : '');
        setDeliveryDays(String(data.deliveryDays || 5));
        setUgcUsername(data.username || '');
        setSocialLinks(data.socialLinks || {});
        setFollowerCounts(data.followerCounts || {});
        setSocialVerified(data.socialVerified || {});
        setSocialStats(data.socialStats || {});
        setAvatarPreview(data.avatarUrl || null);
        setPortfolioImages(data.portfolioImages || []);
        setContactEmail(data.contactEmail || '');
      }
      const ordersSnap = await db.collection('ugcOrders').where('creatorId', '==', user.id).get();
      const allOrders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setUgcRequests(allOrders.filter(o => o.type === 'request' || o.status === 'pending'));
      setUgcOrders(allOrders.filter(o => o.type !== 'request' && o.status !== 'pending'));
      const videosSnap = await db.collection('ugcVideos').where('creatorId', '==', user.id).get();
      const vids = videosSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const urls = vids.map((v: any) => v.url);
      setSampleVideos(urls.length > 0 ? [...urls, ...Array(Math.max(0, 3 - urls.length)).fill('')] : ['', '', '']);
    } catch (err) {
      console.error('[ContentHub] Load UGC data error:', err);
    } finally {
      setLoadingUgcData(false);
    }
  }, [user?.id]);

  const handleAcceptRequest = useCallback(async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const res = await fetch(`/api/ugc/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      });
      if (!res.ok) throw new Error('Failed to accept');
      setUgcRequests(prev => prev.filter(r => r.id !== orderId));
      showToast('Request accepted!', 'success');
      loadUgcData();
    } catch {
      showToast('Failed to accept request', 'error');
    } finally {
      setActionLoading(null);
    }
  }, [showToast, loadUgcData]);

  const handleRejectRequest = useCallback(async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const res = await fetch(`/api/ugc/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      });
      if (!res.ok) throw new Error('Failed to reject');
      setUgcRequests(prev => prev.filter(r => r.id !== orderId));
      showToast('Request rejected', 'info');
      loadUgcData();
    } catch {
      showToast('Failed to reject request', 'error');
    } finally {
      setActionLoading(null);
    }
  }, [showToast, loadUgcData]);

  const handleGenerateIdeas = useCallback(async (req: any) => {
    setIdeasRequestId(req.id);
    setGeneratedIdeas(null);
    setGeneratingIdeas(true);
    try {
      const res = await fetch('/api/ugc/content-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: req.productName || req.product || 'Unknown Product',
          brief: req.brief || req.brand || '',
          deliverables: req.deliverables || null,
        }),
      });
      const data = await res.json();
      setGeneratedIdeas(data.ideas);
    } catch {
      showToast('Failed to generate ideas', 'error');
      setIdeasRequestId(null);
    } finally {
      setGeneratingIdeas(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (activeTab === 'ugc') loadUgcData();
  }, [activeTab, loadUgcData]);

  const handleLaunchCampaign = async () => {
    const product = selectedProduct;
    if (!user?.businessId || !product) {
      showToast('Select a product first', 'error');
      return;
    }
    try {
      const db = getDatabase();
      const days: CampaignDay[] = [
        { day: 1, task: 'Shoot 3 raw video clips of the product', done: false },
        { day: 2, task: 'Write 5 hook variations for the product', done: false },
        { day: 3, task: 'Edit primary Reel/TikTok', done: false },
        { day: 4, task: 'Create 3 static image posts', done: false },
        { day: 5, task: 'Schedule all posts across platforms', done: false },
        { day: 6, task: 'Engage with comments and reshare', done: false },
        { day: 7, task: 'Analyze performance and adjust strategy', done: false },
      ];
      const docRef = await db.collection(`businesses/${user.businessId}/campaigns`).add(
        { productId: product.id, productName: product.displayName, days, createdAt: Date.now() }
      );
      setCampaigns(prev => [...prev, { id: docRef.id, productId: product.id, productName: product.displayName, days, createdAt: Date.now() }]);
      showToast('7-Day campaign launched!', 'success');
    } catch (err) {
      showToast('Failed to launch campaign', 'error');
    }
  };

  const handleToggleTask = async (campaignId: string, dayIndex: number) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign || !user?.businessId) return;
    const updatedDays = campaign.days.map((d, i) => i === dayIndex ? { ...d, done: !d.done } : d);
    try {
      const db = getDatabase();
      await db.doc(`businesses/${user.businessId}/campaigns/${campaignId}`).set({ days: updatedDays }, { merge: true });
      setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, days: updatedDays } : c));
    } catch (err) {
      showToast('Failed to update task', 'error');
    }
  };

  const handleAddNiche = () => {
    const n = nicheInput.trim();
    if (n && !niches.includes(n)) setNiches(prev => [...prev, n]);
    setNicheInput('');
  };

  const handleRemoveNiche = (n: string) => {
    setNiches(prev => prev.filter(x => x !== n));
  };

  const handleVideoUrlChange = (idx: number, val: string) => {
    setSampleVideos(prev => prev.map((v, i) => i === idx ? val : v));
  };

  const handleAddVideoUrl = () => {
    setSampleVideos(prev => [...prev, '']);
  };

  const handleRemoveVideoUrl = (idx: number) => {
    setSampleVideos(prev => prev.filter((_, i) => i !== idx));
  };

  const formatCount = (n?: number) => {
    if (typeof n !== 'number' || isNaN(n)) return '';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    return String(n);
  };

  const handleVerifySocial = async (key: string, url: string) => {
    if (!url.trim()) {
      showToast('Enter a social URL first', 'error');
      return;
    }
    setSocialVerified(prev => ({ ...prev, [key]: 'checking' }));
    setSocialVerifyError(prev => ({ ...prev, [key]: '' }));
    try {
      const res = await fetch('/api/socials/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: key, url: url.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSocialVerified(prev => ({ ...prev, [key]: 'verified' }));
        if (typeof data.followerCount === 'number' && data.followerCount > 0) {
          setFollowerCounts(prev => ({ ...prev, [key]: data.followerCount }));
          setSocialStats(prev => ({
            ...prev,
            [key]: {
              name: data.name || '',
              followerCount: data.followerCount,
              followingCount: data.followingCount ?? 0,
              likesCount: data.likesCount ?? 0,
              postsCount: data.postsCount ?? 0,
              verified: data.accountVerified === true,
              verifiedAt: new Date().toISOString(),
            },
          }));
          showToast(`${key === 'tiktok' ? 'TikTok' : 'Instagram'} verified — ${formatCount(data.followerCount)} followers`, 'success');
        } else {
          showToast(`${key === 'tiktok' ? 'TikTok' : 'Instagram'} account verified`, 'success');
        }
      } else if (data.code === 'profile_unverifiable' || data.code === 'instagram_cookie_required') {
        setSocialVerified(prev => ({ ...prev, [key]: 'unverifiable' }));
        setSocialVerifyError(prev => ({ ...prev, [key]: data.error || '' }));
      } else {
        setSocialVerified(prev => ({ ...prev, [key]: 'failed' }));
        setSocialVerifyError(prev => ({ ...prev, [key]: data.error || 'Could not verify' }));
      }
    } catch {
      setSocialVerified(prev => ({ ...prev, [key]: 'failed' }));
      setSocialVerifyError(prev => ({ ...prev, [key]: 'Verification failed' }));
    }
  };

  const toDateInput = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const nextWeekdayDate = (dayName?: string) => {
    const target = dayName ? daysOfWeek.indexOf(dayName.charAt(0).toUpperCase() + dayName.slice(1)) : -1;
    const d = new Date();
    if (target >= 0) {
      const current = (d.getDay() + 6) % 7;
      let diff = target - current;
      if (diff <= 0) diff += 7;
      d.setDate(d.getDate() + diff);
    }
    return toDateInput(d);
  };

  const parseBestTime = (bestTime?: string) => {
    if (!bestTime) return '12:00';
    const m = bestTime.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (!m) return '12:00';
    let h = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2], 10) : 0;
    const ap = (m[3] || '').toLowerCase();
    if (ap === 'pm' && h < 12) h += 12;
    if (ap === 'am' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  };

  const handleScheduleIdea = (idea: any, product?: any) => {
    const platform = (idea.platforms?.[0] || 'instagram') as string;
    setAddForm({
      title: idea.hook || '',
      platform: PLATFORMS.some(p => p.key === platform) ? platform : 'instagram',
      date: nextWeekdayDate(idea.bestDay),
      time: parseBestTime(idea.bestTime),
      productId: product?.id || '',
      notes: [idea.format, idea.cta].filter(Boolean).join(' — '),
    });
    setAddFormOpen(true);
    setActiveTab('calendar');
  };

  const handleAddCalendarPost = async () => {
    if (!user?.businessId) return;
    if (!addForm.title.trim() || !addForm.date) {
      showToast('Add a title and pick a date', 'error');
      return;
    }
    try {
      const db = getDatabase();
      const product = products.find(p => p.id === addForm.productId);
      const post: any = {
        title: addForm.title.trim(),
        platform: addForm.platform,
        date: addForm.date,
        time: addForm.time || '12:00',
        productId: addForm.productId || null,
        productName: product?.displayName || null,
        notes: addForm.notes || '',
        status: 'scheduled',
        postedUrl: '',
        createdAt: Date.now(),
      };
      const ref = await db.collection(`businesses/${user.businessId}/contentCalendar`).add(post);
      setCalendarPosts(prev => [...prev, { id: ref.id, ...post }]);
      setAddFormOpen(false);
      setAddForm({ title: '', platform: 'instagram', date: '', time: '12:00', productId: '', notes: '' });
      showToast('Post scheduled', 'success');
    } catch {
      showToast('Failed to schedule post', 'error');
    }
  };

  const handleTogglePostStatus = async (post: CalendarPost) => {
    if (!user?.businessId) return;
    const next = post.status === 'scheduled' ? 'posted' : 'scheduled';
    try {
      const db = getDatabase();
      await db.doc(`businesses/${user.businessId}/contentCalendar/${post.id}`).set({ status: next }, { merge: true });
      setCalendarPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: next } : p));
    } catch {
      showToast('Failed to update post', 'error');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user?.businessId) return;
    if (!window.confirm('Delete this scheduled post?')) return;
    try {
      const db = getDatabase();
      await db.doc(`businesses/${user.businessId}/contentCalendar/${postId}`).delete();
      setCalendarPosts(prev => prev.filter(p => p.id !== postId));
      showToast('Post deleted', 'info');
    } catch {
      showToast('Failed to delete post', 'error');
    }
  };

  const handleAddSocialProfile = async () => {
    if (!user?.businessId) return;
    const url = newSocialUrl.trim();
    if (!url) {
      showToast('Paste your profile URL', 'error');
      return;
    }
    const key = newSocialPlatform;
    try {
      const db = getDatabase();
      await db.doc(`businesses/${user.businessId}/socialProfiles/${key}`).set({
        platform: key, url, updatedAt: Date.now(),
      }, { merge: true });
      setSocialProfiles(prev => ({ ...prev, [key]: { ...(prev[key] || {}), platform: key, url } as SocialProfile }));
      setNewSocialUrl('');
      setShowAddProfile(false);
      showToast('Profile added', 'success');
      handleVerifyProfile(key, url);
    } catch {
      showToast('Failed to save profile', 'error');
    }
  };

  const handleVerifyProfile = async (key: string, url: string) => {
    if (!user?.businessId || !url) return;
    setSocialProfileLoading(prev => ({ ...prev, [key]: true }));
    try {
      const res = await fetch('/api/socials/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: key, url: url.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.ok && typeof data.followerCount === 'number' && data.followerCount > 0) {
        const updated: SocialProfile = {
          ...(socialProfiles[key] || { platform: key, url: url.trim() }),
          platform: key, url: url.trim(),
          followerCount: data.followerCount,
          followingCount: data.followingCount ?? 0,
          postsCount: data.postsCount ?? 0,
          likesCount: data.likesCount ?? 0,
          verified: data.accountVerified === true,
          verifiedAt: new Date().toISOString(),
        };
        const db = getDatabase();
        await db.doc(`businesses/${user.businessId}/socialProfiles/${key}`).set(updated, { merge: true });
        setSocialProfiles(prev => ({ ...prev, [key]: updated }));
        showToast(`${key === 'tiktok' ? 'TikTok' : 'Instagram'} verified — ${formatCount(data.followerCount)} followers`, 'success');
      } else if (res.ok && data.ok) {
        showToast('Account verified (existence check)', 'success');
      } else {
        showToast(data.error || 'Could not verify this account', 'error');
      }
    } catch {
      showToast('Verification failed', 'error');
    } finally {
      setSocialProfileLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleRemoveSocialProfile = async (key: string) => {
    if (!user?.businessId) return;
    if (!window.confirm('Remove this social profile?')) return;
    try {
      const db = getDatabase();
      await db.doc(`businesses/${user.businessId}/socialProfiles/${key}`).delete();
      setSocialProfiles(prev => { const n = { ...prev }; delete n[key]; return n; });
      showToast('Profile removed', 'info');
    } catch {
      showToast('Failed to remove profile', 'error');
    }
  };

  const buildAudienceContext = () => {
    const parts = [
      storeConfig?.storeName ? `Store: ${storeConfig.storeName}` : '',
      storeConfig?.businessCategory ? `Category: ${storeConfig.businessCategory}` : '',
      storeConfig?.tagline ? `Tagline: ${storeConfig.tagline}` : '',
      products.length ? `Catalog: ${products.map(p => p.displayName).join(', ')}` : '',
    ].filter(Boolean);
    return parts.join('. ');
  };

  const topProductsFromOrders = () => {
    const map: Record<string, { name: string; units: number }> = {};
    analyticsOrders.forEach((o: any) => {
      if (o.paymentStatus !== 'paid') return;
      (o.lineItems || []).forEach((it: any) => {
        if (!map[it.displayName]) map[it.displayName] = { name: it.displayName, units: 0 };
        map[it.displayName].units += it.quantity || 1;
      });
    });
    return Object.values(map).sort((a, b) => b.units - a.units)[0];
  };

  const handleRecommendForAudience = async () => {
    setRecommending(true);
    setRecommendError('');
    setMoRecommendations(null);
    try {
      const top = topProductsFromOrders();
      const insights = [
        buildAudienceContext(),
        top ? `Best-selling product: ${top.name} (${top.units} units sold)` : '',
        `Content calendar: ${calendarPosts.filter(p => p.status === 'scheduled').length} scheduled, ${calendarPosts.filter(p => p.status === 'posted').length} published`,
      ].filter(Boolean).join('. ');
      const res = await fetch('/api/content/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: top?.name || products[0]?.displayName || 'your product',
          description: top ? 'Your best-selling product' : (products[0]?.description || ''),
          price: products.find(p => p.displayName === top?.name)?.price ?? products[0]?.price,
          category: storeConfig?.businessCategory || '',
          productType: 'physical',
          audienceContext: insights,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate recommendations');
      setMoRecommendations(data);
    } catch (e) {
      setRecommendError(e instanceof Error ? e.message : 'Failed to generate recommendations');
    } finally {
      setRecommending(false);
    }
  };

  const analyticsCutoff = new Date();
  analyticsCutoff.setDate(analyticsCutoff.getDate() - 30);
  const paidOrders = analyticsOrders.filter((o: any) => o.createdAt >= analyticsCutoff && o.paymentStatus === 'paid');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);
  const totalOrders = paidOrders.length;
  const pageViews = analyticsEvents.filter(e => e.eventType === 'page_view').length;
  const addToCarts = analyticsEvents.filter(e => e.eventType === 'add_to_cart').length;
  const checkoutInitiated = analyticsEvents.filter(e => e.eventType === 'checkout_initiated').length;
  const conversionRate = checkoutInitiated > 0 ? ((totalOrders / checkoutInitiated) * 100).toFixed(1) : '—';
  const scheduledCount = calendarPosts.filter(p => p.status === 'scheduled').length;
  const postedCount = calendarPosts.filter(p => p.status === 'posted').length;
  const upcomingPosts = calendarPosts.filter(p => p.status === 'scheduled' && p.date >= toDateInput(new Date())).slice(0, 5);
  const profileCount = Object.keys(socialProfiles).filter(k => socialProfiles[k]?.url).length;

  const handleAvatarUpload = async (): Promise<string | null> => {
    if (!avatarFile) return avatarPreview;
    try {
      const storageMod = await import('firebase/storage');
      const storage = storageMod.getStorage();
      const ext = avatarFile.name.split('.').pop() || 'jpg';
      const fileRef = storageMod.ref(storage, `ugc-avatars/${user!.id}.${ext}`);
      await storageMod.uploadBytes(fileRef, avatarFile);
      return await storageMod.getDownloadURL(fileRef);
    } catch {
      showToast('Failed to upload avatar', 'error');
      return avatarPreview;
    }
  };

  const handleSaveUgcProfile = async () => {
    if (!user?.id) return;
    if (!niches.length || !price30s || !price60s || !deliveryDays) {
      showToast('Fill in all required fields', 'error');
      return;
    }
    setSavingUgc(true);
    try {
      const db = getDatabase();
      const p30 = Number(price30s);
      const p60 = Number(price60s);
      if (isNaN(p30) || isNaN(p60) || p30 < 0 || p60 < 0) {
        showToast('Prices must be valid non-negative numbers', 'error');
        return;
      }
      const username = ugcUsername.trim() || user.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'creator';
      const avatarUrl = await handleAvatarUpload();
      const creator = {
        userId: user.id,
        username,
        displayName: user.name,
        bio: bio || '',
        avatarUrl,
        niches,
        isActive: true,
        isBanned: false,
        price30s: Math.round(p30 * 100),
        price60s: Math.round(p60 * 100),
        currency: storeConfig?.currency ?? 'NGN',
        deliveryDays: Number(deliveryDays) || 5,
        rating: 0,
        totalOrders: 0,
        totalEarnings: 0,
        socialLinks,
        followerCounts,
        socialVerified,
        socialStats,
        portfolioImages: portfolioImages.filter(Boolean),
        contactEmail: contactEmail || user.email || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.doc(`ugcCreators/${user.id}`).set(creator);
      const videos = sampleVideos.filter(Boolean);
      const existingVideos = await db.collection('ugcVideos').where('creatorId', '==', user.id).where('hasWatermark', '==', true).get();
      for (const d of existingVideos.docs) {
        await db.doc(`ugcVideos/${d.id}`).delete();
      }
      for (const url of videos) {
        await db.collection('ugcVideos').add({
          creatorId: user.id, url, thumbnail: null, duration: 15,
          hasWatermark: true, title: null, createdAt: new Date().toISOString(),
        });
      }
      showToast(ugcProfile ? 'Profile updated!' : 'Profile saved! You\'re now listed as a creator.', 'success');
      setUgcView('dashboard');
      await loadUgcData();
    } catch (err) {
      showToast('Failed to save profile', 'error');
    } finally {
      setSavingUgc(false);
    }
  };

  const [ugcActionLoading, setUgcActionLoading] = useState<string | null>(null);

  const handleToggleUgcVisibility = async () => {
    if (!user?.id || !ugcProfile) return;
    const next = ugcProfile.isActive === false;
    if (!window.confirm(next
      ? 'Make your profile public? Brands will be able to find and hire you again.'
      : 'Hide your profile? Brands will no longer see you in the marketplace.')) return;
    setUgcActionLoading('visibility');
    try {
      const db = getDatabase();
      await db.doc(`ugcCreators/${user.id}`).update({
        isActive: next,
        updatedAt: new Date().toISOString(),
      });
      showToast(next ? 'Profile is now public' : 'Profile hidden', 'success');
      await loadUgcData();
    } catch {
      showToast('Failed to update profile', 'error');
    } finally {
      setUgcActionLoading(null);
    }
  };

  const handleDeleteUgcProfile = async () => {
    if (!user?.id || !ugcProfile) return;
    if (!window.confirm('Delete your creator profile permanently? Your listing and sample videos will be removed. This cannot be undone.')) return;
    setUgcActionLoading('delete');
    try {
      const db = getDatabase();
      const videosSnap = await db.collection('ugcVideos').where('creatorId', '==', user.id).where('hasWatermark', '==', true).get();
      for (const d of videosSnap.docs) {
        await db.doc(`ugcVideos/${d.id}`).delete();
      }
      await db.doc(`ugcCreators/${user.id}`).delete();
      setUgcProfile(null);
      setUgcView('apply');
      setSampleVideos(['', '', '']);
      showToast('Profile deleted', 'success');
    } catch {
      showToast('Failed to delete profile', 'error');
    } finally {
      setUgcActionLoading(null);
    }
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div>
        <h2 style={s.heading}>Content Hub</h2>
        <p style={s.sub}>Create, schedule, and analyze your content across all platforms</p>
      </div>

      {/* ─── Tabs ─── */}
      <div style={s.tabs}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              style={s.tab(activeTab === tab.id)}
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === 'ugc') setUgcView(ugcProfile ? 'dashboard' : 'apply');
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── Tab Content ─── */}
      <div style={s.card}>
        {/* ============================================================ */}
        {/* IDEAS TAB                                                    */}
        {/* ============================================================ */}
        {activeTab === 'ideas' && (
          <div>
            <div style={s.cardHeader}>
              <div>
                <p style={s.cardTitle}>Content Ideas</p>
                <p style={s.cardSub}>Turn your products into content that sells</p>
              </div>
            </div>
            <div style={s.cardBody}>
              {/* Product Gallery */}
              <div className={generatorStyles.gallerySection}>
                <span className={generatorStyles.galleryLabel}>
                  {products.length > 0 ? `Your Products (${products.length})` : 'Products'}
                </span>

                {productsLoading ? (
                  <div className={generatorStyles.productGrid}>
                    {[1, 2, 3].map(i => (
                      <div key={i} className={generatorStyles.card} style={{ opacity: 0.5, pointerEvents: 'none' }}>
                        <div className={generatorStyles.cardImageWrap} />
                        <div className={generatorStyles.cardBody}>
                          <div className={generatorStyles.cardName}>&nbsp;</div>
                          <div className={generatorStyles.cardMeta}>&nbsp;</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : products.length === 0 ? (
                  <div className={generatorStyles.productGrid}>
                    <div className={generatorStyles.emptyState}>
                      <Package size={48} className={generatorStyles.emptyIcon} />
                      <p className={generatorStyles.emptyTitle}>No products yet</p>
                      <p className={generatorStyles.emptyText}>
                        Add your first product to get content ideas, scripts, and selling tips tailored for it.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className={generatorStyles.productGrid}>
                    {products.map(p => (
                      <ProductContentCard
                        key={p.id}
                        product={p}
                        selected={selectedProduct?.id === p.id}
                        onSelect={handleSelectProduct}
                        currency={currency}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Content Generator Panel */}
              {selectedProduct && (
                <ContentGenerator
                  product={selectedProduct}
                  onClose={() => setSelectedProduct(null)}
                  currency={currency}
                  audienceContext={buildAudienceContext()}
                  onScheduleIdea={handleScheduleIdea}
                />
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* CALENDAR TAB                                                 */}
        {/* ============================================================ */}
        {activeTab === 'calendar' && (
          <div>
            <div style={s.cardHeader}>
              <div>
                <p style={s.cardTitle}>Content Calendar</p>
                <p style={s.cardSub}>Schedule ideas from the Ideas tab, then mark posts as published to track your social postings</p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', padding: '4px 6px' }}>
                  <button
                    onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sell-text-2)', display: 'flex', padding: 2 }}
                    title="Previous month"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--sell-text-1)', minWidth: 120, textAlign: 'center' }}>
                    {calMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sell-text-2)', display: 'flex', padding: 2 }}
                    title="Next month"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
                <button
                  onClick={() => { setAddFormOpen(true); if (!addForm.date) setAddForm(prev => ({ ...prev, date: toDateInput(new Date()) })); }}
                  style={s.btnPrimary}
                >
                  <Plus size={14} />
                  Schedule Post
                </button>
                <button
                  onClick={() => setReminderOn(!reminderOn)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 'var(--sell-radius-sm)',
                    border: '1px solid var(--sell-border)', background: 'var(--sell-surface)', cursor: 'pointer',
                    fontSize: '0.78rem', fontWeight: 600, color: reminderOn ? 'var(--sell-primary)' : 'var(--sell-text-3)',
                  }}
                  title="Picks up pending posts in Ask MO"
                >
                  {reminderOn ? <Bell size={14} /> : <BellOff size={14} />}
                  {reminderOn ? 'Reminders On' : 'Reminders Off'}
                </button>
              </div>
            </div>
            <div style={s.cardBody}>
              {/* Add post form */}
              {addFormOpen && (
                <div style={{ border: '1px solid var(--sell-primary)', borderRadius: 'var(--sell-radius-sm)', padding: 16, background: 'var(--sell-primary-lt)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--sell-text-1)' }}>
                    <CalendarClock size={14} style={{ verticalAlign: -2, marginRight: 6 }} />Schedule a post
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
                    <input
                      style={s.formInput}
                      placeholder="Post title / idea (e.g. 'Unboxing hook reel')"
                      value={addForm.title}
                      onChange={e => setAddForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                    <select
                      style={s.formInput}
                      value={addForm.platform}
                      onChange={e => setAddForm(prev => ({ ...prev, platform: e.target.value }))}
                    >
                      {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.icon} {p.label}</option>)}
                    </select>
                    <input
                      style={s.formInput}
                      type="date"
                      value={addForm.date}
                      onChange={e => setAddForm(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 10 }}>
                    <input
                      style={s.formInput}
                      type="time"
                      value={addForm.time}
                      onChange={e => setAddForm(prev => ({ ...prev, time: e.target.value }))}
                    />
                    <select
                      style={s.formInput}
                      value={addForm.productId}
                      onChange={e => setAddForm(prev => ({ ...prev, productId: e.target.value }))}
                    >
                      <option value="">No product</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.displayName}</option>)}
                    </select>
                    <input
                      style={s.formInput}
                      placeholder="Notes (format, CTA, script ref…)"
                      value={addForm.notes}
                      onChange={e => setAddForm(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={s.btnPrimary} onClick={handleAddCalendarPost}>
                      <Send size={13} />
                      Save to Calendar
                    </button>
                    <button style={s.btnGhost} onClick={() => setAddFormOpen(false)}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Month grid */}
              {calendarLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, color: 'var(--sell-text-3)', fontSize: '0.85rem', gap: 8 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18, animation: 'spin 0.7s linear infinite' }}>
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  Loading calendar…
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                  {daysOfWeek.map(day => (
                    <div key={day} style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.78rem', color: 'var(--sell-text-3)', padding: '6px 0' }}>
                      {day}
                    </div>
                  ))}
                  {(() => {
                    const monthStart = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1);
                    const firstWeekday = (monthStart.getDay() + 6) % 7;
                    const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
                    const cells: (Date | null)[] = [
                      ...Array.from({ length: firstWeekday }, () => null),
                      ...Array.from({ length: daysInMonth }, (_, i) => new Date(calMonth.getFullYear(), calMonth.getMonth(), i + 1)),
                    ];
                    const todayKey = toDateInput(new Date());
                    return cells.map((d, idx) => {
                      if (!d) return <div key={idx} />;
                      const key = toDateInput(d);
                      const posts = calendarPosts.filter(p => p.date === key);
                      const isToday = key === todayKey;
                      return (
                        <div
                          key={idx}
                          style={{
                            border: `1px solid ${isToday ? 'var(--sell-primary)' : 'var(--sell-border)'}`,
                            borderRadius: 'var(--sell-radius-sm)',
                            background: 'var(--sell-bg)',
                            padding: 6,
                            minHeight: 96,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            overflow: 'hidden',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isToday ? 'var(--sell-primary)' : 'var(--sell-text-1)' }}>{d.getDate()}</span>
                            <button
                              onClick={() => { setAddForm(prev => ({ ...prev, date: key })); setAddFormOpen(true); }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sell-text-3)', display: 'flex', padding: 1 }}
                              title="Add a post on this day"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          {posts.slice(0, 3).map(p => {
                            const icon = PLATFORMS.find(pl => pl.key === p.platform)?.icon || '•';
                            return (
                              <div key={p.id} style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <button
                                  onClick={() => handleTogglePostStatus(p)}
                                  title={(p.status === 'posted' ? 'Posted — click to mark scheduled' : 'Click to mark as posted') + (p.notes ? `\n${p.notes}` : '')}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.6rem', textAlign: 'left',
                                    padding: '2px 6px', borderRadius: 6, border: '1px solid', cursor: 'pointer', flex: 1, minWidth: 0,
                                    background: p.status === 'posted' ? 'var(--sell-green-bg)' : 'var(--sell-surface-2)',
                                    borderColor: p.status === 'posted' ? 'var(--sell-green)' : 'var(--sell-border)',
                                    color: 'var(--sell-text-1)',
                                  }}
                                >
                                  <span>{icon}</span>
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: p.status === 'posted' ? 'line-through' : 'none' }}>
                                    {p.title}
                                  </span>
                                  {p.status === 'posted' && <CheckCircle2 size={10} color="var(--sell-green)" />}
                                </button>
                                <button
                                  onClick={() => handleDeletePost(p.id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sell-text-3)', fontSize: '0.6rem', padding: 1 }}
                                  title="Delete post"
                                >
                                  ✕
                                </button>
                              </div>
                            );
                          })}
                          {posts.length > 3 && (
                            <span style={{ fontSize: '0.6rem', color: 'var(--sell-text-3)' }}>+{posts.length - 3} more</span>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TRENDS TAB                                                   */}
        {/* ============================================================ */}
        {activeTab === 'trends' && (
          <div>
            <div style={s.cardHeader}>
              <div>
                <p style={s.cardTitle}>Trending</p>
                <p style={s.cardSub}>Trending topics and formats relevant to your products</p>
              </div>
            </div>
            <div style={s.cardBody}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '40px 20px', color: 'var(--sell-text-3)', textAlign: 'center' }}>
                <TrendingUp size={40} style={{ opacity: 0.3 }} />
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--sell-text-2)' }}>Trends loading soon</p>
                <p style={{ fontSize: '0.85rem', maxWidth: 340 }}>Real-time trending topics for the Nigerian creator economy will appear here once we connect trend data from across platforms.</p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* CAMPAIGNS TAB                                                */}
        {/* ============================================================ */}
        {activeTab === 'campaigns' && (
          <div>
            <div style={s.cardHeader}>
              <div>
                <p style={s.cardTitle}>Campaigns</p>
                <p style={s.cardSub}>Launch and manage 7-day content campaigns</p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--sell-text-2)' }}>
                  {selectedProduct ? `Product: ${selectedProduct.displayName}` : 'Select a product from the Ideas tab first'}
                </span>
                <button style={s.btnPrimary} onClick={handleLaunchCampaign} disabled={!selectedProduct}>
                  <Megaphone size={14} />
                  Launch 7-Day Campaign
                </button>
              </div>
            </div>
            <div style={s.cardBody}>
              {campaigns.length === 0 && !campaignLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '40px 20px', color: 'var(--sell-text-3)', textAlign: 'center' }}>
                  <Megaphone size={40} style={{ opacity: 0.3 }} />
                  <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--sell-text-2)' }}>No campaigns yet</p>
                  <p style={{ fontSize: '0.85rem', maxWidth: 340 }}>Select a product and launch a 7-day campaign to get a structured content plan.</p>
                </div>
              ) : campaignLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, color: 'var(--sell-text-3)', fontSize: '0.85rem', gap: 8 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18, animation: 'spin 0.7s linear infinite' }}>
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  Loading campaigns\u2026
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {campaigns.map(campaign => (
                    <div key={campaign.id} style={{ border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', background: 'var(--sell-surface-2)', borderBottom: '1px solid var(--sell-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--sell-text-1)' }}>{campaign.productName}</p>
                          <p style={{ fontSize: '0.72rem', color: 'var(--sell-text-3)' }}>7-Day Campaign \u00b7 {campaign.days.filter(d => d.done).length}/{campaign.days.length} tasks done</p>
                        </div>
                      </div>
                      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {campaign.days.map((day, di) => (
                          <label
                            key={di}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px',
                              cursor: 'pointer', fontSize: '0.82rem', color: day.done ? 'var(--sell-text-3)' : 'var(--sell-text-1)',
                              textDecoration: day.done ? 'line-through' : 'none',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={day.done}
                              onChange={() => handleToggleTask(campaign.id, di)}
                              style={{ accentColor: 'var(--sell-green)' }}
                            />
                            <span style={{ fontWeight: 600, minWidth: 30, color: 'var(--sell-text-3)' }}>Day {day.day}</span>
                            <span>{day.task}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* ANALYTICS TAB                                                */}
        {/* ============================================================ */}
        {activeTab === 'analytics' && (
          <div>
            <div style={s.cardHeader}>
              <div>
                <p style={s.cardTitle}>Content Analytics</p>
                <p style={s.cardSub}>Real store performance, verified social growth, and MO's audience-driven recommendations</p>
              </div>
            </div>
            <div style={s.cardBody}>
              {analyticsLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, color: 'var(--sell-text-3)', fontSize: '0.85rem', gap: 8 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18, animation: 'spin 0.7s linear infinite' }}>
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  Loading analytics…
                </div>
              ) : (
                <>
                  {/* KPI row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                    {[
                      { label: 'Revenue (30d)', value: `${currency === 'NGN' ? '₦' : ''}${formatCount(totalRevenue)}`, sub: `${totalOrders} paid orders` },
                      { label: 'Store views', value: formatCount(pageViews) || '0', sub: 'Last 30 days' },
                      { label: 'Add to cart', value: formatCount(addToCarts) || '0', sub: 'Last 30 days' },
                      { label: 'Conversion', value: conversionRate === '—' ? '—' : `${conversionRate}%`, sub: 'Checkout → order' },
                      { label: 'Posted vs Planned', value: `${postedCount}/${scheduledCount + postedCount}`, sub: 'Social calendar' },
                    ].map(k => (
                      <div key={k.label} style={{ border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', padding: '12px 14px', background: 'var(--sell-bg)' }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--sell-text-3)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 4 }}>{k.label}</p>
                        <p style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--sell-text-1)' }}>{k.value}</p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--sell-text-3)' }}>{k.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Social + calendar stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                    {/* Social analytics */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--sell-text-1)' }}>Social Growth <span style={{ fontWeight: 400, color: 'var(--sell-text-3)' }}>— real follower counts, verified</span></p>
                      {profileCount === 0 ? (
                        <div style={{ border: '1px dashed var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <p style={{ fontSize: '0.78rem', color: 'var(--sell-text-3)', margin: 0 }}>Add your public social profiles so MO can pull live follower counts and verify them.</p>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <select style={{ ...s.formInput, flex: 'none', width: 130 }} value={newSocialPlatform} onChange={e => setNewSocialPlatform(e.target.value)}>
                              {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                            </select>
                            <input
                              style={{ ...s.formInput, flex: 1 }}
                              placeholder="Profile URL (e.g. https://tiktok.com/@you)"
                              value={newSocialUrl}
                              onChange={e => setNewSocialUrl(e.target.value)}
                            />
                            <button style={s.btnPrimary} onClick={handleAddSocialProfile} disabled={!newSocialUrl.trim() || socialProfileLoading[newSocialPlatform]}>
                              {socialProfileLoading[newSocialPlatform] ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 13, height: 13, animation: 'spin 0.7s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                              ) : <Check size={13} />}
                              {socialProfileLoading[newSocialPlatform] ? 'Verifying…' : 'Add & Verify'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {PLATFORMS.filter(p => socialProfiles[p.key]?.url).map(({ key, label, icon }) => {
                            const sp = socialProfiles[key];
                            return (
                              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', padding: '8px 12px', background: 'var(--sell-bg)' }}>
                                <span style={{ fontSize: '1rem' }}>{icon}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--sell-text-1)' }}>{label}</span>
                                    {sp.followerCount ? <BadgeCheck size={13} color="var(--sell-green)" /> : null}
                                  </div>
                                  <p style={{ fontSize: '0.72rem', color: 'var(--sell-text-3)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {sp.followerCount ? `${formatCount(sp.followerCount)} followers` : 'Not yet verified'}
                                    {sp.verifiedAt ? ` · verified ${new Date(sp.verifiedAt).toLocaleDateString()}` : ''}
                                  </p>
                                </div>
                                {(key === 'tiktok' || key === 'instagram') && (
                                  <button
                                    style={{ ...s.btnGhost, fontSize: '0.68rem', padding: '4px 9px' }}
                                    disabled={socialProfileLoading[key]}
                                    onClick={() => handleVerifyProfile(key, sp.url)}
                                  >
                                    {socialProfileLoading[key] ? '…' : 'Re-verify'}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleRemoveSocialProfile(key)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sell-text-3)', display: 'flex', padding: 2 }}
                                  title="Remove profile"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            );
                          })}
                          <button style={{ ...s.btnGhost, alignSelf: 'flex-start', fontSize: '0.75rem', padding: '6px 12px' }} onClick={() => setShowAddProfile(true)}>
                            <Plus size={12} /> Add another profile
                          </button>
                          {showAddProfile && (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <select style={{ ...s.formInput, flex: 'none', width: 130 }} value={newSocialPlatform} onChange={e => setNewSocialPlatform(e.target.value)}>
                                {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                              </select>
                              <input
                                style={{ ...s.formInput, flex: 1 }}
                                placeholder="Profile URL"
                                value={newSocialUrl}
                                onChange={e => setNewSocialUrl(e.target.value)}
                              />
                              <button style={s.btnPrimary} onClick={handleAddSocialProfile} disabled={!newSocialUrl.trim()}>
                                Add
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Calendar / posting stats */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--sell-text-1)' }}>Posting Tracker <span style={{ fontWeight: 400, color: 'var(--sell-text-3)' }}>— from your calendar</span></p>
                      {calendarPosts.length === 0 ? (
                        <div style={{ border: '1px dashed var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', padding: 14 }}>
                          <p style={{ fontSize: '0.78rem', color: 'var(--sell-text-3)', margin: 0 }}>
                            No posts scheduled yet. Generate ideas on the Ideas tab and add them to the Calendar to start tracking.
                          </p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <div style={{ flex: 1, border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', padding: '8px 12px', background: 'var(--sell-bg)', textAlign: 'center' }}>
                              <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--sell-primary)', margin: 0 }}>{scheduledCount}</p>
                              <p style={{ fontSize: '0.7rem', color: 'var(--sell-text-3)', margin: 0 }}>Scheduled</p>
                            </div>
                            <div style={{ flex: 1, border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', padding: '8px 12px', background: 'var(--sell-bg)', textAlign: 'center' }}>
                              <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--sell-green)', margin: 0 }}>{postedCount}</p>
                              <p style={{ fontSize: '0.7rem', color: 'var(--sell-text-3)', margin: 0 }}>Published</p>
                            </div>
                          </div>
                          {upcomingPosts.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <p style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--sell-text-3)', margin: 0 }}>Upcoming</p>
                              {upcomingPosts.map(p => (
                                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: 'var(--sell-text-2)' }}>
                                  <span style={{ flexShrink: 0 }}>{PLATFORMS.find(pl => pl.key === p.platform)?.icon || '•'}</span>
                                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                                  <span style={{ flexShrink: 0, color: 'var(--sell-text-3)' }}>{p.date}</span>
                                  <button
                                    onClick={() => handleTogglePostStatus(p)}
                                    style={{ ...s.btnGhost, fontSize: '0.62rem', padding: '3px 8px', color: 'var(--sell-green)' }}
                                    title="Mark as posted"
                                  >
                                    <CheckCircle2 size={11} /> Post
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* MO Recommendations */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--sell-text-1)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Target size={15} color="var(--sell-accent)" /> MO Recommends for Your Audience
                        </p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--sell-text-3)', margin: 0, maxWidth: 460 }}>
                          Ideas generated for {storeConfig?.businessCategory || 'your store'} and your best-selling product — schedule them straight to the calendar.
                        </p>
                      </div>
                      <button style={s.btnPrimary} onClick={handleRecommendForAudience} disabled={recommending}>
                        {recommending ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 13, height: 13, animation: 'spin 0.7s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                        ) : <Sparkles size={13} />}
                        {recommending ? 'MO is thinking…' : 'Generate Recommendations'}
                      </button>
                    </div>
                    {recommendError && (
                      <div style={{ border: '1px solid var(--sell-red, #EF4444)', borderRadius: 'var(--sell-radius-sm)', padding: 10, fontSize: '0.78rem', color: 'var(--sell-red, #EF4444)' }}>
                        {recommendError}
                      </div>
                    )}
                    {moRecommendations && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {moRecommendations.audienceNote && (
                          <div style={{ display: 'flex', gap: 8, background: 'var(--sell-primary-lt)', border: '1px solid var(--sell-primary)', borderRadius: 'var(--sell-radius-sm)', padding: '10px 12px' }}>
                            <Sparkles size={15} color="var(--sell-primary)" style={{ flexShrink: 0, marginTop: 1 }} />
                            <p style={{ fontSize: '0.78rem', color: 'var(--sell-text-1)', margin: 0 }}>{moRecommendations.audienceNote}</p>
                          </div>
                        )}
                        {(moRecommendations.ideas || []).map((idea: any, i: number) => (
                          <div key={i} style={{ border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', padding: '10px 14px', background: 'var(--sell-bg)' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                              <div style={{ minWidth: 0 }}>
                                <p style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--sell-text-1)', margin: 0 }}>{idea.hook}</p>
                                <p style={{ fontSize: '0.74rem', color: 'var(--sell-text-2)', marginTop: 3, marginBottom: 0 }}>
                                  {idea.format}
                                  {idea.bestDay && idea.bestTime ? ` · Best: ${idea.bestDay}, ${idea.bestTime}` : ''}
                                  {idea.cta ? ` · CTA: ${idea.cta}` : ''}
                                </p>
                              </div>
                              <button
                                style={{ ...s.btnGhost, flexShrink: 0, fontSize: '0.68rem', padding: '4px 10px' }}
                                onClick={() => handleScheduleIdea(idea)}
                              >
                                <CalendarClock size={12} /> Schedule
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* UGC TAB                                                      */}
        {/* ============================================================ */}
        {activeTab === 'ugc' && (
          <div>
            <div style={s.cardHeader}>
              <div>
                <p style={s.cardTitle}>UGC Creator Marketplace</p>
                <p style={s.cardSub}>Apply as a creator or manage your creator dashboard</p>
              </div>
              {ugcProfile && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    style={ugcView === 'dashboard' ? s.btnPrimary : { ...s.btnGhost, fontSize: '0.78rem' }}
                    onClick={() => setUgcView('dashboard')}
                  >
                    <Users size={14} />
                    Dashboard
                  </button>
                  <button
                    style={ugcView === 'apply' ? s.btnPrimary : { ...s.btnGhost, fontSize: '0.78rem' }}
                    onClick={() => setUgcView('apply')}
                  >
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
            <div style={s.cardBody}>
              {ugcView === 'apply' ? (
                /* ─── Apply / Edit Form ─── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
                  <p style={{ fontSize: '0.82rem', color: 'var(--sell-text-2)', fontWeight: 600 }}>Become a UGC Creator</p>

                  {/* Niches */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <label style={s.formLabel}>Niches *</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {niches.map(n => (
                        <span key={n} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'var(--sell-primary-lt)', color: 'var(--sell-primary)', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600 }}>
                          {n}
                          <button onClick={() => handleRemoveNiche(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sell-primary)', padding: 0, display: 'flex', fontSize: '14px', lineHeight: 1 }}>&times;</button>
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        style={s.formInput}
                        value={nicheInput}
                        onChange={e => setNicheInput(e.target.value)}
                        placeholder="e.g. Fashion, Tech, Beauty"
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddNiche(); } }}
                      />
                      <button style={s.btnSecondary} onClick={handleAddNiche}>
                        <Plus size={14} />
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={s.formLabel}>Price (30s video) *</label>
                      <input style={s.formInput} type="number" value={price30s} onChange={e => setPrice30s(e.target.value)} placeholder={`0 ${currency}`} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={s.formLabel}>Price (60s video) *</label>
                      <input style={s.formInput} type="number" value={price60s} onChange={e => setPrice60s(e.target.value)} placeholder={`0 ${currency}`} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={s.formLabel}>Delivery (days) *</label>
                      <input style={s.formInput} type="number" value={deliveryDays} onChange={e => setDeliveryDays(e.target.value)} placeholder="3" />
                    </div>
                  </div>

                  {/* Sample Videos */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <label style={s.formLabel}>Sample Videos (URLs) <span style={{ fontWeight: 400, color: 'var(--sell-text-3)' }}>(3 by default, add more if you like)</span></label>
                    {sampleVideos.map((url, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          style={s.formInput}
                          value={url}
                          onChange={e => handleVideoUrlChange(idx, e.target.value)}
                          placeholder={`Video URL ${idx + 1}`}
                        />
                        <button
                          style={{ ...s.btnGhost, padding: '6px 8px', fontSize: '0.72rem', color: 'var(--sell-red, #EF4444)', flexShrink: 0 }}
                          onClick={() => handleRemoveVideoUrl(idx)}
                          title="Remove video"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <button style={{ ...s.btnGhost, alignSelf: 'flex-start', fontSize: '0.75rem', padding: '6px 12px' }} onClick={handleAddVideoUrl}>
                      <Plus size={12} />
                      Add another URL
                    </button>
                  </div>

                  {/* Bio */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <label style={s.formLabel}>Bio</label>
                    <textarea
                      style={{ ...s.formInput, minHeight: 80, resize: 'vertical' as const, fontFamily: 'var(--sell-font-body)' }}
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      placeholder="Tell brands about yourself..."
                    />
                  </div>

                  {/* Username for public portfolio */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <label style={s.formLabel}>Portfolio Username</label>
                    <input
                      style={s.formInput}
                      value={ugcUsername}
                      onChange={e => setUgcUsername(e.target.value)}
                      placeholder={user?.name?.toLowerCase().replace(/\s+/g, '-') || 'your-username'}
                    />
                    <p style={{ fontSize: '0.72rem', color: 'var(--sell-text-3)', margin: 0 }}>Your public portfolio will be at /u/creator/{ugcUsername || 'your-username'}</p>
                  </div>

                  {/* Avatar Upload */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <label style={s.formLabel}>Profile Avatar</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--sell-border)', background: 'var(--sell-bg)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: 'var(--sell-primary)', backgroundImage: avatarPreview ? `url(${avatarPreview})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                        {!avatarPreview && (user?.name?.charAt(0).toUpperCase() || <Camera size={20} />)}
                      </div>
                      <label style={{ ...s.btnGhost, fontSize: '0.75rem', padding: '6px 12px', cursor: 'pointer' }}>
                        <Upload size={12} />
                        {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 2 * 1024 * 1024) { showToast('Image must be under 2MB', 'error'); return; }
                          setAvatarFile(file);
                          const reader = new FileReader();
                          reader.onloadend = () => setAvatarPreview(reader.result as string);
                          reader.readAsDataURL(file);
                        }} />
                      </label>
                      {avatarPreview && (
                        <button style={{ ...s.btnGhost, fontSize: '0.75rem', padding: '6px 12px', color: 'var(--sell-red, #EF4444)' }} onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}>
                          <Trash2 size={12} /> Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Social Links + Follower Counts */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={s.formLabel}>Social Proof</label>
                    {((
                      [
                        ['instagram', 'Instagram', Instagram],
                        ['tiktok', 'TikTok', Music2],
                        ['youtube', 'YouTube', Youtube],
                        ['twitter', 'X (Twitter)', Twitter],
                      ] as [string, string, React.FC<{ size?: number }>][]
                    ).map(([key, label, Icon]) => (
                      <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                        <div className={generatorStyles.ugcSocialRow} style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 120, fontSize: '0.82rem', color: 'var(--sell-text-2)' }}>
                          <Icon size={16} />
                          <span>{label}</span>
                        </div>
                        <input
                          className={generatorStyles.ugcSocialUrl}
                          style={{ ...s.formInput, flex: 1 }}
                          value={socialLinks[key] || ''}
                          onChange={e => setSocialLinks(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder={`${label} URL (optional)`}
                        />
                        {(key === 'tiktok' || key === 'instagram') && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
                            <button
                              style={{
                                ...s.btnGhost, fontSize: '0.68rem', padding: '5px 10px', whiteSpace: 'nowrap',
                                ...(socialVerified[key] === 'verified' ? { borderColor: 'var(--sell-green)', color: 'var(--sell-green)' } : {}),
                              }}
                              onClick={() => handleVerifySocial(key, socialLinks[key] || '')}
                              disabled={socialVerified[key] === 'checking'}
                              title={`Check that this ${label} account exists`}
                            >
                              {socialVerified[key] === 'checking' ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 11, height: 11, animation: 'spin 0.7s linear infinite' }}>
                                  <path d="M21 12a9 9 0 11-6.219-8.56"/>
                                </svg>
                              ) : socialVerified[key] === 'verified' ? <BadgeCheck size={12} /> : <Check size={12} />}
                              {socialVerified[key] === 'verified'
                                ? 'Verified'
                                : socialVerified[key] === 'unverifiable'
                                  ? 'Self-reported'
                                  : socialVerified[key] === 'failed'
                                    ? 'Retry'
                                    : 'Verify'}
                            </button>
                            {socialVerifyError[key] && (
                              <span style={{ fontSize: '0.64rem', color: 'var(--sell-red, #EF4444)', maxWidth: 180 }}>{socialVerifyError[key]}</span>
                            )}
                          </div>
                        )}
                      </div>
                      {/* Verified Social Profile details and summary */}
                      {socialVerified[key] === 'verified' && socialStats[key] ? (
                        <div style={{
                          background: 'rgba(5, 150, 105, 0.04)',
                          border: '1px solid rgba(5, 150, 105, 0.15)',
                          borderRadius: '12px',
                          padding: '12px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          width: '100%',
                          boxSizing: 'border-box',
                          marginTop: '2px',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(5, 150, 105, 0.08)', paddingBottom: '6px', marginBottom: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <BadgeCheck size={14} color="var(--sell-green)" />
                              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--sell-green)' }}>Verified Profile Details</span>
                            </div>
                            {socialStats[key].verified && (
                              <span style={{ background: '#3B82F6', color: '#fff', fontSize: '0.58rem', fontWeight: 700, padding: '2px 8px', borderRadius: '100px' }}>
                                  Official Badge ✓
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {socialStats[key]?.name && (
                              <div style={{ fontSize: '0.78rem', color: 'var(--sell-text-2)', fontWeight: 600 }}>
                                Name: <span style={{ color: 'var(--sell-text-1)', fontWeight: 700 }}>{socialStats[key]?.name}</span>
                              </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '2px' }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--sell-text-2)' }}>
                                <strong>Followers:</strong> {formatCount(socialStats[key].followerCount || 0)}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--sell-text-2)' }}>
                                <strong>Following:</strong> {formatCount(socialStats[key].followingCount || 0)}
                              </div>
                              {(socialStats[key]?.postsCount ?? 0) > 0 && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--sell-text-2)' }}>
                                  <strong>Posts:</strong> {formatCount(socialStats[key]?.postsCount ?? 0)}
                                </div>
                              )}
                              {(socialStats[key]?.likesCount ?? 0) > 0 && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--sell-text-2)' }}>
                                  <strong>Likes:</strong> {formatCount(socialStats[key]?.likesCount ?? 0)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )))}
                    <p style={{ fontSize: '0.72rem', color: 'var(--sell-text-3)', margin: 0 }}>Paste your public profile URL and press Verify. TikTok and Instagram are checked live via Apify and the real follower count is filled in; YouTube and X are self-reported. Instagram post/reel links fall back to a no-key existence check.</p>
                  </div>

                  {/* Portfolio Images */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <label style={s.formLabel}>Portfolio Images (URLs)</label>
                    {portfolioImages.map((url, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          style={s.formInput}
                          value={url}
                          onChange={e => setPortfolioImages(prev => prev.map((v, i) => i === idx ? e.target.value : v))}
                          placeholder={`Image URL ${idx + 1}`}
                        />
                        <button style={{ ...s.btnGhost, padding: '6px 8px', fontSize: '0.72rem', color: 'var(--sell-red, #EF4444)' }} onClick={() => setPortfolioImages(prev => prev.filter((_, i) => i !== idx))}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    <button style={{ ...s.btnGhost, alignSelf: 'flex-start', fontSize: '0.75rem', padding: '6px 12px' }} onClick={() => setPortfolioImages(prev => [...prev, ''])}>
                      <Plus size={12} />
                      Add another image
                    </button>
                  </div>

                  {/* Contact Email */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <label style={s.formLabel}>Contact Email</label>
                    <input
                      style={s.formInput}
                      type="email"
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                      placeholder={user?.email || 'your@email.com'}
                    />
                    <p style={{ fontSize: '0.72rem', color: 'var(--sell-text-3)', margin: 0 }}>Shown on your public portfolio so brands can contact you.</p>
                  </div>

                  <button style={s.btnPrimary} onClick={handleSaveUgcProfile} disabled={savingUgc}>
                    {savingUgc ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 14, height: 14, animation: 'spin 0.7s linear infinite' }}>
                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                      </svg>
                    ) : <Star size={14} />}
                    {savingUgc ? 'Saving\u2026' : ugcProfile ? 'Save Changes' : 'Apply as Creator'}
                  </button>
                </div>
              ) : (
                /* ─── Creator Dashboard ─── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Profile Summary */}
                  {ugcProfile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', background: 'var(--sell-bg)', flexWrap: 'wrap' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', background: 'var(--sell-primary-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700, color: 'var(--sell-primary)', flexShrink: 0, backgroundImage: ugcProfile?.avatarUrl ? `url(${ugcProfile.avatarUrl})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                        {!ugcProfile?.avatarUrl && (user?.name?.charAt(0).toUpperCase() || '?')}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--sell-text-1)' }}>{user?.name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--sell-text-3)' }}>{ugcProfile.niches?.join(', ') || 'No niches set'}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--sell-green)' }}>{currency} {ugcProfile.price30s ?? '-'} / 30s</p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--sell-text-3)' }}>{ugcProfile.deliveryDays ?? '-'} day delivery</p>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/u/creator/${ugcProfile.username}`);
                          setLinkCopied(true);
                          setTimeout(() => setLinkCopied(false), 2000);
                        }}
                        style={{ ...s.btnGhost, fontSize: '0.72rem', padding: '6px 12px', whiteSpace: 'nowrap' }}
                      >
                        {linkCopied ? <Check size={12} /> : <Copy size={12} />}
                        {linkCopied ? 'Copied!' : 'Copy Portfolio Link'}
                      </button>
                    </div>
                  )}

                  {/* Visibility + Delete Controls */}
                  {ugcProfile && (
                    <>
                      {ugcProfile.isActive === false && (
                        <div style={{ padding: '10px 14px', border: '1px solid #FDE68A', borderRadius: 'var(--sell-radius-sm)', background: '#FFFBEB', fontSize: '0.78rem', color: '#92400E', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <EyeOff size={13} />
                            Your profile is hidden from the marketplace.
                          </span>
                          <button
                            onClick={handleToggleUgcVisibility}
                            disabled={ugcActionLoading === 'visibility'}
                            style={{ ...s.btnSecondary, fontSize: '0.72rem', padding: '5px 10px' }}
                          >
                            Make Public
                          </button>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button
                          onClick={handleToggleUgcVisibility}
                          disabled={ugcActionLoading === 'visibility'}
                          style={{ ...s.btnGhost, fontSize: '0.75rem', padding: '7px 12px' }}
                        >
                          {ugcActionLoading === 'visibility' ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 12, height: 12, animation: 'spin 0.7s linear infinite' }}>
                              <path d="M21 12a9 9 0 11-6.219-8.56"/>
                            </svg>
                          ) : ugcProfile.isActive === false ? <Eye size={12} /> : <EyeOff size={12} />}
                          {ugcProfile.isActive === false ? 'Make Public' : 'Hide Profile'}
                        </button>
                        <button
                          onClick={handleDeleteUgcProfile}
                          disabled={ugcActionLoading === 'delete'}
                          style={{ ...s.btnGhost, fontSize: '0.75rem', padding: '7px 12px', color: 'var(--sell-red, #EF4444)', borderColor: 'rgba(239,68,68,0.4)' }}
                        >
                          {ugcActionLoading === 'delete' ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 12, height: 12, animation: 'spin 0.7s linear infinite' }}>
                              <path d="M21 12a9 9 0 11-6.219-8.56"/>
                            </svg>
                          ) : <Trash2 size={12} />}
                          Delete Profile
                        </button>
                      </div>
                    </>
                  )}

                  {/* Earnings Summary */}
                  {ugcOrders.length > 0 && (
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 150, padding: '14px 16px', border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', background: 'var(--sell-bg)', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--sell-text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Requests</p>
                        <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--sell-primary)' }}>{ugcRequests.length}</p>
                      </div>
                      <div style={{ flex: 1, minWidth: 150, padding: '14px 16px', border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', background: 'var(--sell-bg)', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--sell-text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Orders</p>
                        <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--sell-accent)' }}>{ugcOrders.filter(o => o.status === 'active').length}</p>
                      </div>
                      <div style={{ flex: 1, minWidth: 150, padding: '14px 16px', border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', background: 'var(--sell-bg)', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--sell-text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Earnings</p>
                        <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--sell-green)' }}>{currency} {ugcOrders.reduce((sum, o) => sum + (o.status === 'completed' ? o.amount : 0), 0).toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  {/* Incoming Requests Table */}
                  {ugcRequests.length > 0 && (
                    <div>
                      <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--sell-text-2)', marginBottom: 8 }}>Incoming Requests</p>
                      <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--sell-border)' }}>
                            <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 700, color: 'var(--sell-text-3)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Brand</th>
                            <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 700, color: 'var(--sell-text-3)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Product</th>
                            <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 700, color: 'var(--sell-text-3)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Budget</th>
                            <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 700, color: 'var(--sell-text-3)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Brief</th>
                            <th style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 700, color: 'var(--sell-text-3)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ugcRequests.map(req => {
                            const brief = (req as any).brief || '';
                            return (
                              <tr key={req.id} style={{ borderBottom: '1px solid var(--sell-border-subtle)' }}>
                                <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--sell-text-1)' }}>{(req as any).guestName || req.brand || 'Guest'}</td>
                                <td style={{ padding: '8px 10px', color: 'var(--sell-text-2)' }}>{(req as any).productName || req.product}</td>
                                <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--sell-green)' }}>{currency} {((req as any).agreedPrice ?? req.budget ?? 0) / ((req as any).agreedPrice ? 100 : 1)}</td>
                                <td style={{ padding: '8px 10px', color: 'var(--sell-text-3)', fontSize: '0.75rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{brief}</td>
                                <td style={{ padding: '8px 10px' }}>
                                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                                    <button
                                      onClick={() => handleGenerateIdeas(req)}
                                      disabled={generatingIdeas && ideasRequestId === req.id}
                                      title="Generate content ideas"
                                      style={{
                                        display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
                                        border: '1px solid var(--sell-border)', borderRadius: 6,
                                        background: 'var(--sell-bg)', cursor: 'pointer',
                                        fontSize: '0.7rem', fontWeight: 600, color: 'var(--sell-accent)',
                                        fontFamily: 'var(--sell-font-body)',
                                      }}
                                    >
                                      <Lightbulb size={12} />
                                      Ideas
                                    </button>
                                    <button
                                      onClick={() => handleAcceptRequest(req.id)}
                                      disabled={actionLoading === req.id}
                                      title="Accept request"
                                      style={{
                                        display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
                                        border: 'none', borderRadius: 6,
                                        background: 'var(--sell-green)', cursor: 'pointer',
                                        fontSize: '0.7rem', fontWeight: 600, color: '#fff',
                                        fontFamily: 'var(--sell-font-body)',
                                      }}
                                    >
                                      <Check size={12} />
                                      Accept
                                    </button>
                                    <button
                                      onClick={() => handleRejectRequest(req.id)}
                                      disabled={actionLoading === req.id}
                                      title="Reject request"
                                      style={{
                                        display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
                                        border: '1px solid #FCA5A5', borderRadius: 6,
                                        background: '#FEF2F2', cursor: 'pointer',
                                        fontSize: '0.7rem', fontWeight: 600, color: '#DC2626',
                                        fontFamily: 'var(--sell-font-body)',
                                      }}
                                    >
                                      <X size={12} />
                                      Reject
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      </div>
                    </div>
                  )}

                  {/* Active Orders Table */}
                  {ugcOrders.filter(o => o.status === 'active' || o.status === 'completed').length > 0 && (
                    <div>
                      <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--sell-text-2)', marginBottom: 8 }}>Active Orders</p>
                      <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--sell-border)' }}>
                            <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 700, color: 'var(--sell-text-3)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Brand</th>
                            <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 700, color: 'var(--sell-text-3)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Product</th>
                            <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 700, color: 'var(--sell-text-3)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Amount</th>
                            <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 700, color: 'var(--sell-text-3)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Status</th>
                            <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 700, color: 'var(--sell-text-3)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Due</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ugcOrders.filter(o => o.status === 'active' || o.status === 'completed').map(order => (
                            <tr key={order.id} style={{ borderBottom: '1px solid var(--sell-border-subtle)' }}>
                              <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--sell-text-1)' }}>{order.brand}</td>
                              <td style={{ padding: '8px 10px', color: 'var(--sell-text-2)' }}>{order.product}</td>
                              <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--sell-green)' }}>{currency} {order.amount?.toLocaleString()}</td>
                              <td style={{ padding: '8px 10px' }}>
                                <span style={{
                                  fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, textTransform: 'capitalize',
                                  background: order.status === 'completed' ? 'var(--sell-green-bg)' : 'var(--sell-primary-lt)',
                                  color: order.status === 'completed' ? 'var(--sell-green)' : 'var(--sell-primary)',
                                }}>{order.status}</span>
                              </td>
                              <td style={{ padding: '8px 10px', color: 'var(--sell-text-3)', fontSize: '0.78rem' }}>{order.dueDate || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      </div>
                    </div>
                  )}

                  {/* Ideas Modal */}
                  {ideasRequestId && generatedIdeas && (
                    <div style={{
                      position: 'fixed', inset: 0, zIndex: 999,
                      background: 'rgba(0,0,0,0.45)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
                    }} onClick={() => { setIdeasRequestId(null); setGeneratedIdeas(null); }}>
                      <div style={{
                        background: 'var(--sell-surface)', borderRadius: 'var(--sell-radius-lg)',
                        maxWidth: 560, width: '100%', maxHeight: '85dvh', overflow: 'auto',
                        padding: 28, position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                      }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setIdeasRequestId(null); setGeneratedIdeas(null); }}
                          style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', color: 'var(--sell-text-3)' }}>
                          <X size={18} />
                        </button>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--sell-text-1)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Lightbulb size={18} color="var(--sell-accent)" /> Content Ideas
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                          {generatedIdeas.videoHooks && (
                            <div>
                              <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--sell-text-2)', marginBottom: 6 }}>Video Hooks</p>
                              {generatedIdeas.videoHooks.map((h: string, i: number) => (
                                <div key={i} style={{ padding: '8px 12px', background: 'var(--sell-bg)', borderRadius: 8, marginBottom: 6, fontSize: '0.82rem', color: 'var(--sell-text-1)', border: '1px solid var(--sell-border-subtle)' }}>
                                  <span style={{ fontWeight: 700, color: 'var(--sell-accent)', marginRight: 8 }}>#{i + 1}</span>{h}
                                </div>
                              ))}
                            </div>
                          )}
                          {generatedIdeas.contentAngles && (
                            <div>
                              <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--sell-text-2)', marginBottom: 6 }}>Content Angles</p>
                              {generatedIdeas.contentAngles.map((a: any, i: number) => (
                                <div key={i} style={{ padding: '10px 12px', background: 'var(--sell-bg)', borderRadius: 8, marginBottom: 6, border: '1px solid var(--sell-border-subtle)' }}>
                                  <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--sell-primary)', marginBottom: 4 }}>{a.angle}</p>
                                  <p style={{ fontSize: '0.78rem', color: 'var(--sell-text-2)', marginBottom: 4 }}>{a.description}</p>
                                  {a.suggestedScript && <p style={{ fontSize: '0.75rem', color: 'var(--sell-text-3)', fontStyle: 'italic' }}>{a.suggestedScript}</p>}
                                </div>
                              ))}
                            </div>
                          )}
                          {generatedIdeas.visualIdeas && (
                            <div>
                              <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--sell-text-2)', marginBottom: 6 }}>Visual Ideas</p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {generatedIdeas.visualIdeas.map((v: string, i: number) => (
                                  <span key={i} style={{ padding: '5px 10px', background: 'var(--sell-primary-lt)', color: 'var(--sell-primary)', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600 }}>{v}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {generatedIdeas.suggestedHashtags && (
                            <div>
                              <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--sell-text-2)', marginBottom: 6 }}>Hashtags</p>
                              <p style={{ fontSize: '0.78rem', color: 'var(--sell-accent)' }}>{generatedIdeas.suggestedHashtags.join(' ')}</p>
                            </div>
                          )}
                          {generatedIdeas.callToAction && (
                            <div style={{ padding: '10px 12px', background: 'var(--sell-green-bg)', borderRadius: 8, border: '1px solid var(--sell-green)' }}>
                              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--sell-green)', marginBottom: 2 }}>Suggested CTA</p>
                              <p style={{ fontSize: '0.82rem', color: 'var(--sell-text-1)' }}>{generatedIdeas.callToAction}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Generating ideas loader */}
                  {generatingIdeas && (
                    <div style={{
                      position: 'fixed', inset: 0, zIndex: 999,
                      background: 'rgba(0,0,0,0.45)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{
                        background: 'var(--sell-surface)', borderRadius: 'var(--sell-radius-lg)',
                        padding: '32px 40px', textAlign: 'center',
                      }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="var(--sell-accent)" strokeWidth="2.5" style={{ width: 32, height: 32, animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }}>
                          <path d="M21 12a9 9 0 11-6.219-8.56"/>
                        </svg>
                        <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--sell-text-1)' }}>Generating content ideas...</p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--sell-text-3)' }}>Using AI to create video concepts from the brief</p>
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {ugcRequests.length === 0 && ugcOrders.filter(o => o.status === 'active' || o.status === 'completed').length === 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '40px 20px', color: 'var(--sell-text-3)', textAlign: 'center' }}>
                      <Users size={40} style={{ opacity: 0.3 }} />
                      <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--sell-text-2)' }}>No activity yet</p>
                      <p style={{ fontSize: '0.85rem', maxWidth: 340 }}>Your dashboard will show incoming requests, active orders, and earnings once brands start reaching out.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
