'use client';

import React, { useState, useEffect } from 'react';
import { getDatabase } from '@/lib/database/adapter';
import { supabaseClient } from '@/lib/supabase-client';
import { 
  BarChart3, 
  TrendingUp, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2, 
  Download,
  Calendar,
  DollarSign,
  Loader2,
  Video
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
};

const FONTS = {
  display: "'Inter', system-ui, sans-serif",
  body: "'Inter', system-ui, sans-serif",
};

interface VideoPerformance {
  id: string;
  videoTitle: string;
  platformViews: number;
  platformLikes: number;
  platformComments: number;
  platformShares: number;
  price: number;
  purchaseDate: string;
  platform: string;
}

export default function BrandAnalyticsPage() {
  const [videos, setVideos] = useState<VideoPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const loadAnalyticsData = async () => {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) return;

      const db = getDatabase();
      
      // Get brand ID
      const brandQuery = await db.collection('brands').where('userId', '==', user.id).limit(1).get();
      if (brandQuery.docs.length === 0) return;
      
      const brandId = brandQuery.docs[0].id;

      // Get purchased videos
      const videosQuery = await db.collection('purchased_videos')
        .where('brandId', '==', brandId)
        .get();
      
      const purchasedVideos = videosQuery.docs.map(doc => doc.data() as VideoPerformance);
      
      // Filter by date range
      const now = new Date();
      const daysAgo = new Date(now.getTime() - parseInt(dateRange) * 24 * 60 * 60 * 1000);
      
      const filteredVideos = purchasedVideos.filter(video => {
        const purchaseDate = new Date(video.purchaseDate);
        return purchaseDate >= daysAgo;
      });

      setVideos(filteredVideos);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalViews = videos.reduce((sum, v) => sum + (v.platformViews || 0), 0);
  const totalLikes = videos.reduce((sum, v) => sum + (v.platformLikes || 0), 0);
  const totalComments = videos.reduce((sum, v) => sum + (v.platformComments || 0), 0);
  const totalShares = videos.reduce((sum, v) => sum + (v.platformShares || 0), 0);
  const totalSpend = videos.reduce((sum, v) => sum + v.price, 0);
  const avgEngagementRate = totalViews > 0 
    ? ((totalLikes + totalComments + totalShares) / totalViews * 100).toFixed(2)
    : '0.00';

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const exportToCSV = () => {
    const headers = ['Video Title', 'Platform', 'Views', 'Likes', 'Comments', 'Shares', 'Price', 'Purchase Date'];
    const rows = videos.map(v => [
      v.videoTitle,
      v.platform,
      v.platformViews || 0,
      v.platformLikes || 0,
      v.platformComments || 0,
      v.platformShares || 0,
      `$${v.price.toFixed(2)}`,
      new Date(v.purchaseDate).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: THEME.primary }} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: THEME.text1, fontFamily: FONTS.display, marginBottom: 8 }}>
            Analytics
          </h1>
          <p style={{ fontSize: 16, color: THEME.text2 }}>
            Performance tracking for your purchased UGC videos
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{
              padding: '10px 16px',
              background: THEME.surface,
              border: `1px solid ${THEME.border}`,
              borderRadius: 8,
              color: THEME.text1,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button
            onClick={exportToCSV}
            disabled={videos.length === 0}
            style={{
              padding: '12px 20px',
              background: videos.length === 0 ? THEME.surfaceHover : THEME.primary,
              border: 'none',
              borderRadius: 8,
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              cursor: videos.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => videos.length > 0 && (e.currentTarget.style.background = THEME.primaryHover)}
            onMouseLeave={(e) => videos.length > 0 && (e.currentTarget.style.background = THEME.primary)}
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 32 }}>
        <div style={{ 
          padding: 24, 
          borderRadius: 16, 
          background: THEME.surface, 
          border: `1px solid ${THEME.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Eye size={20} color={THEME.primary} />
            <span style={{ fontSize: 14, color: THEME.text2, fontWeight: 500 }}>
              Total Views
            </span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: THEME.text1, fontFamily: FONTS.display }}>
            {formatNumber(totalViews)}
          </div>
        </div>

        <div style={{ 
          padding: 24, 
          borderRadius: 16, 
          background: THEME.surface, 
          border: `1px solid ${THEME.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Heart size={20} color={THEME.success} />
            <span style={{ fontSize: 14, color: THEME.text2, fontWeight: 500 }}>
              Total Likes
            </span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: THEME.text1, fontFamily: FONTS.display }}>
            {formatNumber(totalLikes)}
          </div>
        </div>

        <div style={{ 
          padding: 24, 
          borderRadius: 16, 
          background: THEME.surface, 
          border: `1px solid ${THEME.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <MessageCircle size={20} color={THEME.primary} />
            <span style={{ fontSize: 14, color: THEME.text2, fontWeight: 500 }}>
              Total Comments
            </span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: THEME.text1, fontFamily: FONTS.display }}>
            {formatNumber(totalComments)}
          </div>
        </div>

        <div style={{ 
          padding: 24, 
          borderRadius: 16, 
          background: THEME.surface, 
          border: `1px solid ${THEME.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Share2 size={20} color={THEME.success} />
            <span style={{ fontSize: 14, color: THEME.text2, fontWeight: 500 }}>
              Total Shares
            </span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: THEME.text1, fontFamily: FONTS.display }}>
            {formatNumber(totalShares)}
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 32 }}>
        <div style={{ 
          padding: 24, 
          borderRadius: 16, 
          background: THEME.surface, 
          border: `1px solid ${THEME.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <TrendingUp size={20} color={THEME.primary} />
            <span style={{ fontSize: 14, color: THEME.text2, fontWeight: 500 }}>
              Avg Engagement Rate
            </span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: THEME.text1, fontFamily: FONTS.display }}>
            {avgEngagementRate}%
          </div>
        </div>

        <div style={{ 
          padding: 24, 
          borderRadius: 16, 
          background: THEME.surface, 
          border: `1px solid ${THEME.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <DollarSign size={20} color={THEME.success} />
            <span style={{ fontSize: 14, color: THEME.text2, fontWeight: 500 }}>
              Total Spend
            </span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: THEME.text1, fontFamily: FONTS.display }}>
            ${totalSpend.toFixed(2)}
          </div>
        </div>

        <div style={{ 
          padding: 24, 
          borderRadius: 16, 
          background: THEME.surface, 
          border: `1px solid ${THEME.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Video size={20} color={THEME.primary} />
            <span style={{ fontSize: 14, color: THEME.text2, fontWeight: 500 }}>
              Videos Purchased
            </span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: THEME.text1, fontFamily: FONTS.display }}>
            {videos.length}
          </div>
        </div>

        <div style={{ 
          padding: 24, 
          borderRadius: 16, 
          background: THEME.surface, 
          border: `1px solid ${THEME.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <BarChart3 size={20} color={THEME.success} />
            <span style={{ fontSize: 14, color: THEME.text2, fontWeight: 500 }}>
              Cost per 1K Views
            </span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: THEME.text1, fontFamily: FONTS.display }}>
            ${totalViews > 0 ? (totalSpend / (totalViews / 1000)).toFixed(2) : '0.00'}
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <div style={{ 
        padding: 24, 
        borderRadius: 16, 
        background: THEME.surface, 
        border: `1px solid ${THEME.border}`,
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: THEME.text1, fontFamily: FONTS.display, marginBottom: 20 }}>
          Video Performance
        </h2>

        {videos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: THEME.text3 }}>
            <BarChart3 size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p style={{ fontSize: 14 }}>No video data available for selected period</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${THEME.border}` }}>
                  <th style={{ padding: 12, textAlign: 'left', fontSize: 13, fontWeight: 600, color: THEME.text2 }}>
                    Video
                  </th>
                  <th style={{ padding: 12, textAlign: 'right', fontSize: 13, fontWeight: 600, color: THEME.text2 }}>
                    Views
                  </th>
                  <th style={{ padding: 12, textAlign: 'right', fontSize: 13, fontWeight: 600, color: THEME.text2 }}>
                    Likes
                  </th>
                  <th style={{ padding: 12, textAlign: 'right', fontSize: 13, fontWeight: 600, color: THEME.text2 }}>
                    Comments
                  </th>
                  <th style={{ padding: 12, textAlign: 'right', fontSize: 13, fontWeight: 600, color: THEME.text2 }}>
                    Shares
                  </th>
                  <th style={{ padding: 12, textAlign: 'right', fontSize: 13, fontWeight: 600, color: THEME.text2 }}>
                    Engagement
                  </th>
                  <th style={{ padding: 12, textAlign: 'right', fontSize: 13, fontWeight: 600, color: THEME.text2 }}>
                    Price
                  </th>
                </tr>
              </thead>
              <tbody>
                {videos.map((video) => {
                  const engagement = video.platformViews > 0
                    ? ((video.platformLikes + video.platformComments + video.platformShares) / video.platformViews * 100).toFixed(2)
                    : '0.00';
                  
                  return (
                    <tr
                      key={video.id}
                      style={{ borderBottom: `1px solid ${THEME.border}`, transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = THEME.surfaceHover}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: 12 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: THEME.text1, marginBottom: 4 }}>
                          {video.videoTitle}
                        </div>
                        <div style={{ fontSize: 12, color: THEME.text3, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={12} />
                          {new Date(video.purchaseDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td style={{ padding: 12, textAlign: 'right', color: THEME.text1 }}>
                        {formatNumber(video.platformViews || 0)}
                      </td>
                      <td style={{ padding: 12, textAlign: 'right', color: THEME.text1 }}>
                        {formatNumber(video.platformLikes || 0)}
                      </td>
                      <td style={{ padding: 12, textAlign: 'right', color: THEME.text1 }}>
                        {formatNumber(video.platformComments || 0)}
                      </td>
                      <td style={{ padding: 12, textAlign: 'right', color: THEME.text1 }}>
                        {formatNumber(video.platformShares || 0)}
                      </td>
                      <td style={{ padding: 12, textAlign: 'right' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 500,
                          background: parseFloat(engagement) > 5 ? `${THEME.success}15` : `${THEME.primary}15`,
                          color: parseFloat(engagement) > 5 ? THEME.success : THEME.primary,
                        }}>
                          {engagement}%
                        </span>
                      </td>
                      <td style={{ padding: 12, textAlign: 'right', color: THEME.text1, fontWeight: 600 }}>
                        ${video.price.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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