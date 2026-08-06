import { NextRequest, NextResponse } from 'next/server';
import { getServerFirestore as getAdminDb } from '@/lib/server-firestore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const niche = searchParams.get('niche');
    const priceMax = searchParams.get('priceMax');
    const sort = searchParams.get('sort') ?? 'rating';

    const db = getAdminDb();
    // Single-field where() only — a two-field query needs a Firestore composite
    // index that may not exist, which makes the discover page 500.
    const snap = await db.collection('ugcCreators').where('isActive', '==', true).limit(200).get();
    let creators = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as any[];
    creators = creators.filter(c => c.isBanned !== true);

    if (niche) {
      creators = creators.filter(c => c.niches?.some((n: string) => n.toLowerCase().includes(niche.toLowerCase())));
    }
    if (priceMax) {
      const max = parseInt(priceMax);
      if (!isNaN(max)) {
        creators = creators.filter(c => (c.price30s ?? 0) <= max);
      }
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

    // Enrich with stored creator scores from supabase.creator_metrics.
    // Match by the creator's username or the handle inside their social links.
    const socialHandle = (raw: unknown): string | null => {
      if (typeof raw !== 'string' || !raw.trim()) return null;
      try {
        const path = new URL(raw.trim()).pathname.split('/').filter(Boolean)[0];
        return path ? path.replace(/^@/, '') : null;
      } catch {
        return null;
      }
    };

    const candidates = new Set<string>();
    for (const c of result) {
      if (c.username) candidates.add(String(c.username));
      if (c.socialLinks?.tiktok) {
        const h = socialHandle(c.socialLinks.tiktok);
        if (h) candidates.add(h);
      }
      if (c.socialLinks?.instagram) {
        const h = socialHandle(c.socialLinks.instagram);
        if (h) candidates.add(h);
      }
    }

    let metricsByHandle: Record<string, any> = {};
    if (candidates.size) {
      try {
        const supabase = await import('@/lib/supabase-server').then(m => m.supabaseServer);
        if (supabase) {
          const handles = [...candidates];
          const chunk = 100;
          for (let i = 0; i < handles.length; i += chunk) {
            const { data, error } = await supabase
              .from('creator_metrics')
              .select('handle, platform, score, er, avg_views, top_hashtags, audience_guess, posts_count, followers, updated_at')
              .in('handle', handles.slice(i, i + chunk));
            if (!error && data) {
              for (const m of data) metricsByHandle[m.handle] = m;
            }
          }
        }
      } catch (err) {
        console.error('[ugc/creators] score enrichment failed:', err);
      }
    }

    const final = result.map(c => {
      const m =
        metricsByHandle[String(c.username)] ??
        metricsByHandle[socialHandle(c.socialLinks?.tiktok) ?? ''] ??
        metricsByHandle[socialHandle(c.socialLinks?.instagram) ?? ''];
      return {
        ...c,
        score: m?.score ?? null,
        grade: m?.score != null ? (m.score >= 80 ? 'A' : m.score >= 65 ? 'B' : m.score >= 50 ? 'C' : m.score >= 35 ? 'D' : 'E') : null,
        metrics: m
          ? {
              er: m.er ?? null,
              avgViews: m.avg_views ?? null,
              topHashtags: m.top_hashtags ?? [],
              audienceGuess: m.audience_guess ?? null,
              followers: m.followers ?? null,
              postsCount: m.posts_count ?? null,
              updatedAt: m.updated_at ?? null,
            }
          : null,
      };
    });

    return NextResponse.json({ creators: final });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
