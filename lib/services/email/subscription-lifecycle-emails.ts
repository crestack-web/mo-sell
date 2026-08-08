import { sendEmail, renderShell, formatMoney, APP_URL } from './core';

export interface SubscriptionRenewedData {
  email: string;
  name: string;
  businessName?: string;
  planName: string;
  amount: number;
  billingPeriod: string;
  nextBillingDate: string;
  currency?: string;
}

export async function sendSubscriptionRenewedEmail(data: SubscriptionRenewedData) {
  const name = data.name || 'there';
  const amount = formatMoney(data.amount, data.currency);
  const html = renderShell({
    title: 'Your subscription has been renewed 🔄',
    subtitle: `Hi ${name}, thanks for staying with MO Sell.`,
    body: `
      <p>Your <strong>${data.planName}</strong> plan was renewed for ${amount}. Your next billing date is <strong>${data.nextBillingDate}</strong>.</p>
      <p>No action needed — you're all set. Your storefront and all ${data.planName} features remain active.</p>
    `,
    ctaText: 'Go to dashboard',
    ctaUrl: `${APP_URL()}/dashboard`,
  });
  return sendEmail({
    to: data.email,
    name,
    subject: `Your ${data.planName} plan was renewed`,
    html,
  });
}

export interface SubscriptionPaymentFailedData {
  email: string;
  name: string;
  businessName?: string;
  planName: string;
  amount: number;
  currency?: string;
  retryDate?: string;
}

export async function sendSubscriptionPaymentFailedEmail(data: SubscriptionPaymentFailedData) {
  const name = data.name || 'there';
  const amount = formatMoney(data.amount, data.currency);
  const html = renderShell({
    title: 'Payment failed — action needed ⚠️',
    subtitle: `Hi ${name}, we couldn't process your ${data.planName} subscription payment.`,
    body: `
      <p>Your most recent attempt to charge <strong>${amount}</strong> for <strong>${data.planName}</strong> failed. Your subscription is still active for now, but you'll lose access soon if the payment doesn't go through.</p>
      ${data.retryDate ? `<p>We'll automatically retry on <strong>${data.retryDate}</strong>.</p>` : ''}
      <p>To avoid any interruption, please check your payment method or update your billing details.</p>
    `,
    ctaText: 'Update billing',
    ctaUrl: `${APP_URL()}/dashboard/settings`,
  });
  return sendEmail({
    to: data.email,
    name,
    subject: `Action needed: your ${data.planName} payment failed`,
    html,
  });
}

export interface SubscriptionExpiringSoonData {
  email: string;
  name: string;
  businessName?: string;
  planName: string;
  endDate: string;
  amount: number;
  currency?: string;
}

export async function sendSubscriptionExpiringSoonEmail(data: SubscriptionExpiringSoonData) {
  const name = data.name || 'there';
  const amount = formatMoney(data.amount, data.currency);
  const html = renderShell({
    title: 'Your subscription renews soon ⏰',
    subtitle: `Hi ${name}, your ${data.planName} plan ends on ${data.endDate}.`,
    body: `
      <p>Don't lose access to <strong>${data.businessName || 'your store'}</strong>. Renew now for <strong>${amount}/${data.planName === 'yearly' ? 'year' : 'month'}</strong> to keep all your features running.</p>
      <p>Renewing takes less than a minute and keeps your storefront live with zero downtime.</p>
    `,
    ctaText: 'Renew now',
    ctaUrl: `${APP_URL()}/subscribe`,
  });
  return sendEmail({
    to: data.email,
    name,
    subject: `Your ${data.planName} subscription renews on ${data.endDate}`,
    html,
  });
}

export interface SubscriptionExpiredData {
  email: string;
  name: string;
  businessName?: string;
  planName: string;
  endDate: string;
}

export async function sendSubscriptionExpiredEmail(data: SubscriptionExpiredData) {
  const name = data.name || 'there';
  const html = renderShell({
    title: 'Your subscription has ended',
    subtitle: `Hi ${name}, your ${data.planName} plan expired on ${data.endDate}.`,
    body: `
      <p>Your storefront is now on a limited plan, so some features may be paused. Don't worry — all your products, orders and settings are safe.</p>
      <p>Re-subscribe to unlock everything and keep selling with no interruptions.</p>
    `,
    ctaText: 'Reactivate my plan',
    ctaUrl: `${APP_URL()}/subscribe`,
  });
  return sendEmail({
    to: data.email,
    name,
    subject: `Your ${data.planName} subscription has ended`,
    html,
  });
}

export interface SubscriptionCancelledData {
  email: string;
  name: string;
  businessName?: string;
  planName: string;
  endDate: string;
}

export async function sendSubscriptionCancelledEmail(data: SubscriptionCancelledData) {
  const name = data.name || 'there';
  const html = renderShell({
    title: 'Subscription cancelled',
    subtitle: `Hi ${name}, we're sorry to see you go.`,
    body: `
      <p>Your <strong>${data.planName}</strong> subscription has been cancelled and will remain active until <strong>${data.endDate}</strong>. After that date you'll move to the free plan.</p>
      <p>You can reactivate anytime — all your data is saved. If this was a mistake, or if there's anything we can help with, just reply to this email.</p>
    `,
    ctaText: 'Reactivate my plan',
    ctaUrl: `${APP_URL()}/subscribe`,
  });
  return sendEmail({
    to: data.email,
    name,
    subject: `Your ${data.planName} subscription was cancelled`,
    html,
  });
}
