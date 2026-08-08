import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ─── Apify actors (override via env) ─────────────────────────────────────────
// TikTok: clockworks/tiktok-scraper — per-video stats (playCount, diggCount,
// commentCount, shareCount, hashtags). IG: apify/instagram-post-scraper —
// latest posts with likesCount, commentsCount, videoViewCount / caption.
const TIKTOK_ACTOR = process.env.APIFY_TIKTOK_ACTOR || 'clockworks~tiktok-scraper';
const IG_ACTOR = process.env.APIFY_IG_ACTOR || 'apify~instagram-post-scraper';

const MAX_POSTS = 20;
const RUN_TIMEOUT_SEC = 90;

// ─── Normalization ───────────────────────────────────────────────────────────

function normalizeTiktok(raw: string): { handle: string; url: string } | null {
  let s = raw.trim();
  if (!s) return null;
  if (s.startsWith('@')) s = `https://www.tiktok.com/${s}`;
  else if (!/^https?:\/\//i.test(s)) s = `https://www.tiktok.com/@${s}`;
  try {
    const u = new URL(s);
    if (!/^([a-z0-9-]+\.)*tiktok\.com$/i.test(u.hostname)) return null;
    const handle = u.pathname.split('/').filter(Boolean)[0]?.replace(/^@/, '');
    if (!handle || !/^[A-Za-z0-9._-]{2,24}$/.test(handle)) return null;
    return { handle, url: `https://www.tiktok.com/@${handle}` };
  } catch {
    return null;
  }
}

function normalizeInstagram(raw: string): { handle: string; url: string } | null {
  let s = raw.trim();
  if (!s) return null;
  if (s.startsWith('@')) s = `https://www.instagram.com/${s}`;
  else if (!/^https?:\/\//i.test(s)) s = `https://www.instagram.com/${s}`;
  try {
    const u = new URL(s);
    if (!/^([a-z0-9-]+\.)*instagram\.com$/i.test(u.hostname)) return null;
    const parts = u.pathname.split('/').filter(Boolean);
    const handle = parts[0]?.replace(/^@/, '');
    if (!handle || !/^[A-Za-z0-9._]{1,30}$/.test(handle)) return null;
    return { handle, url: `https://www.instagram.com/${handle}/` };
  } catch {
    return null;
  }
}

// ─── Apify call ──────────────────────────────────────────────────────────────

async function runApify(actor: string, input: Record<string, unknown>): Promise<any[]> {
  const token = process.env.APIFY_KEY || process.env.APIFY_TOKEN;
  if (!token) throw new Error('Apify token not configured');

  const url = `https://api.apify.com/v2/acts/${actor}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=${RUN_TIMEOUT_SEC}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), (RUN_TIMEOUT_SEC + 20) * 1000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Apify actor run failed (${res.status}) ${text.slice(0, 200)}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } finally {
    clearTimeout(timer);
  }
}

// ─── Post parsing ────────────────────────────────────────────────────────────

interface PostStat {
  id?: string;
  text: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  hashtags: string[];
  er: number | null;
}

function parseHashtags(text: string): string[] {
  const out = new Set<string>();
  for (const m of (text || '').matchAll(/#([\p{L}\p{N}_]+)/gu)) out.add(m[1].toLowerCase());
  return [...out];
}

function parseTikTokPosts(items: any[]): { posts: PostStat[]; followers: number | null } {
  const posts: PostStat[] = [];
  let followers: number | null = null;
  for (const item of items) {
    if (!item || item.error) continue;
    const views = typeof item.playCount === 'number' ? item.playCount : item.playCount != null ? Number(item.playCount) : null;
    const likes = typeof item.diggCount === 'number' ? item.diggCount : item.diggCount != null ? Number(item.diggCount) : null;
    const comments = typeof item.commentCount === 'number' ? item.commentCount : item.commentCount != null ? Number(item.commentCount) : null;
    const shares = typeof item.shareCount === 'number' ? item.shareCount : item.shareCount != null ? Number(item.shareCount) : null;
    const text = item.text ?? item.desc ?? '';
    const tagNames = (Array.isArray(item.hashtags) ? item.hashtags.map((h: any) => h?.name).filter(Boolean) : []) as string[];
    const hashtags = [...new Set([...tagNames.map(String), ...parseHashtags(text)].map(h => h.replace(/^#/, '').toLowerCase()))];
    if (followers == null && item.authorMeta?.fans != null) {
      followers = Number(item.authorMeta.fans);
    }
    const er = views != null && views > 0 && (likes != null || comments != null)
      ? (((likes ?? 0) + (comments ?? 0) + (shares ?? 0)) / views) * 100
      : null;
    posts.push({ id: item.id ?? item.videoId, text, views, likes, comments, shares, hashtags, er });
  }
  return { posts, followers };
}

function parseIGPosts(items: any[]): { posts: PostStat[]; followers: number | null } {
  const posts: PostStat[] = [];
  let followers: number | null = null;
  for (const item of items) {
    if (!item || item.error) continue;
    const views = item.videoViewCount != null ? Number(item.videoViewCount)
      : item.videoPlayCount != null ? Number(item.videoPlayCount) : null;
    const likes = item.likesCount != null && Number(item.likesCount) >= 0 ? Number(item.likesCount) : null;
    const comments = item.commentsCount != null && Number(item.commentsCount) >= 0 ? Number(item.commentsCount) : null;
    const text = item.caption ?? item.captionEn ?? item.text ?? '';
    const hashtags = parseHashtags(text);
    if (followers == null && item.ownerProfileInfo?.followerCount != null) {
      followers = Number(item.ownerProfileInfo.followerCount);
    }
    // Engagement is view-based for reels/videos; image posts have no public views.
    const er = views != null && views > 0 && (likes != null || comments != null)
      ? (((likes ?? 0) + (comments ?? 0)) / views) * 100
      : null;
    posts.push({ id: item.id ?? item.shortCode, text, views, likes, comments, shares: null, hashtags, er });
  }
  return { posts, followers };
}

// ─── Metrics ─────────────────────────────────────────────────────────────────

function topHashtags(posts: PostStat[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of posts) {
    for (const tag of p.hashtags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));
}

const AUDIENCE_CATEGORIES: { category: string; keywords: string[] }[] = [
  { category: 'Fashion & Beauty', keywords: ['fashion', 'style', 'outfit', 'beauty', 'makeup', 'skincare', 'hair', 'nails', 'ootd', 'drip', 'streetwear'] },
  { category: 'Fitness & Health', keywords: ['fitness', 'gym', 'workout', 'health', 'wellness', 'yoga', 'weightloss', 'nutrition', 'homeworkout', 'muscle'] },
  { category: 'Food & Cooking', keywords: ['food', 'recipe', 'cooking', 'bake', 'baking', 'restaurant', 'foodie', 'mealprep', 'tasty', 'chef', 'snack'] },
  { category: 'Tech & Gaming', keywords: ['tech', 'gaming', 'gamer', 'phone', 'pc', 'laptop', 'app', 'startup', 'ai', 'programming', 'android', 'ios', 'fortnite', 'games'] },
  { category: 'Travel & Lifestyle', keywords: ['travel', 'vacation', 'explore', 'adventure', 'lifestyle', 'vlog', 'journey', 'wanderlust', 'relax', 'vibes'] },
  { category: 'Business & Finance', keywords: ['business', 'money', 'finance', 'entrepreneur', 'marketing', 'sales', 'investing', 'makemoney', 'brand', 'sidehustle', 'career'] },
  { category: 'Education & DIY', keywords: ['learn', 'tutorial', 'howto', 'tips', 'diy', 'study', 'science', 'facts', 'school', 'math', 'history', 'knowledge'] },
  { category: 'Comedy & Entertainment', keywords: ['funny', 'comedy', 'memes', 'prank', 'entertainment', 'movie', 'music', 'celebrity', 'drama', 'humor', 'dance', 'sing'] },
  { category: 'Parenting & Family', keywords: ['parenting', 'mom', 'dad', 'kids', 'family', 'baby', 'toddler', 'mum'] },
  { category: 'Pets & Animals', keywords: ['dog', 'cat', 'pets', 'animals', 'puppy', 'kitten', 'pet'] },
];

function guessAudience(posts: PostStat[]): {
  primary: string;
  breakdown: { category: string; weight: number }[];
  confidence: number;
} {
  const hits = new Map<string, number>();
  for (const p of posts) {
    const haystack = `${p.text} ${p.hashtags.join(' ')}`.toLowerCase();
    for (const cat of AUDIENCE_CATEGORIES) {
      let matched = false;
      for (const kw of cat.keywords) {
        if (haystack.includes(kw)) {
          matched = true;
          break;
        }
      }
      if (matched) hits.set(cat.category, (hits.get(cat.category) ?? 0) + 1);
    }
  }
  const total = [...hits.values()].reduce((a, b) => a + b, 0);
  if (total === 0) {
    return { primary: 'General / Mixed', breakdown: [], confidence: 0 };
  }
  const sorted = [...hits.entries()].sort((a, b) => b[1] - a[1]);
  return {
    primary: sorted[0][0],
    breakdown: sorted.slice(0, 4).map(([category, weight]) => ({
      category,
      weight: Math.round((weight / total) * 100),
    })),
    confidence: Math.round((sorted[0][1] / total) * 100),
  };
}

function computeScore(avgViews: number | null, er: number | null, postsCount: number, followers: number | null): number {
  const reachScore = avgViews != null && avgViews > 0 ? Math.min(40, Math.log10(Math.max(avgViews, 1)) * 5.5) : 0;
  const engagementScore = er != null ? Math.min(35, Math.max(0, er) * 7) : 0;
  const consistencyScore = Math.min(10, (postsCount / MAX_POSTS) * 10);
  const followerBonus = followers != null && followers > 0 ? Math.min(15, Math.log10(Math.max(followers, 1)) * 2.3) : 0;
  const raw = reachScore + engagementScore + consistencyScore + followerBonus * 0.6;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

function grade(score: number): string {
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'E';
}

function mean(nums: number[]): number | null {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// ─── POST: compute + save + return score ─────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const tiktokUrl = body.tiktokUrl ?? body.tiktok_url ?? body.tiktok ?? null;
    const igHandle = body.igHandle ?? body.ig_handle ?? body.instagram ?? null;

    let platform: string;
    let handle: string;
    let url: string;

    if (tiktokUrl) {
      const n = normalizeTiktok(String(tiktokUrl));
      if (!n) return NextResponse.json({ ok: false, error: 'Invalid TikTok URL or handle' }, { status: 400 });
      platform = 'tiktok';
      handle = n.handle;
      url = n.url;
    } else if (igHandle) {
      const n = normalizeInstagram(String(igHandle));
      if (!n) return NextResponse.json({ ok: false, error: 'Invalid Instagram handle' }, { status: 400 });
      platform = 'instagram';
      handle = n.handle;
      url = n.url;
    } else {
      return NextResponse.json({ ok: false, error: 'Provide tiktok_url or ig_handle' }, { status: 400 });
    }

    const token = process.env.APIFY_KEY || process.env.APIFY_TOKEN;
    if (!token) {
      return NextResponse.json({ ok: false, error: 'Apify not configured (set APIFY_KEY)' }, { status: 503 });
    }

    // 1. Fetch last 20 posts from Apify
    const actor = platform === 'tiktok' ? TIKTOK_ACTOR : IG_ACTOR;
    const input = platform === 'tiktok'
      ? { profiles: [handle], resultsPerPage: MAX_POSTS }
      : { username: [handle], resultsLimit: MAX_POSTS };

    const items = await runApify(actor, input);

    const parsed = platform === 'tiktok' ? parseTikTokPosts(items) : parseIGPosts(items);
    const posts = parsed.posts.slice(0, MAX_POSTS);
    const followers = parsed.followers;

    if (posts.length === 0) {
      return NextResponse.json(
        { ok: false, error: `No public posts found for @${handle} (account may be private or blocked)` },
        { status: 422 },
      );
    }

    // 2. Calculate metrics
    const views = posts.map(p => p.views).filter((v): v is number => v != null && v > 0);
    const ers = posts.map(p => p.er).filter((v): v is number => v != null);
    const avgViews = mean(views);
    const avgEr = mean(ers);
    const hashtags = topHashtags(posts);
    const audience = guessAudience(posts);
    const score = computeScore(avgViews, avgEr, posts.length, followers);

    const metrics = {
      platform,
      handle,
      url,
      followers,
      avgViews: avgViews != null ? Math.round(avgViews) : null,
      er: avgEr != null ? Math.round(avgEr * 100) / 100 : null,
      topHashtags: hashtags,
      audienceGuess: audience,
      score,
      grade: grade(score),
      postsCount: posts.length,
    };

    // 3. Save to supabase.creator_metrics
    let saved = false;
    try {
      const supabase = await import('@/lib/supabase-server').then(m => m.supabaseServer);
      if (supabase) {
        const { error } = await supabase.from('creator_metrics').upsert(
          {
            platform,
            handle,
            followers: followers ?? null,
            avg_views: metrics.avgViews,
            er: metrics.er,
            top_hashtags: metrics.topHashtags,
            audience_guess: metrics.audienceGuess,
            score: metrics.score,
            posts_count: metrics.postsCount,
            raw: posts.map(p => ({
              id: p.id,
              text: (p.text || '').slice(0, 240),
              views: p.views,
              likes: p.likes,
              comments: p.comments,
              shares: p.shares,
            })),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'platform,handle' },
        );
        if (error) console.error('[creator-score] Upsert error:', error.message);
        else saved = true;
      }
    } catch (err) {
      console.error('[creator-score] Save error:', err);
    }

    return NextResponse.json({ ok: true, saved, cached: false, ...metrics, generatedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('[creator-score] Error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to compute creator score';
    const status = /not configured/i.test(msg) ? 503 : /Apify actor run failed/i.test(msg) ? 502 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}

// ─── GET: read a stored score ────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const handle = searchParams.get('handle');
    const platform = searchParams.get('platform') ?? 'tiktok';

    if (!handle) {
      return NextResponse.json({ ok: false, error: 'handle required' }, { status: 400 });
    }

    const supabase = await import('@/lib/supabase-server').then(m => m.supabaseServer);
    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 503 });
    }

    const { data, error } = await supabase
      .from('creator_metrics')
      .select('*')
      .eq('platform', platform)
      .eq('handle', handle)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ ok: true, cached: false, score: null, handle, platform });
    }

    return NextResponse.json({
      ok: true,
      cached: true,
      score: data.score,
      grade: data.score != null ? grade(data.score) : null,
      avgViews: data.avg_views,
      er: data.er,
      topHashtags: data.top_hashtags,
      audienceGuess: data.audience_guess,
      followers: data.followers,
      postsCount: data.posts_count,
      updatedAt: data.updated_at,
      handle,
      platform,
    });
  } catch (err: any) {
    console.error('[creator-score] GET error:', err);
    return NextResponse.json({ ok: false, error: 'Failed to read creator score' }, { status: 500 });
  }
}
