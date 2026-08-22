'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getDatabase } from '@/lib/database/adapter';
import { getStorage } from '@/lib/storage/adapter';
import { useSell } from '@/context/SellContext';
import { THEMES, resolveLinkBioTheme } from '@/themes/registry';
import type { ProductCardData } from '@/themes/types';
import { getLinkBioLayout, type CustomLink } from '@/app/store/[storeSlug]/components/layouts/index';
import { getThemeCssVars } from '@/components/StorefrontCanvas';
import type { StorefrontTheme } from '@/types/mo-sell.types';
import { ExternalLink, GripVertical, Eye, EyeOff, X, Pencil, ArrowRight, Instagram, Twitter, Youtube, Music2, MessageCircle } from 'lucide-react';
import styles from './LinkInBioEditor.module.css';

// Temporary restore stub — full editor restored next commit
export { default } from './LinkInBioEditorImpl';
