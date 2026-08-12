'use client';

import React from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface LinkBioProduct {
  id: string;
  displayName: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  category: string;
  productType: 'physical' | 'digital' | 'service';
  digitalSubtype?: 'ebook' | 'course' | 'template' | 'ticket' | 'coaching';
  eventDate?: string | null;
  eventTime?: string | null;
  venue?: string | null;
  capacity?: number | string | null;
  callToAction?: string | null;
}

export interface LinkBioProductPageProps {
  product: LinkBioProduct;
  storeSlug: string;
  storeName?: string;
  primaryColor: string;
  currency: string;
  discount: number | null;
  formattedDate: string;
  success: boolean;
  orderId: string;
  error: string;
  processing: boolean;
  needsSlot: boolean;
  businessId?: string;
  today: string;
  selectedDate: string;
  selectedSlot: string | null;
  slots: { time: string; available: boolean }[];
  loadingSlots: boolean;
  wantsName: boolean;
  wantsPhone: boolean;
  name: string;
  email: string;
  phone: string;
  notes: string;
  onNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectSlot: (time: string) => void;
  onCheckout: () => void;
  onBack: () => void;
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

function fmtCurrency(price: number, currency: string) {
  return (currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency + ' ') + price.toLocaleString();
}

// Text color that sits on top of each theme's accent (used on the CTA buttons).
const CTA_TEXT: Record<string, string> = {
  ankara: '#FFFFFF', midnight: '#0B0B0F', harmattan: '#FFFFFF', neon: '#FFFFFF',
  sunset: '#111111', mono: '#FFFFFF', blush: '#FFFFFF', rose: '#FFFFFF',
  pearl: '#4A3B52', cherry: '#1A1A1A', quiet: '#FFFFFF', concrete: '#FFFFFF',
  chrome: '#0A0A0A',
};

const DISPLAY_FONTS: Record<string, string> = {
  ankara: "'Arial Black', Impact, sans-serif",
  midnight: "Georgia, 'Times New Roman', serif",
  harmattan: "Georgia, serif",
  neon: "'Arial Narrow', 'Helvetica Neue', sans-serif",
  sunset: "Verdana, system-ui, sans-serif",
  mono: "'Helvetica Neue', Arial, sans-serif",
  blush: "Georgia, serif",
  rose: "Georgia, serif",
  pearl: "Verdana, system-ui, sans-serif",
  cherry: "'Arial Black', Impact, sans-serif",
  quiet: "'Helvetica Neue', Arial, sans-serif",
  concrete: "Arial, 'Helvetica Neue', sans-serif",
  chrome: "Arial, 'Helvetica Neue', sans-serif",
};

function displayFont(theme: string) {
  return DISPLAY_FONTS[theme] || 'var(--sf-font)';
}

function isFlat(theme: string) {
  return theme === 'harmattan' || theme === 'quiet' || theme === 'rose' || theme === 'mono';
}

function cardStyle(theme: string): React.CSSProperties {
  const base: React.CSSProperties = {
    background: 'var(--sf-surface)',
    border: '1px solid var(--sf-border)',
    borderRadius: theme === 'mono' ? 0 : 'var(--sf-radius)',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  };
  if (theme === 'harmattan') {
    return { ...base, borderRadius: 0, border: 'none', borderBottom: '1px solid var(--sf-border)', background: 'transparent', padding: '14px 2px' };
  }
  if (theme === 'quiet') {
    return { ...base, borderRadius: 0, border: 'none', borderTop: '1px solid var(--sf-border)', background: 'transparent', padding: '14px 0' };
  }
  if (theme === 'rose') {
    return { ...base, borderRadius: 0, border: 'none', borderBottom: '1px solid var(--sf-border)', background: 'transparent', padding: '14px 0' };
  }
  if (theme === 'neon') {
    return { ...base, border: '1px solid var(--sf-accent-2, #00F0FF)' };
  }
  if (theme === 'midnight') {
    return { ...base, border: '1px solid var(--sf-border, #C9A227)' };
  }
  if (theme === 'sunset' || theme === 'pearl' || theme === 'chrome') {
    return { ...base, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' };
  }
  if (theme === 'cherry') {
    return { ...base, boxShadow: '0 3px 0 #C81E45' };
  }
  return base;
}

function inputStyle(theme: string): React.CSSProperties {
  return {
    width: '100%', padding: '11px 14px',
    border: theme === 'mono' ? '2px solid var(--sf-border)' : '1px solid var(--sf-border)',
    borderRadius: theme === 'mono' || theme === 'harmattan' ? 0 : 'var(--sf-radius-sm)',
    fontSize: '0.85rem',
    background: theme === 'harmattan' ? 'transparent' : 'var(--sf-bg)',
    color: 'var(--sf-text-1)',
    outline: 'none', boxSizing: 'border-box',
  };
}

function labelStyle(theme: string): React.CSSProperties {
  const base: React.CSSProperties = { display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--sf-text-2)', marginBottom: 5 };
  if (theme === 'harmattan' || theme === 'neon') return { ...base, textTransform: 'uppercase', letterSpacing: '0.06em' };
  return base;
}

function titleStyle(theme: string): React.CSSProperties {
  const base: React.CSSProperties = { margin: 0, fontWeight: 700, fontSize: '0.92rem', fontFamily: displayFont(theme) };
  if (theme === 'neon' || theme === 'mono' || theme === 'concrete') return { ...base, textTransform: 'uppercase', letterSpacing: '0.04em' };
  if (theme === 'rose') return { ...base, letterSpacing: '0.08em', textTransform: 'uppercase' };
  return base;
}

// ─── Shared presentational blocks ─────────────────────────────────────────────

function Deco({ theme }: { theme: string }) {
  const fill: React.CSSProperties = { position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 };
  switch (theme) {
    case 'ankara':
      return <div style={{ ...fill, opacity: 0.35, background: 'repeating-linear-gradient(45deg, var(--sf-accent-2, #00A896) 0 10px, transparent 10px 20px)' }} />;
    case 'neon':
    case 'chrome':
      return <div style={{ ...fill, opacity: 0.12, background: 'repeating-linear-gradient(0deg, #fff 0 1px, transparent 1px 3px)' }} />;
    case 'sunset':
      return (
        <>
          <div style={{ position: 'absolute', top: -60, left: -40, width: 170, height: 170, borderRadius: '50%', background: 'var(--sf-accent-2, #FFD24C)', opacity: 0.5, filter: 'blur(48px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 80, right: -60, width: 150, height: 150, borderRadius: '50%', background: '#6E3AFF', opacity: 0.5, filter: 'blur(48px)', pointerEvents: 'none' }} />
        </>
      );
    case 'pearl':
      return <div style={{ ...fill, opacity: 0.4, background: 'repeating-linear-gradient(115deg, rgba(255,255,255,0.6) 0px, rgba(255,255,255,0.6) 2px, transparent 2px, transparent 18px)' }} />;
    case 'cherry':
      return <div style={{ ...fill, opacity: 0.25, backgroundImage: 'radial-gradient(#fff 1.5px, transparent 1.5px)', backgroundSize: '14px 14px' }} />;
    case 'rose':
      return (
        <>
          <div style={{ position: 'absolute', top: 24, left: 24, right: 24, height: 1, background: 'var(--sf-accent, #C97B8B)', opacity: 0.5, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 32, left: 40, right: 40, height: 1, background: 'var(--sf-accent, #C97B8B)', opacity: 0.25, pointerEvents: 'none' }} />
        </>
      );
    case 'quiet':
      return <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'var(--sf-accent, #B08968)', opacity: 0.5, pointerEvents: 'none' }} />;
    case 'concrete':
      return <div style={{ ...fill, opacity: 0.5, backgroundImage: 'linear-gradient(var(--sf-border, #D4D1C8) 1px, transparent 1px), linear-gradient(90deg, var(--sf-border, #D4D1C8) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />;
    default:
      return null;
  }
}

function Shell({ theme, children, deco }: { theme: string; children: React.ReactNode; deco?: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--sf-bg)',
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--sf-font)',
      color: 'var(--sf-text-1)',
      padding: '24px 16px 80px',
      boxSizing: 'border-box',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .sf-link-input::placeholder { color: var(--sf-text-3); opacity: 1; }`}</style>
      {deco}
      <div style={{ maxWidth: 500, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18, position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}

function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}>
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );
}

function BackBar({ theme, storeName, onBack }: { theme: string; storeName?: string; onBack: () => void }) {
  const style: React.CSSProperties = {
    background: 'var(--sf-surface)',
    border: '1px solid var(--sf-border)',
    color: 'var(--sf-text-1)',
    padding: '8px 14px',
    borderRadius: theme === 'mono' ? 0 : 'var(--sf-radius-sm)',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  };
  if (theme === 'harmattan') {
    style.border = 'none'; style.borderRadius = 0; style.background = 'transparent'; style.padding = '6px 0';
  }
  if (theme === 'quiet' || theme === 'rose') {
    style.border = 'none'; style.borderRadius = 0; style.background = 'transparent'; style.padding = '6px 0';
  }
  if (theme === 'cherry') {
    style.border = '1px solid var(--sf-border, #C81E45)'; style.boxShadow = '0 2px 0 var(--sf-border, #C81E45)'; style.color = '#FFFFFF';
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--sf-border)', paddingBottom: 12 }}>
      <button onClick={onBack} style={style}>
        <span>←</span> Back to store
      </button>
      <span style={{ fontSize: '0.8rem', color: 'var(--sf-text-2)', fontFamily: displayFont(theme) }}>{storeName}</span>
    </div>
  );
}

function Media({ theme, product, index }: { theme: string; product: LinkBioProduct; index?: number }) {
  const border = theme === 'harmattan' ? 'none' : theme === 'mono' ? '2px solid var(--sf-border)' : '1px solid var(--sf-border)';
  const imgStyle: React.CSSProperties = {
    width: '100%', aspectRatio: '16/10', objectFit: 'cover', display: 'block',
    borderRadius: theme === 'mono' ? 0 : 'var(--sf-radius)',
    border,
  };
  const phStyle: React.CSSProperties = {
    ...imgStyle,
    background: 'var(--sf-surface)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem',
  };

  if (theme === 'neon') {
    return (
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 'var(--sf-radius)', border: '2px solid var(--sf-accent, #FF2E9A)', opacity: 0.7, transform: 'translate(6px, 6px)' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: 'var(--sf-radius)', border: '2px solid var(--sf-accent-2, #00F0FF)', opacity: 0.7, transform: 'translate(-6px, -6px)' }} />
        {product.images[0] ? <img src={product.images[0]} alt={product.displayName} style={imgStyle} /> : <div style={phStyle}>📦</div>}
      </div>
    );
  }

  if (theme === 'midnight') {
    return (
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', inset: -8, borderRadius: 'calc(var(--sf-radius) + 8px)', border: '1px solid var(--sf-border, #C9A227)', opacity: 0.6 }} />
        {product.images[0] ? <img src={product.images[0]} alt={product.displayName} style={imgStyle} /> : <div style={phStyle}>📦</div>}
      </div>
    );
  }

  if (theme === 'mono') {
    return (
      <div style={{ position: 'relative' }}>
        {product.images[0] ? <img src={product.images[0]} alt={product.displayName} style={imgStyle} /> : <div style={phStyle}>📦</div>}
        <div style={{
          position: 'absolute', top: -10, right: -8, transform: 'rotate(8deg)',
          background: 'var(--sf-accent, #FF0000)', color: '#fff',
          padding: '4px 12px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>{product.category || 'Product'}</div>
      </div>
    );
  }

  if (theme === 'cherry') {
    const rot = ((index ?? 0) % 2 === 0 ? -2 : 2);
    return (
      <div style={{ transform: 'rotate(' + rot + 'deg)' }}>
        {product.images[0] ? <img src={product.images[0]} alt={product.displayName} style={imgStyle} /> : <div style={phStyle}>📦</div>}
      </div>
    );
  }

  if (theme === 'harmattan') {
    return (
      <div>
        {product.images[0] ? <img src={product.images[0]} alt={product.displayName} style={imgStyle} /> : <div style={phStyle}>📦</div>}
      </div>
    );
  }

  if (theme === 'concrete') {
    return (
      <div style={{ border: '1px solid var(--sf-border)', padding: 6 }}>
        {product.images[0] ? <img src={product.images[0]} alt={product.displayName} style={{ ...imgStyle, border: 'none', borderRadius: 0 }} /> : <div style={{ ...phStyle, border: 'none', borderRadius: 0, background: 'var(--sf-surface)' }}>📦</div>}
      </div>
    );
  }

  return product.images[0] ? <img src={product.images[0]} alt={product.displayName} style={imgStyle} /> : <div style={phStyle}>📦</div>;
}

function InfoBlock({ theme, product, primaryColor, currency, discount }: {
  theme: string; product: LinkBioProduct; primaryColor: string; currency: string; discount: number | null;
}) {
  const priceColor = theme === 'mono' || theme === 'chrome' ? 'var(--sf-accent, #FF0000)' : 'var(--sf-accent, ' + primaryColor + ')';
  const nameStyle: React.CSSProperties = { margin: 0, fontSize: '1.45rem', fontWeight: 800, fontFamily: displayFont(theme) };
  if (theme === 'neon' || theme === 'mono' || theme === 'concrete') {
    nameStyle.textTransform = 'uppercase'; nameStyle.letterSpacing = '0.02em';
  }
  if (theme === 'midnight' || theme === 'rose' || theme === 'harmattan' || theme === 'blush') {
    nameStyle.fontWeight = 600;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--sf-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', ...(theme === 'harmattan' || theme === 'neon' ? { fontFamily: 'var(--sf-font)' } : {}) }}>{product.category}</span>
        {discount ? (
          <span style={{
            fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px',
            borderRadius: theme === 'mono' ? 0 : 20,
            background: theme === 'mono' ? 'var(--sf-accent, #FF0000)' : 'rgba(239,68,68,0.15)',
            color: theme === 'mono' ? '#fff' : '#DC2626',
          }}>-{discount}% OFF</span>
        ) : null}
      </div>
      <h1 style={nameStyle}>{product.displayName}</h1>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
        <span style={{ fontSize: '1.4rem', fontWeight: 800, color: priceColor }}>{fmtCurrency(product.price, currency)}</span>
        {product.compareAtPrice && product.compareAtPrice > product.price ? (
          <span style={{ fontSize: '0.95rem', color: 'var(--sf-text-3)', textDecoration: 'line-through' }}>{fmtCurrency(product.compareAtPrice, currency)}</span>
        ) : null}
      </div>
    </div>
  );
}

function EventDetails({ theme, product }: { theme: string; product: LinkBioProduct }) {
  if (product.digitalSubtype !== 'ticket' || (!product.eventDate && !product.venue)) return null;
  const rows: { k: string; v: string }[] = [];
  if (product.eventDate) {
    rows.push({
      k: 'Date',
      v: new Date(product.eventDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) + (product.eventTime ? ' at ' + product.eventTime : ''),
    });
  }
  if (product.venue) rows.push({ k: 'Venue', v: product.venue });
  if (product.capacity) rows.push({ k: 'Capacity', v: String(product.capacity) + ' guests' });

  const isEditorial = theme === 'rose' || theme === 'quiet';
  return (
    <div style={cardStyle(theme)}>
      {!isEditorial && <p style={titleStyle(theme)}>📅 Event Details</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: isEditorial ? 0 : 8 }}>
        {rows.map((r, i) => (
          <div key={r.k} style={{ display: 'flex', alignItems: isEditorial ? 'baseline' : 'center', gap: 12, padding: isEditorial ? '8px 0' : 0, ...(isEditorial ? { borderBottom: i < rows.length - 1 ? '1px solid var(--sf-border)' : 'none' } : {}) }}>
            {isEditorial && <span style={{ fontSize: 9, color: 'var(--sf-accent)', fontFamily: 'system-ui, sans-serif' }}>{String(i + 1).padStart(2, '0')}</span>}
            <span style={{ fontSize: '0.8rem', color: 'var(--sf-text-2)', fontWeight: 600, minWidth: 70 }}>{r.k}:</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--sf-text-1)' }}>{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Description({ theme, product }: { theme: string; product: LinkBioProduct }) {
  if (!product.description) return null;
  return (
    <div className="product-rich-description" style={{
      borderTop: isFlat(theme) ? 'none' : '1px solid var(--sf-border)',
      borderBottom: theme === 'quiet' ? '1px solid var(--sf-border)' : 'none',
      paddingTop: isFlat(theme) ? 0 : 16,
      paddingBottom: theme === 'quiet' ? 14 : 0,
      fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--sf-text-2)', overflowWrap: 'break-word',
    }} dangerouslySetInnerHTML={{ __html: product.description }} />
  );
}

function SlotPicker({ theme, p }: { theme: string; p: LinkBioProductPageProps }) {
  if (!p.needsSlot || !p.businessId) return null;
  const isEditorial = theme === 'rose' || theme === 'quiet';
  const sectionNum = isEditorial ? '01' : null;
  return (
    <div style={cardStyle(theme)}>
      {isEditorial ? (
        <p style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ fontSize: 9, color: 'var(--sf-accent)', fontFamily: 'system-ui, sans-serif' }}>{sectionNum}</span>
          <span style={titleStyle(theme)}>Schedule Your Slot</span>
        </p>
      ) : (
        <p style={titleStyle(theme)}>📅 Schedule Your Slot</p>
      )}
      <div>
        <label style={labelStyle(theme)}>Select Date</label>
        <input
          type="date"
          value={p.selectedDate}
          min={p.today}
          onChange={p.onDateChange}
          className="sf-link-input"
          style={inputStyle(theme)}
        />
      </div>
      {p.selectedDate && (
        <div>
          <label style={{ ...labelStyle(theme), marginBottom: 8 }}>Available times for {p.formattedDate}</label>
          {p.loadingSlots ? (
            <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--sf-text-2)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Spinner /> Loading slots…
            </div>
          ) : p.slots.length === 0 ? (
            <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--sf-text-3)', fontSize: '0.8rem' }}>No slots available. Try another date.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
              {p.slots.map(slot => {
                const selected = p.selectedSlot === slot.time;
                return (
                  <button
                    key={slot.time}
                    disabled={!slot.available}
                    onClick={() => p.onSelectSlot(slot.time)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: theme === 'mono' ? 0 : 8,
                      border: selected ? '2px solid var(--sf-accent)' : '1px solid var(--sf-border)',
                      background: selected ? 'var(--sf-accent)' : 'var(--sf-bg)',
                      color: selected ? CTA_TEXT[theme] || '#fff' : 'var(--sf-text-1)',
                      fontWeight: selected ? 700 : 500,
                      fontSize: '0.8rem',
                      cursor: slot.available ? 'pointer' : 'not-allowed',
                      opacity: slot.available ? 1 : 0.35,
                      transition: '0.15s',
                    }}
                  >
                    {slot.time}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ContactForm({ theme, p }: { theme: string; p: LinkBioProductPageProps }) {
  const isEditorial = theme === 'rose' || theme === 'quiet';
  const sectionNum = isEditorial ? '02' : null;
  return (
    <div style={cardStyle(theme)}>
      {isEditorial ? (
        <p style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <span style={{ fontSize: 9, color: 'var(--sf-accent)', fontFamily: 'system-ui, sans-serif' }}>{sectionNum}</span>
          <span style={titleStyle(theme)}>Contact Details</span>
        </p>
      ) : (
        <p style={titleStyle(theme)}>👤 Contact Details</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {p.wantsName && (
          <div>
            <label style={labelStyle(theme)}>Full name *</label>
            <input
              className="sf-link-input"
              type="text"
              placeholder="John Doe"
              value={p.name}
              onChange={e => p.onNameChange(e.target.value)}
              style={inputStyle(theme)}
            />
          </div>
        )}
        <div>
          <label style={labelStyle(theme)}>Email address *</label>
          <input
            className="sf-link-input"
            type="email"
            placeholder="john@example.com"
            value={p.email}
            onChange={e => p.onEmailChange(e.target.value)}
            style={inputStyle(theme)}
          />
        </div>
        {p.wantsPhone && (
          <div>
            <label style={labelStyle(theme)}>Phone number *</label>
            <input
              className="sf-link-input"
              type="tel"
              placeholder="+234 800 000 0000"
              value={p.phone}
              onChange={e => p.onPhoneChange(e.target.value)}
              style={inputStyle(theme)}
            />
          </div>
        )}
        <div>
          <label style={labelStyle(theme)}>Notes (optional)</label>
          <textarea
            className="sf-link-input"
            placeholder="Special requests for this order"
            value={p.notes}
            onChange={e => p.onNotesChange(e.target.value)}
            rows={2}
            style={{ ...inputStyle(theme), resize: 'vertical' }}
          />
        </div>
      </div>
    </div>
  );
}

function ErrorBox({ error, theme }: { error: string; theme: string }) {
  if (!error) return null;
  return (
    <div style={{
      padding: '10px 14px',
      background: theme === 'mono' ? 'var(--sf-surface)' : 'rgba(220,38,38,0.1)',
      border: theme === 'mono' ? '2px solid var(--sf-accent, #FF0000)' : '1px solid rgba(220,38,38,0.35)',
      borderRadius: theme === 'mono' ? 0 : 10,
      color: theme === 'mono' ? 'var(--sf-accent, #FF0000)' : '#DC2626',
      fontSize: '0.8rem', lineHeight: 1.4,
    }}>
      ⚠️ {error}
    </div>
  );
}

function CtaButton({ theme, p, label }: { theme: string; p: LinkBioProductPageProps; label: string }) {
  return (
    <button
      onClick={p.onCheckout}
      disabled={p.processing}
      style={{
        width: '100%',
        padding: '16px',
        borderRadius: theme === 'mono' || theme === 'harmattan' ? 0 : 'var(--sf-radius)',
        border: 'none',
        background: 'var(--sf-accent)',
        color: CTA_TEXT[theme] || '#fff',
        fontSize: '0.95rem',
        fontWeight: 700,
        fontFamily: displayFont(theme),
        textTransform: theme === 'neon' || theme === 'mono' || theme === 'concrete' ? 'uppercase' : 'none',
        letterSpacing: theme === 'neon' ? '0.04em' : 'none',
        cursor: p.processing ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        opacity: p.processing ? 0.75 : 1,
        boxShadow: theme === 'cherry' ? '0 3px 0 #C81E45' : 'none',
        transition: 'background 0.2s, opacity 0.2s',
      }}
    >
      {p.processing ? (
        <>
          <Spinner size={18} /> Processing Payment…
        </>
      ) : (
        label
      )}
    </button>
  );
}

function SecureText({ theme }: { theme: string }) {
  return (
    <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--sf-text-3)', textAlign: 'center', fontFamily: theme === 'harmattan' || theme === 'neon' || theme === 'concrete' ? 'var(--sf-font)' : displayFont(theme) }}>
      Secure checkout powered by Paystack
    </p>
  );
}

function SuccessCard({ theme, p }: { theme: string; p: LinkBioProductPageProps }) {
  return (
    <div style={{
      background: 'var(--sf-surface)',
      border: theme === 'mono' ? '2px solid var(--sf-border)' : '1px solid var(--sf-border)',
      borderRadius: theme === 'mono' ? 0 : 'var(--sf-radius)',
      padding: '40px 24px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16,
      boxShadow: theme === 'cherry' ? '0 3px 0 #C81E45' : 'none',
    }}>
      <div style={{ fontSize: '3.5rem' }}>✅</div>
      <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, fontFamily: displayFont(theme), ...(theme === 'neon' || theme === 'mono' ? { textTransform: 'uppercase' } : {}) }}>Payment Successful!</h2>
      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--sf-text-2)', lineHeight: 1.6 }}>
        {p.product.productType === 'digital'
          ? 'Your download link and order confirmation have been sent to your email.'
          : p.product.productType === 'service'
            ? `Your booking for ${p.formattedDate} @ ${p.selectedSlot} has been successfully secured and confirmed.`
            : 'Your order has been received. We\'ll notify you when it is processed.'}
      </p>
      {p.orderId && (
        <span style={{ fontSize: '0.75rem', color: 'var(--sf-text-3)' }}>Order ID: {p.orderId}</span>
      )}
      <button
        onClick={p.onBack}
        style={{
          marginTop: 8,
          padding: '12px 24px',
          borderRadius: theme === 'mono' ? 0 : 'var(--sf-radius)',
          border: 'none',
          background: 'var(--sf-accent)',
          color: CTA_TEXT[theme] || '#fff',
          fontWeight: 700,
          fontSize: '0.9rem',
          cursor: 'pointer',
          fontFamily: displayFont(theme),
        }}
      >
        Continue Shopping
      </button>
    </div>
  );
}

function formLabel(p: LinkBioProductPageProps) {
  return p.product.callToAction?.trim() || (p.needsSlot ? 'Confirm Booking & Pay Now' : 'Buy Now with Paystack');
}

/* ─── 1. ankara — stripes ───────────────────────────────────────────────────── */

export function AnkaraProductPage(p: LinkBioProductPageProps) {
  const theme = 'ankara'; const product = p.product;
  return (
    <Shell theme={theme} deco={<Deco theme={theme} />}>
      <div style={{ width: '100%', height: 14, flexShrink: 0, opacity: 0.35, background: 'repeating-linear-gradient(45deg, var(--sf-accent-2, #00A896) 0 10px, transparent 10px 20px)' }} />
      <BackBar theme={theme} storeName={p.storeName} onBack={p.onBack} />
      {p.success ? <SuccessCard theme={theme} p={p} /> : (
        <>
          <Media theme={theme} product={product} />
          <InfoBlock theme={theme} product={product} primaryColor={p.primaryColor} currency={p.currency} discount={p.discount} />
          <EventDetails theme={theme} product={product} />
          <Description theme={theme} product={product} />
          <SlotPicker theme={theme} p={p} />
          <ContactForm theme={theme} p={p} />
          <ErrorBox error={p.error} theme={theme} />
          <CtaButton theme={theme} p={p} label={formLabel(p)} />
          <SecureText theme={theme} />
        </>
      )}
      <p style={{ margin: '8px 0 0', textAlign: 'center', fontSize: '0.68rem', color: 'var(--sf-text-3)' }}>@{p.storeSlug} — Powered by MO Sell</p>
    </Shell>
  );
}

/* ─── 2. midnight — gold frame ──────────────────────────────────────────────── */

export function MidnightProductPage(p: LinkBioProductPageProps) {
  const theme = 'midnight'; const product = p.product;
  return (
    <Shell theme={theme}>
      <div style={{ border: '1px solid var(--sf-border, #C9A227)', padding: '16px 16px 20px', borderRadius: 'var(--sf-radius-lg)', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 5, border: '1px solid var(--sf-border, #C9A227)', opacity: 0.35, borderRadius: 'calc(var(--sf-radius-lg) - 4px)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <BackBar theme={theme} storeName={p.storeName} onBack={p.onBack} />
          {p.success ? <SuccessCard theme={theme} p={p} /> : (
            <>
              <Media theme={theme} product={product} />
              <InfoBlock theme={theme} product={product} primaryColor={p.primaryColor} currency={p.currency} discount={p.discount} />
              <EventDetails theme={theme} product={product} />
              <Description theme={theme} product={product} />
              <SlotPicker theme={theme} p={p} />
              <ContactForm theme={theme} p={p} />
              <ErrorBox error={p.error} theme={theme} />
              <CtaButton theme={theme} p={p} label={formLabel(p)} />
              <SecureText theme={theme} />
            </>
          )}
        </div>
      </div>
      <p style={{ margin: '8px 0 0', textAlign: 'center', fontSize: '0.68rem', letterSpacing: '0.1em', color: 'var(--sf-text-3)' }}>— @{p.storeSlug} —</p>
    </Shell>
  );
}

/* ─── 3. harmattan — horizon bar ────────────────────────────────────────────── */

export function HarmattanProductPage(p: LinkBioProductPageProps) {
  const theme = 'harmattan'; const product = p.product;
  return (
    <Shell theme={theme}>
      <div style={{ width: '100%', height: 6, flexShrink: 0, background: 'linear-gradient(90deg, var(--sf-accent-2, #8A7A62), var(--sf-accent, #4C6B8A))' }} />
      <BackBar theme={theme} storeName={p.storeName} onBack={p.onBack} />
      {p.success ? <SuccessCard theme={theme} p={p} /> : (
        <>
          <Media theme={theme} product={product} />
          <InfoBlock theme={theme} product={product} primaryColor={p.primaryColor} currency={p.currency} discount={p.discount} />
          <EventDetails theme={theme} product={product} />
          <Description theme={theme} product={product} />
          <SlotPicker theme={theme} p={p} />
          <ContactForm theme={theme} p={p} />
          <ErrorBox error={p.error} theme={theme} />
          <CtaButton theme={theme} p={p} label={formLabel(p)} />
          <SecureText theme={theme} />
        </>
      )}
      <p style={{ margin: '8px 0 0', textAlign: 'center', fontSize: '0.68rem', color: 'var(--sf-text-3)' }}>@{p.storeSlug} · Powered by MO Sell</p>
    </Shell>
  );
}

/* ─── 4. neon — scan lines ──────────────────────────────────────────────────── */

export function NeonProductPage(p: LinkBioProductPageProps) {
  const theme = 'neon'; const product = p.product;
  return (
    <Shell theme={theme} deco={<Deco theme={theme} />}>
      <BackBar theme={theme} storeName={p.storeName} onBack={p.onBack} />
      {p.success ? <SuccessCard theme={theme} p={p} /> : (
        <>
          <Media theme={theme} product={product} />
          <InfoBlock theme={theme} product={product} primaryColor={p.primaryColor} currency={p.currency} discount={p.discount} />
          <EventDetails theme={theme} product={product} />
          <Description theme={theme} product={product} />
          <SlotPicker theme={theme} p={p} />
          <ContactForm theme={theme} p={p} />
          <ErrorBox error={p.error} theme={theme} />
          <CtaButton theme={theme} p={p} label={formLabel(p)} />
          <SecureText theme={theme} />
        </>
      )}
      <p style={{ margin: '8px 0 0', textAlign: 'center', fontSize: '0.68rem', color: 'var(--sf-text-3)' }}>@{p.storeSlug} — Powered by MO Sell</p>
    </Shell>
  );
}

/* ─── 5. sunset — gradient blobs ────────────────────────────────────────────── */

export function SunsetProductPage(p: LinkBioProductPageProps) {
  const theme = 'sunset'; const product = p.product;
  return (
    <Shell theme={theme} deco={<Deco theme={theme} />}>
      <BackBar theme={theme} storeName={p.storeName} onBack={p.onBack} />
      {p.success ? <SuccessCard theme={theme} p={p} /> : (
        <>
          <Media theme={theme} product={product} />
          <InfoBlock theme={theme} product={product} primaryColor={p.primaryColor} currency={p.currency} discount={p.discount} />
          <EventDetails theme={theme} product={product} />
          <Description theme={theme} product={product} />
          <SlotPicker theme={theme} p={p} />
          <ContactForm theme={theme} p={p} />
          <ErrorBox error={p.error} theme={theme} />
          <CtaButton theme={theme} p={p} label={formLabel(p)} />
          <SecureText theme={theme} />
        </>
      )}
      <p style={{ margin: '8px 0 0', textAlign: 'center', fontSize: '0.68rem', color: 'var(--sf-text-3)' }}>@{p.storeSlug} — Powered by MO Sell</p>
    </Shell>
  );
}

/* ─── 6. mono — stamp / hard borders ────────────────────────────────────────── */

export function MonoProductPage(p: LinkBioProductPageProps) {
  const theme = 'mono'; const product = p.product;
  return (
    <Shell theme={theme}>
      <BackBar theme={theme} storeName={p.storeName} onBack={p.onBack} />
      {p.success ? <SuccessCard theme={theme} p={p} /> : (
        <>
          <Media theme={theme} product={product} />
          <InfoBlock theme={theme} product={product} primaryColor={p.primaryColor} currency={p.currency} discount={p.discount} />
          <EventDetails theme={theme} product={product} />
          <Description theme={theme} product={product} />
          <SlotPicker theme={theme} p={p} />
          <ContactForm theme={theme} p={p} />
          <ErrorBox error={p.error} theme={theme} />
          <CtaButton theme={theme} p={p} label={formLabel(p)} />
          <SecureText theme={theme} />
        </>
      )}
      <p style={{ margin: '8px 0 0', textAlign: 'center', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--sf-text-3)' }}>@{p.storeSlug} · MO SELL</p>
    </Shell>
  );
}

/* ─── 7. blush — soft tile grid ─────────────────────────────────────────────── */

export function BlushProductPage(p: LinkBioProductPageProps) {
  const theme = 'blush'; const product = p.product;
  return (
    <Shell theme={theme}>
      <BackBar theme={theme} storeName={p.storeName} onBack={p.onBack} />
      {p.success ? <SuccessCard theme={theme} p={p} /> : (
        <>
          <Media theme={theme} product={product} />
          <InfoBlock theme={theme} product={product} primaryColor={p.primaryColor} currency={p.currency} discount={p.discount} />
          <EventDetails theme={theme} product={product} />
          <Description theme={theme} product={product} />
          <SlotPicker theme={theme} p={p} />
          <ContactForm theme={theme} p={p} />
          <ErrorBox error={p.error} theme={theme} />
          <CtaButton theme={theme} p={p} label={formLabel(p)} />
          <SecureText theme={theme} />
        </>
      )}
      <p style={{ margin: '8px 0 0', textAlign: 'center', fontSize: '0.68rem', color: 'var(--sf-text-3)' }}>@{p.storeSlug} — Powered by MO Sell</p>
    </Shell>
  );
}

/* ─── 8. rose — masthead + numbered index ───────────────────────────────────── */

export function RoseProductPage(p: LinkBioProductPageProps) {
  const theme = 'rose'; const product = p.product;
  return (
    <Shell theme={theme} deco={<Deco theme={theme} />}>
      <BackBar theme={theme} storeName={p.storeName} onBack={p.onBack} />
      <div style={{ textAlign: 'center', paddingTop: 8 }}>
        <p style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1, fontFamily: displayFont(theme), color: 'var(--sf-text-1)' }}>{product.displayName}</p>
        <p style={{ margin: '8px 0 0', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--sf-text-2)' }}>{product.category}</p>
      </div>
      {p.success ? <SuccessCard theme={theme} p={p} /> : (
        <>
          <Media theme={theme} product={product} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--sf-border)' }}>
            <span style={{ fontSize: 9, color: 'var(--sf-accent)', fontFamily: 'system-ui, sans-serif' }}>00</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--sf-text-1)', fontFamily: displayFont(theme) }}>{fmtCurrency(product.price, p.currency)}</span>
              {product.compareAtPrice && product.compareAtPrice > product.price ? (
                <span style={{ fontSize: 11, color: 'var(--sf-text-3)', textDecoration: 'line-through' }}>{fmtCurrency(product.compareAtPrice, p.currency)}</span>
              ) : null}
            </div>
          </div>
          <Description theme={theme} product={product} />
          <EventDetails theme={theme} product={product} />
          <SlotPicker theme={theme} p={p} />
          <ContactForm theme={theme} p={p} />
          <ErrorBox error={p.error} theme={theme} />
          <CtaButton theme={theme} p={p} label={formLabel(p)} />
          <SecureText theme={theme} />
        </>
      )}
      <p style={{ margin: '8px 0 0', textAlign: 'center', fontSize: '0.68rem', color: 'var(--sf-text-3)' }}>— @{p.storeSlug} —</p>
    </Shell>
  );
}

/* ─── 9. pearl — glass hero card ────────────────────────────────────────────── */

export function PearlProductPage(p: LinkBioProductPageProps) {
  const theme = 'pearl'; const product = p.product;
  return (
    <Shell theme={theme} deco={<Deco theme={theme} />}>
      <BackBar theme={theme} storeName={p.storeName} onBack={p.onBack} />
      {p.success ? <SuccessCard theme={theme} p={p} /> : (
        <>
          <div style={{ borderRadius: 'var(--sf-radius-lg)', overflow: 'hidden', background: 'var(--sf-surface)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid var(--sf-border)' }}>
            <Media theme={theme} product={product} />
            <div style={{ padding: '14px 16px 16px' }}>
              <InfoBlock theme={theme} product={product} primaryColor={p.primaryColor} currency={p.currency} discount={p.discount} />
            </div>
          </div>
          <Description theme={theme} product={product} />
          <EventDetails theme={theme} product={product} />
          <SlotPicker theme={theme} p={p} />
          <ContactForm theme={theme} p={p} />
          <ErrorBox error={p.error} theme={theme} />
          <CtaButton theme={theme} p={p} label={formLabel(p)} />
          <SecureText theme={theme} />
        </>
      )}
      <p style={{ margin: '8px 0 0', textAlign: 'center', fontSize: '0.68rem', color: 'var(--sf-text-3)' }}>@{p.storeSlug} — Powered by MO Sell</p>
    </Shell>
  );
}

/* ─── 10. cherry — sticker collage ──────────────────────────────────────────── */

export function CherryProductPage(p: LinkBioProductPageProps) {
  const theme = 'cherry'; const product = p.product;
  return (
    <Shell theme={theme} deco={<Deco theme={theme} />}>
      <BackBar theme={theme} storeName={p.storeName} onBack={p.onBack} />
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.15, color: '#FFFFFF', fontFamily: displayFont(theme) }}>{product.displayName}</p>
        <p style={{ margin: '6px 0 0', fontSize: 10, color: '#FFFFFF', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{product.category}</p>
      </div>
      {p.success ? <SuccessCard theme={theme} p={p} /> : (
        <>
          <Media theme={theme} product={product} index={0} />
          <div style={{ background: '#FFFFFF', borderRadius: 16, padding: '14px 16px', transform: 'rotate(1.5deg)', boxShadow: '0 3px 0 #C81E45' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1A1A1A', fontFamily: displayFont(theme) }}>{fmtCurrency(product.price, p.currency)}</span>
              {product.compareAtPrice && product.compareAtPrice > product.price ? (
                <span style={{ fontSize: '0.9rem', color: '#1A1A1A', opacity: 0.5, textDecoration: 'line-through' }}>{fmtCurrency(product.compareAtPrice, p.currency)}</span>
              ) : null}
            </div>
            {p.discount ? (
              <span style={{ display: 'inline-block', marginTop: 6, fontSize: 10, fontWeight: 700, background: '#FFD400', color: '#1A1A1A', padding: '2px 8px', borderRadius: 999 }}>-{p.discount}% OFF</span>
            ) : null}
          </div>
          <Description theme={theme} product={product} />
          <EventDetails theme={theme} product={product} />
          <SlotPicker theme={theme} p={p} />
          <ContactForm theme={theme} p={p} />
          <ErrorBox error={p.error} theme={theme} />
          <CtaButton theme={theme} p={p} label={formLabel(p)} />
          <SecureText theme={theme} />
        </>
      )}
      <p style={{ margin: '8px 0 0', textAlign: 'center', fontSize: '0.68rem', color: 'var(--sf-text-3)' }}>@{p.storeSlug} — Powered by MO Sell</p>
    </Shell>
  );
}

/* ─── 11. quiet — minimal list ──────────────────────────────────────────────── */

export function QuietProductPage(p: LinkBioProductPageProps) {
  const theme = 'quiet'; const product = p.product;
  return (
    <Shell theme={theme} deco={<Deco theme={theme} />}>
      <BackBar theme={theme} storeName={p.storeName} onBack={p.onBack} />
      {p.success ? <SuccessCard theme={theme} p={p} /> : (
        <>
          <Media theme={theme} product={product} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '12px 0', borderTop: '1px solid var(--sf-border)' }}>
              <span style={{ fontSize: 9, color: 'var(--sf-accent)', fontFamily: 'system-ui, sans-serif' }}>01</span>
              <span style={{ flex: 1, fontSize: '1rem', fontWeight: 500, color: 'var(--sf-text-1)' }}>{product.displayName}</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--sf-accent)' }}>{fmtCurrency(product.price, p.currency)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--sf-border)' }}>
              <span style={{ fontSize: 9, color: 'var(--sf-accent)', fontFamily: 'system-ui, sans-serif' }}>02</span>
              <span style={{ flex: 1, fontSize: '0.8rem', color: 'var(--sf-text-2)' }}>{product.category}</span>
              {product.compareAtPrice && product.compareAtPrice > product.price ? (
                <span style={{ fontSize: '0.75rem', color: 'var(--sf-text-3)', textDecoration: 'line-through' }}>{fmtCurrency(product.compareAtPrice, p.currency)}</span>
              ) : null}
            </div>
          </div>
          <Description theme={theme} product={product} />
          <EventDetails theme={theme} product={product} />
          <SlotPicker theme={theme} p={p} />
          <ContactForm theme={theme} p={p} />
          <ErrorBox error={p.error} theme={theme} />
          <CtaButton theme={theme} p={p} label={formLabel(p)} />
          <SecureText theme={theme} />
        </>
      )}
      <p style={{ margin: '8px 0 0', textAlign: 'center', fontSize: '0.68rem', color: 'var(--sf-text-3)' }}>@{p.storeSlug} — Powered by MO Sell</p>
    </Shell>
  );
}

/* ─── 12. concrete — block grid ─────────────────────────────────────────────── */

export function ConcreteProductPage(p: LinkBioProductPageProps) {
  const theme = 'concrete'; const product = p.product;
  const initials = product.displayName.charAt(0).toUpperCase();
  return (
    <Shell theme={theme} deco={<Deco theme={theme} />}>
      <BackBar theme={theme} storeName={p.storeName} onBack={p.onBack} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--sf-border)' }}>
        <div style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, background: 'var(--sf-accent)', color: '#FFFFFF', fontFamily: 'var(--sf-font)', border: '2px solid var(--sf-text-1)' }}>{initials}</div>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--sf-text-1)', fontFamily: 'var(--sf-font)' }}>{product.displayName}</p>
          <p style={{ margin: 0, fontSize: '9.5px', fontFamily: 'Courier New, monospace', color: 'var(--sf-text-2)' }}>{product.category}</p>
        </div>
      </div>
      {p.success ? <SuccessCard theme={theme} p={p} /> : (
        <>
          <Media theme={theme} product={product} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid var(--sf-border)' }}>
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8, borderRight: '1px solid var(--sf-border)', borderBottom: '1px solid var(--sf-border)' }}>
              <span style={{ display: 'block', fontSize: 8, fontFamily: 'Courier New, monospace', color: 'var(--sf-text-2)' }}>PRICE</span>
              <span style={{ display: 'block', fontSize: '1rem', fontWeight: 700, color: 'var(--sf-text-1)' }}>{fmtCurrency(product.price, p.currency)}</span>
            </div>
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8, borderBottom: '1px solid var(--sf-border)' }}>
              <span style={{ display: 'block', fontSize: 8, fontFamily: 'Courier New, monospace', color: 'var(--sf-text-2)' }}>DISCOUNT</span>
              <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--sf-text-1)' }}>
                {p.discount ? `-${p.discount}%` : '—'}
              </span>
            </div>
            {product.compareAtPrice && product.compareAtPrice > product.price ? (
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8, borderRight: '1px solid var(--sf-border)' }}>
                <span style={{ display: 'block', fontSize: 8, fontFamily: 'Courier New, monospace', color: 'var(--sf-text-2)' }}>WAS</span>
                <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--sf-text-3)', textDecoration: 'line-through' }}>{fmtCurrency(product.compareAtPrice, p.currency)}</span>
              </div>
            ) : (
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8, borderRight: '1px solid var(--sf-border)' }}>
                <span style={{ display: 'block', fontSize: 8, fontFamily: 'Courier New, monospace', color: 'var(--sf-text-2)' }}>STATUS</span>
                <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--sf-text-1)' }}>AVAILABLE</span>
              </div>
            )}
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ display: 'block', fontSize: 8, fontFamily: 'Courier New, monospace', color: 'var(--sf-text-2)' }}>CATEGORY</span>
              <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--sf-text-1)' }}>{product.category}</span>
            </div>
          </div>
          <Description theme={theme} product={product} />
          <EventDetails theme={theme} product={product} />
          <SlotPicker theme={theme} p={p} />
          <ContactForm theme={theme} p={p} />
          <ErrorBox error={p.error} theme={theme} />
          <CtaButton theme={theme} p={p} label={formLabel(p)} />
          <SecureText theme={theme} />
        </>
      )}
      <p style={{ margin: '8px 0 0', textAlign: 'center', fontSize: '0.68rem', fontFamily: 'Courier New, monospace', color: 'var(--sf-text-3)' }}>@{p.storeSlug} — Powered by MO Sell</p>
    </Shell>
  );
}

/* ─── 13. chrome — HUD list, offset rows ────────────────────────────────────── */

export function ChromeProductPage(p: LinkBioProductPageProps) {
  const theme = 'chrome'; const product = p.product;
  return (
    <Shell theme={theme} deco={<Deco theme={theme} />}>
      <BackBar theme={theme} storeName={p.storeName} onBack={p.onBack} />
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--sf-text-1)', fontFamily: displayFont(theme) }}>{product.displayName}</p>
        <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--sf-accent, #00E5FF)', fontFamily: 'Courier New, monospace' }}>{product.category.toUpperCase()}</p>
      </div>
      {p.success ? <SuccessCard theme={theme} p={p} /> : (
        <>
          <Media theme={theme} product={product} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 'var(--sf-radius)', background: 'var(--sf-surface)', border: '1px solid var(--sf-border)', marginRight: 10 }}>
            <span style={{ fontSize: 9, fontFamily: 'Courier New, monospace', color: 'var(--sf-accent, #00E5FF)' }}>00</span>
            <span style={{ flex: 1, textAlign: 'left' }}>
              <span style={{ display: 'block', fontSize: '10.5px', fontWeight: 600, color: 'var(--sf-text-1)', fontFamily: 'var(--sf-font)' }}>{fmtCurrency(product.price, p.currency)}</span>
              <span style={{ display: 'block', fontSize: '8.5px', color: 'var(--sf-text-2)' }}>{product.compareAtPrice && product.compareAtPrice > product.price ? 'was ' + fmtCurrency(product.compareAtPrice, p.currency) : product.category}</span>
            </span>
          </div>
          <Description theme={theme} product={product} />
          <EventDetails theme={theme} product={product} />
          <SlotPicker theme={theme} p={p} />
          <ContactForm theme={theme} p={p} />
          <ErrorBox error={p.error} theme={theme} />
          <CtaButton theme={theme} p={p} label={formLabel(p)} />
          <SecureText theme={theme} />
        </>
      )}
      <p style={{ margin: '8px 0 0', textAlign: 'center', fontSize: '0.68rem', fontFamily: 'Courier New, monospace', color: 'var(--sf-text-3)' }}>@{p.storeSlug} — Powered by MO Sell</p>
    </Shell>
  );
}

/* ─── Registry ─── */
const PRODUCT_PAGES: Record<string, React.ComponentType<LinkBioProductPageProps>> = {
  ankara: AnkaraProductPage,
  midnight: MidnightProductPage,
  harmattan: HarmattanProductPage,
  neon: NeonProductPage,
  sunset: SunsetProductPage,
  mono: MonoProductPage,
  blush: BlushProductPage,
  rose: RoseProductPage,
  pearl: PearlProductPage,
  cherry: CherryProductPage,
  quiet: QuietProductPage,
  concrete: ConcreteProductPage,
  chrome: ChromeProductPage,
};

export function getLinkBioProductPage(theme: string): React.ComponentType<LinkBioProductPageProps> {
  return PRODUCT_PAGES[theme] ?? AnkaraProductPage;
}
