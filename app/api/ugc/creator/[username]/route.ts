import { NextRequest, NextResponse } from 'next/server';
import { getServerFirestore as getAdminDb } from '@/lib/server-firestore';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    const db = getAdminDb();
    const snap = await db.collection('ugcCreators')
      .where('username', '==', username)
      .where('isActive', '==', true)
      .where('isBanned', '==', false)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const doc = snap.docs[0];
    const creator = { id: doc.id, ...doc.data() } as any;

    const videoSnap = await db.collection('ugcVideos')
      .where('creatorId', '==', creator.userId)
      .where('hasWatermark', '==', true)
      .limit(9)
      .get();
    const videos = videoSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    let completedCount = 0;
    try {
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
        price30sDisplay: (creator.price30s ?? 0) / 100,
        price60sDisplay: (creator.price60s ?? 0) / 100,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
