'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, addDoc, doc, getDoc, setDoc, query, where, orderBy } from 'firebase/firestore';
import {
  Lightbulb, Calendar, TrendingUp, Megaphone, BarChart3, Users,
  ClipboardList, Copy, Check, ChevronRight, Clock, Bell, BellOff,
  Sparkles, Package, X, Plus, ExternalLink, Search, Star,
  Eye, MousePointerClick, ShoppingCart, Filter, ChevronDown,
} from 'lucide-react';
import { initializeFirebase } from '@/lib/firebase';
import { useSell } from '@/context/SellContext';
import { useRouter } from 'next/navigation';

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

interface ContentIdea {
  hook: string;
  caption: string;
  hashtags: string;
  script: string;
  format: string;
}

interface ScheduledPost {
  id: string;
  title: string;
  time: string;
  platform: string;
}

interface Trend {
  title: string;
  description: string;
  category: string;
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

interface PostAnalytics {
  id: string;
  title: string;
  views: number;
  clicks: number;
  sales: number;
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

/* ─── Helpers ───────────────────────────────────────────── */

const sampleIdeas: ContentIdea[] = [
  { hook: 'Stop scrolling! Here\'s why you NEED this in your life \u{1F525}', caption: 'This changes everything \u2728', hashtags: '#musthave #trending #viral', script: 'Open with a surprise shot. \nCut to the product in use. \nEnd with a call to action.', format: 'Reel' },
  { hook: 'I tried 10 products so you don\'t have to \u{1F447}', caption: 'Spoiler: this one won \ud83c\udfc6', hashtags: '#review #honestreview #producthunt', script: 'Show all 10 products in a grid. \nReveal the winner. \nExplain why it\'s the best.', format: 'Carousel' },
  { hook: 'POV: You finally found THE perfect gift \ud83c\udf81', caption: 'Tag someone who needs to see this \ud83d\udc40', hashtags: '#giftideas #giftguide #shopping', script: 'Unboxing shot. \nShow product details. \nHappy reaction. \n"Get yours at the link in bio."', format: 'TikTok' },
  { hook: '3 ways to style this \u2014 which one is your fave? \ud83e\udd70', caption: '1, 2, or 3? Comment below!', hashtags: '#styleinspo #ootd #fashion', script: 'Three outfit transitions set to a trending audio. Each style gets 3 seconds.', format: 'Reel' },
  { hook: 'How it started vs how it\u2019s going \ud83d\ude0d', caption: 'Trust the process \u2728', hashtags: '#transformation #glowup #progress', script: 'Split screen: before on left, after on right. \nAdd text overlay explaining the change.', format: 'Reel' },
];

const sampleTrends: Trend[] = [
  { title: 'Affordable Luxury Finds', description: 'Nigerian creators are showing high-quality products under \u20a65,000 that look premium. Huge engagement on Instagram and TikTok.', category: 'Shopping' },
  { title: 'Morning Routine Reset', description: 'Detty December recovery routines are peaking. Products tied to self-care and productivity are converting well.', category: 'Lifestyle' },
  { title: 'Small Business Saturday NG', description: 'Weekly feature trend where creators spotlight a small business. Great for UGC and brand collaborations.', category: 'Business' },
  { title: 'What I Eat in a Day (Affordable)', description: 'Budget-friendly meal content is outperforming luxury food content 3:1 in the Nigerian market.', category: 'Food' },
  { title: 'Tech Unboxing (Made in Nigeria)', description: 'Local tech products unboxing content is seeing 2x engagement vs international tech reviews.', category: 'Tech' },
  { title: 'Before & After Transformations', description: 'Weight loss, skin care, home decor \u2014 transformation content continues to dominate across platforms.', category: 'Lifestyle' },
  { title: 'ASMR Product Showcase', description: 'Satisfying product sounds and close-ups. High watch time, great for algorithm ranking.', category: 'Content' },
  { title: 'POV Marketing', description: 'Relatable POV scenarios featuring products. Nigerian creators are making this format their own.', category: 'Marketing' },
  { title: 'Budget-Friendly Meal Prep', description: 'Nigerian meal prep content that shows weekly budgets under \u20a615,000 is trending across YouTube Shorts.', category: 'Food' },
  { title: 'Customer Review Reacts', description: 'Creators reacting to genuine customer reviews builds trust and drives conversions.', category: 'Marketing' },
];

const sampleAnalytics: PostAnalytics[] = [
  { id: 'p1', title: 'New Collection Launch Reel', views: 12450, clicks: 892, sales: 34 },
  { id: 'p2', title: 'Product Review \u2014 Why This Works', views: 8700, clicks: 654, sales: 21 },
  { id: 'p3', title: 'Behind the Scenes: Packaging', views: 5400, clicks: 321, sales: 12 },
];

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function generateCalendarDays(): { date: number; posts: ScheduledPost[] }[] {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dayNum = d.getDate();
    const hour = 9 + (i * 2) % 10;
    return {
      date: dayNum,
      posts: i % 2 === 0 ? [
        { id: `${i}-1`, title: 'Product spotlight', time: `${hour}:00`, platform: 'Instagram' },
        { id: `${i}-2`, title: 'Quick tip Reel', time: `${hour + 3}:00`, platform: 'TikTok' },
      ] : i % 3 === 0 ? [
        { id: `${i}-1`, title: 'Customer testimonial', time: `${hour}:00`, platform: 'Instagram' },
      ] : [],
    };
  });
}

/* ─── Component ─────────────────────────────────────────── */

export function ContentHub() {
  const { user, storeConfig, showToast } = useSell();
  const router = useRouter();
  const currency = storeConfig?.currency ?? 'NGN';

  const [activeTab, setActiveTab] = useState<TabId>('ideas');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [calendarDays, setCalendarDays] = useState(() => generateCalendarDays());
  const [reminderOn, setReminderOn] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignLoading, setCampaignLoading] = useState(false);

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

  const [ugcProfile, setUgcProfile] = useState<any>(null);
  const [ugcRequests, setUgcRequests] = useState<UGCRequest[]>([]);
  const [ugcOrders, setUgcOrders] = useState<UGCOrder[]>([]);
  const [loadingUgcData, setLoadingUgcData] = useState(false);

  const loadProducts = useCallback(async () => {
    if (!user?.businessId) return;
    try {
      const { firestore } = initializeFirebase();
      const snap = await getDocs(
        collection(firestore, 'businesses', user.businessId, 'storeProducts')
      );
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
    }
  }, [user?.businessId]);

  const loadCampaigns = useCallback(async () => {
    if (!user?.businessId) return;
    setCampaignLoading(true);
    try {
      const { firestore } = initializeFirebase();
      const snap = await getDocs(
        collection(firestore, 'businesses', user.businessId, 'campaigns')
      );
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

  const loadUgcData = useCallback(async () => {
    if (!user?.id) return;
    setLoadingUgcData(true);
    try {
      const { firestore } = initializeFirebase();
      const profileDoc = await getDoc(doc(firestore, 'ugcCreators', user.id));
      if (profileDoc.exists()) setUgcProfile(profileDoc.data());

      const allDocs = await getDocs(
        query(collection(firestore, 'ugcOrders'), where('creatorId', '==', user.id))
      );
      const allOrders = allDocs.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setUgcRequests(allOrders.filter(o => o.type === 'request' || o.status === 'pending'));
      setUgcOrders(allOrders.filter(o => o.type !== 'request' && o.status !== 'pending'));
    } catch (err) {
      console.error('[ContentHub] Load UGC data error:', err);
    } finally {
      setLoadingUgcData(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (activeTab === 'ugc') loadUgcData();
  }, [activeTab, loadUgcData]);

  const handleGenerateIdeas = async () => {
    if (!selectedProductId) {
      showToast('Select a product first', 'error');
      return;
    }
    setGenerating(true);
    await new Promise(r => setTimeout(r, 1200));
    const shuffled = [...sampleIdeas].sort(() => Math.random() - 0.5);
    setIdeas(shuffled);
    setGenerating(false);
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      showToast('Copied!', 'success');
    } catch {
      showToast('Failed to copy', 'error');
    }
  };

  const handleLaunchCampaign = async () => {
    if (!user?.businessId || !selectedProductId) {
      showToast('Select a product first', 'error');
      return;
    }
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;
    try {
      const { firestore } = initializeFirebase();
      const days: CampaignDay[] = [
        { day: 1, task: 'Shoot 3 raw video clips of the product', done: false },
        { day: 2, task: 'Write 5 hook variations for the product', done: false },
        { day: 3, task: 'Edit primary Reel/TikTok', done: false },
        { day: 4, task: 'Create 3 static image posts', done: false },
        { day: 5, task: 'Schedule all posts across platforms', done: false },
        { day: 6, task: 'Engage with comments and reshare', done: false },
        { day: 7, task: 'Analyze performance and adjust strategy', done: false },
      ];
      const docRef = await addDoc(
        collection(firestore, 'businesses', user.businessId, 'campaigns'),
        { productId: selectedProductId, productName: product.displayName, days, createdAt: Date.now() }
      );
      setCampaigns(prev => [...prev, { id: docRef.id, productId: selectedProductId, productName: product.displayName, days, createdAt: Date.now() }]);
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
      const { firestore } = initializeFirebase();
      await setDoc(doc(firestore, 'businesses', user.businessId, 'campaigns', campaignId), { days: updatedDays }, { merge: true });
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

  const handleSaveUgcProfile = async () => {
    if (!user?.id) return;
    if (!niches.length || !price30s || !price60s || !deliveryDays) {
      showToast('Fill in all required fields', 'error');
      return;
    }
    setSavingUgc(true);
    try {
      const { firestore } = initializeFirebase();
      let finalUsername = ugcUsername.trim();
      if (!finalUsername) {
        finalUsername = user.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `creator-${user.id}`;
      }
      await setDoc(doc(firestore, 'ugcCreators', user.id), {
        userId: user.id,
        name: user.name,
        email: user.email,
        username: finalUsername,
        niches,
        price30s: Number(price30s),
        price60s: Number(price60s),
        deliveryDays: Number(deliveryDays),
        sampleVideos: sampleVideos.filter(Boolean),
        bio,
        status: 'active',
        isActive: true,
        isBanned: false,
        displayName: user.name,
        createdAt: Date.now(),
      });
      showToast('Profile saved! You\'re now listed as a creator.', 'success');
      setUgcView('dashboard');
      await loadUgcData();
    } catch (err) {
      showToast('Failed to save profile', 'error');
    } finally {
      setSavingUgc(false);
    }
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div>
        <h2 style={s.heading}>Content Hub</h2>
        <p style={s.sub}>Your Growth OS \u2014 ideas, scheduling, trends, campaigns, analytics, and UGC marketplace</p>
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
                <p style={s.cardSub}>AI-generated ideas tailored to your product</p>
              </div>
            </div>
            <div style={s.cardBody}>
              {/* Product selector */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 240, flex: 1 }}>
                  <label style={s.formLabel}>Select Product</label>
                  <select
                    style={s.formSelect}
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                  >
                    <option value="">Choose a product...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.displayName}</option>
                    ))}
                  </select>
                </div>
                <button
                  style={s.btnPrimary}
                  onClick={handleGenerateIdeas}
                  disabled={generating || !selectedProductId}
                >
                  {generating ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 14, height: 14, animation: 'spin 0.7s linear infinite' }}>
                      <path d="M21 12a9 9 0 11-6.219-8.56"/>
                    </svg>
                  ) : <Sparkles size={14} />}
                  {generating ? 'Generating\u2026' : 'Generate Ideas'}
                </button>
              </div>

              {/* Ideas list */}
              {ideas.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
                  {ideas.map((idea, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        padding: '14px 16px',
                        border: '1px solid var(--sell-border)',
                        borderRadius: 'var(--sell-radius-sm)',
                        background: 'var(--sell-bg)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--sell-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Idea #{idx + 1} \u00b7 {idea.format}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--sell-text-1)', lineHeight: 1.4 }}>
                        {idea.hook}
                      </p>

                      {/* Caption */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--sell-text-3)', marginTop: 2, whiteSpace: 'nowrap' }}>Caption:</span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--sell-text-2)', lineHeight: 1.5, flex: 1 }}>{idea.caption}</span>
                        <button
                          style={{ background: 'none', border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', padding: '4px 10px', fontSize: '0.72rem', color: copiedId === `cap-${idx}` ? '#10b981' : 'var(--sell-text-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
                          onClick={() => handleCopy(idea.caption, `cap-${idx}`)}
                        >
                          {copiedId === `cap-${idx}` ? <Check size={12} /> : <Copy size={12} />}
                          {copiedId === `cap-${idx}` ? 'Copied' : 'Copy'}
                        </button>
                      </div>

                      {/* Hashtags */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--sell-text-3)', marginTop: 2, whiteSpace: 'nowrap' }}>Hashtags:</span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--sell-primary)', lineHeight: 1.5, flex: 1 }}>{idea.hashtags}</span>
                        <button
                          style={{ background: 'none', border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', padding: '4px 10px', fontSize: '0.72rem', color: copiedId === `hash-${idx}` ? '#10b981' : 'var(--sell-text-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
                          onClick={() => handleCopy(idea.hashtags, `hash-${idx}`)}
                        >
                          {copiedId === `hash-${idx}` ? <Check size={12} /> : <Copy size={12} />}
                          {copiedId === `hash-${idx}` ? 'Copied' : 'Copy'}
                        </button>
                      </div>

                      {/* Script */}
                      <div style={{ background: 'var(--sell-surface)', border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--sell-text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Script Preview</span>
                          <button
                            style={{ background: 'var(--sell-primary)', border: 'none', borderRadius: 'var(--sell-radius-sm)', padding: '6px 14px', fontSize: '0.78rem', fontWeight: 600, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                            onClick={() => handleCopy(idea.script, `scr-${idx}`)}
                          >
                            {copiedId === `scr-${idx}` ? <Check size={12} /> : <Copy size={12} />}
                            {copiedId === `scr-${idx}` ? 'Copied' : 'Copy Script'}
                          </button>
                        </div>
                        <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--sell-text-1)', whiteSpace: 'pre-wrap' }}>{idea.script}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!generating && ideas.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '40px 20px', color: 'var(--sell-text-3)', textAlign: 'center' }}>
                  <Lightbulb size={40} style={{ opacity: 0.3 }} />
                  <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--sell-text-2)' }}>Select a product and generate ideas</p>
                  <p style={{ fontSize: '0.85rem', maxWidth: 340 }}>Get AI-powered content hooks, captions, hashtags, and script outlines tailored to your product.</p>
                </div>
              )}

              {generating && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 32, color: 'var(--sell-text-3)', fontSize: '0.85rem' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 22, height: 22, animation: 'spin 0.7s linear infinite' }}>
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  Generating ideas\u2026
                </div>
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
                <p style={s.cardSub}>This week\u2019s schedule \u2014 optimal posting times highlighted</p>
              </div>
              <button
                onClick={() => setReminderOn(!reminderOn)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 'var(--sell-radius-sm)',
                  border: '1px solid var(--sell-border)', background: 'var(--sell-surface)', cursor: 'pointer',
                  fontSize: '0.78rem', fontWeight: 600, color: reminderOn ? 'var(--sell-primary)' : 'var(--sell-text-3)',
                }}
              >
                {reminderOn ? <Bell size={14} /> : <BellOff size={14} />}
                {reminderOn ? 'Reminders On' : 'Reminders Off'}
              </button>
            </div>
            <div style={s.cardBody}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                {daysOfWeek.map((day, idx) => (
                  <div key={day} style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.78rem', color: 'var(--sell-text-3)', padding: '6px 0' }}>
                    {day}
                  </div>
                ))}
                {calendarDays.map((day, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: '1px solid var(--sell-border)',
                      borderRadius: 'var(--sell-radius-sm)',
                      background: 'var(--sell-bg)',
                      padding: 8,
                      minHeight: 100,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--sell-text-1)' }}>{day.date}</span>
                      {idx === 1 && (
                        <span style={{ fontSize: '0.6rem', fontWeight: 700, background: 'var(--sell-green-bg)', color: 'var(--sell-green)', padding: '1px 6px', borderRadius: 99 }}>
                          Best Time
                        </span>
                      )}
                    </div>
                    {day.posts.map(post => (
                      <div
                        key={post.id}
                        style={{ fontSize: '0.68rem', padding: '3px 5px', background: 'var(--sell-surface)', borderRadius: 4, border: '1px solid var(--sell-border-subtle)', cursor: 'default' }}
                      >
                        <div style={{ fontWeight: 600, color: 'var(--sell-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</div>
                        <div style={{ color: 'var(--sell-text-3)', fontSize: '0.62rem' }}>{post.time} \u00b7 {post.platform}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
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
                <p style={s.cardTitle}>Trending in NG</p>
                <p style={s.cardSub}>What\u2019s hot in the Nigerian creator economy right now</p>
              </div>
            </div>
            <div style={s.cardBody}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {sampleTrends.map((trend, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 16px',
                      border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-sm)',
                      background: 'var(--sell-bg)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'var(--sell-primary-lt)', color: 'var(--sell-primary)' }}>
                        {trend.category}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--sell-text-1)' }}>{trend.title}</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--sell-text-2)', lineHeight: 1.5 }}>{trend.description}</p>
                    <button style={{ ...s.btnGhost, alignSelf: 'flex-start', fontSize: '0.75rem', padding: '6px 12px', marginTop: 4 }}>
                      <Sparkles size={12} />
                      Use with Product
                    </button>
                  </div>
                ))}
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
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 200 }}>
                  <select
                    style={s.formSelect}
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                  >
                    <option value="">Select product...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.displayName}</option>
                    ))}
                  </select>
                </div>
                <button style={s.btnPrimary} onClick={handleLaunchCampaign} disabled={!selectedProductId}>
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
                <p style={s.cardSub}>Track how your content performs</p>
              </div>
            </div>
            <div style={s.cardBody}>
              <div style={{ width: '100%', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--sell-border)' }}>
                      <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700, color: 'var(--sell-text-3)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Post</th>
                      <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 700, color: 'var(--sell-text-3)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}><Eye size={14} /></th>
                      <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 700, color: 'var(--sell-text-3)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}><MousePointerClick size={14} /></th>
                      <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 700, color: 'var(--sell-text-3)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}><ShoppingCart size={14} /></th>
                      <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700, color: 'var(--sell-text-3)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleAnalytics.map(post => (
                      <tr key={post.id} style={{ borderBottom: '1px solid var(--sell-border-subtle)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--sell-text-1)' }}>{post.title}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: 'var(--sell-primary)' }}>{post.views.toLocaleString()}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: 'var(--sell-accent)' }}>{post.clicks.toLocaleString()}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: 'var(--sell-green)' }}>{post.sales}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <button style={{ ...s.btnGhost, padding: '6px 12px', fontSize: '0.72rem' }}>
                            <Copy size={11} />
                            Generate 3 Similar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
              {!ugcProfile && ugcView === 'apply' ? (
                /* ─── Apply Form ─── */
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
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
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
                    <label style={s.formLabel}>Sample Videos (URLs)</label>
                    {sampleVideos.map((url, idx) => (
                      <input
                        key={idx}
                        style={s.formInput}
                        value={url}
                        onChange={e => handleVideoUrlChange(idx, e.target.value)}
                        placeholder={`Video URL ${idx + 1}`}
                      />
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

                  <button style={s.btnPrimary} onClick={handleSaveUgcProfile} disabled={savingUgc}>
                    {savingUgc ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 14, height: 14, animation: 'spin 0.7s linear infinite' }}>
                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                      </svg>
                    ) : <Star size={14} />}
                    {savingUgc ? 'Saving\u2026' : 'Apply as Creator'}
                  </button>
                </div>
              ) : (
                /* ─── Creator Dashboard ─── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Profile Summary */}
                  {ugcProfile && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', background: 'var(--sell-bg)' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--sell-primary-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700, color: 'var(--sell-primary)', flexShrink: 0 }}>
                        {user?.name?.charAt(0).toUpperCase() || '?'}
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

                  {/* Earnings Summary */}
                  {ugcOrders.length > 0 && (
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div style={{ flex: 1, padding: '14px 16px', border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', background: 'var(--sell-bg)', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--sell-text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Requests</p>
                        <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--sell-primary)' }}>{ugcRequests.length}</p>
                      </div>
                      <div style={{ flex: 1, padding: '14px 16px', border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', background: 'var(--sell-bg)', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--sell-text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Orders</p>
                        <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--sell-accent)' }}>{ugcOrders.filter(o => o.status === 'active').length}</p>
                      </div>
                      <div style={{ flex: 1, padding: '14px 16px', border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', background: 'var(--sell-bg)', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--sell-text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Earnings</p>
                        <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--sell-green)' }}>{currency} {ugcOrders.reduce((sum, o) => sum + (o.status === 'completed' ? o.amount : 0), 0).toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  {/* Incoming Requests Table */}
                  {ugcRequests.length > 0 && (
                    <div>
                      <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--sell-text-2)', marginBottom: 8 }}>Incoming Requests</p>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--sell-border)' }}>
                            <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 700, color: 'var(--sell-text-3)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Brand</th>
                            <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 700, color: 'var(--sell-text-3)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Product</th>
                            <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 700, color: 'var(--sell-text-3)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Budget</th>
                            <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 700, color: 'var(--sell-text-3)', fontSize: '0.72rem', textTransform: 'uppercase' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ugcRequests.map(req => (
                            <tr key={req.id} style={{ borderBottom: '1px solid var(--sell-border-subtle)' }}>
                              <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--sell-text-1)' }}>{req.brand}</td>
                              <td style={{ padding: '8px 10px', color: 'var(--sell-text-2)' }}>{req.product}</td>
                              <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--sell-green)' }}>{currency} {req.budget?.toLocaleString()}</td>
                              <td style={{ padding: '8px 10px' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'var(--sell-amber-bg)', color: 'var(--sell-amber)', textTransform: 'capitalize' }}>{req.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Active Orders Table */}
                  {ugcOrders.filter(o => o.status === 'active' || o.status === 'completed').length > 0 && (
                    <div>
                      <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--sell-text-2)', marginBottom: 8 }}>Active Orders</p>
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
