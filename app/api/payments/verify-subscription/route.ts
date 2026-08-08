import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/lib/firebase';
import { getFirestore, doc, getDoc, updateDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { sendSubscriptionReceiptEmail } from '@/lib/services/email/subscription-emails';
import { sendSubscriptionRenewedEmail } from '@/lib/services/email/subscription-lifecycle-emails';
import { sendReferralConvertedToPaidEmail, sendReferralRewardEarnedEmail } from '@/lib/services/email/referral-emails';
import { createPostHogClient } from '@/lib/posthog-server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';

const COMMISSION_RATE = 0.20; // 20% referral commission

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json();

    if (!reference) {
      return NextResponse.json({ error: 'Payment reference is required' }, { status: 400 });
    }

    console.log('🔍 [verify-subscription] Verifying payment with reference:', reference);

    // Verify payment with Paystack
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      console.error('❌ [verify-subscription] PAYSTACK_SECRET_KEY not configured');
      return NextResponse.json({ error: 'Payment verification failed - configuration error' }, { status: 500 });
    }

    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
      },
    });

    const verifyData = await verifyResponse.json();
    console.log('📊 [verify-subscription] Paystack verification response:', verifyData);

    if (!verifyData.status) {
      console.error('❌ [verify-subscription] Paystack verification failed:', verifyData.message);
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    const transaction = verifyData.data;
    const metadata = transaction.metadata || {};
    const plan = metadata.plan || 'starter';
    const billing = metadata.billing || 'monthly';
    const userId = metadata.userId || transaction.customer?.customer_code;

    if (!userId) {
      console.error('❌ [verify-subscription] No userId in transaction metadata');
      return NextResponse.json({ error: 'Invalid payment - no user ID' }, { status: 400 });
    }

    console.log('✅ [verify-subscription] Payment verified, updating user plan:', { userId, plan, billing });

    // Calculate subscription end date
    const subscriptionEndDate = new Date();
    if (billing === 'monthly') {
      // Monthly: 30 days from now
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30);
    } else {
      subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
    }

    const paymentAmount = transaction.amount / 100; // Convert from kobo to Naira

    let userEmail = transaction.customer?.email || '';
    let userName = 'User';
    let userBusinessName = 'Your Business';
    let previousPlan: string | undefined;

    // 1) Update the Supabase users row (primary - this is what MO Sell reads)
    try {
      const supabase = getSupabaseServer();
      const { data: supabaseUser, error: lookupError } = await supabase
        .from('users')
        .select('"displayName","businessName",email,plan')
        .eq('id', userId)
        .maybeSingle();

      if (!lookupError && supabaseUser) {
        userEmail = supabaseUser.email || userEmail;
        userName = supabaseUser.displayName || supabaseUser.businessName || userName;
        userBusinessName = supabaseUser.businessName || userBusinessName;
        previousPlan = supabaseUser.plan || undefined;
      }

      const { error: subErr } = await supabase.from('users').upsert({
        id: userId,
        plan,
        subscriptionStatus: 'active',
        subscriptionStartDate: new Date().toISOString(),
        subscriptionEndDate: subscriptionEndDate.toISOString(),
        lastPaymentReference: reference,
        lastPaymentAmount: paymentAmount,
        lastPaymentDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        moSellSubscription: {
          status: 'active',
          plan,
          startDate: new Date().toISOString(),
          endDate: subscriptionEndDate.toISOString(),
          reference,
        },
      });

      if (subErr) {
        console.error('❌ [verify-subscription] Supabase user update failed:', subErr);
      } else {
        console.log('✅ [verify-subscription] Supabase user plan updated');
      }
    } catch (supabaseError) {
      console.error('❌ [verify-subscription] Supabase update error:', supabaseError);
    }

    // 2) Mirror to Firestore (legacy busmo owner app) - best-effort, never fatal
    const { firestore } = initializeFirebase();
    const userRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      await updateDoc(userRef, {
        plan,
        subscriptionStatus: 'active',
        subscriptionStartDate: new Date(),
        subscriptionEndDate,
        lastPaymentReference: reference,
        lastPaymentAmount: paymentAmount,
        lastPaymentDate: new Date(),
        updatedAt: new Date(),
      });
      console.log('✅ [verify-subscription] Firestore user plan updated');
    } else {
      console.log('ℹ️ [verify-subscription] No Firestore user found for', userId, '- skipping mirror (Supabase is primary)');
    }

    console.log('✅ [verify-subscription] User plan updated successfully');

    // Log the subscription payment
    await addDoc(collection(firestore, 'subscription_payments'), {
      userId: userId,
      reference: reference,
      plan: plan,
      billing: billing,
      amount: paymentAmount,
      currency: transaction.currency,
      status: 'success',
      paidAt: transaction.paid_at ? new Date(transaction.paid_at * 1000) : new Date(),
      createdAt: new Date(),
    });

    console.log('✅ [verify-subscription] Payment logged successfully');

    const posthog = createPostHogClient();
    posthog.capture({
      distinctId: userId,
      event: 'subscription_payment_verified',
      properties: {
        plan,
        billing_cycle: billing,
        amount: paymentAmount,
        currency: transaction.currency,
      },
    });
    await posthog.shutdown();

    // Process referral commission if user was referred
    try {
      await processReferralCommission(firestore, userId, plan, paymentAmount);
    } catch (referralError) {
      console.error('⚠️ [verify-subscription] Referral processing failed:', referralError);
      // Don't fail the main flow if referral processing fails
    }

    // Send subscription receipt email (non-blocking)
    const businessName = userBusinessName;

    // Calculate next billing date
    const nextBillingDate = new Date(subscriptionEndDate);

    sendSubscriptionReceiptEmail({
      email: userEmail,
      name: userName,
      businessName: businessName,
      planName: plan,
      amount: paymentAmount,
      currency: transaction.currency,
      transactionId: reference,
      billingPeriod: billing === 'yearly' ? 'Yearly' : 'Monthly',
      nextBillingDate: nextBillingDate.toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' }),
    }).catch((emailError) => {
      console.error('❌ [verify-subscription] Failed to send receipt email:', emailError);
      // Don't fail the request if email fails
    });

    // Send subscription renewed email if this is a renewal (user already had a plan)
    if (previousPlan && previousPlan !== 'free') {
      sendSubscriptionRenewedEmail({
        email: userEmail,
        name: userName,
        businessName: businessName,
        planName: plan,
        amount: paymentAmount,
        billingPeriod: billing === 'yearly' ? 'Yearly' : 'Monthly',
        nextBillingDate: nextBillingDate.toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' }),
        currency: transaction.currency,
      }).catch((emailError) => {
        console.error('❌ [verify-subscription] Failed to send renewal email:', emailError);
        // Don't fail the request if email fails
      });
    }

    return NextResponse.json({ 
      success: true, 
      plan: plan,
      billing: billing,
      subscriptionEndDate: subscriptionEndDate.toISOString(),
    });

  } catch (error) {
    console.error('❌ [verify-subscription] Error:', error);
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
  }
}

// Process referral commission
async function processReferralCommission(firestore: any, userId: string, plan: string, paymentAmount: number) {
  try {
    // Find referral record
    const referralsQuery = query(
      collection(firestore, 'referrals'),
      where('referredId', '==', userId)
    );
    const referralsSnapshot = await getDocs(referralsQuery);
    
    if (referralsSnapshot.empty) {
      console.log('ℹ️ [referral] No referral found for user:', userId);
      return;
    }

    const referralDoc = referralsSnapshot.docs[0];
    const referralData = referralDoc.data();
    const referrerId = referralData.referrerId;

    if (!referrerId) {
      console.log('ℹ️ [referral] No referrer ID found');
      return;
    }

    // Calculate commission (20% of payment amount)
    const commissionAmount = paymentAmount * COMMISSION_RATE;

    // Get referrer's current balance
    const referrerRef = doc(firestore, 'users', referrerId);
    const referrerDoc = await getDoc(referrerRef);
    
    if (!referrerDoc.exists()) {
      console.error('❌ [referral] Referrer not found:', referrerId);
      return;
    }

    const referrerData = referrerDoc.data();
    const currentBalance = referrerData.referralBalance || 0;
    const totalEarned = referrerData.totalEarned || 0;

    // Update referral record
    await updateDoc(referralDoc.ref, {
      status: 'active',
      hasSubscribed: true,
      subscriptionPlan: plan,
      subscriptionDate: new Date(),
      commissionEarned: commissionAmount,
      updatedAt: newTimestamp(),
    });

    // Update referrer's balance and stats
    await updateDoc(referrerRef, {
      referralBalance: currentBalance + commissionAmount,
      totalEarned: totalEarned + commissionAmount,
      activeReferrals: (referrerData.activeReferrals || 0) + 1,
      updatedAt: newTimestamp(),
    });

    // Log commission transaction
    await addDoc(collection(firestore, 'referral_transactions'), {
      referrerId: referrerId,
      referredId: userId,
      type: 'commission',
      amount: commissionAmount,
      plan: plan,
      paymentReference: referralDoc.id,
      createdAt: newTimestamp(),
    });

    console.log('✅ [referral] Commission credited:', {
      referrerId,
      amount: commissionAmount,
      plan: plan
    });

    // Send referral emails (non-blocking)
    const referrerEmail = referrerData.email;
    const referrerName = referrerData.name || referrerData.displayName || 'Referrer';
    const referrerBusinessName = referrerData.businessName || 'Your Business';

    // Get referred user info
    const referredUserDoc = await getDoc(doc(firestore, 'users', userId));
    const referredUserData = referredUserDoc.data();
    const referredUserName = referredUserData?.name || referredUserData?.displayName || 'User';
    const referredUserBusinessName = referredUserData?.businessName || 'Their Business';

    if (referrerEmail) {
      // Send referral converted to paid email
      sendReferralConvertedToPaidEmail({
        email: referrerEmail,
        name: referrerName,
        businessName: referrerBusinessName,
        referralName: referredUserName,
        referralEmail: userId,
        planName: plan,
        conversionDate: new Date().toLocaleDateString(),
        rewardAmount: commissionAmount,
        currency: 'NGN',
      }).catch((emailError) => {
        console.error('❌ [referral] Failed to send converted email:', emailError);
      });

      // Send referral reward earned email
      sendReferralRewardEarnedEmail({
        email: referrerEmail,
        name: referrerName,
        businessName: referrerBusinessName,
        referralName: referredUserName,
        referralEmail: userId,
        rewardAmount: commissionAmount,
        rewardType: 'credit',
        earnedDate: new Date().toLocaleDateString(),
        currency: 'NGN',
      }).catch((emailError) => {
        console.error('❌ [referral] Failed to send reward earned email:', emailError);
      });
    }

  } catch (error) {
    console.error('❌ [referral] Error processing commission:', error);
    throw error;
  }
}

function newTimestamp() {
  return serverTimestamp();
}