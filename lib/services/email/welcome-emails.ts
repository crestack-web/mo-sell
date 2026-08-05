import { sendEmail, renderShell, APP_URL } from './core';

export interface WelcomeCreatorData {
  email: string;
  name: string;
  businessName?: string;
}

export interface WelcomeBrandData {
  email: string;
  name: string;
  brandName: string;
}

export async function sendWelcomeCreatorEmail(data: WelcomeCreatorData) {
  const name = data.name || 'there';
  const businessName = data.businessName || 'your business';
  const html = renderShell({
    title: 'Welcome to MO Sell! 🎉',
    subtitle: `Hi ${name}, you're in.`,
    body: `
      <p>Thanks for joining MO Sell. You're on your way to launching <strong>${businessName}</strong> in minutes — no code, no stress.</p>
      <p>Here's what you can do right away:</p>
      <ul>
        <li>Build a beautiful storefront with AI assistance</li>
        <li>Accept payments via Paystack (NGN + USD)</li>
        <li>Sell physical products, digital products, courses and services</li>
        <li>Get your own custom domain</li>
      </ul>
      <p>Need help setting up? Our <a href="${APP_URL()}/dashboard" style="color:#0EA5E9;">dashboard</a> walks you through everything step by step.</p>
    `,
    ctaText: 'Go to my dashboard',
    ctaUrl: `${APP_URL()}/dashboard`,
  });
  return sendEmail({
    to: data.email,
    name,
    subject: 'Welcome to MO Sell 🎉',
    html,
  });
}

export async function sendWelcomeBrandEmail(data: WelcomeBrandData) {
  const name = data.name || data.brandName || 'there';
  const html = renderShell({
    title: 'Welcome to MO Sell, ' + data.brandName + '! 🎉',
    subtitle: `Hi ${name}, your brand account is ready.`,
    body: `
      <p>Your brand profile for <strong>${data.brandName}</strong> has been created. You can now:</p>
      <ul>
        <li>Discover and connect with creators to produce content for you</li>
        <li>Fund creator campaigns from your wallet</li>
        <li>Track campaign performance and analytics</li>
      </ul>
      <p>Head to the brand dashboard to get started.</p>
    `,
    ctaText: 'Open brand dashboard',
    ctaUrl: `${APP_URL()}/brand/dashboard`,
  });
  return sendEmail({
    to: data.email,
    name,
    subject: `Welcome to MO Sell, ${data.brandName}! 🎉`,
    html,
  });
}
