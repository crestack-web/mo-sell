'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Monitor, Tablet, Smartphone, Undo2, Redo2, ChevronLeft, Pencil, X } from 'lucide-react';
import { SocialIcon, SOCIAL_DEFS, SOCIAL_KEYS, normalizeSocialValue, socialStatus } from '@/components/SocialBrand';
import { getDatabase } from '@/lib/database/adapter';
import { useSell } from '@/context/SellContext';
import { useRouter } from 'next/navigation';
import { isCreatorTheme, getThemeType, resolveEcommerceTheme, THEMES } from '@/themes/registry';
import { StorefrontCanvas } from '@/components/StorefrontCanvas';
import { CartProvider } from '@/app/store/[storeSlug]/context/CartContext';
import type {
  StorefrontTheme, StoreSection, StoreSectionType,
  StorefrontProduct, StoreCollection,
  HeroSectionSettings, CollectionsSectionSettings,
  FeaturedSectionSettings, AnnouncementSectionSettings,
  HeaderSectionSettings, FooterSectionSettings,
  AboutSectionSettings, TestimonialsSectionSettings,
  InstagramSectionSettings, NewsletterSectionSettings,
} from '@/types/mo-sell.types';
import { DEFAULT_SECTIONS } from '@/types/mo-sell.types';
import styles from './ThemeEditorPage.module.css';

const SectionIcons: Record<StoreSectionType, React.ReactNode> = {
  header:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="5" rx="1"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="16" x2="21" y2="16"/></svg>,
  announcement: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 17H2a3 3 0 000 6h20v-6z"/><path d="M22 11V3L7 11h15z"/></svg>,
  hero:         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="13" rx="2"/><polyline points="3 20 7 16 11 19 15 14 21 20"/></svg>,
  featured:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>,
  collections:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  about:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
  testimonials: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  instagram:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
  newsletter:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  footer:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="12" x2="21" y2="12"/><rect x="3" y="16" width="18" height="5" rx="1"/></svg>,
};

const SECTION_META: Record<StoreSectionType, { label: string; movable: boolean }> = {
  header:       { label: 'Header',           movable: false },
  announcement: { label: 'Announcement bar', movable: false },
  hero:         { label: 'Hero / Banner',    movable: false },
  featured:     { label: 'Featured Products',movable: true  },
  collections:  { label: 'Collections',     movable: true  },
  about:        { label: 'About / Story',    movable: true  },
  testimonials: { label: 'Testimonials',    movable: true  },
  instagram:    { label: 'Instagram Feed',  movable: true  },
  newsletter:   { label: 'Newsletter',      movable: true  },
  footer:       { label: 'Footer',          movable: false },
};

// FILE CONTINUES - see note: full file will be pushed via alternate method if truncated
