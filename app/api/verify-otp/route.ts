import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code required' }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const normalizedEmail = email.toLowerCase();

    const { data, error } = await supabase
      .from('email_otps')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error) {
      console.error('[Verify OTP] Lookup error:', error);
      return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'No verification code found for this email. Please request a new code.' }, { status: 400 });
    }

    if (new Date(data.expires_at).getTime() < Date.now()) {
      await supabase.from('email_otps').delete().eq('email', normalizedEmail);
      return NextResponse.json({ error: 'This code has expired. Please request a new code.' }, { status: 400 });
    }

    if (String(data.otp) !== String(code).trim()) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    await supabase.from('email_otps').delete().eq('email', normalizedEmail);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Verify OTP] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
