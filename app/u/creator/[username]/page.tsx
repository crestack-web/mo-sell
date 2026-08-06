import { Metadata } from 'next';
import { getCreatorByUsername } from '@/lib/ugc';
import { PortfolioPage } from './components/PortfolioPage';

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { username } = await params;
    const creator = (await getCreatorByUsername(username, { activeOnly: true })) as any;
    if (!creator || creator.isBanned === true) {
      return { title: 'Creator Not Found | MO-Sell' };
    }

    const creatorName = creator.displayName ?? creator.name ?? 'Creator';
    const symbol = creator.currency === 'NGN' ? '₦' : '$';
    const priceDisplay = Math.round((creator.price30s ?? 0) / 100).toLocaleString();
    const appUrl = process.env.PUBLIC_APP_URL ?? 'https://mo-sell.store';

    return {
      title: `${creatorName} | UGC Creator for Hire in Nigeria | MO-Sell`,
      description: creator.bio
        ? `${creator.bio.slice(0, 160)}`
        : `Hire ${creatorName} for UGC videos. From ${symbol}${priceDisplay}/30s.`,
      openGraph: {
        title: `${creatorName} | UGC Creator`,
        description: `Hire ${creatorName} for UGC videos. From ${symbol}${priceDisplay}/30s.`,
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
        description: `Hire ${creatorName} for UGC videos. From ${symbol}${priceDisplay}/30s.`,
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
