'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getDatabase } from '@/lib/database/adapter';
import { getStorage } from '@/lib/storage/adapter';
import { useSell } from '@/context/SellContext';
import { THEMES } from '@/themes/registry';
import type { ProductCardData } from '@/themes/types';
import { getLinkBioLayout, type CustomLink } from '@/app/[storeSlug]/components/layouts/index';
import { ExternalLink, GripVertical, Eye, EyeOff, X } from 'lucide-react';
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
  const [theme, setTheme] = useState<string>('glow');
  const [tab, setTab] = useState<'profile' | 'design' | 'products' | 'links'>('profile');
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (storeConfigLoading) return;
    const lb = (storeConfig as any)?.linkBio;
    setForm({
      avatarUrl: lb?.avatarUrl ?? null,
      name: lb?.name ?? storeConfig?.storeName ?? '',
      bio: lb?.bio ?? '',
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
    setTheme((storeConfig as any)?.theme ?? 'glow');
    setDirty(false);
  }, [storeConfig, storeConfigLoading]);

  useEffect(() => {
    if (!user?.businessId) return;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    fetch(`${baseUrl}/api/store/products?businessId=${user.businessId}&available=true`)
      .then(r => (r.ok ? r.json() : { products: [] }))
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
      .catch(() => setProducts([]));
  }, [user?.businessId]);

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
      const db = getDatabase();
      let avatarUrl = form.avatarUrl;
      if (avatarFile) {
        const storage = getStorage();
        const path = `link-bio/${user.businessId}/avatar_${Date.now()}_${avatarFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        avatarUrl = await storage.upload(avatarFile, path);
      }
      await db.doc(`businesses/${user.businessId}/store/config`).set({
        linkBio: {
          ...form,
          avatarUrl,
          updatedAt: new Date().toISOString(),
        },
      }, { merge: true });
      await refreshStoreConfig();
      setDirty(false);
      showToast('Link-in-bio saved', 'success');
    } catch {
      showToast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  const handleThemeSelect = async (themeId: string) => {
    if (!user?.businessId || themeId === theme) return;
    try {
      const db = getDatabase();
      await db.doc(`businesses/${user.businessId}/store/config`).set(
        { theme: themeId, updatedAt: new Date().toISOString() },
        { merge: true }
      );
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

  const updateSocial = (i: number, patch: Partial<{ platform: string; url: string }>) => {
    if (!form) return;
    const socials = [...form.socials];
    socials[i] = { ...socials[i], ...patch };
    setField({ socials });
  };

  const addSocial = () => {
    if (!form) return;
    setField({ socials: [...form.socials, { platform: 'instagram', url: '' }] });
  };

  const updateCustomLink = (id: string, patch: Partial<CustomLink>) => {
    if (!form) return;
    setField({ customLinks: form.customLinks.map(cl => (cl.id === id ? { ...cl, ...patch } : cl)) });
  };

  if (!form) return <div className={styles.loading}>Loading...</div>;

  const storeName = storeConfig?.storeName ?? 'Your Store';
  const config = {
    storeSlug: storeConfig?.storeSlug ?? '',
    storeName,
    logoUrl: storeConfig?.logoUrl ?? null,
    primaryColor: storeConfig?.primaryColor ?? '#0EA5E9',
    secondaryColor: storeConfig?.secondaryColor ?? '#6366F1',
    currency: storeConfig?.currency ?? 'NGN',
    tagline: storeConfig?.tagline ?? null,
    contactEmail: storeConfig?.contactEmail ?? '',
    contactPhone: storeConfig?.contactPhone ?? '',
    paystackPublicKey: (storeConfig as any)?.paystackPublicKey ?? '',
  };

  const isLightBg = form.backgroundType === 'solid' && ['#FFFFFF', '#F9FAFB', '#FFF7ED', '#ECFDF5', '#F0F9FF'].includes(form.backgroundValue);
  const text1 = isLightBg ? '#0f172a' : '#ffffff';
  const text2 = isLightBg ? '#64748b' : 'rgba(255,255,255,0.7)';
  const text3 = isLightBg ? '#94a3b8' : 'rgba(255,255,255,0.4)';

  const bgStyle: React.CSSProperties =
    form.backgroundType === 'image' || form.backgroundType === 'pattern'
      ? { backgroundColor: '#111' }
      : { background: form.backgroundValue };

  const Layout = getLinkBioLayout(theme);
  const bio = {
    avatarUrl: form.avatarUrl,
    name: form.name,
    bio: form.bio,
    socials: form.socials.filter(s => s.url),
    displayType: form.displayType,
    backgroundType: form.backgroundType,
    backgroundValue: form.backgroundValue,
    customLinks: form.customLinks.filter(cl => cl.label && cl.url),
    productDisplayTypes: form.productDisplayTypes,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', background: 'var(--sell-bg, #f8fafc)' }}>
      <div className={styles.page} style={{ flexDirection: 'column', gap: 16 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'var(--sell-font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--sell-text-1)' }}>Link in Bio</h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--sell-text-2)' }}>Preview updates live as you edit</p>
          </div>
          {storeConfig?.storeSlug && (
            <a
              href={`/${storeConfig.storeSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', fontWeight: 600, color: 'var(--sell-green)', background: 'var(--sell-green-bg)', padding: '3px 10px', borderRadius: 100, textDecoration: 'none' }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--sell-green)' }} />Live
            </a>
          )}
        </div>

        <div style={{ display: 'flex', gap: 24, flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Mobile preview */}
          <div className={styles.previewCol}>
            <div className={styles.phoneFrame}>
              <div className={styles.phoneScreen} style={bgStyle}>
                {(form.backgroundType === 'image' || form.backgroundType === 'pattern') && form.backgroundValue && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className={styles.bgImg}
                    src={form.backgroundValue}
                    alt=""
                    style={{ opacity: form.backgroundType === 'pattern' ? 0.15 : 1 }}
                  />
                )}
                <div style={{ position: 'relative', zIndex: 1, width: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column', fontFamily: themeFont ? `'${themeFont}', system-ui, sans-serif` : undefined }}>
                  <Layout
                    config={config}
                    bio={bio}
                    visibleProducts={visibleProducts}
                    isLightBg={isLightBg}
                    textColor={text1}
                    textColor2={text2}
                    textColor3={text3}
                    onProductClick={() => {}}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Editor panel */}
          <div className={styles.editorCol}>
            <div className={styles.editorTabs}>
              {(['profile', 'design', 'products', 'links'] as const).map(t => (
                <button
                  key={t}
                  className={[styles.editorTab, tab === t ? styles.editorTabActive : ''].join(' ')}
                  onClick={() => setTab(t)}
                  type="button"
                >
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <div className={styles.editorContent}>
              {tab === 'profile' && (
                <div className={styles.tabContent}>
                  <div className={styles.field}>
                    <label className={styles.fLabel}>Profile picture</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
                      <div className={styles.pAvatar} style={{ marginBottom: 0 }}>
                        {avatarPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className={styles.pAvatarImg} src={avatarPreview} alt="Avatar" />
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
                    <input className={styles.fInput} value={form.name} onChange={e => setField({ name: e.target.value })} placeholder={storeName} />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fLabel}>Bio</label>
                    <textarea className={styles.fTextarea} rows={3} value={form.bio} onChange={e => setField({ bio: e.target.value })} placeholder="Tell people who you are..." />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fLabel}>Social links</label>
                    {form.socials.map((s, i) => (
                      <div key={i} className={styles.socialRow}>
                        <span className={styles.socialIcon}>{s.platform.slice(0, 2).toUpperCase()}</span>
                        <select
                          className={styles.fSelect}
                          value={s.platform}
                          onChange={e => updateSocial(i, { platform: e.target.value })}
                          style={{ width: 110 }}
                        >
                          {SOCIAL_PLATFORMS.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                        <input
                          className={styles.fInput}
                          value={s.url}
                          onChange={e => updateSocial(i, { url: e.target.value })}
                          placeholder="https://..."
                        />
                        <button
                          className={styles.iconBtn}
                          onClick={() => setField({ socials: form.socials.filter((_, j) => j !== i) })}
                          aria-label="Remove social link"
                          type="button"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                    <button className={styles.addBtn} onClick={addSocial} type="button">+ Add social</button>
                  </div>
                </div>
              )}

              {tab === 'design' && (
                <div className={styles.tabContent}>
                  <div className={styles.field}>
                    <label className={styles.fLabel}>Theme</label>
                    <div className={styles.themeGrid}>
                      {THEMES.filter(t => t.type === 'link-style').map(t => (
                        <button
                          key={t.id}
                          type="button"
                          className={[styles.themeOption, theme === t.id ? styles.themeOptionActive : ''].join(' ')}
                          onClick={() => handleThemeSelect(t.id)}
                        >
                          <span className={styles.themeSwatch} style={{ background: t.previewAccent }} />
                          <span className={styles.themeOptName}>{t.name}</span>
                          {theme === t.id && <span className={styles.themeCheck}>✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fLabel}>Default product display</label>
                    <div className={styles.displayOptions}>
                      {DISPLAY_TYPES.map(d => (
                        <button
                          key={d}
                          type="button"
                          className={[styles.displayOpt, form.displayType === d ? styles.displayOptActive : ''].join(' ')}
                          onClick={() => setField({ displayType: d })}
                        >
                          {d[0].toUpperCase() + d.slice(1)}
                        </button>
                      ))}
                    </div>
                    <p className={styles.fHint}>Default style for products. Override per product in the Products tab.</p>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fLabel}>Background type</label>
                    <div className={styles.displayOptions}>
                      {BG_TYPES.map(b => (
                        <button
                          key={b}
                          type="button"
                          className={[styles.displayOpt, form.backgroundType === b ? styles.displayOptActive : ''].join(' ')}
                          onClick={() => setField({ backgroundType: b })}
                        >
                          {b[0].toUpperCase() + b.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {form.backgroundType === 'solid' && (
                    <div className={styles.field}>
                      <label className={styles.fLabel}>Color</label>
                      <div className={styles.colorGrid}>
                        {SOLID_COLORS.map(c => (
                          <button
                            key={c}
                            type="button"
                            aria-label={c}
                            className={[styles.colorSwatch, form.backgroundValue === c ? styles.colorSwatchActive : ''].join(' ')}
                            style={{ background: c }}
                            onClick={() => setField({ backgroundValue: c })}
                          />
                        ))}
                      </div>
                      <div className={styles.colorPicker}>
                        <input type="color" value={form.backgroundValue} onChange={e => setField({ backgroundValue: e.target.value })} />
                      </div>
                    </div>
                  )}

                  {form.backgroundType === 'gradient' && (
                    <div className={styles.field}>
                      <label className={styles.fLabel}>Gradient</label>
                      <div className={styles.colorGrid}>
                        {GRADIENTS.map(g => (
                          <button
                            key={g}
                            type="button"
                            aria-label="Gradient"
                            className={[styles.gradientSwatch, form.backgroundValue === g ? styles.colorSwatchActive : ''].join(' ')}
                            style={{ background: g }}
                            onClick={() => setField({ backgroundValue: g })}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {(form.backgroundType === 'image' || form.backgroundType === 'pattern') && (
                    <div className={styles.field}>
                      <label className={styles.fLabel}>{form.backgroundType === 'image' ? 'Image URL' : 'Pattern image URL'}</label>
                      <input className={styles.fInput} value={form.backgroundValue} onChange={e => setField({ backgroundValue: e.target.value })} placeholder="https://..." />
                      <p className={styles.fHint}>{form.backgroundType === 'image' ? 'Full-cover background image' : 'Pattern image shown faintly behind your links'}</p>
                    </div>
                  )}
                </div>
              )}

              {tab === 'products' && (
                <div className={styles.tabContent}>
                  <p className={styles.tabDesc}>Choose how each product looks and whether it appears on your link-in-bio page.</p>
                  {orderedAll.map((p, i) => {
                    const type = form.productDisplayTypes[p.id] ?? form.displayType;
                    const visible = form.productVisibility[p.id] !== false;
                    const first = i === 0;
                    const last = i === orderedAll.length - 1;
                    return (
                      <div key={p.id} className={styles.productRow} style={{ opacity: visible ? 1 : 0.55 }}>
                        <span className={styles.gripIcon}><GripVertical size={16} /></span>
                        {p.images?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className={styles.productThumb} src={p.images[0]} alt={p.displayName} />
                        ) : (
                          <span className={styles.productThumbPlaceholder}>📦</span>
                        )}
                        <div className={styles.productInfo}>
                          <p className={styles.productName}>{p.displayName}</p>
                          <p className={styles.productPrice}>₦{p.price.toLocaleString()}</p>
                        </div>
                        <button className={styles.iconBtn} onClick={() => setProductVisibility(p.id)} title={visible ? 'Hide' : 'Show'} aria-label={visible ? 'Hide' : 'Show'} type="button">
                          {visible ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                        <button className={styles.iconBtn} onClick={() => moveProduct(p.id, -1)} aria-label="Move up" disabled={first} type="button">↑</button>
                        <button className={styles.iconBtn} onClick={() => moveProduct(p.id, 1)} aria-label="Move down" disabled={last} type="button">↓</button>
                        <div className={styles.productDisplayPicker}>
                          {DISPLAY_TYPES.map(d => (
                            <button
                              key={d}
                              type="button"
                              className={[styles.productDisplayOpt, type === d ? styles.productDisplayOptActive : ''].join(' ')}
                              onClick={() => setProductDisplay(p.id, d)}
                            >
                              {d === 'button' ? 'Btn' : d === 'callout' ? 'Card' : 'Min'}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {orderedAll.length === 0 && <p className={styles.emptyState}>No products yet. Add products to show them on your page.</p>}
                </div>
              )}

              {tab === 'links' && (
                <div className={styles.tabContent}>
                  <p className={styles.tabDesc}>Add external links (website, Telegram, booking page, etc.) shown alongside your products.</p>
                  {form.customLinks.map(cl => (
                    <div key={cl.id} className={styles.customLinkRow}>
                      <input
                        className={styles.fInput}
                        value={cl.label}
                        onChange={e => updateCustomLink(cl.id, { label: e.target.value })}
                        placeholder="Label"
                        style={{ flex: 1 }}
                      />
                      <input
                        className={styles.fInput}
                        value={cl.url}
                        onChange={e => updateCustomLink(cl.id, { url: e.target.value })}
                        placeholder="https://..."
                        style={{ flex: 1 }}
                      />
                      <button
                        className={styles.iconBtn}
                        onClick={() => setField({ customLinks: form.customLinks.filter(x => x.id !== cl.id) })}
                        aria-label="Remove link"
                        type="button"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                  <button
                    className={styles.addBtn}
                    onClick={() => setField({ customLinks: [...form.customLinks, { id: newLinkId(), label: '', url: '' }] })}
                    type="button"
                  >
                    + Add link
                  </button>
                </div>
              )}
            </div>

            <div className={styles.saveRow}>
              <button
                className={styles.viewBtn}
                onClick={() => storeConfig?.storeSlug && window.open(`/${storeConfig.storeSlug}`, '_blank')}
                type="button"
              >
                <ExternalLink size={14} /> View
              </button>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving || !dirty}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
