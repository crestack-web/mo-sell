import { NextRequest, NextResponse } from 'next/server';

const TIKTOK_OEMBED = 'https://www.tiktok.com/oembed?url=';
const IG_OEMBED = 'https://graph.facebook.com/v25.0/instagram_oembed?url=';
const MEDIA_SEGMENTS = ['p', 'reel', 'tv', 'stories', 'explore'];

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

function normalizeTiktok(raw: string): string | null {
  let s = raw.trim();
  if (!s) return null;
  if (s.startsWith('@')) s = `https://www.tiktok.com/${s}`;
  else if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    if (!/^([a-z0-9-]+\.)*tiktok\.com$/i.test(u.hostname)) return null;
    const username = u.pathname.split('/').filter(Boolean)[0]?.replace(/^@/, '');
    if (!username || !/^[A-Za-z0-9._-]{2,24}$/.test(username)) return null;
    return `https://www.tiktok.com/@${username}`;
  } catch {
    return null;
  }
}

function normalizeInstagram(raw: string): { url: string; isProfile: boolean } | null {
  let s = raw.trim();
  if (!s) return null;
  if (s.startsWith('@')) s = `https://www.instagram.com/${s}`;
  else if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  try {
    const u = new URL(s);
    if (!/^([a-z0-9-]+\.)*instagram\.com$/i.test(u.hostname)) return null;
    const parts = u.pathname.split('/').filter(Boolean);
    if (!parts.length) return null;
    const first = parts[0].replace(/^@/, '');
    if (MEDIA_SEGMENTS.includes(first)) return { url: u.toString(), isProfile: false };
    if (!/^[A-Za-z0-9._]{1,30}$/.test(first)) return null;
    return { url: `https://www.instagram.com/${first}/`, isProfile: true };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { platform, url } = await req.json();
    if (typeof url !== 'string' || !url.trim()) {
      return NextResponse.json({ ok: false, error: 'Missing URL' }, { status: 400 });
    }

    if (platform === 'tiktok') {
      const normalized = normalizeTiktok(url);
      if (!normalized) {
        return NextResponse.json({ ok: false, error: 'Invalid TikTok URL' }, { status: 400 });
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const res = await fetch(`${TIKTOK_OEMBED}${encodeURIComponent(normalized)}`, {
          signal: controller.signal,
          headers: { 'user-agent': UA },
        });
        const data = await res.json();
        if (res.ok && data.author_name) {
          return NextResponse.json({
            ok: true,
            platform,
            name: data.author_name,
            url: data.author_url || normalized,
          });
        }
        return NextResponse.json({ ok: false, platform, error: 'Account not found' });
      } finally {
        clearTimeout(timer);
      }
    }

    if (platform === 'instagram') {
      const normalized = normalizeInstagram(url);
      if (!normalized) {
        return NextResponse.json({ ok: false, error: 'Invalid Instagram URL' }, { status: 400 });
      }
      if (normalized.isProfile) {
        return NextResponse.json({
          ok: false,
          platform,
          code: 'profile_unverifiable',
          error: 'Instagram profiles can\u2019t be verified without a token. Paste a public post or reel link instead, or leave the count self-reported.',
        });
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const res = await fetch(`${IG_OEMBED}${encodeURIComponent(normalized.url)}`, { signal: controller.signal });
        const data = await res.json();
        if (res.ok && data.html) {
          return NextResponse.json({ ok: true, platform, name: data.author_name ?? null, url: normalized.url });
        }
        return NextResponse.json({ ok: false, platform, error: 'This post is not public or was not found' });
      } finally {
        clearTimeout(timer);
      }
    }

    return NextResponse.json({ ok: false, error: 'Unsupported platform' }, { status: 400 });
  } catch {
    return NextResponse.json({ ok: false, error: 'Verification failed. Try again.' }, { status: 500 });
  }
}
