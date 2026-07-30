import { NextRequest, NextResponse } from 'next/server';
import { getServerFirestore as getAdminDb } from '@/lib/server-firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const db = getAdminDb();

    const profileSnap = await db.collection('ugcCreators').doc(userId).get();
    const profile = profileSnap.exists ? profileSnap.data() : null;

    const ordersSnap = await db
      .collection('ugcOrders')
      .where('creatorId', '==', userId)
      .get();
    const docs = ordersSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ profile, orders: docs });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    console.error('[ugc/my-profile] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
