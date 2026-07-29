import { NextRequest, NextResponse } from 'next/server';
import { getServerFirestore as getAdminDb, FieldValue } from '@/lib/server-firestore';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'creator';
}

async function generateUniqueUsername(db: any, base: string): Promise<string> {
  let username = slugify(base);
  let attempt = 0;
  while (true) {
    const existing = await db.collection('ugcCreators').where('username', '==', username).limit(1).get();
    if (existing.empty) return username;
    attempt++;
    username = `${slugify(base)}-${attempt}`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, displayName, bio, niches, price30s, price60s, deliveryDays, sampleVideos, avatarUrl, username: providedUsername } = await req.json();
    if (!userId || !displayName || !niches?.length || !price30s || !price60s) {
      return NextResponse.json({ error: 'userId, displayName, niches, price30s, price60s required' }, { status: 400 });
    }

    const db = getAdminDb();
    const existing = await db.collection('ugcCreators').doc(userId).get();
    if (existing.exists) {
      return NextResponse.json({ error: 'Creator already exists. Update your profile instead.' }, { status: 409 });
    }

    const username = providedUsername
      ? slugify(providedUsername)
      : await generateUniqueUsername(db, displayName);

    const creator = {
      userId,
      username,
      displayName,
      bio: bio ?? '',
      avatarUrl: avatarUrl ?? null,
      niches,
      isActive: true,
      isBanned: false,
      price30s: Math.round(price30s * 100),
      price60s: Math.round(price60s * 100),
      deliveryDays: deliveryDays ?? 5,
      rating: 0,
      totalOrders: 0,
      totalEarnings: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await db.collection('ugcCreators').doc(userId).set(creator);

    if (sampleVideos?.length) {
      const batch = db.batch();
      for (const url of sampleVideos.slice(0, 5)) {
        const ref = db.collection('ugcVideos').doc();
        batch.set(ref, {
          creatorId: userId,
          url,
          thumbnail: null,
          duration: 15,
          hasWatermark: true,
          title: null,
          createdAt: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();
    }

    return NextResponse.json({ success: true, isActive: true, username });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
