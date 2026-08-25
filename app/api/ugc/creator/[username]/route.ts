import { NextRequest, NextResponse } from 'next/server';
import { getCreatorByUsername, listVideos } from '@/lib/ugc';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import { resolveVideoThumbnail } from '@/lib/youtube';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    const creator = (await getCreatorByUsername(username, { activeOnly: true })) as any;
    if (!creator || creator.isBanned === true) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const videos = (await listVideos({ creatorId: creator.userId, hasWatermark: true, limit: 9 })) as any[];

    // Attach poster images (YouTube / Cloudinary sync + TikTok oEmbed)
    const sampleVideos = await Promise.all(
      videos.map(async (v) => {
        const thumbnailUrl =
          (await resolveVideoThumbnail({
            url: v.url,
            thumbnail: v.thumbnail,
            thumbnailUrl: v.thumbnailUrl,
          })) ?? v.thumbnailUrl ?? v.thumbnail ?? null;
        return { ...v, thumbnailUrl, thumbnail: thumbnailUrl ?? v.thumbnail ?? null };
      }),
    );

    let completedCount = 0;
    try {
      const supabase = getSupabaseServer();
      const { count, error } = await supabase
        .from('ugcOrders')
        .select('*', { count: 'exact', head: true })
        .eq('creatorId', creator.userId)
        .eq('status', 'COMPLETED');
      if (!error) completedCount = count ?? 0;
    } catch (e) {
      console.error('[ugc/creator] orders count unavailable, defaulting to 0:', e);
    }

    return NextResponse.json({
      creator: {
        ...creator,
        sampleVideos,
        completedOrders: completedCount,
        currency: creator.currency ?? 'NGN',
        price30sDisplay: (creator.price30s ?? 0) / 100,
        price60sDisplay: (creator.price60s ?? 0) / 100,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
