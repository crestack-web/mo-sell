'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { initializeFirebase } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

// ─── URL ↔ Page mapping ──────────────────────────────────────────────────────

const PATH_TO_PAGE: Record<string, SellPageId> = {
  '/dashboard/overview':   'overview',
  '/dashboard/products':   'products',
  '/dashboard/collections':'collections',
  '/dashboard/orders':     'orders',
  '/dashboard/shipping':   'shipping',
  '/dashboard/analytics':  'analytics',
  '/dashboard/earnings':   'earnings',
  '/dashboard/settings':   'settings',
  '/dashboard/customize':  'theme-editor',
  '/dashboard/themes':     'themes',
  '/dashboard/link-in-bio':'link-in-bio',
  '/dashboard/ask-mo':     'ask-mo',
  '/dashboard/bookings':   'bookings',
  '/dashboard/customers':  'customers',
  '/dashboard/content':       'content',
  '/dashboard/content-hub':   'content-hub',
  '/dashboard/admin/ugc-disputes': 'admin-ugc-disputes',
};

const PAGE_TO_PATH: Record<SellPageId, string> = {
  'overview':      '/dashboard/overview',
  'products':      '/dashboard/products',
  'collections':   '/dashboard/collections',
  'orders':        '/dashboard/orders',
  'shipping':      '/dashboard/shipping',
  'analytics':     '/dashboard/analytics',
  'earnings':      '/dashboard/earnings',
  'settings':      '/dashboard/settings',
  'theme-editor':  '/dashboard/customize',
  'themes':        '/dashboard/themes',
  'link-in-bio':   '/dashboard/link-in-bio',
  'setup-wizard':  '/dashboard/overview',
  'ask-mo':        '/dashboard/ask-mo',
  'bookings':      '/dashboard/bookings',
  'customers':     '/dashboard/customers',
  'content':              '/dashboard/content',
  'content-hub':          '/dashboard/content-hub',
  'admin-ugc-disputes':   '/dashboard/admin/ugc-disputes',
};

// ─── Types ───────────────────────────────────────────────────────────────────

export type SellPageId =
  | 'overview'
  | 'products'
  | 'collections'
  | 'orders'
  | 'shipping'
  | 'analytics'
  | 'earnings'
  | 'settings'
  | 'theme-editor'
  | 'themes'
  | 'link-in-bio'
  | 'setup-wizard'
  | 'ask-mo'
  | 'bookings'
  | 'customers'
  | 'content'
  | 'content-hub'
  | 'admin-ugc-disputes';

export type SellTheme = 'light' | 'dark';

export interface SellUser {
  id: string;
  name: string;
  shortName: string;
  email: string;
  businessId: string;
  plan: string;
  avatarContent: string;
  avatarStyle: { background: string; color: string };
  photoURL?: string;
  moSellAccess: boolean; // beta gate flag
  fromBusmo?: boolean; // user came from busmo studio
}

export interface StoreConfig {
  storeSlug: string;
  storeName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  businessCategory: string;
  currency: string;
  contactEmail: string;
  contactPhone: string;
  status: 'draft' | 'active' | 'paused';
  customDomain: string | null;
  customDomainStatus: 'pending' | 'verified' | 'failed';
  managedPayments?: boolean;
  payoutBankName?: string | null;
  payoutAccountNumber?: string | null;
  payoutAccountName?: string | null;
  theme?: string;
  tagline?: string | null;
  sections?: Array<{
    id: string;
    type: string;
    enabled: boolean;
    order: number;
    settings: Record<string, unknown>;
  }>;
}

export interface SellToast {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}

interface SellContextValue {
  // Theme
  theme: SellTheme;
  toggleTheme: () => void;

  // Navigation
  activePage: SellPageId;
  navigateTo: (page: SellPageId) => void;

  // Sidebar
  sidebarCollapsed: boolean;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;

  // User
  user: SellUser | null;
  userLoading: boolean;

  // Store config
  storeConfig: StoreConfig | null;
  storeConfigLoading: boolean;
  refreshStoreConfig: () => Promise<void>;

  // Toast
  toast: SellToast;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;

  // Quick stats (for topbar / overview)
  quickStats: {
    pendingOrders: number;
    monthlyRevenue: number;
    totalProducts: number;
  };
  refreshQuickStats: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const SellContext = createContext<SellContextValue | undefined>(undefined);

export function SellProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // Theme
  const [theme, setTheme] = useState<SellTheme>(() => {
    try { return (localStorage.getItem('sell-theme') as SellTheme) || 'light'; }
    catch { return 'light'; }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-sell-theme', theme);
    try { localStorage.setItem('sell-theme', theme); } catch { /* noop */ }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  // Navigation — derive activePage from URL
  const activePage: SellPageId = useMemo(() => {
    return PATH_TO_PAGE[pathname] ?? 'overview';
  }, [pathname]);

  const navigateTo = useCallback((page: SellPageId) => {
    const path = PAGE_TO_PATH[page];
    if (path) router.push(path);
    setSidebarOpen(false);
  }, [router]);

  // Sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = useCallback(() => setSidebarCollapsed(prev => !prev), []);
  const openSidebar   = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar  = useCallback(() => setSidebarOpen(false), []);

  // Toast
  const [toast, setToast] = useState<SellToast>({ message: '', type: 'info', visible: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type, visible: true });
    toastTimer.current = setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  // User
  const [user, setUser] = useState<SellUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    const { auth, firestore } = initializeFirebase();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: import('firebase/auth').User | null) => {
      if (!firebaseUser) {
        setUser(null);
        setUserLoading(false);
        return;
      }
      try {
        const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
        const data = userDoc.exists() ? userDoc.data() : {};
        const displayName = firebaseUser.displayName || data.displayName || data.businessName || firebaseUser.email?.split('@')[0] || 'User';
        const firstName = displayName.split(' ')[0];
        setUser({
          id: firebaseUser.uid,
          name: displayName,
          shortName: firstName,
          email: firebaseUser.email || data.email || '',
          businessId: data.businessId || '',
          plan: data.plan || 'starter',
          avatarContent: data.avatarContent || firstName.charAt(0).toUpperCase(),
          avatarStyle: {
            background: data.avatarBg || '#0EA5E9',
            color: data.avatarColor || '#fff',
          },
          photoURL: data.photoURL,
          moSellAccess: true, // open to all authenticated users
          fromBusmo: !!data.fromBusmo,
        });
      } catch (err) {
        console.error('[SellContext] Failed to load user:', err);
        setUser(null);
      } finally {
        setUserLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Store Config
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);
  const [storeConfigLoading, setStoreConfigLoading] = useState(true);

  const refreshStoreConfig = useCallback(async () => {
    if (!user?.businessId) return;
    try {
      const { firestore } = initializeFirebase();
      const configDoc = await getDoc(
        doc(firestore, 'businesses', user.businessId, 'store', 'config')
      );
      if (configDoc.exists()) {
        setStoreConfig(configDoc.data() as StoreConfig);
      } else {
        setStoreConfig(null);
      }
    } catch (err) {
      console.error('[SellContext] Failed to load store config:', err);
    } finally {
      setStoreConfigLoading(false);
    }
  }, [user?.businessId]);

  useEffect(() => {
    if (user?.businessId) {
      refreshStoreConfig();
    } else if (!userLoading) {
      setStoreConfigLoading(false);
    }
  }, [user?.businessId, userLoading, refreshStoreConfig]);

  // Quick stats
  const [quickStats, setQuickStats] = useState({ pendingOrders: 0, monthlyRevenue: 0, totalProducts: 0 });

  const refreshQuickStats = useCallback(async () => {
    if (!user?.businessId) return;
    try {
      const { firestore } = initializeFirebase();
      const biz = user.businessId;

      // Pending orders count
      const ordersQ = query(
        collection(firestore, 'businesses', biz, 'storeOrders'),
        where('status', 'in', ['paid', 'processing']),
        limit(100)
      );
      const ordersSnap = await getDocs(ordersQ);
      const pendingOrders = ordersSnap.size;

      // Monthly revenue
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const revenueQ = query(
        collection(firestore, 'businesses', biz, 'storeOrders'),
        where('paymentStatus', '==', 'paid'),
        where('createdAt', '>=', startOfMonth),
        orderBy('createdAt', 'desc'),
        limit(500)
      );
      const revenueSnap = await getDocs(revenueQ);
      const monthlyRevenue = revenueSnap.docs.reduce((sum, d) => sum + (d.data().total || 0), 0);

      // Product count
      const productsSnap = await getDocs(
        collection(firestore, 'businesses', biz, 'storeProducts')
      );
      const totalProducts = productsSnap.size;

      setQuickStats({ pendingOrders, monthlyRevenue, totalProducts });
    } catch (err) {
      console.error('[SellContext] Failed to load quick stats:', err);
    }
  }, [user?.businessId]);

  useEffect(() => {
    if (user?.businessId && storeConfig) {
      refreshQuickStats();
    }
  }, [user?.businessId, storeConfig, refreshQuickStats]);

  return (
    <SellContext.Provider value={{
      theme, toggleTheme,
      activePage, navigateTo,
      sidebarCollapsed, sidebarOpen, toggleSidebar, openSidebar, closeSidebar,
      user, userLoading,
      storeConfig, storeConfigLoading, refreshStoreConfig,
      toast, showToast,
      quickStats, refreshQuickStats,
    }}>
      {children}
    </SellContext.Provider>
  );
}

export function useSell(): SellContextValue {
  const ctx = useContext(SellContext);
  if (!ctx) throw new Error('useSell must be used inside <SellProvider>');
  return ctx;
}
