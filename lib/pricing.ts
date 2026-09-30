// ─── MO Sell pricing model ────────────────────────────────────────────────────
//
// Two models:
//   1. pay_as_you_go — 8% commission per sale, no monthly fee.
//   2. monthly       — plan fee in NGN (from USD list price × NGN_PER_USD); Standard
//                      keeps a small per-sale commission, Pro/Enterprise are 0%.
//                      Plan fee is deducted from earnings ONLY when the month's
//                      revenue is >= the plan fee (conditional billing).

export const BILLING_MODEL_PAYG = 'pay_as_you_go';
export const BILLING_MODEL_MONTHLY = 'monthly';

/** Commission charged per sale for pay-as-you-go stores. */
export const PAYG_COMMISSION_RATE = 0.08;

/** Legacy managed-payments commission (pre-pricing-model stores). */
export const LEGACY_MANAGED_PAYMENTS_COMMISSION_RATE = 0.05;

/**
 * Monthly Standard ($10) plan per-sale commission by product type:
 * physical/services are charged 3%, digital 5%. Pro/Enterprise charge 0%.
 */
export const STANDARD_PLAN_COMMISSION_RATE = 0.03;
export const STANDARD_PLAN_DIGITAL_COMMISSION_RATE = 0.05;

/**
 * Single source for USD → NGN conversion used by plan fees and pricing UI.
 * Isolated here so plan pricing does not scatter hardcoded rates.
 * (Payment FX in lib/currency.ts / lib/paymentService.ts is separate.)
 */
export const NGN_PER_USD = 1550;

/** Display helper: 0.08 → "8%". */
export function formatCommissionPct(rate: number): string {
  const pct = Math.round(rate * 1000) / 10; // one decimal if needed (e.g. 7.5)
  return Number.isInteger(pct) ? `${pct}%` : `${pct}%`;
}

export type MonthlyPlanId = 'standard' | 'pro' | 'enterprise';

export interface MonthlyPlan {
  id: MonthlyPlanId;
  name: string;
  priceUsd: number;
  tagline: string;
  features: string[];
  popular?: boolean;
}

export const MONTHLY_PLANS: MonthlyPlan[] = [
  {
    id: 'standard',
    name: 'Standard',
    priceUsd: 10,
    tagline: 'For new stores ready to grow',
    features: [
      '3% commission (5% on digital)',
      'Unlimited products & orders',
      'Paystack payments',
      '10 premium themes',
      'Custom domain',
      'Real-time analytics',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceUsd: 25,
    tagline: 'For scaling brands',
    features: [
      'Everything in Standard',
      'Priority support',
      'Advanced analytics',
      'AI-powered product builder',
      'Unlimited Ask Mo tokens',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceUsd: 50,
    tagline: 'For high-volume merchants',
    features: [
      'Everything in Pro',
      'Dedicated account manager',
      'Custom integrations',
      'Bulk product import',
      'Multi-user access',
    ],
  },
];

export function getMonthlyPlan(id?: string | null): MonthlyPlan | undefined {
  if (!id) return undefined;
  return MONTHLY_PLANS.find(p => p.id === id);
}

// ─── Ask Mo AI token packages (client-safe) ──────────────────────────────────

export interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  /** Price in NGN (kobo * 100) */
  price: number;
  popular?: boolean;
}

export const TOKEN_PACKAGES: TokenPackage[] = [
  { id: 'starter', name: 'Starter Pack', tokens: 1_000, price: 5_000 },
  { id: 'standard', name: 'Standard Pack', tokens: 3_000, price: 12_000, popular: true },
  { id: 'pro', name: 'Pro Pack', tokens: 10_000, price: 30_000 },
  { id: 'enterprise', name: 'Enterprise Pack', tokens: 25_000, price: 60_000 },
];

/** Monthly plan fee converted to NGN. */
export function getPlanFeeNgn(planId?: string | null): number {
  const plan = getMonthlyPlan(planId);
  return plan ? plan.priceUsd * NGN_PER_USD : 0;
}

/** Current month as 'YYYY-MM' in the business timezone (UTC-safe). */
export function currentMonthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** Advance a 'YYYY-MM' key by n months. */
export function nextMonthKey(month: string, n = 1): string {
  const [y, m] = month.split('-').map(Number);
  const total = y * 12 + (m - 1) + n;
  const year = Math.floor(total / 12);
  const monthNum = (total % 12) + 1;
  return `${year}-${String(monthNum).padStart(2, '0')}`;
}

/**
 * Per-sale commission rate for a store config + product type.
 *   - monthly Standard plan → 5% (digital 10%)
 *   - monthly Pro/Enterprise → 0 (no commission, fee-based)
 *   - payg     → PAYG_COMMISSION_RATE
 *   - legacy managedPayments → 5%
 *   - otherwise → 0 (legacy behavior, no earnings tracked)
 */
export function getOrderCommissionRate(config?: {
  billingModel?: string | null;
  billingPlan?: string | null;
  managedPayments?: boolean;
} | null, productType?: string | null): number {
  if (config?.billingModel === BILLING_MODEL_MONTHLY) {
    if (config.billingPlan === 'standard') {
      return productType === 'digital'
        ? STANDARD_PLAN_DIGITAL_COMMISSION_RATE
        : STANDARD_PLAN_COMMISSION_RATE;
    }
    return 0;
  }
  if (config?.billingModel === BILLING_MODEL_PAYG) return PAYG_COMMISSION_RATE;
  if (config?.managedPayments === true) return LEGACY_MANAGED_PAYMENTS_COMMISSION_RATE;
  return 0;
}

/**
 * Blended commission rate across an order's line items. For single-rate models
 * (PAYG, Pro/Enterprise, legacy managed payments) this equals that rate.
 */
export function getCommissionRate(config?: {
  billingModel?: string | null;
  billingPlan?: string | null;
  managedPayments?: boolean;
} | null): number {
  if (config?.billingModel === BILLING_MODEL_MONTHLY) {
    if (config.billingPlan === 'standard') {
      return STANDARD_PLAN_DIGITAL_COMMISSION_RATE;
    }
    return 0;
  }
  if (config?.billingModel === BILLING_MODEL_PAYG) return PAYG_COMMISSION_RATE;
  if (config?.managedPayments === true) return LEGACY_MANAGED_PAYMENTS_COMMISSION_RATE;
  return 0;
}

/**
 * Compute the commission for a confirmed order by applying the per-product-type
 * rate to each line item, then applying the blended rate to the order total
 * (so shipping keeps counting like before). Returns the rounded amount plus the
 * effective rate used, for display on the order row / earnings entry.
 */
export function computeOrderCommission(
  lineItems: Array<{ lineTotal?: number | null; productType?: string | null }>,
  config?: { billingModel?: string | null; billingPlan?: string | null; managedPayments?: boolean } | null,
  orderTotal?: number | null,
): { commissionAmount: number; effectiveRate: number } {
  let gross = 0;
  let commission = 0;
  for (const item of lineItems) {
    const lineTotal = Number(item.lineTotal ?? 0);
    gross += lineTotal;
    commission += lineTotal * getOrderCommissionRate(config, item.productType);
  }
  const effectiveRate = gross > 0 ? commission / gross : 0;
  const base = orderTotal != null && !Number.isNaN(Number(orderTotal)) ? Number(orderTotal) : gross;
  const commissionAmount = Math.round(base * effectiveRate * 100) / 100;
  return { commissionAmount, effectiveRate };
}

/** Whether the platform manages payments for this store (earnings tracked). */
export function isPlatformManaged(config?: {
  billingModel?: string | null;
  managedPayments?: boolean;
} | null): boolean {
  if (!config) return false;
  if (config.billingModel === BILLING_MODEL_PAYG || config.billingModel === BILLING_MODEL_MONTHLY) return true;
  return config.managedPayments === true;
}
