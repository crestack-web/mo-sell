import { Resend } from 'resend';

export const BRAND_NAME = 'MO Sell';
export const DEFAULT_SENDER_EMAIL = 'noreply@mo-sell.store';
export const SUPPORT_EMAIL = 'hello@mo-sell.store';
export const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL || 'https://mo-sell.store';
export const BRAND_LOGO =
  'https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png';

const BRAND_SHELL_COLORS = {
  bg: '#ffffff',
  surface: '#F7FAFC',
  border: '#E0EFFA',
  heading: '#0C1A2E',
  body: '#3D5A7A',
  muted: '#8AAABF',
  accentFrom: '#0EA5E9',
  accentTo: '#6366F1',
  white: '#ffffff',
};

export function formatMoney(amount: number, currency = 'NGN'): string {
  if (currency === 'USD' || currency === 'GBP' || currency === 'EUR') {
    return `${currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '€'}${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `₦${Number(amount || 0).toLocaleString()}`;
}

export function formatDate(date: string | number | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('en-NG', options ?? { year: 'numeric', month: 'long', day: 'numeric' });
}

export interface ShellOptions {
  title: string;
  subtitle?: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
}

export function renderShell({ title, subtitle, body, ctaText, ctaUrl }: ShellOptions): string {
  const year = new Date().getFullYear();
  const ctaBlock = ctaText && ctaUrl
    ? `
      <div style="text-align: center; margin: 32px 0;">
        <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, ${BRAND_SHELL_COLORS.accentFrom} 0%, ${BRAND_SHELL_COLORS.accentTo} 100%); color: ${BRAND_SHELL_COLORS.white}; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 15px; font-weight: 700;">
          ${ctaText}
        </a>
      </div>`
    : '';

  return `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: ${BRAND_SHELL_COLORS.bg};">
      <div style="text-align: center; margin-bottom: 32px;">
        <img src="${BRAND_LOGO}" alt="${BRAND_NAME}" style="width: 64px; height: 64px; object-fit: contain;" />
      </div>
      <h1 style="color: ${BRAND_SHELL_COLORS.heading}; font-size: 26px; font-weight: 800; margin: 0 0 12px 0; text-align: center; line-height: 1.3;">
        ${title}
      </h1>
      ${subtitle ? `<p style="color: ${BRAND_SHELL_COLORS.body}; font-size: 16px; line-height: 1.6; margin: 0 0 8px 0; text-align: center;">${subtitle}</p>` : ''}
      <div style="color: ${BRAND_SHELL_COLORS.body}; font-size: 15px; line-height: 1.7; margin: 24px 0;">
        ${body}
      </div>
      ${ctaBlock}
      <div style="text-align: center; padding-top: 24px; border-top: 1px solid ${BRAND_SHELL_COLORS.border}; margin-top: 32px;">
        <p style="color: ${BRAND_SHELL_COLORS.muted}; font-size: 12px; line-height: 1.6; margin: 0;">
          ${BRAND_NAME} · Built for African commerce<br/>
          <a href="mailto:${SUPPORT_EMAIL}" style="color: ${BRAND_SHELL_COLORS.muted}; text-decoration: none;">${SUPPORT_EMAIL}</a> · <a href="${APP_URL()}" style="color: ${BRAND_SHELL_COLORS.muted}; text-decoration: none;">mo-sell.store</a><br/>
          © ${year} Busmo · MO Sell
        </p>
      </div>
    </div>
  `;
}

export interface EmailPayload {
  to: string;
  name?: string;
  subject: string;
  html: string;
  text?: string;
  from?: { email: string; name: string };
}

export async function sendEmail(payload: EmailPayload): Promise<{ success: boolean; id?: string; provider?: string; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const brevoApiKey = process.env.BREVO_API_KEY;
  const from = payload.from ?? { email: DEFAULT_SENDER_EMAIL, name: BRAND_NAME };

  if (!resendApiKey && !brevoApiKey) {
    console.warn('[Email] NO EMAIL PROVIDER CONFIGURED — email NOT delivered (stubbed):', {
      to: payload.to,
      subject: payload.subject,
      from: `${from.name} <${from.email}>`,
    });
    return { success: false, provider: 'stub', error: 'No email provider configured (RESEND_API_KEY/BREVO_API_KEY missing)' };
  }

  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const { data, error } = await resend.emails.send({
        from: `${from.name} <${from.email}>`,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        ...(payload.text ? { text: payload.text } : {}),
      });
      if (error) {
        console.error('[Email] Resend error:', error);
      } else {
        return { success: true, id: data?.id, provider: 'resend' };
      }
    } catch (err) {
      console.error('[Email] Resend send failed:', err);
    }
  }

  if (brevoApiKey) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { email: from.email, name: from.name },
          to: [{ email: payload.to, name: payload.name ?? '' }],
          subject: payload.subject,
          htmlContent: payload.html,
          ...(payload.text ? { textContent: payload.text } : {}),
        }),
      });
      if (!res.ok) {
        console.error('[Email] Brevo error:', res.status, await res.text());
        return { success: false };
      }
      return { success: true, provider: 'brevo' };
    } catch (err) {
      console.error('[Email] Brevo send failed:', err);
      return { success: false };
    }
  }

  return { success: false };
}
