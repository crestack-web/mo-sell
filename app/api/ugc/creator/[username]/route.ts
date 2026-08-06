import { NextRequest, NextResponse } from 'next/server';
import { getCreatorByUsername, listVideos } from '@/lib/ugc';
import { getServerFirestore as getAdminDb } from '@/lib/server-firestore';

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

    let completedCount = 0;
    try {
      const db = getAdminDb();
      const orderSnap = await db.collection('ugcOrders')
        .where('creatorId', '==', creator.userId)
        .where('status', '==', 'COMPLETED')
        .get();
      completedCount = orderSnap.size;
    } catch (e) {
      console.error('[ugc/creator] orders count unavailable, defaulting to 0:', e);
    }

    return NextResponse.json({
      creator: {
        ...creator,
        sampleVideos: videos,
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
