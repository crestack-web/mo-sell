'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getDatabase } from '@/lib/database/adapter';
import { getStorage } from '@/lib/storage/adapter';
import { supabaseClient } from '@/lib/supabase-client';
import { useSell } from '@/context/SellContext';
import { THEMES, resolveLinkBioTheme } from '@/themes/registry';
import { getThemeCssVars } from '@/components/theme-css-vars';
import type { ProductCardData } from '@/themes/types';
import { getLinkBioLayout, type CustomLink } from '@/app/store/[storeSlug]/components/layouts/index';
import { ExternalLink, Eye, EyeOff, X, Pencil, Instagram, Twitter, Youtube, Music2, MessageCircle } from 'lucide-react';
import styles from './LinkInBioEditor.module.css';

type DisplayType = 'button' | 'callout' | 'minimal';
type BgType = 'solid' | 'gradient' | 'image' | 'pattern';
type ProductRow = ProductCardData & { description?: string; digitalFileUrl?: string | null };

interface LinkBioForm {
  avatarUrl: string | null;
  name: string;
  bio: string;
  socials: { platform: string; url: string }[];
  displayType: DisplayType;
  backgroundType: BgType;
  backgroundValue: string;
  productVisibility: Record<string, boolean>;
  productDisplayTypes: Record<string, DisplayType>;
  customLinks: CustomLink[];
  productOrder: string[];
}

const DISPLAY_TYPES: DisplayType[] = ['button', 'callout', 'minimal'];
const BG_TYPES: BgType[] = ['solid', 'gradient', 'image', 'pattern'];
const SOCIAL_PLATFORMS = ['instagram', 'tiktok', 'twitter', 'youtube', 'whatsapp'];
const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  instagram: <Instagram size={18} style={{ color: '#E4405F' }} />,
  twitter: <Twitter size={18} style={{ color: '#1DA1F2' }} />,
  youtube: <Youtube size={18} style={{ color: '#FF0000' }} />,
  tiktok: <Music2 size={18} style={{ color: '#010101' }} />,
  whatsapp: <MessageCircle size={18} style={{ color: '#25D366' }} />,
};
const SOCIAL_PLACEHOLDERS: Record<string, string> = {
  instagram: '@username', tiktok: '@username', twitter: '@username', youtube: '@username', whatsapp: 'phone number',
};
const SOLID_COLORS = ['#0A0A0A', '#0F172A', '#1E293B', '#111827', '#FFFFFF', '#F9FAFB', '#FFF7ED', '#ECFDF5', '#F0F9FF'];
const GRADIENTS = [
  'linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)',
  'linear-gradient(135deg, #4F46E5 0%, #DB2777 100%)',
  'linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)',
  'linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)',
  'linear-gradient(135deg, #059669 0%, #0EA5E9 100%)',
  'linear-gradient(135deg, #111827 0%, #374151 100%)',
];
function newLinkId(): string {
  return `cl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function LinkInBioEditor() {
  const { user, storeConfig, storeConfigLoading, refreshStoreConfig, showToast } = useSell();
  const [form, setForm] = useState<LinkBioForm | null>(null);
  const [theme, setTheme] = useState<string>('ankara');
  const [tab, setTab] = useState<'profile' | 'design' | 'products' | 'links'>('profile');
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false);

  useEffect(() => {
    if (storeConfigLoading) return;
    const lb = (storeConfig as any)?.linkBio;
    setForm({
      avatarUrl: lb?.avatarUrl ?? null,
      name: lb?.name ?? storeConfig?.storeName ?? '',
      bio: lb?.bio ?? (storeConfig as any)?.tagline ?? '',
      socials: Array.isArray(lb?.socials) ? lb.socials : [],
      displayType: lb?.displayType ?? 'button',
      backgroundType: lb?.backgroundType ?? 'solid',
      backgroundValue: lb?.backgroundValue ?? '#0A0A0A',
      productVisibility: lb?.productVisibility ?? {},
      productDisplayTypes: lb?.productDisplayTypes ?? {},
      customLinks: Array.isArray(lb?.customLinks) ? lb.customLinks : [],
      productOrder: Array.isArray(lb?.productOrder) ? lb.productOrder : [],
    });
    setAvatarPreview(lb?.avatarUrl ?? null);
    setTheme(resolveLinkBioTheme(storeConfig?.theme, (storeConfig as any)?.linkBioTheme));
    setDirty(false);
  }, [storeConfig, storeConfigLoading]);

  const loadProducts = useCallback(() => {
    if (!user?.businessId) return;
    setProductsLoading(true);
    setProductsError(false);
    fetch(`/api/store/products?businessId=${user.businessId}&available=true`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => setProducts((d.products ?? []).map((p: any): ProductRow => ({
        id: p.id,
        displayName: p.displayName ?? 'Untitled',
        price: Number(p.price ?? 0),
        compareAtPrice: p.compareAtPrice ?? null,
        images: Array.isArray(p.images) ? p.images : [],
        category: p.category ?? '',
        available: p.available !== false,
        stock: p.stock ?? 0,
        productType: p.productType ?? 'physical',
        description: p.description,
        digitalFileUrl: p.digitalFileUrl ?? null,
      }))))
      .catch(() => { setProducts([]); setProductsError(true); })
      .finally(() => setProductsLoading(false));
  }, [user?.businessId]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const themeFont = THEMES.find(t => t.id === theme)?.previewFont ?? null;
  useEffect(() => {
    if (!themeFont) return;
    const fontKey = themeFont.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (document.getElementById(`linkbio-font-${fontKey}`)) return;
    const link = document.createElement('link');
    link.id = `linkbio-font-${fontKey}`;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(themeFont)}:wght@400;500;600;700;800&display=swap`;
    document.head.appendChild(link);
  }, [themeFont]);

  const setField = (patch: Partial<LinkBioForm>) => {
    setForm(f => (f ? { ...f, ...patch } : f));
    setDirty(true);
  };

  const orderedAll = useMemo(() => {
    if (!form) return [] as ProductRow[];
    const po = form.productOrder.length > 0 ? form.productOrder : products.map(p => p.id);
    const sorted = po.map(id => products.find(p => p.id === id)).filter(Boolean) as ProductRow[];
    const rest = products.filter(p => !po.includes(p.id));
    return [...sorted, ...rest];
  }, [products, form?.productOrder]);

  const visibleProducts = useMemo(() => {
    if (!form) return [] as ProductRow[];
    return orderedAll.filter(p => form.productVisibility[p.id] !== false);
  }, [orderedAll, form?.productVisibility]);

  async function handleSave() {
    if (!user?.businessId || !form) return;
    setSaving(true);
    try {
      let avatarUrl = form.avatarUrl;
      if (avatarFile) {
        const storage = getStorage();
        const path = `link-bio/${user.businessId}/avatar_${Date.now()}_${avatarFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        avatarUrl = await storage.upload(avatarFile, path);
      }
      const cleanedSocials = (form.socials || [])
        .map(s => ({ platform: (s.platform || 'instagram').toLowerCase().trim(), url: (s.url || '').trim() }))
        .filter(s => !!s.url);
      const linkBio = {
        ...form,
        avatarUrl,
        name: (form.name || '').trim(),
        bio: (form.bio || '').trim(),
        description: (form.bio || '').trim(),
        socials: cleanedSocials,
        updatedAt: new Date().toISOString(),
      };
      const patch: Record<string, unknown> = {
        linkBio,
        tagline: linkBio.bio || null,
        updatedAt: new Date().toISOString(),
      };
      if (linkBio.name) patch.storeName = linkBio.name;
      let saved = false;
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session?.access_token) {
          const res = await fetch('/api/store/config', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ businessId: user.businessId, patch }),
          });
          const body = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(body.error || `Save failed (${res.status})`);
          saved = true;
        }
      } catch (apiErr: any) {
        console.warn('[LinkInBio] API save failed, falling back:', apiErr);
      }
      if (!saved) {
        const db = getDatabase();
        await db.doc(`businesses/${user.businessId}/store/config`).set(patch, { merge: true });
      }
      setField({ avatarUrl, socials: cleanedSocials, name: linkBio.name, bio: linkBio.bio });
      setAvatarFile(null);
      await refreshStoreConfig();
      setDirty(false);
      showToast('Link-in-bio saved', 'success');
    } catch (err: any) {
      console.error('[LinkInBio] save failed:', err);
      showToast(err?.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  const handleThemeSelect = async (themeId: string) => {
    if (!user?.businessId || themeId === theme) return;
    try {
      const patch = { linkBioTheme: themeId, updatedAt: new Date().toISOString() };
      let saved = false;
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session?.access_token) {
          const res = await fetch('/api/store/config', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ businessId: user.businessId, patch }),
          });
          if (res.ok) saved = true;
        }
      } catch { /* fallback */ }
      if (!saved) {
        const db = getDatabase();
        await db.doc(`businesses/${user.businessId}/store/config`).set(patch, { merge: true });
      }
      setTheme(themeId);
      setDirty(true);
      showToast(`Switched to "${THEMES.find(t => t.id === themeId)?.name}"`, 'success');
    } catch {
      showToast('Failed to switch theme', 'error');
    }
  };

  const setProductVisibility = (id: string) => {
    if (!form) return;
    const current = form.productVisibility[id] !== false;
    setField({ productVisibility: { ...form.productVisibility, [id]: !current } });
  };

  const setProductDisplay = (id: string, type: DisplayType) => {
    if (!form) return;
    setField({ productDisplayTypes: { ...form.productDisplayTypes, [id]: type } });
  };

  const moveProduct = (id: string, dir: -1 | 1) => {
    if (!form) return;
    const arr = [...form.productOrder];
    if (arr.length === 0) arr.push(...products.map(p => p.id));
    const i = arr.indexOf(id);
    const t = i + dir;
    if (i < 0 || t < 0 || t >= arr.length) return;
    [arr[i], arr[t]] = [arr[t], arr[i]];
    setField({ productOrder: arr });
  };

  const addCustomLink = () => {
    if (!form) return;
    setField({ customLinks: [...form.customLinks, { id: newLinkId(), label: '', url: '' }] });
  };

  const updateCustomLink = (id: string, patch: Partial<CustomLink>) => {
    if (!form) return;
    setField({ customLinks: form.customLinks.map(cl => (cl.id === id ? { ...cl, ...patch } : cl)) });
  };

  const removeCustomLink = (id: string) => {
    if (!form) return;
    setField({ customLinks: form.customLinks.filter(cl => cl.id !== id) });
  };

  if (!form) {
    return <div className={styles.loading}>Loading editor…</div>;
  }

  const bioUrl = storeConfig?.storeSlug ? `/${storeConfig.storeSlug}` : '#';
  const Layout = getLinkBioLayout(theme);
  const primary = storeConfig?.primaryColor ?? '#0EA5E9';
  const secondary = storeConfig?.secondaryColor ?? '#6366F1';
  const themeVars = getThemeCssVars(theme as any, primary, secondary);

  // Match live LinkBioPage light/dark + background logic
  const LIGHT_BGS = ['#FFFFFF', '#F9FAFB', '#FFF7ED', '#ECFDF5', '#F0F9FF', '#FFC93C', '#EDE7D9'];
  const bgType = form.backgroundType || 'solid';
  const bgValue = form.backgroundValue || '#0A0A0A';
  const isLightBg = bgType === 'solid' && LIGHT_BGS.includes(bgValue);
  const textColor = isLightBg ? '#0f172a' : '#fff';
  const textColor2 = isLightBg ? '#64748b' : 'rgba(255,255,255,0.7)';
  const textColor3 = isLightBg ? '#94a3b8' : 'rgba(255,255,255,0.4)';
  const isDefaultSolid = bgType === 'solid' && (!bgValue || bgValue === '#0A0A0A');
  const previewBgStyle: React.CSSProperties =
    bgType === 'image' || bgType === 'pattern'
      ? { backgroundColor: '#111' }
      : isDefaultSolid
        ? { background: 'var(--sf-bg, #0A0A0A)' }
        : { background: bgValue };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Link in Bio</h2>
          <p className={styles.sub}>Design your page — profile, theme, products, and links</p>
        </div>
        {storeConfig?.storeSlug && (
          <a href={bioUrl} target="_blank" rel="noopener noreferrer" className={styles.viewLive}>
            View live page <ExternalLink size={14} />
          </a>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.previewCol}>
          <div className={styles.phoneFrame}>
            <div className={styles.phoneScreen} style={{ ...themeVars, ...previewBgStyle } as React.CSSProperties}>
              {bgType === 'image' && bgValue ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bgValue} alt="" className={styles.bgImg} />
              ) : null}
              {bgType === 'pattern' && bgValue ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bgValue} alt="" className={styles.bgImg} style={{ opacity: 0.15 }} />
              ) : null}
              <div style={{ position: 'relative', zIndex: 1, width: '100%', minHeight: '100%' }}>
                {Layout ? (
                  <Layout
                    config={{
                      storeSlug: storeConfig?.storeSlug ?? '',
                      storeName: form.name || storeConfig?.storeName || 'Store',
                      logoUrl: form.avatarUrl,
                      primaryColor: primary,
                      secondaryColor: secondary,
                      currency: storeConfig?.currency ?? 'NGN',
                      tagline: form.bio,
                      contactEmail: '',
                      contactPhone: '',
                      paystackPublicKey: '',
                    }}
                    bio={{
                      avatarUrl: avatarPreview || form.avatarUrl,
                      name: form.name,
                      bio: form.bio,
                      socials: form.socials.filter(s => s.url),
                      displayType: form.displayType,
                      backgroundType: form.backgroundType,
                      backgroundValue: form.backgroundValue,
                      customLinks: form.customLinks.filter(cl => cl.label && cl.url),
                      productDisplayTypes: form.productDisplayTypes,
                    }}
                    visibleProducts={visibleProducts as any}
                    isLightBg={isLightBg}
                    textColor={textColor}
                    textColor2={textColor2}
                    textColor3={textColor3}
                    onProductClick={() => {}}
                  />
                ) : (
                  <div style={{ padding: 24, textAlign: 'center', color: textColor }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>{form.name || 'Your name'}</div>
                    <div style={{ fontSize: 13, opacity: 0.8 }}>{form.bio || 'Your bio'}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={[styles.editorCol, mobileEditorOpen ? styles.editorColOpen : ''].join(' ')}>
          <div className={styles.editorTabs}>
            {(['profile', 'design', 'products', 'links'] as const).map(t => (
              <button
                key={t}
                type="button"
                className={[styles.editorTab, tab === t ? styles.editorTabActive : ''].join(' ')}
                onClick={() => setTab(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
            <button type="button" className={styles.mobileClose} onClick={() => setMobileEditorOpen(false)} aria-label="Close">
              <X size={16} />
            </button>
          </div>

          <div className={styles.editorContent}>
            {tab === 'profile' && (
              <div className={styles.tabContent}>
                <div className={styles.field}>
                  <label className={styles.fLabel}>Profile picture</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
                    <div className={styles.pAvatar}>
                      {(avatarPreview || form.avatarUrl) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className={styles.pAvatarImg} src={avatarPreview || form.avatarUrl || ''} alt="" />
                      ) : (
                        <div className={styles.pAvatarPlaceholder}>{(form.name || 'M').charAt(0).toUpperCase()}</div>
                      )}
                    </div>
                    <input
                      className={styles.fileInput}
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setAvatarFile(file);
                        setDirty(true);
                        const reader = new FileReader();
                        reader.onloadend = () => setAvatarPreview(reader.result as string);
                        reader.readAsDataURL(file);
                      }}
                    />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.fLabel}>Name</label>
                  <input className={styles.fInput} value={form.name} onChange={e => setField({ name: e.target.value })} placeholder="Your name" />
                </div>
                <div className={styles.field}>
                  <label className={styles.fLabel}>Bio / description</label>
                  <textarea className={styles.fTextarea} rows={3} value={form.bio} onChange={e => setField({ bio: e.target.value })} placeholder="Tell people who you are..." />
                </div>
                <div className={styles.field}>
                  <label className={styles.fLabel}>Social links</label>
                  {form.socials.map((s, i) => (
                    <div key={i} className={styles.socialRow}>
                      <select
                        className={styles.fSelect}
                        value={s.platform}
                        onChange={e => {
                          const next = [...form.socials];
                          next[i] = { ...next[i], platform: e.target.value };
                          setField({ socials: next });
                        }}
                        style={{ width: 110 }}
                      >
                        {SOCIAL_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <input
                        className={styles.fInput}
                        value={s.url}
                        onChange={e => {
                          const next = [...form.socials];
                          next[i] = { ...next[i], url: e.target.value };
                          setField({ socials: next });
                        }}
                        placeholder={SOCIAL_PLACEHOLDERS[s.platform] ?? '@username'}
                      />
                      <button type="button" className={styles.iconBtn} onClick={() => setField({ socials: form.socials.filter((_, j) => j !== i) })}>
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                  <button type="button" className={styles.addBtn} onClick={() => setField({ socials: [...form.socials, { platform: 'instagram', url: '' }] })}>
                    + Add social
                  </button>
                </div>
              </div>
            )}

            {tab === 'design' && (
              <div className={styles.tabContent}>
                <div className={styles.field}>
                  <label className={styles.fLabel}>Theme</label>
                  <div className={styles.themeGrid}>
                    {THEMES.filter(t => t.type === 'link-style').slice(0, 24).map(t => {
                      const isActive = theme === t.id;
                      const accent = t.previewAccent || '#0EA5E9';
                      const bg = t.previewBg || '#0A0A0A';
                      const LIGHT_MOCK_BGS = new Set(['#FFFFFF', '#F9FAFB', '#FFF7ED', '#ECFDF5', '#F0F9FF', '#FFC93C', '#EDE7D9', '#E5E3DE', '#FFF4DE', '#F7F5F0', '#F1EEE4', '#F5F5F4']);
                      const lightMock = LIGHT_MOCK_BGS.has(bg.toUpperCase()) || LIGHT_MOCK_BGS.has(bg);
                      const mockText = lightMock ? '#0f172a' : '#FFFFFF';
                      const mockMuted = lightMock ? 'rgba(15,23,42,0.45)' : 'rgba(255,255,255,0.55)';
                      return (
                        <button
                          key={t.id}
                          type="button"
                          className={[styles.themeCard, isActive ? styles.themeCardActive : ''].join(' ')}
                          onClick={() => handleThemeSelect(t.id)}
                          title={t.description || t.name}
                        >
                          <div
                            className={styles.themeMock}
                            style={{
                              background: bg,
                              fontFamily: t.previewFont ? `${t.previewFont}, system-ui, sans-serif` : undefined,
                            }}
                          >
                            <div className={styles.themeMockAvatar} style={{ background: accent, boxShadow: `0 0 0 2px ${accent}55` }} />
                            <div className={styles.themeMockName} style={{ color: mockText }}>{t.name.split(' ')[0]}</div>
                            <div className={styles.themeMockLine} style={{ background: mockMuted }} />
                            <div className={styles.themeMockBtns}>
                              <span className={styles.themeMockBtn} style={{ background: accent, color: lightMock ? '#0f172a' : '#fff' }} />
                              <span className={styles.themeMockBtn} style={{ background: lightMock ? 'rgba(15,23,42,0.12)' : 'rgba(255,255,255,0.18)' }} />
                              <span className={styles.themeMockBtn} style={{ background: lightMock ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.12)' }} />
                            </div>
                            {t.badge ? (
                              <span className={styles.themeMockBadge} style={{ color: t.badge.color, background: t.badge.bg }}>{t.badge.label}</span>
                            ) : null}
                          </div>
                          <span className={styles.themeName}>{t.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.fLabel}>Product display style</label>
                  <div className={styles.chipRow}>
                    {DISPLAY_TYPES.map(dt => (
                      <button key={dt} type="button" className={[styles.chip, form.displayType === dt ? styles.chipActive : ''].join(' ')} onClick={() => setField({ displayType: dt })}>
                        {dt}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.fLabel}>Background</label>
                  <div className={styles.chipRow}>
                    {BG_TYPES.map(bt => (
                      <button key={bt} type="button" className={[styles.chip, form.backgroundType === bt ? styles.chipActive : ''].join(' ')} onClick={() => setField({ backgroundType: bt })}>
                        {bt}
                      </button>
                    ))}
                  </div>
                  {form.backgroundType === 'solid' && (
                    <div className={styles.colorRow}>
                      {SOLID_COLORS.map(c => (
                        <button key={c} type="button" className={styles.colorSwatch} style={{ background: c, outline: form.backgroundValue === c ? '2px solid var(--sell-primary)' : undefined }} onClick={() => setField({ backgroundValue: c })} />
                      ))}
                    </div>
                  )}
                  {form.backgroundType === 'gradient' && (
                    <div className={styles.colorRow}>
                      {GRADIENTS.map(g => (
                        <button key={g} type="button" className={styles.colorSwatch} style={{ background: g, width: 48, outline: form.backgroundValue === g ? '2px solid var(--sell-primary)' : undefined }} onClick={() => setField({ backgroundValue: g })} />
                      ))}
                    </div>
                  )}
                  {(form.backgroundType === 'image' || form.backgroundType === 'pattern') && (
                    <input className={styles.fInput} value={form.backgroundValue} onChange={e => setField({ backgroundValue: e.target.value })} placeholder="Image URL or CSS value" />
                  )}
                </div>
              </div>
            )}

            {tab === 'products' && (
              <div className={styles.tabContent}>
                <p className={styles.tabDesc}>Choose how each product looks and whether it appears on your link-in-bio page.</p>
                {productsLoading && <p className={styles.fHint}>Loading products…</p>}
                {productsError && (
                  <div>
                    <p className={styles.fHint}>Could not load products.</p>
                    <button type="button" className={styles.retryBtn} onClick={loadProducts}>Retry</button>
                  </div>
                )}
                {!productsLoading && !productsError && orderedAll.length === 0 && (
                  <p className={styles.fHint}>No products yet. Add products in the Products page first.</p>
                )}
                {orderedAll.map((p, idx) => {
                  const visible = form.productVisibility[p.id] !== false;
                  const display = form.productDisplayTypes[p.id] || form.displayType;
                  return (
                    <div key={p.id} className={styles.productRow}>
                      <div className={styles.productRowMain}>
                        <span className={styles.productName}>{p.displayName}</span>
                        <div className={styles.productActions}>
                          <button type="button" className={styles.iconBtn} onClick={() => moveProduct(p.id, -1)} disabled={idx === 0} aria-label="Move up">↑</button>
                          <button type="button" className={styles.iconBtn} onClick={() => moveProduct(p.id, 1)} disabled={idx === orderedAll.length - 1} aria-label="Move down">↓</button>
                          <button type="button" className={styles.iconBtn} onClick={() => setProductVisibility(p.id)} aria-label={visible ? 'Hide' : 'Show'}>
                            {visible ? <Eye size={15} /> : <EyeOff size={15} />}
                          </button>
                        </div>
                      </div>
                      {visible && (
                        <div className={styles.chipRow}>
                          {DISPLAY_TYPES.map(dt => (
                            <button key={dt} type="button" className={[styles.chip, display === dt ? styles.chipActive : ''].join(' ')} onClick={() => setProductDisplay(p.id, dt)}>
                              {dt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {tab === 'links' && (
              <div className={styles.tabContent}>
                <p className={styles.tabDesc}>Add external links (website, Telegram, booking page, etc.) shown alongside your products.</p>
                {form.customLinks.map(cl => (
                  <div key={cl.id} className={styles.linkRow}>
                    <input className={styles.fInput} value={cl.label} onChange={e => updateCustomLink(cl.id, { label: e.target.value })} placeholder="Label" />
                    <input className={styles.fInput} value={cl.url} onChange={e => updateCustomLink(cl.id, { url: e.target.value })} placeholder="https://..." />
                    <button type="button" className={styles.iconBtn} onClick={() => removeCustomLink(cl.id)}><X size={15} /></button>
                  </div>
                ))}
                <button type="button" className={styles.addBtn} onClick={addCustomLink}>+ Add link</button>
              </div>
            )}
          </div>

          <div className={styles.saveRow}>
            <button type="button" className={styles.viewBtn} onClick={() => storeConfig?.storeSlug && window.open(bioUrl, '_blank')}>
              <ExternalLink size={14} /> View
            </button>
            <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={saving || !dirty}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <button type="button" className={styles.mobileFab} onClick={() => setMobileEditorOpen(true)} style={{ display: mobileEditorOpen ? 'none' : undefined }}>
        <Pencil size={14} /> Edit
      </button>
    </div>
  );
}

export default LinkInBioEditor;
