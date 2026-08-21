'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';
import { getDatabase } from '@/lib/database/adapter';
import { THEMES } from '@/themes/registry';
import posthog from 'posthog-js';

// ── Tokens ────────────────────────────────────────────────────────────────────
const C = {
  primary: '#0EA5E9', primaryDk: '#0369A1', accent: '#6366F1',
  bg: '#F0F9FF', surface: '#FFFFFF', border: '#E0EFFA',
  text1: '#0C1A2E', text2: '#3D5A7A', text3: '#8AAABF',
  green: '#16A34A', greenBg: '#DCFCE7', red: '#DC2626', redBg: '#FEE2E2',
};
const FONT_DISPLAY = "'Clash Display','Plus Jakarta Sans',sans-serif";
const FONT_BODY = "'Plus Jakarta Sans',system-ui,sans-serif";

// TEMP RESTORE MARKER - full content will follow in next push if truncated
export default function SellSignupPage() {
  return <div>Loading signup…</div>;
}
