// ─── MO Sell pricing model ────────────────────────────────────────────────────
//
// Two models:
//   1. pay_as_you_go — 10% commission per sale, no monthly fee.
//   2. monthly       — no per-sale commission; a fixed plan fee that is deducted
//                      from the earnings balance ONLY when the month's revenue
//                      is >= the plan fee (conditional billing).

export const BILLING_MODEL_PAYG = 'pay_as_you_go';
export const BILLING_MODEL_MONTHLY = 'monthly';

/** Commission charged per sale for pay-as-you-go stores. */
export const PAYG_COMMISSION_RATE = 0.1;

/** Legacy managed-payments commission (pre-pricing-model stores). */
export const LEGACY_MANAGED_PAYMENTS_COMMISSION_RATE = 0.05;

/** Approximate USD → NGN rate used to compare plan fees with NGN revenue. */
export const NGN_PER_USD = 1550;

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
      'No commission on sales',
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
 * Per-sale commission rate for a store config.
 *   - monthly  → 0 (no commission, fee-based)
 *   - payg     → PAYG_COMMISSION_RATE
 *   - legacy managedPayments → 5%
 *   - otherwise → 0 (legacy behavior, no earnings tracked)
 */
export function getCommissionRate(config?: {
  billingModel?: string | null;
  managedPayments?: boolean;
} | null): number {
  if (config?.billingModel === BILLING_MODEL_MONTHLY) return 0;
  if (config?.billingModel === BILLING_MODEL_PAYG) return PAYG_COMMISSION_RATE;
  if (config?.managedPayments === true) return LEGACY_MANAGED_PAYMENTS_COMMISSION_RATE;
  return 0;
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
