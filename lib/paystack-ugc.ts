const PAYSTACK_SECRET = () => process.env.PAYSTACK_SECRET_KEY ?? '';
const PAYSTACK_API = 'https://api.paystack.co';

const PLATFORM_FEE_PERCENT = 0.15;

export interface UGCPaymentBreakdown {
  platformFee: number;
  creatorPayout: number;
  deposit: number;
  balance: number;
}

export function calculateUGCPayment(agreedPriceKobo: number): UGCPaymentBreakdown {
  const platformFee = Math.floor(agreedPriceKobo * PLATFORM_FEE_PERCENT);
  const creatorPayout = agreedPriceKobo - platformFee;
  const deposit = Math.floor(agreedPriceKobo / 2);
  const balance = agreedPriceKobo - deposit;
  return { platformFee, creatorPayout, deposit, balance };
}

export async function initializeDeposit(
  orderId: string,
  brandEmail: string,
  agreedPriceKobo: number
): Promise<{ authorization_url: string; reference: string }> {
  const { deposit } = calculateUGCPayment(agreedPriceKobo);
  const reference = `ugc_deposit_${orderId}_${Date.now()}`;
  const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: brandEmail,
      amount: deposit,
      reference,
      metadata: { orderId, type: 'deposit' },
    }),
  });
  const data = await res.json();
  if (!data.status || !data.data?.authorization_url) {
    throw new Error(data.message ?? 'Failed to initialize deposit');
  }
  return { authorization_url: data.data.authorization_url, reference };
}

export async function initializeBalance(
  orderId: string,
  brandEmail: string,
  agreedPriceKobo: number
): Promise<{ authorization_url: string; reference: string }> {
  const { balance } = calculateUGCPayment(agreedPriceKobo);
  const reference = `ugc_balance_${orderId}_${Date.now()}`;
  const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: brandEmail,
      amount: balance,
      reference,
      metadata: { orderId, type: 'balance' },
    }),
  });
  const data = await res.json();
  if (!data.status || !data.data?.authorization_url) {
    throw new Error(data.message ?? 'Failed to initialize balance');
  }
  return { authorization_url: data.data.authorization_url, reference };
}

export async function createTransferRecipient(
  name: string,
  accountNumber: string,
  bankCode: string
): Promise<string> {
  const res = await fetch(`${PAYSTACK_API}/transferrecipient`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'nuban',
      name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: 'NGN',
    }),
  });
  const data = await res.json();
  if (!data.status || !data.data?.recipient_code) {
    throw new Error(data.message ?? 'Failed to create transfer recipient');
  }
  return data.data.recipient_code;
}

export async function payoutToCreator(
  recipientCode: string,
  amountKobo: number,
  reason: string
): Promise<string> {
  const res = await fetch(`${PAYSTACK_API}/transfer`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source: 'balance',
      amount: amountKobo,
      recipient: recipientCode,
      reason,
    }),
  });
  const data = await res.json();
  if (!data.status || !data.data?.transfer_code) {
    throw new Error(friendlyTransferError(data.message));
  }
  return data.data.transfer_code;
}

/**
 * Map raw Paystack transfer errors to a clear, actionable message for the
 * store owner. Paystack rejects third-party payouts when the platform's
 * business is still a Starter business (transfers require a Registered
 * business), so surface that distinctly instead of leaking the raw error.
 */
export function friendlyTransferError(message?: string | null): string {
  const msg = message ?? 'Failed to initiate transfer';
  const lower = msg.toLowerCase();

  if (lower.includes('third party payout') || lower.includes('third-party payout')) {
    return 'Payouts are temporarily unavailable — the payment processor requires an account upgrade before transfers can be sent. Please try again later.';
  }
  if (lower.includes('insufficient') || lower.includes('balance')) {
    return 'Payout failed — not enough balance to cover the transfer. Please try again later.';
  }
  if (lower.includes('recipient')) {
    return 'Payout failed — we could not reach your bank account. Update your bank details in Settings and try again.';
  }
  return msg;
}

export async function refundToBrand(
  paystackRef: string,
  amountKobo?: number
): Promise<void> {
  const body: Record<string, unknown> = { transaction: paystackRef };
  if (amountKobo) body.amount = amountKobo;
  const res = await fetch(`${PAYSTACK_API}/refund`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.status) {
    throw new Error(data.message ?? 'Failed to process refund');
  }
}
