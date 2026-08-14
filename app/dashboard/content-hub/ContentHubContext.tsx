'use client';

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { getDatabase } from '@/lib/database/adapter';
import { getStorage } from '@/lib/storage/adapter';
import { useSell } from '@/context/SellContext';
import {
  Product, Campaign, CampaignDay, CalendarPost, SocialProfile,
  UGCRequest, UGCOrder, RecommendationIdea,
  PLATFORMS, AddFormDefault,
  formatCount, toDateInput, nextWeekdayDate, parseBestTime,
} from './shared';

/* ─── Context shape ─────────────────────────────────────── */

interface AnalyticsStats {
  totalRevenue: number;
  totalOrders: number;
  pageViews: number;
  addToCarts: number;
  checkoutInitiated: number;
  conversionRate: string;
  scheduledCount: number;
  postedCount: number;
  upcomingPosts: CalendarPost[];
  profileCount: number;
  analyticsLoading: boolean;
}

interface ContentHubContextValue extends AnalyticsStats {
  activeTab: string;
  setActiveTab: (t: string) => void;
  currency: string;
  user: any;
  storeConfig: any;

  products: Product[];
  productsLoading: boolean;
  selectedProduct: Product | null;
  handleSelectProduct: (p: Product) => void;

  campaigns: Campaign[];
  campaignLoading: boolean;
  handleLaunchCampaign: () => void;
  handleToggleTask: (campaignId: string, dayIndex: number) => void;
  handleDeleteCampaign: (campaignId: string) => void;

  calendarPosts: CalendarPost[];
  calendarLoading: boolean;
  calMonth: Date;
  setCalMonth: React.Dispatch<React.SetStateAction<Date>>;
  addFormOpen: boolean;
  setAddFormOpen: (v: boolean) => void;
  editingPostId: string | null;
  setEditingPostId: (v: string | null) => void;
  addForm: typeof AddFormDefault;
  setAddForm: React.Dispatch<React.SetStateAction<typeof AddFormDefault>>;
  dayOpen: string | null;
  setDayOpen: (v: string | null) => void;
  reminderOn: boolean;
  setReminderOn: (v: boolean) => void;
  handleSavePost: () => void;
  handleTogglePostStatus: (post: CalendarPost) => void;
  handleDeletePost: (postId: string) => void;

  socialProfiles: Record<string, SocialProfile>;
  socialProfileLoading: Record<string, boolean>;
  newSocialUrl: string;
  setNewSocialUrl: (v: string) => void;
  newSocialPlatform: string;
  setNewSocialPlatform: (v: string) => void;
  showAddProfile: boolean;
  setShowAddProfile: (v: boolean) => void;
  handleAddSocialProfile: () => void;
  handleVerifyProfile: (key: string, url: string) => void;
  handleRemoveSocialProfile: (key: string) => void;

  moRecommendations: any;
  recommending: boolean;
  recommendError: string;
  handleRecommendForAudience: () => void;
  handleScheduleIdea: (idea: any, product?: any) => void;

  trends: any[];
  trendsLoading: boolean;
  trendsError: string;
  trendsSource: string;
  handleLoadTrends: () => void;

  UGC: UgcState;
}

interface UgcState {
  ugcView: 'apply' | 'dashboard';
  setUgcView: (v: 'apply' | 'dashboard') => void;
  ugcProfile: any;
  niches: string[];
  nicheInput: string;
  setNicheInput: (v: string) => void;
  handleAddNiche: () => void;
  handleRemoveNiche: (n: string) => void;
  price30s: string;
  setPrice30s: (v: string) => void;
  price60s: string;
  setPrice60s: (v: string) => void;
  deliveryDays: string;
  setDeliveryDays: (v: string) => void;
  sampleVideos: string[];
  handleVideoUrlChange: (idx: number, val: string) => void;
  handleAddVideoUrl: () => void;
  handleRemoveVideoUrl: (idx: number) => void;
  bio: string;
  setBio: (v: string) => void;
  ugcUsername: string;
  setUgcUsername: (v: string) => void;
  savingUgc: boolean;
  linkCopied: boolean;
  setLinkCopied: (v: boolean) => void;
  socialLinks: Record<string, string>;
  setSocialLinks: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  followerCounts: Record<string, number>;
  socialVerified: Record<string, string>;
  setSocialVerified: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  socialVerifyError: Record<string, string>;
  setSocialVerifyError: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  socialStats: Record<string, any>;
  setSocialStats: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  avatarFile: File | null;
  setAvatarFile: (v: File | null) => void;
  avatarPreview: string | null;
  setAvatarPreview: (v: string | null) => void;
  portfolioImages: string[];
  setPortfolioImages: React.Dispatch<React.SetStateAction<string[]>>;
  contactEmail: string;
  setContactEmail: (v: string) => void;
  loadingUgcData: boolean;
  ugcRequests: UGCRequest[];
  ugcOrders: UGCOrder[];
  handleVerifySocial: (key: string, url: string) => void;
  handleSaveUgcProfile: () => void;
  handleToggleUgcVisibility: () => void;
  handleDeleteUgcProfile: () => void;
  ugcActionLoading: string | null;
  ideasRequestId: string | null;
  setIdeasRequestId: (v: string | null) => void;
  generatedIdeas: any;
  setGeneratedIdeas: (v: any) => void;
  generatingIdeas: boolean;
  actionLoading: string | null;
  handleGenerateIdeas: (req: any) => void;
  handleAcceptRequest: (orderId: string) => void;
  handleRejectRequest: (orderId: string) => void;
}

const ContentHubContext = createContext<ContentHubContextValue | null>(null);

export function useContentHub() {
  const ctx = useContext(ContentHubContext);
  if (!ctx) throw new Error('useContentHub must be used inside ContentHubProvider');
  return ctx;
}

/* ─── Provider ──────────────────────────────────────────── */

export function ContentHubProvider({ children }: { children: React.ReactNode }) {
  const { user, storeConfig, showToast } = useSell();
  const currency = storeConfig?.currency ?? 'NGN';

  const [activeTab, setActiveTab] = useState('ideas');
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
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [dayOpen, setDayOpen] = useState<string | null>(null);
  const [addForm, setAddForm] = useState<typeof AddFormDefault>({ ...AddFormDefault });

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

  const [trends, setTrends] = useState<any[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsError, setTrendsError] = useState('');
  const [trendsSource, setTrendsSource] = useState('');

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
  const [socialStats, setSocialStats] = useState<Record<string, any>>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [contactEmail, setContactEmail] = useState('');

  const [ugcProfile, setUgcProfile] = useState<any>(null);
  const [ugcRequests, setUgcRequests] = useState<UGCRequest[]>([]);
  const [ugcOrders, setUgcOrders] = useState<UGCOrder[]>([]);
  const [loadingUgcData, setLoadingUgcData] = useState(false);
  const [ugcActionLoading, setUgcActionLoading] = useState<string | null>(null);

  const [ideasRequestId, setIdeasRequestId] = useState<string | null>(null);
  const [generatedIdeas, setGeneratedIdeas] = useState<any>(null);
  const [generatingIdeas, setGeneratingIdeas] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  /* ─── Loaders ─── */

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

  useEffect(() => {
    if (activeTab === 'ugc') loadUgcData();
  }, [activeTab, loadUgcData]);

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

  /* ─── Campaigns ─── */

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

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!user?.businessId) return;
    if (!window.confirm('Delete this campaign? This cannot be undone.')) return;
    try {
      const db = getDatabase();
      await db.doc(`businesses/${user.businessId}/campaigns/${campaignId}`).delete();
      setCampaigns(prev => prev.filter(c => c.id !== campaignId));
      showToast('Campaign deleted', 'info');
    } catch {
      showToast('Failed to delete campaign', 'error');
    }
  };

  /* ─── Calendar ─── */

  const handleSavePost = async () => {
    if (!user?.businessId) return;
    if (!addForm.title.trim() || !addForm.date) {
      showToast('Add a title and pick a date', 'error');
      return;
    }
    try {
      const db = getDatabase();
      const product = products.find(p => p.id === addForm.productId);
      const fields = {
        title: addForm.title.trim(),
        platform: addForm.platform,
        date: addForm.date,
        time: addForm.time || '12:00',
        productId: addForm.productId || null,
        productName: product?.displayName || null,
        notes: addForm.notes || '',
      };
      if (editingPostId) {
        await db.doc(`businesses/${user.businessId}/contentCalendar/${editingPostId}`).set(fields, { merge: true });
        setCalendarPosts(prev => prev.map(p => p.id === editingPostId ? { ...p, ...fields } as CalendarPost : p));
        showToast('Post updated', 'success');
      } else {
        const post: any = { ...fields, status: 'scheduled', postedUrl: '', createdAt: Date.now() };
        const ref = await db.collection(`businesses/${user.businessId}/contentCalendar`).add(post);
        setCalendarPosts(prev => [...prev, { id: ref.id, ...post }]);
        showToast('Post scheduled', 'success');
      }
      setAddFormOpen(false);
      setEditingPostId(null);
      setAddForm({ ...AddFormDefault });
    } catch {
      showToast(editingPostId ? 'Failed to update post' : 'Failed to schedule post', 'error');
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

  /* ─── Social profiles ─── */

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

  /* ─── UGC ─── */

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
    setEditingPostId(null);
    setAddFormOpen(true);
    setActiveTab('calendar');
  };

  /* ─── Recommendations ─── */

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

  const handleLoadTrends = async () => {
    setTrendsLoading(true);
    setTrendsError('');
    try {
      const top = topProductsFromOrders();
      const names = [
        top?.name,
        ...products.slice(0, 4).map(p => p.displayName),
      ].filter(Boolean) as string[];
      const res = await fetch('/api/content/trending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: storeConfig?.businessCategory || '',
          productNames: names,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load trends');
      setTrends(data.trends || []);
      setTrendsSource(data.source || '');
    } catch (e) {
      setTrendsError(e instanceof Error ? e.message : 'Failed to load trends');
      setTrends([]);
    } finally {
      setTrendsLoading(false);
    }
  };

  /* ─── UGC persistence ─── */

  const handleAvatarUpload = async (): Promise<string | null> => {
    if (!avatarFile) return avatarPreview;
    try {
      const storage = getStorage();
      const ext = avatarFile.name.split('.').pop() || 'jpg';
      const path = `ugc-avatars/${user!.id}.${ext}`;
      return await storage.upload(avatarFile, path);
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

  /* ─── Derived analytics stats ─── */

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

  const value: ContentHubContextValue = {
    activeTab, setActiveTab, currency, user, storeConfig,
    products, productsLoading, selectedProduct, handleSelectProduct,
    campaigns, campaignLoading, handleLaunchCampaign, handleToggleTask, handleDeleteCampaign,
    calendarPosts, calendarLoading, calMonth, setCalMonth,
    addFormOpen, setAddFormOpen, editingPostId, setEditingPostId, dayOpen, setDayOpen,
    addForm, setAddForm, reminderOn, setReminderOn,
    handleSavePost, handleTogglePostStatus, handleDeletePost,
    socialProfiles, socialProfileLoading, newSocialUrl, setNewSocialUrl,
    newSocialPlatform, setNewSocialPlatform, showAddProfile, setShowAddProfile,
    handleAddSocialProfile, handleVerifyProfile, handleRemoveSocialProfile,
    moRecommendations, recommending, recommendError,
    handleRecommendForAudience, handleScheduleIdea,
    trends, trendsLoading, trendsError, trendsSource, handleLoadTrends,
    totalRevenue, totalOrders, pageViews, addToCarts, checkoutInitiated,
    conversionRate, scheduledCount, postedCount, upcomingPosts, profileCount,
    analyticsLoading,
    UGC: {
      ugcView, setUgcView, ugcProfile,
      niches, nicheInput, setNicheInput, handleAddNiche, handleRemoveNiche,
      price30s, setPrice30s, price60s, setPrice60s, deliveryDays, setDeliveryDays,
      sampleVideos, handleVideoUrlChange, handleAddVideoUrl, handleRemoveVideoUrl,
      bio, setBio, ugcUsername, setUgcUsername, savingUgc,
      linkCopied, setLinkCopied,
      socialLinks, setSocialLinks, followerCounts,
      socialVerified, setSocialVerified, socialVerifyError, setSocialVerifyError,
      socialStats, setSocialStats,
      avatarFile, setAvatarFile, avatarPreview, setAvatarPreview,
      portfolioImages, setPortfolioImages, contactEmail, setContactEmail,
      loadingUgcData, ugcRequests, ugcOrders,
      handleVerifySocial, handleSaveUgcProfile,
      handleToggleUgcVisibility, handleDeleteUgcProfile, ugcActionLoading,
      ideasRequestId, setIdeasRequestId, generatedIdeas, setGeneratedIdeas,
      generatingIdeas, actionLoading,
      handleGenerateIdeas, handleAcceptRequest, handleRejectRequest,
    },
  };

  return (
    <ContentHubContext.Provider value={value}>
      {children}
    </ContentHubContext.Provider>
  );
}
