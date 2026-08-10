import { getSupabaseServer } from '@/lib/database/postgresql-adapter';

/**
 * Generate, persist, and return a 6-digit payout OTP for a business.
 * The code expires in 10 minutes and is keyed by businessId (upsert), so
 * requesting a new code simply replaces the previous one.
 */
export async function storePayoutOtp(params: {
  businessId: string;
  email: string;
  amount: number;
  currency?: string | null;
}): Promise<string> {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const supabase = getSupabaseServer();

  const { error } = await supabase
    .from('payout_otps')
    .upsert(
      {
        businessId: params.businessId,
        email: params.email,
        otp,
        amount: params.amount,
        currency: params.currency ?? 'NGN',
        expiresAt,
        createdAt: new Date().toISOString(),
      },
      { onConflict: 'businessId' }
    );

  if (error) {
    console.error('[payout-otp] Failed to store OTP:', error);
    throw new Error('Failed to send verification code');
  }

  return otp;
}

export interface PayoutOtpVerification {
  ok: boolean;
  error?: string;
  email?: string;
  amount?: number;
  currency?: string;
}

/**
 * Verify a payout OTP for a business. On success the record is deleted so it
 * cannot be reused. On expiry the stale record is also cleaned up.
 */
export async function verifyPayoutOtp(
  businessId: string,
  otp: string
): Promise<PayoutOtpVerification> {
  if (!otp || !/^\d{6}$/.test(otp)) {
    return { ok: false, error: 'Enter the 6-digit verification code' };
  }

  const supabase = getSupabaseServer();
  const { data: stored } = await supabase
    .from('payout_otps')
    .select('*')
    .eq('businessId', businessId)
    .single();

  if (!stored) {
    return { ok: false, error: 'No code found. Please request a new one.' };
  }

  if (new Date(stored.expiresAt).getTime() < Date.now()) {
    await supabase.from('payout_otps').delete().eq('businessId', businessId);
    return { ok: false, error: 'Code expired. Please request a new one.' };
  }

  if (stored.otp !== otp) {
    return { ok: false, error: 'Invalid verification code' };
  }

  await supabase.from('payout_otps').delete().eq('businessId', businessId);

  return { ok: true, email: stored.email, amount: stored.amount, currency: stored.currency };
}
