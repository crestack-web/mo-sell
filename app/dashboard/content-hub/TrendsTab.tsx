'use client';

import React, { useEffect } from 'react';
import { RefreshCw, TrendingUp, Eye, Heart, MessageCircle, Share2, ExternalLink, CalendarClock, Sparkles } from 'lucide-react';
import { s, Spinner, formatCount } from './shared';
import { RecommendationsPanel } from './RecommendationsPanel';
import { useContentHub } from './ContentHubContext';

export function TrendsTab() {
  const {
    trends, trendsLoading, trendsError, trendsSource,
    handleLoadTrends, handleScheduleIdea,
  } = useContentHub();

  useEffect(() => {
    if (!trendsLoading && trends.length === 0 && !trendsError) {
      handleLoadTrends();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div style={s.cardHeader}>
        <div>
          <p style={s.cardTitle}>Trending</p>
          <p style={s.cardSub}>Real trending posts on TikTok in your niche — adapt any of them for your store</p>
        </div>
        <button style={s.btnSecondary} onClick={handleLoadTrends} disabled={trendsLoading}>
          {trendsLoading ? <Spinner size={13} /> : <RefreshCw size={13} />}
          {trendsLoading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
      <div style={s.cardBody}>
        {trendsError && (
          <div style={{ border: '1px solid var(--sell-red)', borderRadius: 'var(--sell-radius-sm)', padding: 12, fontSize: '0.78rem', color: 'var(--sell-red)' }}>
            {trendsError}
          </div>
        )}
        {trendsLoading && trends.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--sell-text-3)', fontSize: '0.85rem' }}>
            <Spinner size={16} /> Scraping live TikTok trends for your niche…
          </div>
        )}
        {!trendsLoading && !trendsError && trends.length === 0 && (
          <p style={{ fontSize: '0.85rem', color: 'var(--sell-text-3)', margin: 0 }}>
            No trending posts found yet — hit Refresh to pull live data.
          </p>
        )}
        {trends.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--sell-text-3)' }}>
              <TrendingUp size={13} color="var(--sell-accent)" />
              {trends.length} live posts from TikTok{trendsSource ? ` · source: ${trendsSource}` : ''} — ranked by niche relevance
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {trends.map((t, i) => (
                <div key={t.id || i} style={{ display: 'flex', gap: 12, border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', padding: 10, background: 'var(--sell-bg)' }}>
                  {t.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.coverUrl}
                      alt=""
                      style={{ width: 96, height: 72, objectFit: 'cover', borderRadius: 'var(--sell-radius-sm)', flexShrink: 0, background: 'var(--sell-border-subtle)' }}
                    />
                  ) : (
                    <div style={{ width: 96, height: 72, borderRadius: 'var(--sell-radius-sm)', flexShrink: 0, background: 'var(--sell-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '1.4rem' }}>🎵</span>
                    </div>
                  )}
                  <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                      <p style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--sell-text-1)', margin: 0 }}>
                        <span style={{ color: 'var(--sell-text-3)', fontWeight: 600, marginRight: 4 }}>#{i + 1}</span>
                        {t.caption || '(no caption)'}
                      </p>
                      <button
                        style={{ ...s.btnGhost, flexShrink: 0, fontSize: '0.68rem', padding: '4px 10px' }}
                        onClick={() => handleScheduleIdea({
                          hook: (t.caption || 'Trending post').slice(0, 90),
                          format: `Replicate trending TikTok (${formatCount(t.views ?? 0)} views)`,
                          cta: 'Post your own version with your product',
                          platforms: ['tiktok'],
                          bestDay: 'Saturday',
                          bestTime: '6pm WAT',
                        })}
                      >
                        <CalendarClock size={12} /> Schedule
                      </button>
                    </div>
                    <p style={{ fontSize: '0.74rem', color: 'var(--sell-text-2)', margin: 0, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700 }}>@{t.creator}</span>
                      {t.videoUrl && (
                        <a href={t.videoUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--sell-accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          Open <ExternalLink size={11} />
                        </a>
                      )}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.72rem', color: 'var(--sell-text-3)', flexWrap: 'wrap' }}>
                      {t.views != null && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Eye size={12} /> {formatCount(t.views)}</span>}
                      {t.likes != null && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Heart size={12} /> {formatCount(t.likes)}</span>}
                      {t.comments != null && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><MessageCircle size={12} /> {formatCount(t.comments)}</span>}
                      {t.shares != null && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Share2 size={12} /> {formatCount(t.shares)}</span>}
                      {t.hashtags?.length > 0 && (
                        <span style={{ color: 'var(--sell-accent)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 280 }}>
                          {t.hashtags.map((h: string) => `#${h}`).join(' ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        <div style={{ borderTop: '1px solid var(--sell-border-subtle)', paddingTop: 16 }}>
          <RecommendationsPanel
            title="AI-Generated Ideas for Your Store"
            subtitle="Not seeing what you need? Have MO generate fully tailored hooks, scripts and captions for your specific products."
          />
        </div>
      </div>
    </div>
  );
}
