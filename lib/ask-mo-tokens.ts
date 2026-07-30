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

// ─── Free Tokens (one-time grant for all users) ────────────────────────────────

/** Free tokens every user gets on first Ask Mo access */
export const FREE_TOKEN_AMOUNT = 2000;
export const FREE_TOKENS_CREDITED_FIELD = 'askMoFreeTokensCredited';

// ─── Ensure free tokens (shared across APIs) ──────────────────────────────────

/**
 * Ensures the business has been granted FREE_TOKEN_AMOUNT once.
 * Call this before any token check so users always get their 2000 free tokens
 * regardless of which API route is hit first.
 */
export async function ensureFreeTokens(
  db: any,
  businessId: string,
): Promise<number> {
  const docRef = db.doc(TOKEN_DOC_PATH(businessId));
  const snap = await docRef.get();
  const data = snap.data() ?? {};

  const hasBalance = TOKEN_BALANCE_FIELD in data;
  const currentBalance = (data[TOKEN_BALANCE_FIELD] as number) ?? 0;

  if (!hasBalance && !data[FREE_TOKENS_CREDITED_FIELD]) {
    await docRef.set({
      [TOKEN_BALANCE_FIELD]: currentBalance + FREE_TOKEN_AMOUNT,
      [FREE_TOKENS_CREDITED_FIELD]: true,
    }, { merge: true });
    return currentBalance + FREE_TOKEN_AMOUNT;
  }

  return currentBalance;
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
