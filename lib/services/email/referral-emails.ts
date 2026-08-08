import { sendEmail, renderShell, formatMoney, APP_URL } from './core';

export interface ReferralConvertedToPaidData {
  email: string;
  name: string;
  businessName?: string;
  referralName: string;
  referralEmail: string;
  planName: string;
  conversionDate: string;
  rewardAmount: number;
  currency?: string;
}

export interface ReferralRewardEarnedData {
  email: string;
  name: string;
  businessName?: string;
  referralName: string;
  referralEmail: string;
  rewardAmount: number;
  rewardType: string;
  earnedDate: string;
  currency?: string;
}

export async function sendReferralConvertedToPaidEmail(data: ReferralConvertedToPaidData) {
  const name = data.name || 'there';
  const reward = formatMoney(data.rewardAmount, data.currency);
  const html = renderShell({
    title: 'Your referral just went pro 🎉',
    subtitle: `Hi ${name}, great news!`,
    body: `
      <p><strong>${data.referralName}</strong> (${data.referralEmail}) signed up for the <strong>${data.planName}</strong> plan on ${data.conversionDate}.</p>
      <p>You've earned a <strong>${reward}</strong> referral reward. It's been credited to your account and is ready to use.</p>
    `,
    ctaText: 'View my earnings',
    ctaUrl: `${APP_URL()}/dashboard/earnings`,
  });
  return sendEmail({
    to: data.email,
    name,
    subject: `You earned ${reward} from a referral! 🎉`,
    html,
  });
}

export async function sendReferralRewardEarnedEmail(data: ReferralRewardEarnedData) {
  const name = data.name || 'there';
  const reward = formatMoney(data.rewardAmount, data.currency);
  const html = renderShell({
    title: 'Referral reward earned 💰',
    subtitle: `Hi ${name}, here's an update on your referrals.`,
    body: `
      <p><strong>${data.referralName}</strong> has subscribed, so a <strong>${reward}</strong> reward (${data.rewardType}) was added to your account on ${data.earnedDate}.</p>
      <p>Share your referral link to earn even more — the more people you refer, the more you earn.</p>
    `,
    ctaText: 'Share my referral link',
    ctaUrl: `${APP_URL()}/dashboard/earnings`,
  });
  return sendEmail({
    to: data.email,
    name,
    subject: `Referral reward earned: ${reward}`,
    html,
  });
}
