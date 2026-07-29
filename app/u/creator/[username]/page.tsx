import { Metadata } from 'next';
import { getServerFirestore as getAdminDb } from '@/lib/server-firestore';
import { PortfolioPage } from './components/PortfolioPage';

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { username } = await params;
    const db = getAdminDb();
    const snap = await db.collection('ugcCreators')
      .where('username', '==', username)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (snap.empty) {
      return { title: 'Creator Not Found | MO-Sell' };
    }

    const creator = snap.docs[0].data() as any;
    const creatorName = creator.displayName ?? creator.name ?? 'Creator';
    const priceDisplay = Math.round((creator.price30s ?? 0) / 100).toLocaleString();
    const appUrl = process.env.PUBLIC_APP_URL ?? 'https://mo-sell.store';

    return {
      title: `${creatorName} | UGC Creator for Hire in Nigeria | MO-Sell`,
      description: creator.bio
        ? `${creator.bio.slice(0, 160)}`
        : `Hire ${creatorName} for UGC videos. From ₦${priceDisplay}/30s.`,
      openGraph: {
        title: `${creatorName} | UGC Creator`,
        description: `Hire ${creatorName} for UGC videos. From ₦${priceDisplay}/30s.`,
        type: 'profile',
        url: `${appUrl}/u/creator/${username}`,
        images: [{
          url: `${appUrl}/api/og/creator/${username}`,
          width: 1200,
          height: 630,
          alt: creatorName,
        }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${creatorName} | UGC Creator for Hire`,
        description: `Hire ${creatorName} for UGC videos. From ₦${priceDisplay}/30s.`,
        images: [`${appUrl}/api/og/creator/${username}`],
      },
      robots: { index: true, follow: true },
    };
  } catch {
    return { title: 'MO-Sell UGC Marketplace' };
  }
}

export default async function Page({ params }: Props) {
  const { username } = await params;
  return <PortfolioPage username={username} />;
}
