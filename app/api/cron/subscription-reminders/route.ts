import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import {
  sendSubscriptionExpiringSoonEmail,
  sendSubscriptionExpiredEmail,
} from '@/lib/services/email/subscription-lifecycle-emails';

const EXPIRING_WINDOW_DAYS = 3;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');
  const xSecret = req.headers.get('x-cron-secret');

  if (cronSecret && auth !== `Bearer ${cronSecret}` && xSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseServer();
    const now = new Date();

    const { data: users, error } = await supabase
      .from('users')
      .select('id,email,"displayName","businessName",plan,"subscriptionStatus","subscriptionEndDate","expiringReminderSentAt","expiredReminderSentAt"')
      .eq('subscriptionStatus', 'active');

    if (error) {
      console.error('[Cron] Failed to load active users:', error);
      return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
    }

    const expiringWindow = new Date(now.getTime() + EXPIRING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    let expiringSent = 0;
    let expiredSent = 0;

    for (const user of (users ?? [])) {
      const endDate = user.subscriptionEndDate ? new Date(user.subscriptionEndDate) : null;
      if (!endDate) continue;

      const email = user.email;
      const name = user.displayName || user.businessName || 'there';
      const planName = user.plan || 'starter';
      const endDateDisplay = endDate.toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' });

      if (endDate > now && endDate <= expiringWindow && !user.expiringReminderSentAt) {
        try {
          await sendSubscriptionExpiringSoonEmail({
            email,
            name,
            businessName: user.businessName,
            planName,
            endDate: endDateDisplay,
            amount: 10,
            currency: 'NGN',
          });
          await supabase.from('users').update({ expiringReminderSentAt: now.toISOString() }).eq('id', user.id);
          expiringSent++;
        } catch (err) {
          console.error('[Cron] Expiring email failed for', user.id, err);
        }
      }

      if (endDate <= now && !user.expiredReminderSentAt) {
        try {
          await sendSubscriptionExpiredEmail({
            email,
            name,
            businessName: user.businessName,
            planName,
            endDate: endDateDisplay,
          });
          await supabase.from('users').update({
            expiredReminderSentAt: now.toISOString(),
            subscriptionStatus: 'expired',
          }).eq('id', user.id);
          expiredSent++;
        } catch (err) {
          console.error('[Cron] Expired email failed for', user.id, err);
        }
      }
    }

    return NextResponse.json({ ok: true, checked: users?.length ?? 0, expiringSent, expiredSent });
  } catch (err) {
    console.error('[Cron] Subscription reminders error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
