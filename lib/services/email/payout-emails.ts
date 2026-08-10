import { sendEmail, renderShell, formatMoney, APP_URL } from './core';

export interface PayoutOtpEmailData {
  email: string;
  name?: string;
  otp: string;
  amount: number;
  currency?: string;
  storeName?: string;
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
}

export async function sendPayoutOtpEmail(data: PayoutOtpEmailData) {
  const amount = formatMoney(data.amount, data.currency);
  const name = data.name || 'there';
  const storeName = data.storeName || 'MO Sell';
  const accountLine = data.bankName
    ? `<p style="color: #3D5A7A; font-size: 16px; line-height: 1.6; margin: 0 0 8px 0; text-align: center;">
        Payout destination: <strong>${data.bankName}</strong> · ${data.accountName ?? ''} · ${data.accountNumber ?? ''}
       </p>`
    : '';

  const html = renderShell({
    title: 'Confirm Your Payout 🔐',
    subtitle: `You requested a payout of ${amount} from ${storeName}.`,
    body: `
      ${accountLine}
      <p>Enter the 6-digit code below to authorize the transfer. For your security, this code expires in <strong>10 minutes</strong>.</p>
      <div style="background: linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%); padding: 24px; border-radius: 16px; text-align: center; margin: 32px 0;">
        <div style="color: #ffffff; font-size: 48px; font-weight: 800; letter-spacing: 12px; font-family: monospace;">
          ${data.otp}
        </div>
      </div>
      <p>If you didn't request this payout, please contact support immediately — someone may be trying to withdraw from your account.</p>
    `,
  });

  return sendEmail({
    to: data.email,
    name,
    subject: `Confirm your ${amount} payout — MO Sell`,
    html,
  });
}

export interface PayoutConfirmedEmailData {
  email: string;
  name?: string;
  amount: number;
  currency?: string;
  storeName?: string;
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  payoutRequestId?: string;
  transferCode?: string;
  withdrawalId?: string;
}

export async function sendPayoutConfirmedEmail(data: PayoutConfirmedEmailData) {
  const amount = formatMoney(data.amount, data.currency);
  const name = data.name || 'there';
  const storeName = data.storeName || 'MO Sell';

  const html = renderShell({
    title: 'Payout Sent ✅',
    subtitle: `Your payout of ${amount} has been initiated.`,
    body: `
      <p>We've sent <strong>${amount}</strong> from <strong>${storeName}</strong> to your bank account:</p>
      <div style="background: #F7FAFC; border: 1px solid #E0EFFA; border-radius: 12px; padding: 20px; margin: 16px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #8AAABF;">Amount</td>
            <td style="padding: 6px 0; text-align: right; color: #16A34A; font-weight: 800;">${amount}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #8AAABF;">Bank</td>
            <td style="padding: 6px 0; text-align: right; color: #0C1A2E; font-weight: 700;">${data.bankName ?? '—'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #8AAABF;">Account</td>
            <td style="padding: 6px 0; text-align: right; color: #0C1A2E; font-weight: 600;">${data.accountName ?? ''} · ${data.accountNumber ?? '—'}</td>
          </tr>
          ${data.payoutRequestId ? `
          <tr>
            <td style="padding: 6px 0; color: #8AAABF;">Reference</td>
            <td style="padding: 6px 0; text-align: right; color: #0C1A2E; font-weight: 600;">${data.payoutRequestId}</td>
          </tr>` : ''}
        </table>
      </div>
      <p>Funds are sent instantly to your bank. They typically arrive within 1–3 business days.</p>
    `,
    ctaText: 'View payout history',
    ctaUrl: `${APP_URL()}/dashboard/earnings`,
  });

  return sendEmail({
    to: data.email,
    name,
    subject: `Your ${amount} payout has been sent ✅`,
    html,
  });
}
