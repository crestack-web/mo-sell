import { sendEmail } from '@/lib/services/email/core';

async function sendPortfolioEmail(params: {
  to: string;
  name?: string;
  subject: string;
  html: string;
}) {
  try {
    const result = await sendEmail({
      to: params.to,
      name: params.name,
      subject: params.subject,
      html: params.html,
      from: { email: 'hello@mo-sell.store', name: 'MO-Sell UGC' },
    });
    return { success: result.success };
  } catch (err) {
    console.error('[Email Portfolio] Send failed:', err);
    return { success: false };
  }
}

export interface PortfolioRequestData {
  guestName: string;
  guestEmail: string;
  guestCompany?: string;
  creatorName: string;
  creatorEmail: string;
  productName: string;
  budget: number;
  deadline?: string;
  deposit: number;
  orderId: string;
  videoLength: string;
}

export async function sendPortfolioRequestToCreator(data: PortfolioRequestData) {
  const budgetDisplay = `₦${(data.budget / 100).toLocaleString()}`;
  const depositDisplay = `₦${(data.deposit / 100).toLocaleString()}`;
  return sendPortfolioEmail({
    to: data.creatorEmail,
    name: data.creatorName,
    subject: `New UGC Request from ${data.guestName} via your portfolio`,
    html: `
      <div style="font-family:system-ui;max-width:560px;margin:0 auto;">
        <h2 style="color:#0EA5E9;">New Request!</h2>
        <p><strong>${data.guestName}</strong>${data.guestCompany ? ` from <strong>${data.guestCompany}</strong>` : ''} wants to work with you.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Product</td><td style="padding:8px;border:1px solid #e2e8f0;">${data.productName}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Video Length</td><td style="padding:8px;border:1px solid #e2e8f0;">${data.videoLength}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Budget</td><td style="padding:8px;border:1px solid #e2e8f0;">${budgetDisplay}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Deposit Paid</td><td style="padding:8px;border:1px solid #e2e8f0;">${depositDisplay}</td></tr>
          ${data.deadline ? `<tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Deadline</td><td style="padding:8px;border:1px solid #e2e8f0;">${data.deadline}</td></tr>` : ''}
        </table>
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://mo-sell.store'}/dashboard/content-hub" style="display:inline-block;padding:12px 24px;background:#0EA5E9;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">View in Dashboard</a>
        <p style="margin-top:16px;color:#64748b;font-size:0.85rem;">MO-Sell UGC Marketplace</p>
      </div>
    `,
  });
}

export async function sendPortfolioRequestToGuest(data: PortfolioRequestData) {
  const depositDisplay = `₦${(data.deposit / 100).toLocaleString()}`;
  return sendPortfolioEmail({
    to: data.guestEmail,
    name: data.guestName,
    subject: `Your UGC request for ${data.creatorName} has been received`,
    html: `
      <div style="font-family:system-ui;max-width:560px;margin:0 auto;">
        <h2 style="color:#0EA5E9;">Request Received!</h2>
        <p>Hi ${data.guestName},</p>
        <p>We've notified <strong>${data.creatorName}</strong> about your request. You'll get an update once they accept.</p>
        <p><strong>Deposit of ${depositDisplay} has been securely held</strong> in escrow and will only be released when the work is completed to your satisfaction.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Product</td><td style="padding:8px;border:1px solid #e2e8f0;">${data.productName}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Creator</td><td style="padding:8px;border:1px solid #e2e8f0;">${data.creatorName}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;">Video Length</td><td style="padding:8px;border:1px solid #e2e8f0;">${data.videoLength}</td></tr>
        </table>
        <p style="color:#64748b;font-size:0.85rem;">MO-Sell UGC Marketplace</p>
      </div>
    `,
  });
}

export async function sendCreatorAcceptedEmailToGuest(data: PortfolioRequestData) {
  return sendPortfolioEmail({
    to: data.guestEmail,
    name: data.guestName,
    subject: `${data.creatorName} accepted your UGC request!`,
    html: `
      <div style="font-family:system-ui;max-width:560px;margin:0 auto;">
        <h2 style="color:#0EA5E9;">Accepted!</h2>
        <p>Hi ${data.guestName},</p>
        <p><strong>${data.creatorName}</strong> has accepted your request and will start working on it.</p>
        <p>They'll deliver in the agreed timeframe. We'll email you when the draft is ready for review.</p>
        <p style="color:#64748b;font-size:0.85rem;">MO-Sell UGC Marketplace</p>
      </div>
    `,
  });
}
