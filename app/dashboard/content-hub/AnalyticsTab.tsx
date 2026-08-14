'use client';

import React from 'react';
import { BadgeCheck, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { s, PLATFORMS, formatCount, Spinner } from './shared';
import { useContentHub } from './ContentHubContext';
import { RecommendationsPanel } from './RecommendationsPanel';

export function AnalyticsTab() {
  const {
    currency,
    totalRevenue, totalOrders, pageViews, addToCarts, conversionRate,
    scheduledCount, postedCount, upcomingPosts, profileCount,
    analyticsLoading,
    socialProfiles, socialProfileLoading, newSocialUrl, setNewSocialUrl,
    newSocialPlatform, setNewSocialPlatform, showAddProfile, setShowAddProfile,
    handleAddSocialProfile, handleVerifyProfile, handleRemoveSocialProfile,
    calendarPosts, handleTogglePostStatus,
  } = useContentHub();

  const totalPlanned = scheduledCount + postedCount;
  const completionPct = totalPlanned > 0 ? Math.round((postedCount / totalPlanned) * 100) : 0;

  return (
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
            <Spinner size={18} />
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
                { label: 'Post completion', value: totalPlanned > 0 ? `${completionPct}%` : '—', sub: `${postedCount} posted of ${totalPlanned} planned` },
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
                        {socialProfileLoading[newSocialPlatform] ? <Spinner size={13} color="#fff" /> : <CheckCircle2 size={13} />}
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
                            aria-label={`Remove ${label} profile`}
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
            <RecommendationsPanel />
          </>
        )}
      </div>
    </div>
  );
}
