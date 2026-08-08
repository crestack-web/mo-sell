'use client';

import React, { useState, useEffect } from 'react';
import { getDatabase } from '@/lib/database/adapter';
import { supabaseClient } from '@/lib/supabase-client';
import { 
  Video, 
  Download, 
  Eye, 
  TrendingUp, 
  Search, 
  Filter,
  Calendar,
  DollarSign,
  Tag,
  ExternalLink,
  MoreVertical,
  Loader2
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

interface PurchasedVideo {
  id: string;
  videoTitle: string;
  creatorName: string;
  creatorUsername: string;
  creatorAvatar?: string;
  videoThumbnail: string;
  videoUrl: string;
  platform: string;
  price: number;
  paymentMethod: string;
  licenseType: string;
  purchaseDate: string;
  platformViews?: number;
  platformLikes?: number;
  platformComments?: number;
  status: string;
  tags?: string[];
}

export default function BrandVideosPage() {
  const [videos, setVideos] = useState<PurchasedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
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
      
      const purchasedVideos = videosQuery.docs.map(doc => doc.data() as PurchasedVideo);
      setVideos(purchasedVideos);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.videoTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         video.creatorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = platformFilter === 'all' || video.platform === platformFilter;
    return matchesSearch && matchesPlatform;
  }).sort((a, b) => {
    if (sortBy === 'date') return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
    if (sortBy === 'price') return b.price - a.price;
    if (sortBy === 'views') return (b.platformViews || 0) - (a.platformViews || 0);
    return 0;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'tiktok': return '🎵';
      case 'instagram': return '📸';
      case 'youtube': return '▶️';
      default: return '🎬';
    }
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
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: THEME.text1, fontFamily: FONTS.display, marginBottom: 8 }}>
          My Videos
        </h1>
        <p style={{ fontSize: 16, color: THEME.text2 }}>
          Manage your purchased UGC content library
        </p>
      </div>

      {/* Filters */}
      <div style={{ 
        padding: 20, 
        borderRadius: 12, 
        background: THEME.surface, 
        border: `1px solid ${THEME.border}`,
        marginBottom: 24,
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={18} color={THEME.text3} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search videos or creators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
            onFocus={(e) => e.target.style.borderColor = THEME.primary}
            onBlur={(e) => e.target.style.borderColor = THEME.border}
          />
        </div>

        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
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
          <option value="all">All Platforms</option>
          <option value="tiktok">TikTok</option>
          <option value="instagram">Instagram</option>
          <option value="youtube">YouTube</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
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
          <option value="date">Sort by Date</option>
          <option value="price">Sort by Price</option>
          <option value="views">Sort by Views</option>
        </select>
      </div>

      {/* Videos Grid */}
      {filteredVideos.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: 80, 
          borderRadius: 16, 
          background: THEME.surface, 
          border: `1px solid ${THEME.border}`,
        }}>
          <Video size={64} color={THEME.text3} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: 20, fontWeight: 600, color: THEME.text1, marginBottom: 8 }}>
            No videos yet
          </h3>
          <p style={{ fontSize: 14, color: THEME.text2, marginBottom: 24 }}>
            Start discovering and purchasing UGC content from creators
          </p>
          <button
            onClick={() => window.location.href = '/brand/discover'}
            style={{
              padding: '12px 24px',
              background: THEME.primary,
              border: 'none',
              borderRadius: 8,
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = THEME.primaryHover}
            onMouseLeave={(e) => e.currentTarget.style.background = THEME.primary}
          >
            Discover Videos
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap: 24 }}>
          {filteredVideos.map((video) => (
            <div
              key={video.id}
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
              {/* Thumbnail */}
              <div style={{ position: 'relative', aspectRatio: '9/16', background: THEME.bg }}>
                <img
                  src={video.videoThumbnail}
                  alt={video.videoTitle}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ 
                  position: 'absolute', 
                  top: 12, 
                  right: 12, 
                  padding: '4px 8px', 
                  borderRadius: 6, 
                  background: 'rgba(0,0,0,0.7)',
                  fontSize: 12,
                  color: 'white',
                  fontWeight: 500,
                }}>
                  {getPlatformIcon(video.platform)} {video.platform}
                </div>
                <div style={{ 
                  position: 'absolute', 
                  bottom: 12, 
                  left: 12, 
                  padding: '4px 8px', 
                  borderRadius: 6, 
                  background: `${THEME.primary}90`,
                  fontSize: 12,
                  color: 'white',
                  fontWeight: 600,
                }}>
                  ${video.price}
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: 16 }}>
                <h3 style={{ 
                  fontSize: 16, 
                  fontWeight: 600, 
                  color: THEME.text1, 
                  marginBottom: 8,
                  fontFamily: FONTS.display,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {video.videoTitle}
                </h3>

                {/* Creator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ 
                    width: 28, 
                    height: 28, 
                    borderRadius: '50%', 
                    background: THEME.surfaceHover,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 600,
                    color: THEME.text2,
                  }}>
                    {video.creatorName.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: THEME.text1 }}>
                      {video.creatorName}
                    </div>
                    <div style={{ fontSize: 11, color: THEME.text3 }}>
                      @{video.creatorUsername}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: THEME.text3 }}>
                    <Eye size={14} />
                    {video.platformViews?.toLocaleString() || 'N/A'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: THEME.text3 }}>
                    <TrendingUp size={14} />
                    {video.platformLikes?.toLocaleString() || 'N/A'}
                  </div>
                </div>

                {/* Tags */}
                {video.tags && video.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {video.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 4,
                          background: `${THEME.primary}15`,
                          color: THEME.primary,
                          fontSize: 11,
                          fontWeight: 500,
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Meta */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: THEME.text3, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} />
                    {formatDate(video.purchaseDate)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <DollarSign size={12} />
                    {video.paymentMethod === 'wallet' ? 'Wallet' : 'Direct'}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => window.open(video.videoUrl, '_blank')}
                    style={{
                      flex: 1,
                      padding: 10,
                      background: THEME.bg,
                      border: `1px solid ${THEME.border}`,
                      borderRadius: 6,
                      color: THEME.text2,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
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
                    <ExternalLink size={14} />
                    View
                  </button>
                  <button
                    style={{
                      flex: 1,
                      padding: 10,
                      background: THEME.primary,
                      border: 'none',
                      borderRadius: 6,
                      color: 'white',
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = THEME.primaryHover}
                    onMouseLeave={(e) => e.currentTarget.style.background = THEME.primary}
                  >
                    <Download size={14} />
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
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