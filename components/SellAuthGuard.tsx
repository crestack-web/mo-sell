'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSell } from '../context/SellContext';
import { SellLoader } from './SellLoader';
import { getDatabase } from '@/lib/database/adapter';

interface Props { children: React.ReactNode; }

export function SellAuthGuard({ children }: Props) {
  const router = useRouter();
  const { user, userLoading } = useSell();
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (userLoading || !user) return;

    let cancelled = false;

    async function checkAccess() {
      try {
        const db = getDatabase();
        const userDoc = await db.doc(`users/${user!.id}`).get();
        if (cancelled) return;
        const userData = userDoc.exists ? userDoc.data() : {};

        if (!userData) {
          setHasAccess(false);
          setNeedsOnboarding(true);
          setSubscriptionChecked(true);
          return;
        }

        // Active MO Sell subscription
        const moSellSub = userData.moSellSubscription;
        if (moSellSub && moSellSub.status === 'active') {
          const endDate = new Date(moSellSub.endDate);
          if (endDate > new Date()) {
            setHasAccess(true);
            setSubscriptionChecked(true);
            return;
          }
        }

        // Owner plan includes MO Sell
        if (userData.subscriptionStatus === 'active') {
          const endDate = new Date(userData.subscriptionEndDate);
          if (endDate > new Date()) {
            setHasAccess(true);
            setSubscriptionChecked(true);
            return;
          }
        }

        // Explicit PAYG / free access flags on the user profile
        if (userData.moSellAccess === true || userData.billingModel === 'pay_as_you_go') {
          if (userData.onboardingComplete === false) {
            setNeedsOnboarding(true);
            setHasAccess(false);
            setSubscriptionChecked(true);
            return;
          }
          setHasAccess(true);
          setSubscriptionChecked(true);
          return;
        }

        // Billing lives on the business doc and/or store/config (signup writes both)
        if (userData.businessId) {
          const businessSnap = await db.doc(`businesses/${userData.businessId}`).get();
          if (cancelled) return;
          const businessData = businessSnap.exists ? businessSnap.data() : {};

          let billingModel = businessData.billingModel as string | undefined;
          let billingStatus = businessData.billingStatus as string | undefined;

          // Fallback: store config (where create-store writes commission / PAYG fields)
          if (!billingModel) {
            try {
              const configSnap = await db
                .doc(`businesses/${userData.businessId}/store/config`)
                .get();
              if (cancelled) return;
              if (configSnap.exists) {
                const cfg = configSnap.data() || {};
                billingModel = cfg.billingModel || billingModel;
                billingStatus = cfg.billingStatus || billingStatus;
              }
            } catch {
              /* ignore missing config */
            }
          }

          if (billingModel === 'pay_as_you_go' || billingModel === 'monthly') {
            if (billingStatus !== 'canceled') {
              setHasAccess(true);
              setSubscriptionChecked(true);
              return;
            }
          }

          // Has a business but no billing yet → finish PAYG onboarding, not $10 subscribe
          if (!billingModel && userData.onboardingComplete !== true) {
            setNeedsOnboarding(true);
            setHasAccess(false);
            setSubscriptionChecked(true);
            return;
          }
        } else {
          // No business yet — still in signup
          setNeedsOnboarding(true);
          setHasAccess(false);
          setSubscriptionChecked(true);
          return;
        }

        setHasAccess(false);
        setNeedsOnboarding(false);
        setSubscriptionChecked(true);
      } catch (err) {
        if (cancelled) return;
        console.error('[SellAuthGuard] Access check error:', err);
        setHasAccess(true);
        setSubscriptionChecked(true);
      }
    }

    checkAccess();

    return () => { cancelled = true; };
  }, [user, userLoading]);

  useEffect(() => {
    if (userLoading || !subscriptionChecked) return;
    if (!user) {
      router.replace('/login');
    } else if (!hasAccess) {
      // Incomplete signup → continue PAYG onboarding, not the legacy $10 page
      router.replace(needsOnboarding ? '/signup?onboarding=1' : '/subscribe');
    }
  }, [user, userLoading, subscriptionChecked, hasAccess, needsOnboarding, router]);

  if (userLoading || !subscriptionChecked) {
    return <SellLoader label="Loading your store" />;
  }

  if (!user) return null;

  return <>{children}</>;
}
