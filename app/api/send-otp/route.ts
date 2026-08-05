import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 503 });
    }

    const supabase = getSupabaseServer();

    // Reject emails that already belong to a brand
    const { data: existingBrand } = await supabase
      .from('brands')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    if (existingBrand) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: storeError } = await supabase
      .from('email_otps')
      .upsert({
        email: email.toLowerCase(),
        otp,
        full_name: name || '',
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      });

    if (storeError) {
      console.error('[Send OTP] Failed to store OTP:', storeError);
      return NextResponse.json({ error: 'Failed to send verification code' }, { status: 500 });
    }

    const resend = new Resend(resendApiKey);

    const { data, error } = await resend.emails.send({
      from: 'MO Sell <noreply@mo-sell.store>',
      to: [email],
      subject: 'Your Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Your Verification Code</h2>
          <p style="color: #666; font-size: 16px;">Hello ${name || 'there'},</p>
          <p style="color: #666; font-size: 16px;">Your verification code is:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border-radius: 8px;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error('[Send OTP] Resend error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: data.id });
  } catch (error) {
    console.error('[Send OTP] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
