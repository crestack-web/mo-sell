import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { Resend } from 'resend';

// Store OTPs temporarily (in production, use Redis or database)
const otpStore = new Map<string, { otp: string; email: string; fullName: string; expires: number }>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, fullName, action } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 503 });
    }

    const resend = new Resend(resendApiKey);

    if (action === 'send') {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP (expires in 10 minutes)
      otpStore.set(email, {
        otp,
        email,
        fullName: fullName || '',
        expires: Date.now() + 10 * 60 * 1000,
      });

      // Send branded OTP email
      const { data, error } = await resend.emails.send({
        from: 'MO Sell <noreply@mo-sell.store>',
        to: [email],
        subject: 'Verify your email - MO Sell',
        html: `
          <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 32px;">
              <img src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png" alt="MO Sell" style="width: 64px; height: 64px; object-fit: contain;" />
            </div>
            <h1 style="color: #0C1A2E; font-size: 28px; font-weight: 800; margin: 0 0 16px 0; text-align: center;">
              Verify Your Email
            </h1>
            <p style="color: #3D5A7A; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
              Hi ${fullName || 'there'},<br>
              Thanks for signing up! Use the code below to verify your email address.
            </p>
            <div style="background: linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%); padding: 24px; border-radius: 16px; text-align: center; margin: 32px 0;">
              <div style="color: #ffffff; font-size: 48px; font-weight: 800; letter-spacing: 12px; font-family: monospace;">
                ${otp}
              </div>
            </div>
            <p style="color: #8AAABF; font-size: 14px; line-height: 1.6; margin: 24px 0; text-align: center;">
              This code will expire in <strong>10 minutes</strong>.<br>
              If you didn't create an account with MO Sell, you can safely ignore this email.
            </p>
            <div style="text-align: center; padding-top: 24px; border-top: 1px solid #E0EFFA; margin-top: 32px;">
              <p style="color: #8AAABF; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Busmo · MO Sell · Built for African commerce
              </p>
            </div>
          </div>
        `,
      });

      if (error) {
        console.error('[Verify Email] Resend error:', error);
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Verification code sent to your email',
        messageId: data.id 
      });
    }

    if (action === 'verify') {
      const stored = otpStore.get(email);
      
      if (!stored) {
        return NextResponse.json({ error: 'OTP not found or expired. Please request a new code.' }, { status: 400 });
      }

      if (Date.now() > stored.expires) {
        otpStore.delete(email);
        return NextResponse.json({ error: 'OTP expired. Please request a new code.' }, { status: 400 });
      }

      if (stored.otp !== body.otp) {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
      }

      // OTP verified successfully
      otpStore.delete(email);

      return NextResponse.json({ 
        success: true, 
        message: 'Email verified successfully',
        email,
        fullName: stored.fullName,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[Verify Email] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}