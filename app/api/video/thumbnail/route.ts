import { NextRequest, NextResponse } from 'next/server';
import {
  getYouTubeId,
  isTikTokUrl,
  getTikTokVideoId,
  fetchTikTokThumbnail,
  isCloudinaryVideo,
  getCloudinaryVideoThumbnail,
  getVideoThumbnail,
} from '@/lib/youtube';

async function resolveTikTokCanonical(url: string): Promise<string> {
  if (getTikTokVideoId(url)) {
    const id = getTikTokVideoId(url)!;
    return `https://www.tiktok.com/video/${id}`;
  }
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(8000),
    });
    const finalUrl = res.url || url;
    const id = getTikTokVideoId(finalUrl);
    if (id) return `https://www.tiktok.com/video/${id}`;

    const html = await res.text();
    const fromHtml =
      html.match(/\/video\/(\d{15,25})/) ||
      html.match(/"aweme_id"\s*:\s*"(\d+)"/);
    if (fromHtml?.[1]) return `https://www.tiktok.com/video/${fromHtml[1]}`;
    return finalUrl;
  } catch {
    return url;
  }
}

/**
 * Return a poster image URL for a video link (YouTube, Cloudinary, TikTok oEmbed).
 * GET /api/video/thumbnail?url=...
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('url')?.trim();
  if (!raw) {
    return NextResponse.json({ error: 'url required' }, { status: 400 });
  }

  try {
    const yt = getYouTubeId(raw);
    if (yt) {
      return NextResponse.json(
        { thumbnailUrl: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` },
        { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } },
      );
    }

    if (isCloudinaryVideo(raw)) {
      const t = getCloudinaryVideoThumbnail(raw);
      if (t) {
        return NextResponse.json(
          { thumbnailUrl: t },
          { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } },
        );
      }
    }

    if (isTikTokUrl(raw)) {
      const canonical = await resolveTikTokCanonical(raw);
      const thumb = await fetchTikTokThumbnail(canonical);
      return NextResponse.json(
        { thumbnailUrl: thumb },
        {
          status: thumb ? 200 : 404,
          headers: {
            'Cache-Control': thumb
              ? 'public, s-maxage=86400, stale-while-revalidate=604800'
              : 'public, s-maxage=300',
          },
        },
      );
    }

    const fallback = getVideoThumbnail({ url: raw });
    return NextResponse.json(
      { thumbnailUrl: fallback },
      { status: fallback ? 200 : 404 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'failed';
    return NextResponse.json({ error: msg, thumbnailUrl: null }, { status: 502 });
  }
}
