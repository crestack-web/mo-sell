import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, code, accessToken, brandName, phone, website, industry } = body;

    if (!brandName || !String(brandName).trim()) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    let userId: string;
    let accountCreated = false;

    if (accessToken) {
      // Google OAuth path — identity already verified by Supabase
      const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
      if (userError || !user) {
        return NextResponse.json({ error: 'Invalid session. Please sign in again.' }, { status: 401 });
      }
      userId = user.id;
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

      // Create the auth user (auto-confirmed)
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
      });

      if (createError) {
        const message = String(createError.message || '').toLowerCase();
        if (message.includes('already') || message.includes('registered')) {
          // A previous failed attempt left an auth user without a brand row.
          // Recover by linking this registration to the existing account.
          const { data: listData, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
          if (listError) {
            console.error('[Brand Register] listUsers error:', listError);
            return NextResponse.json({ error: 'Failed to link existing account' }, { status: 500 });
          }
          const existing = (listData?.users || []).find(u => (u.email || '').toLowerCase() === normalizedEmail);
          if (!existing) {
            return NextResponse.json({ error: 'An account with this email already exists. Please sign in.' }, { status: 400 });
          }
          userId = existing.id;
        } else {
          console.error('[Brand Register] createUser error:', createError);
          return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
        }
      } else {
        userId = created.user.id;
        accountCreated = true;
      }
    }

    // Create the brand profile with the service role (bypasses RLS)
    const now = new Date().toISOString();
    const brandPayload = {
      id: userId,
      brandName: String(brandName).trim(),
      email: (email || '').toLowerCase(),
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

    return NextResponse.json({ success: true, userId, accountCreated });
  } catch (error) {
    console.error('[Brand Register] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
