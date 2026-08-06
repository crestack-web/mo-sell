'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';
import { getDatabase } from '@/lib/database/adapter';
import { ToastProvider } from '@/components/brand/ToastProvider';
import { 
  LayoutDashboard, 
  Search, 
  Video, 
  Wallet, 
  Receipt, 
  BarChart3, 
  Megaphone, 
  Settings, 
  LogOut,
  Menu,
  X,
  Bell
} from 'lucide-react';

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

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/brand/dashboard' },
  { id: 'discover', label: 'Discover', icon: Search, path: '/brand/discover' },
  { id: 'videos', label: 'My Videos', icon: Video, path: '/brand/videos' },
  { id: 'wallet', label: 'Wallet', icon: Wallet, path: '/brand/wallet' },
  { id: 'transactions', label: 'Transactions', icon: Receipt, path: '/brand/transactions' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/brand/analytics' },
  { id: 'campaigns', label: 'Campaigns', icon: Megaphone, path: '/brand/campaigns' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/brand/settings' },
];

export default function BrandDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [brand, setBrand] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        router.push('/brand-auth/login');
        return;
      }

      const db = getDatabase();
      const brandDoc = await db.doc(`brands/${user.id}`).get();

      if (!brandDoc.exists) {
        router.push('/brand-auth/register');
        return;
      }

      setBrand(brandDoc.data());
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/brand-auth/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    router.push('/brand-auth/login');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: THEME.bg }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #2A2A2E', borderTopColor: THEME.primary, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: THEME.text2, fontSize: 14 }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div style={{ minHeight: '100vh', display: 'flex', background: THEME.bg, fontFamily: FONTS.body }}>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        style={{
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 50,
          width: 40,
          height: 40,
          borderRadius: 8,
          background: THEME.surface,
          border: `1px solid ${THEME.border}`,
          color: THEME.text1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
        className="mobile-menu-button"
      >
        <Menu size={20} />
      </button>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40,
          }}
          className="sidebar-overlay"
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: 280,
          background: THEME.surface,
          borderRight: `1px solid ${THEME.border}`,
          zIndex: 45,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
        }}
        className="sidebar"
      >
        {/* Close Button (Mobile) */}
        <button
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: 6,
            background: 'transparent',
            border: 'none',
            color: THEME.text2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          className="close-button"
        >
          <X size={20} />
        </button>

        {/* Logo */}
        <div style={{ padding: 24, borderBottom: `1px solid ${THEME.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png" alt="MO Sell" style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: THEME.text1, fontFamily: FONTS.display }}>
                MO Sell
              </div>
              <div style={{ fontSize: 12, color: THEME.text3 }}>Brand Dashboard</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: 16, flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.path;
              const Icon = item.icon;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    router.push(item.path);
                    setSidebarOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: isActive ? `${THEME.primary}15` : 'transparent',
                    border: 'none',
                    color: isActive ? THEME.primary : THEME.text2,
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => !isActive && (e.currentTarget.style.background = THEME.surfaceHover)}
                  onMouseLeave={(e) => !isActive && (e.currentTarget.style.background = 'transparent')}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Wallet Balance Card */}
        {brand && (
          <div style={{ padding: 16, borderTop: `1px solid ${THEME.border}` }}>
            <div style={{ padding: 16, borderRadius: 12, background: `linear-gradient(135deg, ${THEME.primary} 0%, #8B5CF6 100%)` }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>
                Wallet Balance
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'white', fontFamily: FONTS.display, marginBottom: 8 }}>
                ${brand.walletBalance?.toFixed(2) || '0.00'}
              </div>
              <button
                onClick={() => {
                  router.push('/brand/wallet');
                  setSidebarOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: 8,
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: 6,
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >
                Top Up
              </button>
            </div>
          </div>
        )}

        {/* User Section */}
        <div style={{ padding: 16, borderTop: `1px solid ${THEME.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: THEME.surfaceHover, display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.text2, fontSize: 14, fontWeight: 600 }}>
              {brand?.brandName?.charAt(0).toUpperCase() || 'B'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: THEME.text1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {brand?.brandName || 'Brand'}
              </div>
              <div style={{ fontSize: 12, color: THEME.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {brand?.email || ''}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: 10,
              background: 'transparent',
              border: `1px solid ${THEME.border}`,
              borderRadius: 6,
              color: THEME.text2,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = THEME.error;
              e.currentTarget.style.color = THEME.error;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = THEME.border;
              e.currentTarget.style.color = THEME.text2;
            }}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Bar */}
        <header style={{ 
          height: 64, 
          borderBottom: `1px solid ${THEME.border}`, 
          background: THEME.surface,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
        }}
        className="header"
      >
          <div style={{ width: 280 }} className="header-spacer" />
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16 }}>
            <button style={{ width: 40, height: 40, borderRadius: 8, background: 'transparent', border: 'none', color: THEME.text2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={20} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ maxWidth: 1000, width: '100%', margin: '0 auto' }}>
            {children}
          </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (min-width: 1024px) {
          .mobile-menu-button {
            display: none !important;
          }
          .sidebar-overlay {
            display: none !important;
          }
          .sidebar {
            transform: translateX(0) !important;
            position: sticky !important;
          }
          .close-button {
            display: none !important;
          }
          .header-spacer {
            display: none !important;
          }
          .header {
            padding-left: 0 !important;
          }
        }
      `}</style>
      </div>
    </ToastProvider>
  );
}