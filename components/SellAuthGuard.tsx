'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSell } from '../context/SellContext';
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
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#F0F9FF', gap: 16,
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(14,165,233,0.30)',
          animation: 'sellPulse 1.4s ease-in-out infinite',
          overflow: 'hidden',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png"
            alt="MO Sell"
            style={{ width: 36, height: 36, objectFit: 'contain' }}
          />
        </div>
        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#3D5A7A' }}>
          Loading MO Sell…
        </p>
        <style>{`
          @keyframes sellPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50%       { opacity: 0.75; transform: scale(0.96); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
