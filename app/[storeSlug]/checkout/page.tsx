import React from 'react';
import { notFound } from 'next/navigation';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import { getStoreConfigBySlug } from '@/lib/store';
import { CheckoutForm } from './CheckoutForm';

function getPreferredPaymentMethod(config: Record<string, any>): 'paystack' | 'whop' {
  const currency = (config.currency ?? 'NGN').toString().toUpperCase();
  const hasVerifiedPayoutAccount = Boolean(
    config.payoutBankName?.toString().trim() &&
    config.payoutAccountName?.toString().trim() &&
    config.payoutAccountNumber?.toString().trim()
  );

  if (currency === 'NGN' && (hasVerifiedPayoutAccount || config.paystackPublicKey || config.useOwnPaystack)) {
    return 'paystack';
  }

  return 'whop';
}

async function getStoreConfig(storeSlug: string) {
  try {
    return await getStoreConfigBySlug(storeSlug);
  } catch { return null; }
}

async function getShippingZones(businessId: string) {
  try {
    const supabase = getSupabaseServer();
    const { data: rows } = await supabase
      .from('storeShippingZones')
      .select('*')
      .eq('businessId', businessId);
    return (rows ?? []).map((d: any) => ({ id: d.id, ...d }));
  } catch { return []; }
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const config = await getStoreConfig(storeSlug);
  if (!config) notFound();

  const shippingZones = await getShippingZones(config.businessId);
  const pickupLocations = config.pickupLocations ?? [];

  return (
    <div className="sf-page" style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--sf-text-1)', marginBottom: 4 }}>
        Checkout
      </h1>
      <p style={{ fontSize: '0.875rem', color: 'var(--sf-text-3)', marginBottom: 28 }}>
        Complete your order details below
      </p>
      <CheckoutForm
        storeSlug={storeSlug}
        businessId={config.businessId}
        currency={config.currency}
        shippingZones={shippingZones as any[]}
        pickupLocations={pickupLocations}
        preferredPaymentMethod={getPreferredPaymentMethod(config)}
        whopEnabled={config.whopEnabled === true || getPreferredPaymentMethod(config) === 'whop'}
      />
    </div>
  );
}
