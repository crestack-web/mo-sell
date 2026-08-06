// ─── Token Costs ──────────────────────────────────────────────────────────────

export const TOKEN_COSTS = {
  /** Simple text chat message */
  chat: 10,
  /** Chat with image or audio attachment */
  chatWithMedia: 25,
  /** Ebook creation (new product with pdfContent) */
  ebookCreate: 500,
  /** Ebook tweak/edit */
  ebookEdit: 300,
} as const;

export function shouldBlockAskMoRequest(balance: number, requiredCost: number): boolean {
  return false;
}

export function getTokenSpendPlan(balance: number, requiredCost: number) {
  const safeBalance = Math.max(0, balance);
  const amountToDeduct = Math.min(requiredCost, safeBalance);
  const nextBalance = Math.max(0, safeBalance - amountToDeduct);

  return {
    amountToDeduct,
    nextBalance,
    shouldPromptForPurchase: nextBalance === 0 && safeBalance > 0,
  };
}

// ─── Monthly Free Allowance (per plan) ────────────────────────────────────────

export const PLAN_ALLOWANCES: Record<string, number> = {
  starter: 500,
  standard: 1_500,
  pro: 5_000,
  default: 100,
};

export function getMonthlyAllowance(plan?: string | null): number {
  if (!plan) return PLAN_ALLOWANCES.default;
  return PLAN_ALLOWANCES[plan.toLowerCase()] ?? PLAN_ALLOWANCES.default;
}

// ─── Token Purchase Packages ──────────────────────────────────────────────────

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

// ─── Firestore Path ──────────────────────────────────────────────────────────

export const TOKEN_DOC_PATH = (businessId: string) =>
  `businesses/${businessId}/store/config`;
export const TOKEN_BALANCE_FIELD = 'askMoTokenBalance';
export const TOKEN_PURCHASED_FIELD = 'askMoTotalPurchased';
export const TOKEN_MONTH_USAGE_FIELD = 'askMoMonthUsage';
export const TOKEN_MONTH_RESET_FIELD = 'askMoMonthReset';

// ─── Balance helpers (server-side) ─────────────────────────────────────────────

import { FieldValue } from '@/lib/server-firestore';

/**
 * Reads the current token balance for a business.
 * NOTE: no free-token grant happens here — users start at 0 and purchase tokens.
 * Chat stays free (llama-instant); PDF/ebook creation costs tokens (llama-versatile).
 */
export async function getTokenBalance(
  db: any,
  businessId: string,
): Promise<number> {
  try {
    const snap = await db.doc(TOKEN_DOC_PATH(businessId)).get();
    return (snap.data()?.[TOKEN_BALANCE_FIELD] as number) ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Atomically deducts `amount` tokens. Throws 'Insufficient tokens' when the
 * balance is too low so the caller can decide how to surface it.
 */
export async function deductTokens(
  db: any,
  businessId: string,
  amount: number,
): Promise<number> {
  const docRef = db.doc(TOKEN_DOC_PATH(businessId));

  const result = await db.runTransaction(async (tx: any) => {
    const snap = await tx.get(docRef);
    const data = snap.data() ?? {};
    const currentBalance = (data[TOKEN_BALANCE_FIELD] as number) ?? 0;
    const currentMonthUsage = (data[TOKEN_MONTH_USAGE_FIELD] as number) ?? 0;
    const monthReset = (data[TOKEN_MONTH_RESET_FIELD] as number) ?? 0;

    if (currentBalance < amount) {
      throw new Error('Insufficient tokens');
    }

    const now = Date.now();
    const currentMonth = new Date(now).toISOString().slice(0, 7);
    const resetMonth = monthReset ? new Date(monthReset).toISOString().slice(0, 7) : '';

    tx.update(docRef, {
      [TOKEN_BALANCE_FIELD]: FieldValue.increment(-amount),
      [TOKEN_MONTH_USAGE_FIELD]: (resetMonth === currentMonth ? currentMonthUsage : 0) + amount,
      [TOKEN_MONTH_RESET_FIELD]: now,
    });

    return currentBalance - amount;
  });

  return result;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getTokenCost(
  hasMedia: boolean,
  isEbookCreate: boolean,
  isEbookEdit: boolean,
): number {
  if (isEbookCreate) return TOKEN_COSTS.ebookCreate;
  if (isEbookEdit) return TOKEN_COSTS.ebookEdit;
  if (hasMedia) return TOKEN_COSTS.chatWithMedia;
  return TOKEN_COSTS.chat;
}

export const ASK_MO_COMMISSION_RATE = 0.20;
export const ASK_MO_COMMISSION_FIELD = 'askMoCommissionRate';
