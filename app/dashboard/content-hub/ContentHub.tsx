'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, addDoc, doc, getDoc, setDoc, query, where, orderBy, serverTimestamp, writeBatch } from 'firebase/firestore';
import {
  Lightbulb, Calendar, TrendingUp, Megaphone, BarChart3, Users,
  Copy, Check, Bell, BellOff,
  Sparkles, Package, X, Plus, Star, Camera, Instagram, Music2, Youtube, Twitter, Trash2, Upload,

} from 'lucide-react';
import { initializeFirebase } from '@/lib/firebase';
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
    } finally {
      setProductsLoading(false);
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
      const profileSnap = await getDoc(doc(firestore, 'ugcCreators', user.id));
      if (profileSnap.exists()) {
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
        setAvatarPreview(data.avatarUrl || null);
        setPortfolioImages(data.portfolioImages || []);
        setContactEmail(data.contactEmail || '');
      }
      const ordersSnap = await getDocs(
        query(collection(firestore, 'ugcOrders'), where('creatorId', '==', user.id))
      );
      const allOrders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setUgcRequests(allOrders.filter(o => o.type === 'request' || o.status === 'pending'));
      setUgcOrders(allOrders.filter(o => o.type !== 'request' && o.status !== 'pending'));
      const videosSnap = await getDocs(
        query(collection(firestore, 'ugcVideos'), where('creatorId', '==', user.id))
      );
      const vids = videosSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setSampleVideos(vids.length > 0 ? vids.map((v: any) => v.url) : ['', '', '']);
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
      const { firestore } = initializeFirebase();
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
        deliveryDays: Number(deliveryDays) || 5,
        rating: 0,
        totalOrders: 0,
        totalEarnings: 0,
        socialLinks,
        followerCounts,
        portfolioImages: portfolioImages.filter(Boolean),
        contactEmail: contactEmail || user.email || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(firestore, 'ugcCreators', user.id), creator);
      const videos = sampleVideos.filter(Boolean);
      if (videos.length > 0) {
        const batch = writeBatch(firestore);
        for (const url of videos.slice(0, 5)) {
          const ref = doc(collection(firestore, 'ugcVideos'));
          batch.set(ref, {
            creatorId: user.id, url, thumbnail: null, duration: 15,
            hasWatermark: true, title: null, createdAt: serverTimestamp(),
          });
        }
        await batch.commit();
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
                <p style={s.cardSub}>Plan and schedule your content posts</p>
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
                {Array.from({ length: 7 }, (_, i) => {
                  const d = new Date();
                  const startOfWeek = new Date(d);
                  startOfWeek.setDate(d.getDate() - d.getDay() + 1);
                  const day = new Date(startOfWeek);
                  day.setDate(startOfWeek.getDate() + i);
                  return day.getDate();
                }).map((dateNum, idx) => (
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
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--sell-text-1)' }}>{dateNum}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, fontSize: '0.72rem', color: 'var(--sell-text-3)' }}>
                      No posts scheduled
                    </div>
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
                <p style={s.cardSub}>Track how your content performs</p>
              </div>
            </div>
            <div style={s.cardBody}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '40px 20px', color: 'var(--sell-text-3)', textAlign: 'center' }}>
                <BarChart3 size={40} style={{ opacity: 0.3 }} />
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--sell-text-2)' }}>No analytics data yet</p>
                <p style={{ fontSize: '0.85rem', maxWidth: 340 }}>Analytics for views, clicks, and sales from your content will show here once you start publishing and getting engagement.</p>
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
                      <div key={key} className={generatorStyles.ugcSocialRow} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
                        <input
                          className={generatorStyles.ugcSocialFollowers}
                          style={{ ...s.formInput, width: 100, flex: 'none' }}
                          type="number"
                          value={followerCounts[key] || ''}
                          onChange={e => setFollowerCounts(prev => ({ ...prev, [key]: Number(e.target.value) || 0 }))}
                          placeholder="Followers"
                        />
                      </div>
                    )))}
                    <p style={{ fontSize: '0.72rem', color: 'var(--sell-text-3)', margin: 0 }}>Enter your public social profile URLs and approximate follower counts.</p>
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
