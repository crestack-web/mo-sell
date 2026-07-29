import { ImageResponse } from 'next/og';
import { getServerFirestore as getAdminDb } from '@/lib/server-firestore';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  try {
    const db = getAdminDb();
    const snap = await db.collection('ugcCreators').where('username', '==', username).where('isActive', '==', true).limit(1).get();
    if (snap.empty) {
      return new ImageResponse(
        (
          <div style={{ display: 'flex', width: 1200, height: 630, background: '#0f172a', color: '#fff', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
            <p style={{ fontSize: 40 }}>Creator not found</p>
          </div>
        ),
        { width: 1200, height: 630 }
      );
    }
    const creator = snap.docs[0].data() as any;
    const priceDisplay = `₦${Math.round((creator.price30s ?? 0) / 100).toLocaleString()}`;

    return new ImageResponse(
      (
        <div style={{
          display: 'flex', width: 1200, height: 630,
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          color: '#fff', fontFamily: 'system-ui',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 60, position: 'relative',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 32,
            background: 'rgba(255,255,255,0.05)', borderRadius: 24,
            padding: '40px 60px', backdropFilter: 'blur(10px)',
          }}>
            <div style={{
              width: 140, height: 140, borderRadius: '50%',
              background: creator.avatarUrl ? `url(${creator.avatarUrl})` : '#0EA5E9',
              backgroundSize: 'cover', backgroundPosition: 'center',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 48, fontWeight: 800, color: '#fff',
              flexShrink: 0,
            }}>
              {!creator.avatarUrl ? (creator.name?.charAt(0)?.toUpperCase() ?? 'C') : null}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h1 style={{ fontSize: 52, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                {creator.name}
              </h1>
              <p style={{ fontSize: 24, color: '#94a3b8', margin: 0 }}>
                UGC Creator for Hire in Nigeria
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <span style={{ background: '#0EA5E9', padding: '8px 20px', borderRadius: 100, fontSize: 18, fontWeight: 700 }}>
                  From {priceDisplay}/30s
                </span>
                {creator.totalOrders > 5 && (
                  <span style={{ background: '#16A34A', padding: '8px 20px', borderRadius: 100, fontSize: 18, fontWeight: 700 }}>
                    ✓ Verified
                  </span>
                )}
              </div>
            </div>
          </div>
          <p style={{
            position: 'absolute', bottom: 24, fontSize: 16, color: '#475569',
          }}>
            mo-sell.store
          </p>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  } catch {
    return new ImageResponse(
      (
        <div style={{ display: 'flex', width: 1200, height: 630, background: '#0f172a', color: '#fff', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
          <p style={{ fontSize: 40 }}>MO-Sell UGC</p>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }
}
