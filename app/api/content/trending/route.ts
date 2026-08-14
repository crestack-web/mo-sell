import { NextRequest, NextResponse } from 'next/server';
import { runApify } from '@/lib/apify/run';
import { nicheInput } from '@/lib/apify/niche';

export const dynamic = 'force-dynamic';

// TikTok: clockworks/tiktok-scraper supports hashtag + keyword search and
// returns real engagement stats (playCount, diggCount, commentCount, shareCount).
const TIKTOK_ACTOR = process.env.APIFY_TIKTOK_ACTOR || 'clockworks~tiktok-scraper';

const MAX_TRENDS = 12;
const RUN_TIMEOUT_SEC = 90;

// ─── Normalization ───────────────────────────────────────────────────────────

export interface TrendItem {
  id: string;
  platform: 'tiktok';
  caption: string;
  creator: string;
  creatorUrl: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  hashtags: string[];
  videoUrl: string | null;
  coverUrl: string | null;
  postedAt: string | null;
}

function parseHashtags(text: string): string[] {
  const out = new Set<string>();
  for (const m of (text || '').matchAll(/#([\p{L}\p{N}_]+)/gu)) out.add(m[1].toLowerCase());
  return [...out];
}

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return isNaN(n) ? null : n;
}

function normalizeTikTokItem(item: any): TrendItem | null {
  if (!item || item.error) return null;
  const text = (item.text ?? item.desc ?? '') as string;
  const videoUrl = item.webVideoUrl ?? item.videoUrl ?? null;
  const coverUrl = item.videoMeta?.coverUrl ?? item.videoMeta?.cover ?? null;
  const tagNames = (Array.isArray(item.hashtags) ? item.hashtags.map((h: any) => h?.name) : [])
    .filter(Boolean) as string[];
  const hashtags = [...new Set([...tagNames.map(String), ...parseHashtags(text)])]
    .map(h => h.replace(/^#/, '').toLowerCase());

  return {
    id: String(item.id ?? item.videoId ?? ''),
    platform: 'tiktok',
    caption: text,
    creator: item.authorMeta?.nickName ?? item.authorMeta?.name ?? 'unknown',
    creatorUrl: item.authorMeta?.name
      ? `https://www.tiktok.com/@${item.authorMeta.name}`
      : 'https://www.tiktok.com',
    views: num(item.playCount),
    likes: num(item.diggCount),
    comments: num(item.commentCount),
    shares: num(item.shareCount),
    hashtags,
    videoUrl: videoUrl ? String(videoUrl) : null,
    coverUrl: coverUrl ? String(coverUrl) : null,
    postedAt: item.createTimeISO ?? item.createdAt ?? null,
  };
}

// ─── POST: fetch real trending posts in the store's niche ────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const category = typeof body.category === 'string' ? body.category : '';
    const productNames = Array.isArray(body.productNames)
      ? body.productNames.map(String)
      : typeof body.productName === 'string'
        ? [body.productName]
        : [];

    const token = process.env.APIFY_KEY || process.env.APIFY_TOKEN;
    if (!token) {
      return NextResponse.json(
        { ok: false, error: 'Apify not configured (set APIFY_KEY)' },
        { status: 503 },
      );
    }

    const { hashtags, searchTerms } = nicheInput(category, productNames);

    const items = await runApify(
      TIKTOK_ACTOR,
      {
        hashtags,
        searchTerms,
        resultsPerPage: Math.max(MAX_TRENDS * 2, 24),
        shouldDownloadVideos: false,
        shouldDownloadCovers: false,
      },
      RUN_TIMEOUT_SEC,
    );

    const trends = (Array.isArray(items) ? items : [])
      .map(normalizeTikTokItem)
      .filter((t): t is TrendItem => Boolean(t))
      .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
      .slice(0, MAX_TRENDS);

    if (trends.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No trending posts found for this niche right now — try again later' },
        { status: 422 },
      );
    }

    return NextResponse.json({
      ok: true,
      source: 'tiktok',
      niche: category || 'your niche',
      hashtags,
      trends,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[content-trending] Error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to load trends';
    const status = /not configured/i.test(msg) ? 503 : /Apify actor run failed/i.test(msg) ? 502 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
