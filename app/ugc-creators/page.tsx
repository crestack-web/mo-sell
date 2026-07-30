import type { Metadata } from 'next';
import UGCClientWrapper from './UGCClientWrapper';

export const metadata: Metadata = {
  title: 'Hire UGC Creators | MO Sell',
  description: 'Discover and hire UGC creators for your brand. Browse portfolios, request videos, and pay securely.',
};

export default function Page() {
  return <UGCClientWrapper />;
}
