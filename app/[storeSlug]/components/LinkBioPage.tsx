'use client';

import React, { useState, useMemo } from 'react';
import { Instagram, Twitter, Youtube, Music2, MessageCircle } from 'lucide-react';
import type { ProductCardData } from '@/themes/types';
import { ProductModal } from './ProductModal';

interface CustomLink {
  id: string;
  label: string;
  url: string;
}

interface LinkBioConfig {
  avatarUrl: string | null;
  name: string;
  bio: string;
  socials: { platform: string; url: string }[];
  displayType: 'button' | 'callout' | 'minimal';
  backgroundType: 'solid' | 'gradient' | 'image' | 'pattern';
  backgroundValue: string;
  productVisibility: Record<string, boolean>;
  customLinks?: CustomLink[];
  productOrder?: string[];
}

interface LinkBioPageProps {
  config: {
    storeSlug: string;
    storeName: string;
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    currency: string;
    tagline: string | null;
    contactEmail: string;
    contactPhone: string;
    paystackPublicKey: string;
  };
  products: (ProductCardData & { description?: string; digitalFileUrl?: string | null })[];
  linkBio?: LinkBioConfig | null;
}

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  instagram: <Instagram size={20} />,
  twitter: <Twitter size={20} />,
  youtube: <Youtube size={20} />,
  tiktok: <Music2 size={20} />,
  whatsapp: <MessageCircle size={20} />,
};

function getBgStyle(bg: LinkBioConfig['backgroundType'], val: string): React.CSSProperties {
  if (bg === 'gradient') return { background: val };
  if (bg === 'solid') return { background: val };
  if (bg === 'image') return { background: `#111` };
  if (bg === 'pattern') return { background: `#111` };
  return { background: '#0A0A0A' };
}

export function LinkBioPage({ config, products, linkBio }: LinkBioPageProps) {
  const [selectedProduct, setSelectedProduct] = useState<
    (ProductCardData & { description?: string; digitalFileUrl?: string | null }) | null
  >(null);

  const raw = (linkBio ?? {}) as Partial<LinkBioConfig>;
  const bio = {
    avatarUrl: 'avatarUrl' in raw ? raw.avatarUrl : config.logoUrl,
    name: raw.name || config.storeName,
    bio: raw.bio || (config.tagline ?? ''),
    socials: Array.isArray(raw.socials) ? raw.socials : [],
    displayType: raw.displayType || ('button' as const),
    backgroundType: raw.backgroundType || ('solid' as const),
    backgroundValue: raw.backgroundValue || '#0A0A0A',
    productVisibility: raw.productVisibility ?? {},
    customLinks: Array.isArray(raw.customLinks) ? raw.customLinks : [],
    productOrder: Array.isArray(raw.productOrder) ? raw.productOrder : [],
  };

  const displayType = bio.displayType || 'button';
  const bgType = bio.backgroundType || 'solid';
  const bgValue = bio.backgroundValue || '#0A0A0A';
  const isLightBg = bgType === 'solid' && (bgValue === '#F9FAFB' || bgValue === '#FFF7ED' || bgValue === '#ECFDF5' || bgValue === '#F0F9FF');
  const textColor = isLightBg ? '#0f172a' : '#fff';
  const textColor2 = isLightBg ? '#64748b' : 'rgba(255,255,255,0.7)';
  const textColor3 = isLightBg ? '#94a3b8' : 'rgba(255,255,255,0.4)';

  const visibleProducts = useMemo(() => {
    const filtered = products.filter(p => bio.productVisibility?.[p.id] !== false);
    if (bio.productOrder && bio.productOrder.length > 0) {
      const ordered = bio.productOrder.map(id => filtered.find(p => p.id === id)).filter(Boolean) as typeof filtered;
      const remaining = filtered.filter(p => !bio.productOrder!.includes(p.id));
      return [...ordered, ...remaining];
    }
    return filtered;
  }, [products, bio.productVisibility, bio.productOrder]);

  const bgStyle: React.CSSProperties = bgType === 'image' ? { backgroundColor: '#111' } :
    bgType === 'pattern' ? { backgroundColor: '#111' } :
    { background: bgValue };

  return (
    <>
      <div style={{
        minHeight: '100dvh',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        ...bgStyle,
        position: 'relative', overflow: 'hidden',
      }}>
        {bgType === 'image' && bgValue && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bgValue} alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
          />
        )}
        {bgType === 'pattern' && bgValue && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bgValue} alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15, zIndex: 0 }}
          />
        )}

        <div style={{
          position: 'relative', zIndex: 1,
          width: '100%', maxWidth: 600, margin: '0 auto',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '48px 24px 32px', textAlign: 'center',
        }}>
          <div style={{
            width: 96, height: 96, borderRadius: '50%', overflow: 'hidden',
            marginBottom: 16, flexShrink: 0,
            boxShadow: isLightBg ? '0 4px 20px rgba(0,0,0,0.1)' : '0 4px 20px rgba(0,0,0,0.3)',
            border: `2px solid ${config.primaryColor}44`,
          }}>
            {bio.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bio.avatarUrl} alt={bio.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : config.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={config.logoUrl} alt={bio.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', fontWeight: 700, color: '#fff',
              }}>
                {bio.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <h1 style={{
            margin: '0 0 4px', fontSize: '1.35rem', fontWeight: 800,
            color: textColor, letterSpacing: '-0.02em',
          }}>{bio.name}</h1>

          {bio.bio && (
            <p style={{
              margin: '0 0 20px', fontSize: '0.88rem', color: textColor2,
              maxWidth: 400, lineHeight: 1.6,
            }}>{bio.bio}</p>
          )}

          {bio.socials && bio.socials.length > 0 && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
              {bio.socials.map((s, i) => {
                if (!s.url) return null;
                const icon = SOCIAL_ICONS[s.platform];
                return (
                  <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                    style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: isLightBg ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: textColor, transition: 'all 0.15s',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    {icon}
                  </a>
                );
              })}
            </div>
          )}

          <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {visibleProducts.map(p => {
              if (displayType === 'minimal') {
                return (
                  <button key={p.id} onClick={() => setSelectedProduct(p)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      width: '100%', padding: '10px 4px',
                      border: 'none', borderBottom: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`,
                      background: 'transparent', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <span style={{ fontSize: '0.88rem', color: textColor, fontWeight: 500 }}>{p.displayName}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: textColor }}>
                      {config.currency === 'NGN' ? '₦' : '$'}{p.price.toLocaleString()}
                    </span>
                  </button>
                );
              }

              if (displayType === 'callout') {
                return (
                  <button key={p.id} onClick={() => setSelectedProduct(p)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      width: '100%', padding: 12,
                      borderRadius: 16, border: 'none',
                      background: isLightBg ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)',
                      cursor: 'pointer', textAlign: 'left',
                      backdropFilter: isLightBg ? 'none' : 'blur(10px)',
                    }}
                  >
                    {p.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt={p.displayName}
                        style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: 60, height: 60, borderRadius: 10, background: `${config.primaryColor}33` }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.displayName}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: textColor2 }}>
                        {config.currency === 'NGN' ? '₦' : '$'}{p.price.toLocaleString()}
                      </p>
                    </div>
                    <span style={{
                      padding: '6px 14px', borderRadius: 20,
                      background: config.primaryColor, color: '#fff',
                      fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap',
                    }}>
                      Buy Now
                    </span>
                  </button>
                );
              }

              return (
                <button key={p.id} onClick={() => setSelectedProduct(p)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    width: '100%', padding: '10px 16px',
                    borderRadius: 100, border: 'none',
                    background: isLightBg ? '#fff' : 'rgba(255,255,255,0.12)',
                    color: isLightBg ? '#0f172a' : '#fff',
                    cursor: 'pointer', textAlign: 'left',
                    boxShadow: isLightBg ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  {p.images?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt={p.displayName}
                      style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${config.primaryColor}44` }} />
                  )}
                  <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.displayName}
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {config.currency === 'NGN' ? '₦' : '$'}{p.price.toLocaleString()}
                  </span>
                </button>
              );
            })}
            {bio.customLinks?.filter(cl => cl.label && cl.url).map(cl => {
              const linkStyle: React.CSSProperties = displayType === 'minimal' ? {
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                width: '100%', padding: '10px 4px',
                border: 'none', borderBottom: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`,
                background: 'transparent', cursor: 'pointer', textAlign: 'left',
              } : displayType === 'callout' ? {
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', padding: 12,
                borderRadius: 16, border: 'none',
                background: isLightBg ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)',
                cursor: 'pointer', textAlign: 'left',
                backdropFilter: isLightBg ? 'none' : 'blur(10px)',
              } : {
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '10px 16px',
                borderRadius: 100, border: 'none',
                background: isLightBg ? '#fff' : 'rgba(255,255,255,0.12)',
                color: isLightBg ? '#0f172a' : '#fff',
                cursor: 'pointer', textAlign: 'left',
                boxShadow: isLightBg ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s',
              };

              return (
                <a key={cl.id} href={cl.url} target="_blank" rel="noopener noreferrer"
                  style={linkStyle}
                  onMouseEnter={e => { if (displayType !== 'minimal') e.currentTarget.style.transform = 'scale(1.02)'; }}
                  onMouseLeave={e => { if (displayType !== 'minimal') e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600 }}>{cl.label}</span>
                  {displayType !== 'minimal' && (
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      Open ↗
                    </span>
                  )}
                </a>
              );
            })}
          </div>

          <p style={{
            marginTop: 'auto', paddingTop: 40,
            fontSize: '0.68rem', color: textColor3,
          }}>
            Powered by MO Sell
          </p>
        </div>
      </div>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          storeSlug={config.storeSlug}
          currency={config.currency}
          primaryColor={config.primaryColor}
          paystackPublicKey={config.paystackPublicKey}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
}
