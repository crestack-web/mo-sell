import { NextRequest, NextResponse } from 'next/server';

const TIKTOK_OEMBED = 'https://www.tiktok.com/oembed?url=';
const IG_OEMBED = 'https://graph.facebook.com/v25.0/instagram_oembed?url=';
const MEDIA_SEGMENTS = ['p', 'reel', 'tv', 'stories', 'explore'];

const STATS_ACTOR = 'automation-lab~social-media-stats-checker';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

/**
 * Coerce a user-supplied handle into a full profile URL.
 *
 * Accepts bare usernames (`myhandle`), `@`-prefixed handles, bare domains
 * (`tiktok.com/@x`), and full URLs. Returns `null` on empty input.
 */
function toProfileUrl(raw: string, platform: 'tiktok' | 'instagram'): string | null {
  let s = raw.trim();
  if (!s) return null;
  s = s.replace(/^@+/, '');
  const looksLikeUrl = /^https?:\/\//i.test(s) || s.includes('/') || /\.(com|net|org|io|co|ng|tv|me|xyz|info|dev)\b/i.test(s);
  if (looksLikeUrl) {
    return /^https?:\/\//i.test(s) ? s : `https://${s}`;
  }
  return platform === 'tiktok'
    ? `https://www.tiktok.com/@${s}`
    : `https://www.instagram.com/${s}/`;
}

function normalizeTiktok(raw: string): { url: string; username: string } | null {
  const s = toProfileUrl(raw, 'tiktok');
  if (!s) return null;
  try {
    const u = new URL(s);
    if (!/^([a-z0-9-]+\.)*tiktok\.com$/i.test(u.hostname)) return null;
    const username = u.pathname.split('/').filter(Boolean)[0]?.replace(/^@/, '');
    if (!username || !/^[A-Za-z0-9._-]{2,24}$/.test(username)) return null;
    return { url: `https://www.tiktok.com/@${username}`, username };
  } catch {
    return null;
  }
}

function normalizeInstagram(raw: string): { url: string; isProfile: boolean; username?: string } | null {
  const s = toProfileUrl(raw, 'instagram');
  if (!s) return null;
  try {
    const u = new URL(s);
    if (!/^([a-z0-9-]+\.)*instagram\.com$/i.test(u.hostname)) return null;
    const parts = u.pathname.split('/').filter(Boolean);
    if (!parts.length) return null;
    const first = parts[0].replace(/^@/, '');
    if (MEDIA_SEGMENTS.includes(first)) return { url: u.toString(), isProfile: false };
    if (!/^[A-Za-z0-9._]{1,30}$/.test(first)) return null;
    return { url: `https://www.instagram.com/${first}/`, isProfile: true, username: first };
  } catch {
    return null;
  }
}

async function runApifyStats(username: string, platform: string, token: string, timeoutSec = 120): Promise<any[]> {
  const input: any = {
    profiles: [{ platform, username }],
    continueOnError: true,
  };
  const cookie = process.env.APIFY_INSTAGRAM_COOKIE;
  if (cookie) input.instagramCookie = cookie;

  const url = `https://api.apify.com/v2/acts/${STATS_ACTOR}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=${timeoutSec}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), (timeoutSec + 20) * 1000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Apify actor run failed (${res.status})`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } finally {
    clearTimeout(timer);
  }
}

function buildVerifiedResponse(item: any, platform: string, fallbackUsername: string) {
  return {
    ok: true,
    platform,
    verified: true,
    source: 'apify',
    name: item.displayName ?? item.username ?? fallbackUsername,
    followerCount: item.followers ?? 0,
    followingCount: item.following ?? 0,
    postsCount: item.posts ?? 0,
    likesCount: item.likes ?? 0,
    accountVerified: item.isVerified === true,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { platform, url } = await req.json();
    if (typeof url !== 'string' || !url.trim()) {
      return NextResponse.json({ ok: false, error: 'Missing URL' }, { status: 400 });
    }

    const apifyToken = process.env.APIFY_KEY || process.env.APIFY_TOKEN;

    if (platform === 'tiktok') {
      const normalized = normalizeTiktok(url);
      if (!normalized) {
        return NextResponse.json({ ok: false, error: 'Invalid TikTok URL' }, { status: 400 });
      }

      if (apifyToken) {
        try {
          const items = await runApifyStats(normalized.username, 'tiktok', apifyToken);
          const item = items?.find((i: any) => (i.username ?? '') === normalized.username) ?? items?.[0];
          if (item?.error) {
            return NextResponse.json({ ok: false, platform, error: item.error });
          }
          if (item) {
            return NextResponse.json(buildVerifiedResponse(item, 'tiktok', normalized.username));
          }
        } catch (e) {
          console.error('[socials/verify] Apify TikTok failed, falling back to oEmbed:', e);
        }
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const res = await fetch(`${TIKTOK_OEMBED}${encodeURIComponent(normalized.url)}`, {
          signal: controller.signal,
          headers: { 'user-agent': UA },
        });
        const data = await res.json();
        if (res.ok && data.author_name) {
          return NextResponse.json({
            ok: true,
            platform,
            verified: true,
            source: 'oembed',
            name: data.author_name,
            url: data.author_url || normalized.url,
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

      if (apifyToken && normalized.isProfile && normalized.username) {
        try {
          const items = await runApifyStats(normalized.username, 'instagram', apifyToken);
          const item = items?.find((i: any) => (i.username ?? '') === normalized.username) ?? items?.[0];
          if (item?.error) {
            const err = String(item.error);
            return NextResponse.json({
              ok: false,
              platform,
              code: /cookie|login|session/i.test(err) ? 'instagram_cookie_required' : undefined,
              error: /cookie|login|session/i.test(err)
                ? 'Instagram stats need a session cookie. Paste a public post or reel link instead, or leave the count self-reported.'
                : err,
            });
          }
          if (item) {
            return NextResponse.json(buildVerifiedResponse(item, 'instagram', normalized.username));
          }
        } catch (e) {
          console.error('[socials/verify] Apify Instagram failed, falling back to oEmbed:', e);
        }
      }

      if (normalized.isProfile) {
        return NextResponse.json({
          ok: false,
          platform,
          code: 'profile_unverifiable',
          error: 'Instagram profiles need the Apify token and session cookie to verify. Paste a public post or reel link instead, or leave the count self-reported.',
        });
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const res = await fetch(`${IG_OEMBED}${encodeURIComponent(normalized.url)}`, { signal: controller.signal });
        const data = await res.json();
        if (res.ok && data.html) {
          return NextResponse.json({ ok: true, platform, verified: true, source: 'oembed', name: data.author_name ?? null, url: normalized.url });
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
