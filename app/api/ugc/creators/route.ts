import { NextRequest, NextResponse } from 'next/server';
import { getServerFirestore as getAdminDb } from '@/lib/server-firestore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const niche = searchParams.get('niche');
    const priceMax = searchParams.get('priceMax');
    const sort = searchParams.get('sort') ?? 'rating';

    const db = getAdminDb();
    let query: FirebaseFirestore.Query = db.collection('ugcCreators').where('isActive', '==', true).where('isBanned', '==', false);

    const snap = await query.limit(50).get();
    let creators = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

    if (niche) {
      creators = creators.filter(c => c.niches?.some((n: string) => n.toLowerCase().includes(niche.toLowerCase())));
    }
    if (priceMax) {
      creators = creators.filter(c => (c.price30s ?? 0) <= parseInt(priceMax));
    }

    creators.sort((a, b) => {
      if (sort === 'price') return (a.price30s ?? 0) - (b.price30s ?? 0);
      if (sort === 'orders') return (b.totalOrders ?? 0) - (a.totalOrders ?? 0);
      return (b.rating ?? 0) - (a.rating ?? 0);
    });

    const videoSnap = await db.collection('ugcVideos').limit(200).get();
    const videosByCreator: Record<string, any[]> = {};
    videoSnap.docs.forEach((d: any) => {
      const v = { id: d.id, ...d.data() };
      const cid = v.creatorId;
      if (!videosByCreator[cid]) videosByCreator[cid] = [];
      videosByCreator[cid].push(v);
    });

    const result = creators.map(c => ({
      ...c,
      sampleVideos: (videosByCreator[c.userId] ?? []).slice(0, 3),
      price30sDisplay: (c.price30s ?? 0) / 100,
      price60sDisplay: (c.price60s ?? 0) / 100,
    }));

    return NextResponse.json({ creators: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
