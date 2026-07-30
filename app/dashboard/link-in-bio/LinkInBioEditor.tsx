'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useSell } from '@/context/SellContext';
import { THEMES, getThemeType } from '@/themes/registry';
import { useRouter } from 'next/navigation';
import {
  Instagram, Twitter, Youtube, Music2, MessageCircle, Globe,
  Plus, Trash2, GripVertical, Eye, EyeOff, Image as ImageIcon, Link,
} from 'lucide-react';
import type { ProductCardData } from '@/themes/types';
import styles from './LinkInBioEditor.module.css';

type DisplayType = 'button' | 'callout' | 'minimal';
type BgType = 'solid' | 'gradient' | 'image' | 'pattern';

const PRESET_GRADIENTS = [
  'linear-gradient(135deg, #EC4899, #8B5CF6)',
  'linear-gradient(135deg, #F59E0B, #EF4444)',
  'linear-gradient(135deg, #10B981, #3B82F6)',
  'linear-gradient(135deg, #8B5CF6, #EC4899)',
  'linear-gradient(135deg, #06B6D4, #8B5CF6)',
  'linear-gradient(135deg, #F97316, #EAB308)',
  'linear-gradient(135deg, #111827, #1F2937)',
  'linear-gradient(135deg, #0EA5E9, #6366F1)',
];

const PRESET_COLORS = ['#0A0A0A', '#111827', '#1E1B4B', '#0F172A', '#F9FAFB', '#FFF7ED', '#ECFDF5', '#F0F9FF'];

type SocialPlatform = 'instagram' | 'tiktok' | 'whatsapp' | 'twitter' | 'youtube';

const SOCIAL_OPTIONS: { key: SocialPlatform; label: string; icon: React.ReactNode }[] = [
  { key: 'instagram', label: 'Instagram', icon: <Instagram size={18} /> },
  { key: 'tiktok', label: 'TikTok', icon: <Music2 size={18} /> },
  { key: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={18} /> },
  { key: 'twitter', label: 'X / Twitter', icon: <Twitter size={18} /> },
  { key: 'youtube', label: 'YouTube', icon: <Youtube size={18} /> },
];

interface CustomLink {
  id: string;
  label: string;
  url: string;
}

interface LinkBioConfig {
  avatarUrl: string | null;
  name: string;
  bio: string;
  socials: { platform: SocialPlatform; url: string }[];
  displayType: DisplayType;
  backgroundType: BgType;
  backgroundValue: string;
  productVisibility: Record<string, boolean>;
  customLinks: CustomLink[];
  productOrder: string[];
}

interface ProductItem extends ProductCardData {
  visible: boolean;
}

export function LinkInBioEditor() {
  const { user, storeConfig, refreshStoreConfig, showToast, navigateTo } = useSell();
  const router = useRouter();
  const activeTheme = storeConfig?.theme ?? 'luxe';

  useEffect(() => {
    if (getThemeType(activeTheme) !== 'link-style') {
      showToast('Switch to a Link-in-Bio theme first', 'info');
      navigateTo('themes');
    }
  }, [activeTheme, navigateTo, showToast]);

  const [tab, setTab] = useState<'profile' | 'socials' | 'products' | 'design'>('profile');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [name, setName] = useState(storeConfig?.storeName ?? '');
  const [bio, setBio] = useState(storeConfig?.tagline ?? '');
  const [socials, setSocials] = useState<{ platform: SocialPlatform; url: string }[]>([]);
  const [displayType, setDisplayType] = useState<DisplayType>('button');
  const [bgType, setBgType] = useState<BgType>('solid');
  const [bgValue, setBgValue] = useState('#0A0A0A');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [productOrder, setProductOrder] = useState<string[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!storeConfig) return;
    setName(storeConfig.storeName ?? '');
    setBio(storeConfig.tagline ?? '');

    const saved = (storeConfig as any).linkBio as LinkBioConfig | undefined;
    if (saved) {
      setAvatarPreview(saved.avatarUrl);
      setSocials(saved.socials ?? []);
      setDisplayType(saved.displayType ?? 'button');
      setBgType(saved.backgroundType ?? 'solid');
      setBgValue(saved.backgroundValue ?? '#0A0A0A');
      setCustomLinks(saved.customLinks ?? []);
      setProductOrder(saved.productOrder ?? []);
      if (saved.productVisibility) {
        setProducts(prev => prev.map(p => ({
          ...p,
          visible: saved.productVisibility[p.id] ?? true,
        })));
      }
    }
  }, [storeConfig]);

  useEffect(() => {
    if (!user?.businessId) return;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    fetch(`${baseUrl}/api/store/products?businessId=${user.businessId}&available=true`)
      .then(r => r.ok ? r.json() : { products: [] })
      .then(data => {
        const saved = (storeConfig as any)?.linkBio as LinkBioConfig | undefined;
        setProducts((data.products ?? []).map((p: ProductCardData) => ({
          ...p,
          visible: saved?.productVisibility?.[p.id] ?? true,
        })));
        if (saved?.productOrder) setProductOrder(saved.productOrder);
      })
      .catch(() => {});
  }, [user?.businessId, storeConfig?.storeSlug]);

  const handleSave = useCallback(async () => {
    if (!user?.businessId) return;
    setSaving(true);
    try {
      let finalAvatar = avatarPreview;
      if (avatarFile) {
        const { storage } = initializeFirebase();
        const ref = storageRef(storage, `link-bio/${user.businessId}/avatar_${Date.now()}`);
        await uploadBytes(ref, avatarFile);
        finalAvatar = await getDownloadURL(ref);
      }

      const productVisibility: Record<string, boolean> = {};
      products.forEach(p => { productVisibility[p.id] = p.visible; });

      const linkBio: LinkBioConfig = {
        avatarUrl: finalAvatar,
        name,
        bio,
        socials,
        displayType,
        backgroundType: bgType,
        backgroundValue: bgValue,
        productVisibility,
        customLinks,
        productOrder,
      };

      const { firestore } = initializeFirebase();
      await setDoc(
        doc(firestore, 'businesses', user.businessId, 'store', 'config'),
        {
          storeName: name,
          tagline: bio,
          linkBio,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await refreshStoreConfig();
      setAvatarFile(null);
      setDirty(false);
      showToast('Link-in-Bio saved!', 'success');
    } catch {
      showToast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }, [user?.businessId, avatarPreview, avatarFile, name, bio, socials, displayType, bgType, bgValue, products, customLinks, productOrder, refreshStoreConfig, showToast]);

  const toggleProductVisibility = useCallback((productId: string) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, visible: !p.visible } : p));
    setDirty(true);
  }, []);

  const sortedProducts = useMemo(() => {
    if (productOrder.length === 0) return products;
    const ordered = productOrder.map(id => products.find(p => p.id === id)).filter(Boolean) as ProductItem[];
    const remaining = products.filter(p => !productOrder.includes(p.id));
    return [...ordered, ...remaining];
  }, [products, productOrder]);

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const newOrder = [...productOrder];
    const [moved] = newOrder.splice(dragIndex, 1);
    newOrder.splice(index, 0, moved);
    setProductOrder(newOrder);
    setDragIndex(index);
    setDirty(true);
  }, [dragIndex, productOrder]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
  }, []);

  const addCustomLink = useCallback(() => {
    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setCustomLinks(prev => [...prev, { id, label: '', url: '' }]);
    setDirty(true);
  }, []);

  const updateCustomLink = useCallback((id: string, field: 'label' | 'url', value: string) => {
    setCustomLinks(prev => prev.map(cl => cl.id === id ? { ...cl, [field]: value } : cl));
    setDirty(true);
  }, []);

  const removeCustomLink = useCallback((id: string) => {
    setCustomLinks(prev => prev.filter(cl => cl.id !== id));
    setDirty(true);
  }, []);

  const addSocial = useCallback(() => {
    const available = SOCIAL_OPTIONS.find(s => !socials.find(ss => ss.platform === s.key));
    if (!available) return;
    setSocials(prev => [...prev, { platform: available.key, url: '' }]);
    setDirty(true);
  }, [socials]);

  const updateSocial = useCallback((index: number, url: string) => {
    setSocials(prev => prev.map((s, i) => i === index ? { ...s, url } : s));
    setDirty(true);
  }, []);

  const removeSocial = useCallback((index: number) => {
    setSocials(prev => prev.filter((_, i) => i !== index));
    setDirty(true);
  }, []);

  const previewBg = bgType === 'gradient' ? bgValue :
    bgType === 'solid' ? bgValue :
    bgType === 'image' ? `url(${bgValue}) center/cover` :
    bgValue;

  return (
    <div className={styles.page}>
      <div className={styles.previewCol}>
        <div className={styles.phoneFrame}>
          <div className={styles.phoneScreen} style={{
            background: bgType === 'image' ? '#111' : bgType === 'gradient' ? bgValue : bgValue,
          }}>
            {bgType === 'image' && bgValue && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bgValue} alt="" className={styles.bgImg} />
            )}
            <div className={styles.phoneContent}>
              <div className={styles.pAvatar}>
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt="" className={styles.pAvatarImg} />
                ) : (
                  <div className={styles.pAvatarPlaceholder}>
                    {(name || 'Y').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h1 className={styles.pName}>{name || 'Your Name'}</h1>
              <p className={styles.pBio}>{bio || 'Your bio goes here'}</p>

              {socials.length > 0 && (
                <div className={styles.pSocials}>
                  {socials.map((s, i) => {
                    const opt = SOCIAL_OPTIONS.find(o => o.key === s.platform);
                    return (
                      <a key={i} href={s.url || '#'} target="_blank" rel="noopener noreferrer" className={styles.pSocialLink}>
                        {opt?.icon}
                      </a>
                    );
                  })}
                </div>
              )}

              <div className={styles.pProducts}>
                {sortedProducts.filter(p => p.visible).slice(0, 5).map(p => {
                  if (displayType === 'minimal') {
                    return (
                      <div key={p.id} className={styles.pMinimal}>
                        <span className={styles.pMinimalName}>{p.displayName}</span>
                        <span className={styles.pMinimalPrice}>
                          ₦{p.price.toLocaleString()}
                        </span>
                      </div>
                    );
                  }
                  if (displayType === 'callout') {
                    return (
                      <div key={p.id} className={styles.pCallout}>
                        {p.images?.[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.images[0]} alt="" className={styles.pCalloutImg} />
                        )}
                        <div className={styles.pCalloutInfo}>
                          <p className={styles.pCalloutName}>{p.displayName}</p>
                          <p className={styles.pCalloutPrice}>₦{p.price.toLocaleString()}</p>
                        </div>
                        <span className={styles.pCalloutBtn}>Buy Now</span>
                      </div>
                    );
                  }
                  return (
                    <div key={p.id} className={styles.pButton} style={{
                      background: storeConfig?.primaryColor || '#6366F1',
                    }}>
                      {p.images?.[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0]} alt="" className={styles.pButtonThumb} />
                      )}
                      <span className={styles.pButtonName}>{p.displayName}</span>
                      <span className={styles.pButtonPrice}>₦{p.price.toLocaleString()}</span>
                    </div>
                  );
                })}
                {customLinks.filter(cl => cl.label && cl.url).map(cl => {
                  if (displayType === 'minimal') {
                    return (
                      <div key={cl.id} className={styles.pMinimal}>
                        <span className={styles.pMinimalName}>{cl.label}</span>
                      </div>
                    );
                  }
                  if (displayType === 'callout') {
                    return (
                      <div key={cl.id} className={styles.pCallout}>
                        <div className={styles.pCalloutInfo}>
                          <p className={styles.pCalloutName}>{cl.label}</p>
                        </div>
                        <span className={styles.pCalloutBtn}>Open</span>
                      </div>
                    );
                  }
                  return (
                    <div key={cl.id} className={styles.pButton} style={{
                      background: storeConfig?.primaryColor || '#6366F1',
                    }}>
                      <span className={styles.pButtonName}>{cl.label}</span>
                    </div>
                  );
                })}
              </div>

              <p className={styles.pFooter}>Powered by MO Sell</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.editorCol}>
        <div className={styles.editorTabs}>
          {(['profile', 'socials', 'products', 'design'] as const).map(t => (
            <button
              key={t}
              className={[styles.editorTab, tab === t ? styles.editorTabActive : ''].join(' ')}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles.editorContent}>
          {tab === 'profile' && (
            <div className={styles.tabContent}>
              <div className={styles.field}>
                <label className={styles.fLabel}>Avatar</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) { showToast('Image must be under 2MB', 'error'); return; }
                    setAvatarFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => setAvatarPreview(reader.result as string);
                    reader.readAsDataURL(file);
                    setDirty(true);
                  }}
                  className={styles.fileInput}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.fLabel}>Name</label>
                <input className={styles.fInput} value={name} onChange={e => { setName(e.target.value); setDirty(true); }} maxLength={50} />
              </div>
              <div className={styles.field}>
                <label className={styles.fLabel}>Bio <span className={styles.fHint}>{bio.length}/160</span></label>
                <textarea className={styles.fTextarea} value={bio} onChange={e => { setBio(e.target.value.slice(0, 160)); setDirty(true); }} maxLength={160} rows={3} />
              </div>
            </div>
          )}

          {tab === 'socials' && (
            <div className={styles.tabContent}>
              <p className={styles.tabDesc}>Add links to your social profiles. Visitors tap to open.</p>
              {socials.map((s, i) => (
                <div key={i} className={styles.socialRow}>
                  <span className={styles.socialIcon}>
                    {SOCIAL_OPTIONS.find(o => o.key === s.platform)?.icon}
                  </span>
                  <input
                    className={styles.fInput}
                    placeholder="https://instagram.com/yourhandle"
                    value={s.url}
                    onChange={e => updateSocial(i, e.target.value)}
                  />
                  <button className={styles.iconBtn} onClick={() => removeSocial(i)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button className={styles.addBtn} onClick={addSocial}>
                <Plus size={16} /> Add Social Link
              </button>
            </div>
          )}

          {tab === 'products' && (
            <div className={styles.tabContent}>
              <div className={styles.field}>
                <label className={styles.fLabel}>Display Type</label>
                <div className={styles.displayOptions}>
                  {(['button', 'callout', 'minimal'] as DisplayType[]).map(d => (
                    <button
                      key={d}
                      className={[styles.displayOpt, displayType === d ? styles.displayOptActive : ''].join(' ')}
                      onClick={() => { setDisplayType(d); setDirty(true); }}
                    >
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <p className={styles.tabDesc}>Show, hide, or reorder products on your page.</p>
              {sortedProducts.length === 0 && (
                <p className={styles.emptyState}>No products yet. Add some from Products page.</p>
              )}
              {sortedProducts.map((p, i) => (
                <div
                  key={p.id}
                  className={[styles.productRow, dragIndex === i ? styles.dragging : ''].join(' ')}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={e => handleDragOver(e, i)}
                  onDragEnd={handleDragEnd}
                >
                  <span className={styles.gripIcon}><GripVertical size={16} /></span>
                  {p.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt="" className={styles.productThumb} />
                  ) : (
                    <div className={styles.productThumbPlaceholder}>
                      <ImageIcon size={14} />
                    </div>
                  )}
                  <div className={styles.productInfo}>
                    <p className={styles.productName}>{p.displayName}</p>
                    <p className={styles.productPrice}>₦{p.price.toLocaleString()}</p>
                  </div>
                  <button className={styles.iconBtn} onClick={() => toggleProductVisibility(p.id)}>
                    {p.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              ))}
              <div className={styles.customLinksSection}>
                <p className={styles.tabDesc}>Add custom link buttons to your page.</p>
                {customLinks.map(cl => (
                  <div key={cl.id} className={styles.customLinkRow}>
                    <span className={styles.gripIcon}><Link size={16} /></span>
                    <input
                      className={styles.fInput}
                      placeholder="Label"
                      value={cl.label}
                      onChange={e => updateCustomLink(cl.id, 'label', e.target.value)}
                    />
                    <input
                      className={styles.fInput}
                      placeholder="https://..."
                      value={cl.url}
                      onChange={e => updateCustomLink(cl.id, 'url', e.target.value)}
                    />
                    <button className={styles.iconBtn} onClick={() => removeCustomLink(cl.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button className={styles.addBtn} onClick={addCustomLink}>
                  <Plus size={16} /> Add Custom Link
                </button>
              </div>
            </div>
          )}

          {tab === 'design' && (
            <div className={styles.tabContent}>
              <div className={styles.field}>
                <label className={styles.fLabel}>Background Type</label>
                <div className={styles.displayOptions}>
                  {(['solid', 'gradient', 'image', 'pattern'] as BgType[]).map(b => (
                    <button
                      key={b}
                      className={[styles.displayOpt, bgType === b ? styles.displayOptActive : ''].join(' ')}
                      onClick={() => { setBgType(b); setDirty(true); }}
                    >
                      {b.charAt(0).toUpperCase() + b.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {bgType === 'solid' && (
                <div className={styles.colorGrid}>
                  {PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      className={[styles.colorSwatch, bgValue === c ? styles.colorSwatchActive : ''].join(' ')}
                      style={{ background: c, border: c === '#F9FAFB' || c === '#FFF7ED' || c === '#F0F9FF' ? '1px solid #ddd' : 'none' }}
                      onClick={() => { setBgValue(c); setDirty(true); }}
                    />
                  ))}
                  <label className={styles.colorPicker}>
                    <input type="color" value={bgValue} onChange={e => { setBgValue(e.target.value); setDirty(true); }} />
                  </label>
                </div>
              )}

              {bgType === 'gradient' && (
                <div className={styles.colorGrid}>
                  {PRESET_GRADIENTS.map(g => (
                    <button
                      key={g}
                      className={[styles.gradientSwatch, bgValue === g ? styles.colorSwatchActive : ''].join(' ')}
                      style={{ background: g }}
                      onClick={() => { setBgValue(g); setDirty(true); }}
                    />
                  ))}
                </div>
              )}

              {(bgType === 'image' || bgType === 'pattern') && (
                <div className={styles.field}>
                  <label className={styles.fLabel}>{bgType === 'image' ? 'Background Image URL' : 'Pattern URL'}</label>
                  <input className={styles.fInput} value={bgValue} onChange={e => { setBgValue(e.target.value); setDirty(true); }} placeholder="https://..." />
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.saveRow}>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={saving || !dirty}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            className={styles.viewBtn}
            onClick={() => {
              if (storeConfig?.storeSlug) {
                window.open(`/${storeConfig.storeSlug}`, '_blank');
              }
            }}
          >
            <Eye size={16} /> View Page
          </button>
        </div>
      </div>
    </div>
  );
}
