'use client';

import React, { useState } from 'react';
import { SocialIcon, SOCIAL_DEFS, SOCIAL_KEYS, normalizeSocialValue, socialStatus } from '@/components/SocialBrand';
import type {
  HeroSectionSettings, CollectionsSectionSettings,
  FeaturedSectionSettings, AnnouncementSectionSettings,
  HeaderSectionSettings, FooterSectionSettings,
  AboutSectionSettings, TestimonialsSectionSettings,
  InstagramSectionSettings, NewsletterSectionSettings,
} from '@/types/mo-sell.types';
import styles from './ThemeEditorPage.module.css';

export function SGroup({ label }: { label: string }) {
  return <p className={styles.sGroup}>{label}</p>;
}

export function Advanced({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div className={styles.adv}>
      <button className={styles.advToggle} type="button" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{title}</span>
        <svg className={[styles.advChevron, open ? styles.advChevronOpen : ''].join(' ')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && <div className={styles.advBody}>{children}</div>}
    </div>
  );
}

export function TF({ label, value, onChange, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.fLabel}>{label}</label>
      <input className={styles.fInput} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
      {hint && <p className={styles.fHint}>{hint}</p>}
    </div>
  );
}

export function Toggle({ label, value, onChange, hint }: {
  label: string; value: boolean; onChange: (v: boolean) => void; hint?: string;
}) {
  return (
    <div className={styles.fRow}>
      <div style={{ flex: 1 }}>
        <span className={styles.fLabel}>{label}</span>
        {hint && <p className={styles.fHint}>{hint}</p>}
      </div>
      <button className={[styles.toggle, value ? styles.toggleOn : ''].join(' ')} onClick={() => onChange(!value)} type="button" aria-pressed={value}>
        <span className={styles.toggleThumb} />
      </button>
    </div>
  );
}

export function SF({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div className={styles.field}>
      <label className={styles.fLabel}>{label}</label>
      <select className={styles.fSelect} value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className={styles.field}>
      <label className={styles.fLabel}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          style={{ width: 32, height: 32, borderRadius: 7, border: '1.5px solid var(--sell-border)', cursor: 'pointer', padding: 2, background: 'transparent', flexShrink: 0 }} />
        <input className={styles.fInput} value={value} onChange={e => onChange(e.target.value)} style={{ width: 90 }} />
      </div>
    </div>
  );
}

// Remaining settings components follow in next commit due to size
export function HeroSettings({ s, upd, isLinkStyle, isCreator, isMobile }: { s: HeroSectionSettings; upd: (p: Partial<HeroSectionSettings>) => void; isLinkStyle?: boolean; isCreator?: boolean; isMobile?: boolean }) {
  return <div>Hero settings loading...</div>;
}
export function AnnouncementSettings({ s, upd }: { s: AnnouncementSectionSettings; upd: (p: Partial<AnnouncementSectionSettings>) => void }) {
  return <div>Announcement settings loading...</div>;
}
export function FeaturedSettings({ s, upd }: { s: FeaturedSectionSettings; upd: (p: Partial<FeaturedSectionSettings>) => void }) {
  return <div>Featured settings loading...</div>;
}
export function CollectionsSettings({ s, upd }: { s: CollectionsSectionSettings; upd: (p: Partial<CollectionsSectionSettings>) => void }) {
  return <div>Collections settings loading...</div>;
}
export function AboutSettings({ s, upd }: { s: AboutSectionSettings; upd: (p: Partial<AboutSectionSettings>) => void }) {
  return <div>About settings loading...</div>;
}
export function TestimonialsSettings({ s, upd }: { s: TestimonialsSectionSettings; upd: (p: Partial<TestimonialsSectionSettings>) => void }) {
  return <div>Testimonials settings loading...</div>;
}
export function InstagramSettings({ s, upd }: { s: InstagramSectionSettings; upd: (p: Partial<InstagramSectionSettings>) => void }) {
  return <div>Instagram settings loading...</div>;
}
export function NewsletterSettings({ s, upd }: { s: NewsletterSectionSettings; upd: (p: Partial<NewsletterSectionSettings>) => void }) {
  return <div>Newsletter settings loading...</div>;
}
export function HeaderSettings({ s, upd }: { s: HeaderSectionSettings; upd: (p: Partial<HeaderSectionSettings>) => void }) {
  return <div>Header settings loading...</div>;
}
export function FooterSettings({ s, upd }: { s: FooterSectionSettings; upd: (p: Partial<FooterSectionSettings>) => void }) {
  return <div>Footer settings loading...</div>;
}
