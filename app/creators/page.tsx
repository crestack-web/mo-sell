import type { Metadata } from 'next';
import CreatorWelcomeClient from './CreatorWelcomeClient';

export const metadata: Metadata = {
  title: 'UGC Creators | MO Sell',
  description: 'Build a free UGC creator profile on MO Sell, get brand briefs, upload your videos, and get paid — all in one place.',
};

export default function Page() {
  return <CreatorWelcomeClient />;
}
