import { NextRequest, NextResponse } from 'next/server';
import { getTikTokVideoId, getYouTubeId, isTikTokUrl } from '@/lib/youtube';

/**
 * Follow redirects for short video links (e.g. vm.tiktok.com) and return
 * a playable embed URL when possible.
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('url')?.trim();
  if (!raw) {
    return NextResponse.json({ error: 'url required' }, { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }

  // Only allow known video hosts
  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  const allowed =
    host === 'tiktok.com' ||
    host.endsWith('.tiktok.com') ||
    host === 'youtube.com' ||
    host === 'youtu.be' ||
    host.endsWith('.youtube.com');
  if (!allowed) {
    return NextResponse.json({ error: 'unsupported host' }, { status: 400 });
  }

  // Already has an id — no need to resolve
  const existingTt = getTikTokVideoId(raw);
  const existingYt = getYouTubeId(raw);
  if (existingTt) {
    return NextResponse.json({
      finalUrl: raw,
      videoId: existingTt,
      platform: 'tiktok',
      embedUrl: `https://www.tiktok.com/embed/v2/${existingTt}?autoplay=1`,
    });
  }
  if (existingYt) {
    return NextResponse.json({
      finalUrl: raw,
      videoId: existingYt,
      platform: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${existingYt}?autoplay=1&rel=0`,
    });
  }

  try {
    const res = await fetch(raw, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        // Desktop UA so TikTok returns a normal HTML page with the video path
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(8000),
    });

    const finalUrl = res.url || raw;
    const tt = getTikTokVideoId(finalUrl);
    if (tt) {
      return NextResponse.json({
        finalUrl,
        videoId: tt,
        platform: 'tiktok',
        embedUrl: `https://www.tiktok.com/embed/v2/${tt}?autoplay=1`,
      });
    }

    // Sometimes the final URL is still short; scrape video id from HTML
    if (isTikTokUrl(finalUrl) || isTikTokUrl(raw)) {
      const html = await res.text();
      const fromHtml =
        html.match(/\/video\/(\d{15,25})/) ||
        html.match(/"aweme_id"\s*:\s*"(\d+)"/) ||
        html.match(/"id"\s*:\s*"(\d{15,25})"/);
      if (fromHtml?.[1]) {
        const id = fromHtml[1];
        return NextResponse.json({
          finalUrl,
          videoId: id,
          platform: 'tiktok',
          embedUrl: `https://www.tiktok.com/embed/v2/${id}?autoplay=1`,
        });
      }
    }

    const yt = getYouTubeId(finalUrl);
    if (yt) {
      return NextResponse.json({
        finalUrl,
        videoId: yt,
        platform: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${yt}?autoplay=1&rel=0`,
      });
    }

    return NextResponse.json({ finalUrl, videoId: null, platform: null, embedUrl: null });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'resolve failed';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
