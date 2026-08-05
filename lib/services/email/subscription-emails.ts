import { sendEmail, renderShell, formatMoney, APP_URL } from './core';

export interface SubscriptionReceiptData {
  email: string;
  name: string;
  businessName?: string;
  planName: string;
  amount: number;
  currency?: string;
  transactionId: string;
  billingPeriod: string;
  nextBillingDate: string;
}

export async function sendSubscriptionReceiptEmail(data: SubscriptionReceiptData) {
  const name = data.name || 'there';
  const businessName = data.businessName || 'Your Business';
  const amount = formatMoney(data.amount, data.currency);
  const html = renderShell({
    title: 'Payment received ✅',
    subtitle: `Your ${data.planName} subscription for ${businessName} is now active.`,
    body: `
      <div style="background: #F7FAFC; border: 1px solid #E0EFFA; border-radius: 12px; padding: 20px; margin: 16px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #8AAABF;">Plan</td>
            <td style="padding: 6px 0; text-align: right; color: #0C1A2E; font-weight: 700; text-transform: capitalize;">${data.planName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #8AAABF;">Billing period</td>
            <td style="padding: 6px 0; text-align: right; color: #0C1A2E; font-weight: 600;">${data.billingPeriod}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #8AAABF;">Amount paid</td>
            <td style="padding: 6px 0; text-align: right; color: #16A34A; font-weight: 800;">${amount}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #8AAABF;">Next billing date</td>
            <td style="padding: 6px 0; text-align: right; color: #0C1A2E; font-weight: 600;">${data.nextBillingDate}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #8AAABF;">Reference</td>
            <td style="padding: 6px 0; text-align: right; color: #0C1A2E; font-family: monospace; font-size: 12px;">${data.transactionId}</td>
          </tr>
        </table>
      </div>
      <p>You now have full access to all ${data.planName} features. If you have any questions, just reply to this email.</p>
    `,
    ctaText: 'Open my dashboard',
    ctaUrl: `${APP_URL()}/dashboard`,
  });
  return sendEmail({
    to: data.email,
    name,
    subject: `Payment received — your ${data.planName} plan is active`,
    html,
  });
}
