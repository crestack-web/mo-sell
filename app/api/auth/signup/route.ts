import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { Resend } from 'resend';
import { getDatabase } from '@/lib/database/adapter';
import { sendWelcomeCreatorEmail } from '@/lib/services/email/welcome-emails';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, fullName, action, otp } = body;

    if (action === 'send-otp') {
      if (!email || !password || !fullName) {
        return NextResponse.json({ error: 'Email, password, and full name are required' }, { status: 400 });
      }

      const resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) {
        return NextResponse.json({ error: 'Email service not configured' }, { status: 503 });
      }

      if (!supabaseServer) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
      }

      // Check if user already exists (best-effort - admin.createUser also guards at verify time)
      const { data: existingUser } = await supabaseServer
        .from('users')
        .select('id, email')
        .eq('email', email)
        .maybeSingle();

      if (existingUser?.id) {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
      }

      // Check brand accounts too (they live in auth but not in the public.users table)
      const { data: existingBrand } = await supabaseServer
        .from('brands')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingBrand?.id) {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
      }

      // Generate 6-digit OTP (expires in 10 minutes)
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      // Persist OTP in Supabase so it survives serverless instances
      const { error: storeError } = await supabaseServer
        .from('email_otps')
        .upsert(
          { email, otp: otpCode, full_name: fullName, expires_at: expiresAt },
          { onConflict: 'email' }
        );

      if (storeError) {
        console.error('[Signup] Failed to store OTP:', storeError);
        return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
      }

      // Send branded OTP email
      const resend = new Resend(resendApiKey);
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
              Hi ${fullName},<br>
              Thanks for signing up! Use the code below to verify your email address.
            </p>
            <div style="background: linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%); padding: 24px; border-radius: 16px; text-align: center; margin: 32px 0;">
              <div style="color: #ffffff; font-size: 48px; font-weight: 800; letter-spacing: 12px; font-family: monospace;">
                ${otpCode}
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
        console.error('[Signup] Resend error:', error);
        return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Verification code sent to your email',
        messageId: data.id
      });
    }

    if (action === 'verify-otp') {
      if (!email || !otp) {
        return NextResponse.json({ error: 'Email and verification code are required' }, { status: 400 });
      }
      if (!password) {
        return NextResponse.json({ error: 'Password is required' }, { status: 400 });
      }

      if (!supabaseServer) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
      }

      // Look up the persisted OTP record
      const { data: stored, error: fetchError } = await supabaseServer
        .from('email_otps')
        .select('email, otp, full_name, expires_at')
        .eq('email', email)
        .single();

      if (fetchError || !stored) {
        return NextResponse.json({ error: 'OTP not found or expired. Please request a new code.' }, { status: 400 });
      }

      if (new Date(stored.expires_at).getTime() < Date.now()) {
        await supabaseServer.from('email_otps').delete().eq('email', email);
        return NextResponse.json({ error: 'OTP expired. Please request a new code.' }, { status: 400 });
      }

      if (stored.otp !== otp) {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
      }

      // OTP verified - create the user account
      const { data, error } = await supabaseServer.auth.admin.createUser({
        email: stored.email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: stored.full_name,
        },
      });

      if (error) {
        console.error('[Signup] Supabase error:', error);
        const message = String(error.message || '');
        if (error.code === 'email_exists' || /already registered|already been registered|has already/.test(message.toLowerCase())) {
          return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
      }

      const userId = data.user?.id;
      if (!userId) {
        return NextResponse.json({ error: 'Failed to get user ID' }, { status: 500 });
      }

      const businessId = `biz_${userId.slice(0, 12)}`;

      // Clean up the OTP record so it can't be reused
      await supabaseServer.from('email_otps').delete().eq('email', email);

      // Create user and business profile records (best-effort - auth is already complete)
      try {
        const db = getDatabase();
        await db.doc(`users/${userId}`).set({
          displayName: stored.full_name,
          email: stored.email,
          businessId,
          plan: 'starter',
          moSellAccess: true,
          emailVerified: true,
          createdAt: new Date().toISOString(),
        });

        await db.doc(`businesses/${businessId}`).set({
          ownerUserId: userId,
          businessName: `${stored.full_name}'s Business`,
          businessType: '',
          createdAt: new Date().toISOString(),
        });
      } catch (profileError) {
        console.error('[Signup] Failed to create profile records:', profileError);
      }

      // Send welcome email (non-blocking - never fail account creation over email)
      sendWelcomeCreatorEmail({
        email: stored.email,
        name: stored.full_name,
        businessName: `${stored.full_name}'s Business`,
      }).catch((emailError) => {
        console.error('[Signup] Failed to send welcome email:', emailError);
      });

      return NextResponse.json({
        success: true,
        message: 'Account created successfully',
        userId,
        businessId,
        email: stored.email,
        fullName: stored.full_name,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[Signup] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
