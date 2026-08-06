'use client';

import React, { useState, useEffect } from 'react';
import { getDatabase } from '@/lib/database/adapter';
import { supabaseClient } from '@/lib/supabase-client';
import { 
  Wallet, 
  Video, 
  TrendingUp, 
  Activity, 
  ArrowUpRight, 
  Clock,
  CheckCircle,
  XCircle
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
};

const FONTS = {
  display: "'Inter', system-ui, sans-serif",
  body: "'Inter', system-ui, sans-serif",
};

interface DashboardStats {
  walletBalance: number;
  videosPurchased: number;
  totalSpendThisMonth: number;
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type: 'purchase' | 'topup' | 'refund';
  description: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
}

export default function BrandDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    walletBalance: 0,
    videosPurchased: 0,
    totalSpendThisMonth: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      const db = getDatabase();
      
      // Get brand data
      const brandQuery = await db.collection('brands').where('userId', '==', user.id).limit(1).get();
      if (brandQuery.docs.length === 0) return;
      
      const brand = brandQuery.docs[0].data();
      const brandId = brandQuery.docs[0].id;

      // Get purchased videos count
      const videosQuery = await db.collection('purchased_videos')
        .where('brandId', '==', brandId)
        .get();
      
      const videosPurchased = videosQuery.docs.length;

      // Calculate total spend this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const transactionsQuery = await db.collection('wallet_transactions')
        .where('brandId', '==', brandId)
        .where('type', '==', 'purchase')
        .get();
      
      let totalSpendThisMonth = 0;
      transactionsQuery.docs.forEach(doc => {
        const transaction = doc.data();
        const transactionDate = new Date(transaction.createdAt);
        if (transactionDate >= startOfMonth && transaction.status === 'completed') {
          totalSpendThisMonth += Math.abs(transaction.amount);
        }
      });

      // Get recent activity
      const activityQuery = await db.collection('wallet_transactions')
        .where('brandId', '==', brandId)
        .get();
      
      const recentActivity = activityQuery.docs
        .map(doc => ({
          id: doc.id,
          type: doc.data().type,
          description: doc.data().description,
          amount: doc.data().amount,
          status: doc.data().status,
          createdAt: doc.data().createdAt,
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);

      setStats({
        walletBalance: brand.walletBalance || 0,
        videosPurchased,
        totalSpendThisMonth,
        recentActivity,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatAmount = (amount: number) => {
    return amount >= 0 ? `+$${amount.toFixed(2)}` : `-$${Math.abs(amount).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ width: 40, height: 40, border: '3px solid #2A2A2E', borderTopColor: THEME.primary, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: THEME.text1, fontFamily: FONTS.display, marginBottom: 4 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 13.5, color: THEME.text2 }}>
          Welcome back! Here's an overview of your UGC marketplace activity.
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
        {/* Wallet Balance Card */}
        <div style={{ 
          padding: 14, 
          borderRadius: 12, 
          background: `linear-gradient(135deg, ${THEME.primary} 0%, #8B5CF6 100%)`,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Wallet size={16} color="white" />
              <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                Wallet Balance
              </span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'white', fontFamily: FONTS.display, marginBottom: 10 }}>
              ${stats.walletBalance.toFixed(2)}
            </div>
            <button
              onClick={() => window.location.href = '/brand/wallet'}
              style={{
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: 6,
                color: 'white',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >
              Top Up
              <ArrowUpRight size={13} />
            </button>
          </div>
        </div>

        {/* Videos Purchased Card */}
        <div style={{ 
          padding: 14, 
          borderRadius: 12, 
          background: THEME.surface, 
          border: `1px solid ${THEME.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Video size={16} color={THEME.primary} />
            <span style={{ fontSize: 12.5, color: THEME.text2, fontWeight: 500 }}>
              Videos Purchased
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: THEME.text1, fontFamily: FONTS.display, marginBottom: 4 }}>
            {stats.videosPurchased}
          </div>
          <div style={{ fontSize: 11.5, color: THEME.text3 }}>
            Total videos in your library
          </div>
        </div>

        {/* Total Spend Card */}
        <div style={{ 
          padding: 14, 
          borderRadius: 12, 
          background: THEME.surface, 
          border: `1px solid ${THEME.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <TrendingUp size={16} color={THEME.success} />
            <span style={{ fontSize: 12.5, color: THEME.text2, fontWeight: 500 }}>
              Total Spend This Month
            </span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: THEME.text1, fontFamily: FONTS.display, marginBottom: 4 }}>
            ${stats.totalSpendThisMonth.toFixed(2)}
          </div>
          <div style={{ fontSize: 11.5, color: THEME.text3 }}>
            UGC purchases this month
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ 
        padding: 16, 
        borderRadius: 12, 
        background: THEME.surface, 
        border: `1px solid ${THEME.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={18} color={THEME.primary} />
            <h2 style={{ fontSize: 16, fontWeight: 600, color: THEME.text1, fontFamily: FONTS.display }}>
              Recent Activity
            </h2>
          </div>
          <button
            onClick={() => window.location.href = '/brand/transactions'}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              border: `1px solid ${THEME.border}`,
              borderRadius: 6,
              color: THEME.text2,
              fontSize: 12,
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
            View All
          </button>
        </div>

        {stats.recentActivity.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: THEME.text3 }}>
            <Activity size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p style={{ fontSize: 13 }}>No recent activity</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats.recentActivity.map((activity) => (
              <div
                key={activity.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 12,
                  borderRadius: 8,
                  background: THEME.bg,
                  border: `1px solid ${THEME.border}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    width: 34, 
                    height: 34, 
                    borderRadius: 8, 
                    background: activity.type === 'topup' ? `${THEME.success}15` : `${THEME.primary}15`,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                  }}>
                    {activity.type === 'topup' ? (
                      <Wallet size={18} color={THEME.success} />
                    ) : activity.type === 'purchase' ? (
                      <Video size={18} color={THEME.primary} />
                    ) : (
                      <Activity size={18} color={THEME.error} />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: THEME.text1, marginBottom: 2 }}>
                      {activity.description}
                    </div>
                    <div style={{ fontSize: 11.5, color: THEME.text3, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} />
                      {formatDate(activity.createdAt)}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontSize: 14, 
                    fontWeight: 600, 
                    color: activity.amount >= 0 ? THEME.success : THEME.error,
                    fontFamily: FONTS.display,
                  }}>
                    {formatAmount(activity.amount)}
                  </div>
                  <div style={{ fontSize: 11.5, color: THEME.text3, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                    {activity.status === 'completed' ? (
                      <>
                        <CheckCircle size={11} color={THEME.success} />
                        Completed
                      </>
                    ) : activity.status === 'pending' ? (
                      <>
                        <Clock size={11} color={THEME.text3} />
                        Pending
                      </>
                    ) : (
                      <>
                        <XCircle size={11} color={THEME.error} />
                        Failed
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}