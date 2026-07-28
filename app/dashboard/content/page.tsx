import dynamic from 'next/dynamic';

const SellContentPage = dynamic(
  () => import('./SellContentPage').then(m => m.SellContentPage),
  { ssr: false }
);

export default function Page() {
  return <SellContentPage />;
}
