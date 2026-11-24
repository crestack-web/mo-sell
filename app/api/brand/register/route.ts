import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import { createModuleUser } from '@/lib/account-identity';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, code, accessToken, brandName, phone, website, industry } = body;

    if (!brandName || !String(brandName).trim()) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    let userId: string;
    let authEmail: string;
    let accountCreated = false;

    if (accessToken) {
      // Google OAuth path — identity already verified by Supabase
      const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
      if (userError || !user) {
        return NextResponse.json({ error: 'Invalid session. Please sign in again.' }, { status: 401 });
      }
      userId = user.id;
      authEmail = user.email || String(email || '').toLowerCase();
    } else {
      // Email + password path — require OTP verification
      if (!email || !password || !code) {
        return NextResponse.json({ error: 'Email, password and verification code are required' }, { status: 400 });
      }
      if (String(password).length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
      }

      const normalizedEmail = String(email).toLowerCase();

      // Verify OTP
      const { data: otpRow, error: otpError } = await supabase
        .from('email_otps')
        .select('*')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (otpError) {
        console.error('[Brand Register] OTP lookup error:', otpError);
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
      }

      if (!otpRow) {
        return NextResponse.json({ error: 'No verification code found for this email. Please request a new code.' }, { status: 400 });
      }

      if (new Date(otpRow.expires_at).getTime() < Date.now()) {
        await supabase.from('email_otps').delete().eq('email', normalizedEmail);
        return NextResponse.json({ error: 'This code has expired. Please request a new code.' }, { status: 400 });
      }

      if (String(otpRow.otp) !== String(code).trim()) {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
      }

      await supabase.from('email_otps').delete().eq('email', normalizedEmail);

      // Create the next available brand identity for this email. The real
      // address stays on the brand profile; only auth uses the alias.
      try {
        const created = await createModuleUser(supabase.auth, {
          email: normalizedEmail,
          password,
          module: 'brand',
          fullName: String(brandName).trim(),
        });
        userId = created.userId;
        authEmail = created.authEmail;
        accountCreated = true;
      } catch (createError) {
        console.error('[Brand Register] createUser error:', createError);
        return NextResponse.json(
          { error: createError instanceof Error ? createError.message : 'Failed to create account' },
          { status: 500 }
        );
      }
    }

    // Create the brand profile with the service role (bypasses RLS)
    const now = new Date().toISOString();
    const brandPayload = {
      id: userId,
      brandName: String(brandName).trim(),
      email: (email || authEmail).toLowerCase(),
      userId,
      phone: phone || '',
      website: website || '',
      industry: industry || 'Other',
      walletBalance: 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    const { error: upsertError } = await supabase
      .from('brands')
      .upsert(brandPayload, { onConflict: 'id' });

    if (upsertError) {
      console.error('[Brand Register] brand upsert error:', upsertError);
      return NextResponse.json({ error: 'Failed to create brand profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true, userId, authEmail, accountCreated });
  } catch (error) {
    console.error('[Brand Register] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
