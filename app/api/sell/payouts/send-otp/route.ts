import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import { isPlatformManaged } from '@/lib/pricing';
import { storePayoutOtp } from '@/lib/payout-otp';
import { sendPayoutOtpEmail } from '@/lib/services/email/payout-emails';

/**
 * POST /api/sell/payouts/send-otp
 *
 * Sends a one-time verification code to the store owner's email before any
 * payout is executed. The code is stored server-side keyed by businessId.
 *
 * Body: { businessId: string, email?: string }
 */
export async function POST(req: NextRequest) {
  let body: { businessId?: string; email?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { businessId } = body;
  if (!businessId) {
    return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();

    // 1. Load store config
    const { data: config } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .maybeSingle();

    if (!config) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    if (!isPlatformManaged(config)) {
      return NextResponse.json({ error: 'Managed payments not enabled for this store' }, { status: 403 });
    }

    // 2. Confirm there is an available balance to pay out
    const { data: earnings, error: earningsError } = await supabase
      .from('storeEarnings')
      .select('*')
      .eq('businessId', businessId)
      .eq('status', 'available');

    if (earningsError || !earnings?.length) {
      return NextResponse.json({ error: 'No available earnings to pay out.' }, { status: 400 });
    }

    const totalNet = earnings.reduce((sum: number, d: any) => sum + (d.netAmount ?? 0), 0);
    const roundedNet = Math.round(totalNet * 100) / 100;

    if (roundedNet <= 0) {
      return NextResponse.json({ error: 'No payable earnings balance.' }, { status: 400 });
    }

    // Minimum payout threshold (NGN) — reject before sending a code so the
    // OTP amount always matches what can actually be paid out.
    const MIN_PAYOUT_AMOUNT = 2000;
    if (config.currency === 'NGN' && roundedNet < MIN_PAYOUT_AMOUNT) {
      return NextResponse.json({
        error: `Minimum payout is ₦${MIN_PAYOUT_AMOUNT.toLocaleString('en-NG')}. You need ₦${(MIN_PAYOUT_AMOUNT - roundedNet).toLocaleString('en-NG')} more to request a payout.`,
      }, { status: 400 });
    }

    // 3. Resolve the destination email (user's account email, else store contact)
    const email = body.email?.trim() || config.contactEmail || null;
    if (!email) {
      return NextResponse.json({ error: 'No email on file to send the verification code to.' }, { status: 400 });
    }

    // 4. Persist the OTP
    const otp = await storePayoutOtp({
      businessId,
      email,
      amount: roundedNet,
      currency: config.currency ?? 'NGN',
    });

    // 5. Send the branded OTP email — awaited so a delivery failure is surfaced
    const emailResult = await sendPayoutOtpEmail({
      email,
      name: config.ownerName ?? config.businessName ?? config.storeName ?? undefined,
      otp,
      amount: roundedNet,
      currency: config.currency ?? 'NGN',
      storeName: config.storeName ?? config.businessName ?? 'MO Sell',
      accountName: config.payoutAccountName,
      accountNumber: config.payoutAccountNumber,
      bankName: config.payoutBankName,
    });

    if (!emailResult.success) {
      await supabase.from('payout_otps').delete().eq('businessId', businessId);
      console.error('[payouts/send-otp] Email delivery failed:', emailResult);
      return NextResponse.json({ error: 'Failed to send verification code. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email.',
      expiresInMinutes: 10,
      amount: roundedNet,
      currency: config.currency ?? 'NGN',
      email: email.replace(/(.{2}).+(@.+)/, '$1***$2'),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    console.error('[payouts/send-otp] Error:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
