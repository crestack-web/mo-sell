import Whop from '@whop/sdk';

const apiKey = process.env.WHOP_API_KEY;
const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;

export const whopClient = new Whop({
  apiKey: apiKey ?? '',
  ...(webhookSecret ? { webhookKey: Buffer.from(webhookSecret).toString('base64') } : {}),
});

export interface WhopPaymentSucceeded {
  id: string;
  status: string;
  amount: number;
  amount_after_fees: number;
  currency: string;
  paid_at: string;
  payment_method_type: string;
  card_brand?: string;
  card_last4?: string;
  member: { id: string };
  metadata: Record<string, unknown>;
}

export interface WhopWebhookEvent {
  id: string;
  api_version: string;
  type: string;
  timestamp: string;
  company_id: string;
  data: WhopPaymentSucceeded;
}

export const WHOP_SETTLEMENT_DAYS = 7;

export function getWhopSettlementDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + WHOP_SETTLEMENT_DAYS);
  return d.toISOString();
}
