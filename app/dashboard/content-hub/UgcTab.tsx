'use client';

import React from 'react';
import {
  Users, Plus, X, Star, Camera, Instagram, Music2, Youtube, Twitter,
  Trash2, Upload, Check, Copy, Eye, EyeOff, Lightbulb, BadgeCheck,
  Video, Clock, Wallet, Banknote, AlertCircle, MessageSquare, ExternalLink, Send,
} from 'lucide-react';
import { s, Spinner, Md, formatCount } from './shared';
import { useContentHub } from './ContentHubContext';
import { getStorage } from '@/lib/storage/adapter';
import { useSell } from '@/context/SellContext';

/* ─── Collapsible section ───────────────────────────────── */

function Section({ title, hint, defaultOpen, children }: { title: string; hint?: string; defaultOpen?: boolean; children: React.ReactNode }) {
  return (
    <details
      open={defaultOpen}
      style={{ border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', background: 'var(--sell-surface)', overflow: 'hidden' }}
    >
      <summary
        style={{
          cursor: 'pointer', padding: '11px 14px', fontSize: '0.82rem', fontWeight: 700,
          color: 'var(--sell-text-1)', background: 'var(--sell-surface-2)', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', gap: 8, listStyle: 'none',
        }}
      >
        <span>{title}</span>
        {hint && <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--sell-text-3)' }}>{hint}</span>}
      </summary>
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </details>
  );
}

/* ─── Apply / Edit form ─────────────────────────────────── */

function UgcApplyForm() {
  const { user, currency, UGC } = useContentHub();
  const {
    ugcProfile, niches, nicheInput, setNicheInput, handleAddNiche, handleRemoveNiche,
    price30s, setPrice30s, price60s, setPrice60s, deliveryDays, setDeliveryDays,
    sampleVideos, handleVideoUrlChange, handleAddVideoUrl, handleRemoveVideoUrl,
    bio, setBio, ugcUsername, setUgcUsername, savingUgc,
    socialLinks, setSocialLinks, socialVerified,
    socialVerifyError, socialStats,
    avatarFile, setAvatarFile, avatarPreview, setAvatarPreview,
    portfolioImages, setPortfolioImages, contactEmail, setContactEmail,
    handleVerifySocial, handleSaveUgcProfile,
  } = UGC;

  const socialPlatforms: [string, string, React.FC<{ size?: number }>][] = [
    ['instagram', 'Instagram', Instagram],
    ['tiktok', 'TikTok', Music2],
    ['youtube', 'YouTube', Youtube],
    ['twitter', 'X (Twitter)', Twitter],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 }}>
      <p style={{ fontSize: '0.82rem', color: 'var(--sell-text-2)', fontWeight: 600 }}>Become a UGC Creator</p>

      {/* Required: niches + pricing */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', padding: '14px 16px', background: 'var(--sell-surface)' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--sell-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
          Required
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={s.formLabel}>Niches *</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {niches.map(n => (
              <span key={n} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'var(--sell-primary-lt)', color: 'var(--sell-primary)', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600 }}>
                {n}
                <button onClick={() => handleRemoveNiche(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sell-primary)', padding: 0, display: 'flex', fontSize: '14px', lineHeight: 1 }} aria-label={`Remove niche ${n}`}>&times;</button>
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
      </div>

      {/* Collapsible: Profile details */}
      <Section title="Profile & Contact" hint="Username, bio, avatar, email">
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={s.formLabel}>Bio</label>
          <textarea
            style={{ ...s.formInput, minHeight: 80, resize: 'vertical' as const, fontFamily: 'var(--sell-font-body)' }}
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Tell brands about yourself..."
          />
        </div>
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
                if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB'); return; }
                setAvatarFile(file);
                const reader = new FileReader();
                reader.onloadend = () => setAvatarPreview(reader.result as string);
                reader.readAsDataURL(file);
              }} />
            </label>
            {avatarPreview && (
              <button style={{ ...s.btnGhost, fontSize: '0.75rem', padding: '6px 12px', color: 'var(--sell-red)' }} onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}>
                <Trash2 size={12} /> Remove
              </button>
            )}
          </div>
        </div>
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
      </Section>

      {/* Collapsible: Portfolio media */}
      <Section title="Portfolio Media" hint="Sample videos + images">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={s.formLabel}>Sample Videos (URLs) <span style={{ fontWeight: 400, color: 'var(--sell-text-3)' }}>(3 by default, add more if you like)</span></label>
          {sampleVideos.map((url, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                style={s.formInput}
                value={url}
                onChange={e => handleVideoUrlChange(idx, e.target.value)}
                placeholder={`Video URL ${idx + 1}`}
              />
              <button
                style={{ ...s.btnGhost, padding: '6px 8px', fontSize: '0.72rem', color: 'var(--sell-red)', flexShrink: 0 }}
                onClick={() => handleRemoveVideoUrl(idx)}
                title="Remove video"
                aria-label={`Remove video ${idx + 1}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <button style={{ ...s.btnGhost, alignSelf: 'flex-start', fontSize: '0.75rem', padding: '6px 12px' }} onClick={handleAddVideoUrl}>
            <Plus size={12} />
            Add another URL
          </button>
        </div>
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
              <button style={{ ...s.btnGhost, padding: '6px 8px', fontSize: '0.72rem', color: 'var(--sell-red)' }} onClick={() => setPortfolioImages(prev => prev.filter((_, i) => i !== idx))} title="Remove image" aria-label={`Remove image ${idx + 1}`}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <button style={{ ...s.btnGhost, alignSelf: 'flex-start', fontSize: '0.75rem', padding: '6px 12px' }} onClick={() => setPortfolioImages(prev => [...prev, ''])}>
            <Plus size={12} />
            Add another image
          </button>
        </div>
      </Section>

      {/* Collapsible: Social proof */}
      <Section title="Social Proof & Verification" hint="TikTok & Instagram are verified live">
        {socialPlatforms.map(([key, label, Icon]) => (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 120, fontSize: '0.82rem', color: 'var(--sell-text-2)' }}>
                <Icon size={16} />
                <span>{label}</span>
              </div>
              <input
                style={{ ...s.formInput, flex: '1', minWidth: 160 }}
                value={socialLinks[key] || ''}
                onChange={e => setSocialLinks(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={`@${label.toLowerCase()} or URL (optional)`}
              />
              {(key === 'tiktok' || key === 'instagram') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
                  <button
                    style={{
                      ...s.btnGhost, fontSize: '0.68rem', padding: '5px 10px', whiteSpace: 'nowrap',
                      ...(socialVerified[key] === 'verified' ? { borderColor: 'var(--sell-green)', color: 'var(--sell-green)' } : {}),
                    }}
                    onClick={() => handleVerifySocial(key, socialLinks[key] || '')}
                    disabled={socialVerified[key] === 'checking'}
                    title={`Check that this ${label} account exists`}
                  >
                    {socialVerified[key] === 'checking' ? (
                      <Spinner size={11} />
                    ) : socialVerified[key] === 'verified' ? <BadgeCheck size={12} /> : <Check size={12} />}
                    {socialVerified[key] === 'verified'
                      ? 'Verified'
                      : socialVerified[key] === 'unverifiable'
                        ? 'Self-reported'
                        : socialVerified[key] === 'failed'
                          ? 'Retry'
                          : 'Verify'}
                  </button>
                  {socialVerifyError[key] && (
                    <span style={{ fontSize: '0.64rem', color: 'var(--sell-red)', maxWidth: 180 }}>{socialVerifyError[key]}</span>
                  )}
                </div>
              )}
            </div>
            {socialVerified[key] === 'verified' && socialStats[key] ? (
              <div style={{
                background: 'var(--sell-green-bg)',
                border: '1px solid var(--sell-green)',
                borderRadius: 'var(--sell-radius-sm)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                width: '100%',
                boxSizing: 'border-box',
                marginTop: '2px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--sell-border)', paddingBottom: '6px', marginBottom: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BadgeCheck size={14} color="var(--sell-green)" />
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--sell-green)' }}>Verified Profile Details</span>
                  </div>
                  {socialStats[key].verified && (
                    <span style={{ background: 'var(--sell-accent)', color: '#fff', fontSize: '0.58rem', fontWeight: 700, padding: '2px 8px', borderRadius: '100px' }}>
                      Official Badge ✓
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {socialStats[key]?.name && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--sell-text-2)', fontWeight: 600 }}>
                      Name: <span style={{ color: 'var(--sell-text-1)', fontWeight: 700 }}>{socialStats[key]?.name}</span>
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '2px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--sell-text-2)' }}>
                      <strong>Followers:</strong> {formatCount(socialStats[key].followerCount || 0)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--sell-text-2)' }}>
                      <strong>Following:</strong> {formatCount(socialStats[key].followingCount || 0)}
                    </div>
                    {(socialStats[key]?.postsCount ?? 0) > 0 && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--sell-text-2)' }}>
                        <strong>Posts:</strong> {formatCount(socialStats[key]?.postsCount ?? 0)}
                      </div>
                    )}
                    {(socialStats[key]?.likesCount ?? 0) > 0 && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--sell-text-2)' }}>
                        <strong>Likes:</strong> {formatCount(socialStats[key]?.likesCount ?? 0)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ))}
        <p style={{ fontSize: '0.72rem', color: 'var(--sell-text-3)', margin: 0 }}>Type a username (e.g. <b>@yourhandle</b> or <b>yourhandle</b>) or paste a public profile URL, then press Verify. TikTok and Instagram are checked live via Apify and the real follower count is filled in; YouTube and X are self-reported. Instagram post/reel links fall back to a no-key existence check.</p>
      </Section>

      <button style={s.btnPrimary} onClick={handleSaveUgcProfile} disabled={savingUgc}>
        {savingUgc ? <Spinner size={14} color="#fff" /> : <Star size={14} />}
        {savingUgc ? 'Saving…' : ugcProfile ? 'Save Changes' : 'Apply as Creator'}
      </button>
    </div>
  );
}

/* ─── Ideas modal + loader ──────────────────────────────── */

function IdeasModal() {
  const { UGC } = useContentHub();
  const { ideasRequestId, setIdeasRequestId, generatedIdeas, setGeneratedIdeas } = UGC;
  if (!ideasRequestId || !generatedIdeas) return null;

  return (
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
          style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', color: 'var(--sell-text-3)' }}
          aria-label="Close content ideas"
        >
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
                  <span style={{ fontWeight: 700, color: 'var(--sell-accent)', marginRight: 8 }}>#{i + 1}</span>
                  <Md text={h} />
                </div>
              ))}
            </div>
          )}
          {generatedIdeas.contentAngles && (
            <div>
              <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--sell-text-2)', marginBottom: 6 }}>Content Angles</p>
              {generatedIdeas.contentAngles.map((a: any, i: number) => (
                <div key={i} style={{ padding: '10px 12px', background: 'var(--sell-bg)', borderRadius: 8, marginBottom: 6, border: '1px solid var(--sell-border-subtle)' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--sell-primary)', marginBottom: 4 }}><Md text={a.angle} /></div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--sell-text-2)', marginBottom: 4 }}><Md text={a.description} /></div>
                  {a.suggestedScript && <div style={{ fontSize: '0.75rem', color: 'var(--sell-text-3)', fontStyle: 'italic' }}><Md text={a.suggestedScript} /></div>}
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
              <div style={{ fontSize: '0.82rem', color: 'var(--sell-text-1)' }}><Md text={generatedIdeas.callToAction} /></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GeneratingLoader() {
  const { UGC } = useContentHub();
  const { generatingIdeas } = UGC;
  if (!generatingIdeas) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--sell-surface)', borderRadius: 'var(--sell-radius-lg)',
        padding: '32px 40px', textAlign: 'center',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', margin: '0 auto 12px' }}>
          <Spinner size={32} color="var(--sell-accent)" />
        </div>
        <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--sell-text-1)' }}>Generating content ideas...</p>
        <p style={{ fontSize: '0.78rem', color: 'var(--sell-text-3)' }}>Using AI to create video concepts from the brief</p>
      </div>
    </div>
  );
}

/* ─── Shared brand collaboration card ───────────────────── */

const ORDER_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  IN_PROGRESS: { label: 'In progress', color: 'var(--sell-primary)', bg: 'var(--sell-primary-lt)' },
  DRAFT_SUBMITTED: { label: 'Draft for review', color: 'var(--sell-amber)', bg: 'var(--sell-amber-bg)' },
  APPROVED: { label: 'Draft approved', color: 'var(--sell-green)', bg: 'var(--sell-green-bg)' },
  COMPLETED: { label: 'Final delivered', color: 'var(--sell-green)', bg: 'var(--sell-green-bg)' },
  DISPUTED: { label: 'Issue raised', color: 'var(--sell-red)', bg: 'var(--sell-red-bg)' },
  REJECTED: { label: 'Declined', color: 'var(--sell-red)', bg: 'var(--sell-red-bg)' },
  CANCELLED: { label: 'Cancelled', color: 'var(--sell-text-3)', bg: 'var(--sell-surface-2)' },
};

function StatusPill({ status }: { status?: string }) {
  const meta = ORDER_STATUS_META[status ?? ''] ?? {
    label: status ?? 'Active', color: 'var(--sell-primary)', bg: 'var(--sell-primary-lt)',
  };
  return (
    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: meta.bg, color: meta.color, whiteSpace: 'nowrap' as const }}>
      {meta.label}
    </span>
  );
}

function CollaborationCard({ order }: { order: any }) {
  const { user, currency, UGC } = useContentHub();
  const { showToast } = useSell();
  const { handleSubmitVideo, actionLoading } = UGC;
  const [draftUrl, setDraftUrl] = React.useState('');
  const [finalUrl, setFinalUrl] = React.useState('');
  const [uploading, setUploading] = React.useState<string | null>(null);

  const status = order.status as string;
  const paymentStatus = order.paymentStatus as string | undefined;
  const canSubmitDraft = status === 'IN_PROGRESS' && paymentStatus === 'DEPOSIT_HELD';
  const canSubmitFinal = status === 'DRAFT_SUBMITTED' || status === 'APPROVED';
  const isApproval = typeof order.review === 'string' && (order.review.startsWith('approved') || order.review.startsWith('draft approved'));
  const feedback = order.rejectionReason || order.disputeDescription || (!isApproval && order.review ? order.review : null);

  async function submit(type: 'draft' | 'final', url: string, setter: (v: string) => void) {
    const trimmed = url.trim();
    if (!trimmed) return;
    try {
      await handleSubmitVideo(order.id, type, trimmed);
      setter('');
    } catch { /* toast handled in context */ }
  }

  async function submitFile(type: 'draft' | 'final', file: File) {
    setUploading(type);
    try {
      const path = `ugc-videos/${user?.id || 'me'}/${order.id}/${type}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const url = await getStorage().upload(file, path);
      await handleSubmitVideo(order.id, type, url);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Video upload failed', 'error');
      console.error('[UGC] video upload failed:', err);
    } finally {
      setUploading(null);
    }
  }

  return (
    <div style={{ border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-lg)', background: 'var(--sell-surface)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--sell-border-subtle)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--sell-text-1)' }}>{order.productName || order.product || 'Brand brief'}</p>
          <p style={{ margin: '3px 0 0', fontSize: '0.74rem', color: 'var(--sell-text-3)' }}>
            {order.brand || order.brandName || 'Brand'} · {order.videoLength || '30s'} video
            {order.deadline ? ` · due ${new Date(order.deadline).toLocaleDateString()}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <StatusPill status={status} />
          <StatusPill status={paymentStatus} />
        </div>
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <p style={{ margin: '0 0 3px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--sell-text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Brief</p>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--sell-text-2)', lineHeight: 1.55 }}>{order.brief || '—'}</p>
        </div>
        <div>
          <p style={{ margin: '0 0 3px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--sell-text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Deliverables</p>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--sell-text-2)', lineHeight: 1.55 }}>{order.deliverables || '—'}</p>
        </div>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: '0.76rem', color: 'var(--sell-text-3)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Wallet size={12} /> Deposit {currency} {((order.depositAmount ?? 0) / 100).toLocaleString()}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Banknote size={12} /> Balance {currency} {((order.balanceAmount ?? 0) / 100).toLocaleString()}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--sell-green)', fontWeight: 700 }}>Your payout {currency} {((order.creatorPayout ?? 0) / 100).toLocaleString()}</span>
        </div>

        {feedback && (
          <div style={{ padding: '10px 12px', border: '1px solid var(--sell-amber)', borderRadius: 'var(--sell-radius-sm)', background: 'var(--sell-amber-bg)', fontSize: '0.76rem', color: 'var(--sell-amber)', display: 'flex', gap: 8 }}>
            <MessageSquare size={13} style={{ flexShrink: 0, marginTop: 2 }} />
            <span><strong>Brand feedback:</strong> {feedback}</span>
          </div>
        )}

        {isApproval && !feedback && (
          <div style={{ padding: '10px 12px', border: '1px solid var(--sell-green)', borderRadius: 'var(--sell-radius-sm)', background: 'var(--sell-green-bg)', fontSize: '0.76rem', color: 'var(--sell-green)', display: 'flex', gap: 8 }}>
            <Check size={13} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{order.review}</span>
          </div>
        )}

        {order.draftVideoUrl && (
          <a href={order.draftVideoUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.76rem', color: 'var(--sell-primary)', width: 'fit-content' }}>
            <Video size={13} /> View submitted draft <ExternalLink size={11} />
          </a>
        )}
        {order.finalVideoUrl && (
          <a href={order.finalVideoUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.76rem', color: 'var(--sell-green)', width: 'fit-content' }}>
            <Video size={13} /> View delivered final video <ExternalLink size={11} />
          </a>
        )}

        {canSubmitDraft && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              style={{ ...s.formInput, flex: 1, minWidth: 200 }}
              value={draftUrl}
              onChange={(e) => setDraftUrl(e.target.value)}
              placeholder="Paste your draft video link (Drive / YouTube / upload URL)"
            />
            <button
              style={{ ...s.btnPrimary, fontSize: '0.76rem', padding: '8px 12px' }}
              disabled={actionLoading === `draft-${order.id}`}
              onClick={() => submit('draft', draftUrl, setDraftUrl)}
            >
              {actionLoading === `draft-${order.id}` ? <Spinner size={12} /> : <Send size={12} />}
              Submit draft
            </button>
          </div>
        )}
        {canSubmitDraft && (
          <label style={{ ...s.btnGhost, fontSize: '0.74rem', padding: '7px 12px', width: 'fit-content', cursor: 'pointer' }}>
            {uploading === 'draft' ? <Spinner size={12} /> : <Upload size={12} />}
            {uploading === 'draft' ? 'Uploading…' : 'Or upload a video file'}
            <input
              type="file"
              accept="video/*"
              style={{ display: 'none' }}
              disabled={uploading !== null}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) submitFile('draft', file);
                e.target.value = '';
              }}
            />
          </label>
        )}

        {canSubmitFinal && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              style={{ ...s.formInput, flex: 1, minWidth: 200 }}
              value={finalUrl}
              onChange={(e) => setFinalUrl(e.target.value)}
              placeholder="Paste the final video link for the brand"
            />
            <button
              style={{ ...s.btnPrimary, fontSize: '0.76rem', padding: '8px 12px' }}
              disabled={
                actionLoading === `final-${order.id}` ||
                (paymentStatus !== 'PENDING_BALANCE' && paymentStatus !== 'PAID_OUT')
              }
              title={paymentStatus !== 'PENDING_BALANCE' && paymentStatus !== 'PAID_OUT' ? 'Waiting for the brand to pay the balance' : undefined}
              onClick={() => submit('final', finalUrl, setFinalUrl)}
            >
              {actionLoading === `final-${order.id}` ? <Spinner size={12} /> : <Send size={12} />}
              Submit final
            </button>
          </div>
        )}
        {canSubmitFinal && (paymentStatus === 'PENDING_BALANCE' || paymentStatus === 'PAID_OUT') && (
          <label style={{ ...s.btnGhost, fontSize: '0.74rem', padding: '7px 12px', width: 'fit-content', cursor: 'pointer' }}>
            {uploading === 'final' ? <Spinner size={12} /> : <Upload size={12} />}
            {uploading === 'final' ? 'Uploading…' : 'Or upload the final file'}
            <input
              type="file"
              accept="video/*"
              style={{ display: 'none' }}
              disabled={uploading !== null}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) submitFile('final', file);
                e.target.value = '';
              }}
            />
          </label>
        )}
        {canSubmitFinal && paymentStatus !== 'PENDING_BALANCE' && paymentStatus !== 'PAID_OUT' && (
          <p style={{ margin: '-4px 0 0', fontSize: '0.72rem', color: 'var(--sell-text-3)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Clock size={11} /> Final delivery unlocks once the brand pays the balance.
          </p>
        )}

        {order.paymentStatus === 'PAID_OUT' && (
          <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--sell-green)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Banknote size={13} /> Payout released{order.paystackTransferCode ? ` · ${order.paystackTransferCode}` : ''}
          </p>
        )}
        {order.status === 'DISPUTED' && (
          <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--sell-red)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <AlertCircle size={13} /> An issue was raised — check the brand feedback above.
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Dashboard ─────────────────────────────────────────── */

function UgcDashboard() {
  const { user, currency, UGC } = useContentHub();
  const {
    ugcProfile, ugcRequests, ugcOrders, ugcActionLoading,
    linkCopied, setLinkCopied,
    handleToggleUgcVisibility, handleDeleteUgcProfile,
    ideasRequestId, setIdeasRequestId, generatedIdeas, setGeneratedIdeas,
    actionLoading, generatingIdeas, handleGenerateIdeas, handleAcceptRequest, handleRejectRequest,
  } = UGC;

  return (
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

      {/* Visibility + Delete Controls */}
      {ugcProfile && (
        <>
          {ugcProfile.isActive === false && (
            <div style={{ padding: '10px 14px', border: '1px solid var(--sell-amber)', borderRadius: 'var(--sell-radius-sm)', background: 'var(--sell-amber-bg)', fontSize: '0.78rem', color: 'var(--sell-amber)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <EyeOff size={13} />
                Your profile is hidden from the marketplace.
              </span>
              <button
                onClick={handleToggleUgcVisibility}
                disabled={ugcActionLoading === 'visibility'}
                style={{ ...s.btnSecondary, fontSize: '0.72rem', padding: '5px 10px' }}
              >
                Make Public
              </button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={handleToggleUgcVisibility}
              disabled={ugcActionLoading === 'visibility'}
              style={{ ...s.btnGhost, fontSize: '0.75rem', padding: '7px 12px' }}
            >
              {ugcActionLoading === 'visibility' ? <Spinner size={12} /> : ugcProfile.isActive === false ? <Eye size={12} /> : <EyeOff size={12} />}
              {ugcProfile.isActive === false ? 'Make Public' : 'Hide Profile'}
            </button>
            <button
              onClick={handleDeleteUgcProfile}
              disabled={ugcActionLoading === 'delete'}
              style={{ ...s.btnGhost, fontSize: '0.75rem', padding: '7px 12px', color: 'var(--sell-red)', borderColor: 'var(--sell-red)' }}
            >
              {ugcActionLoading === 'delete' ? <Spinner size={12} /> : <Trash2 size={12} />}
              Delete Profile
            </button>
          </div>
        </>
      )}

      {/* Earnings Summary */}
      {(ugcOrders.length > 0 || ugcRequests.length > 0) && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 150, padding: '14px 16px', border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', background: 'var(--sell-bg)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--sell-text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Requests</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--sell-primary)' }}>{ugcRequests.length}</p>
          </div>
          <div style={{ flex: 1, minWidth: 150, padding: '14px 16px', border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', background: 'var(--sell-bg)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--sell-text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Orders</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--sell-accent)' }}>{ugcOrders.filter(o => ['IN_PROGRESS', 'DRAFT_SUBMITTED', 'APPROVED'].includes(o.status || '')).length}</p>
          </div>
          <div style={{ flex: 1, minWidth: 150, padding: '14px 16px', border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', background: 'var(--sell-bg)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--sell-text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Earnings</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--sell-green)' }}>{currency} {ugcOrders.reduce((sum, o) => sum + ((o.creatorPayout ?? 0) / 100), 0).toLocaleString()}</p>
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
                              border: '1px solid var(--sell-red)', borderRadius: 6,
                              background: 'var(--sell-red-bg)', cursor: 'pointer',
                              fontSize: '0.7rem', fontWeight: 600, color: 'var(--sell-red)',
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

      {/* Shared collaborations with brands */}
      {ugcOrders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--sell-text-2)', marginBottom: 0 }}>Collaborations</p>
          {ugcOrders.map(order => <CollaborationCard key={order.id} order={order} />)}
        </div>
      )}

      {/* Empty state */}
      {ugcRequests.length === 0 && ugcOrders.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '40px 20px', color: 'var(--sell-text-3)', textAlign: 'center' }}>
          <Users size={40} style={{ opacity: 0.3 }} />
          <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--sell-text-2)' }}>No activity yet</p>
          <p style={{ fontSize: '0.85rem', maxWidth: 340 }}>Your dashboard will show incoming requests, active orders, and earnings once brands start reaching out.</p>
        </div>
      )}

      <IdeasModal />
      <GeneratingLoader />
    </div>
  );
}

/* ─── Tab root ──────────────────────────────────────────── */

export function UgcTab() {
  const { UGC } = useContentHub();
  const { ugcView, setUgcView, ugcProfile, loadingUgcData } = UGC;

  return (
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
        {loadingUgcData && !ugcProfile ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, color: 'var(--sell-text-3)', fontSize: '0.85rem', gap: 8 }}>
            <Spinner size={18} />
            Loading profile…
          </div>
        ) : ugcView === 'apply' ? (
          <UgcApplyForm />
        ) : (
          <UgcDashboard />
        )}
      </div>
    </div>
  );
}
