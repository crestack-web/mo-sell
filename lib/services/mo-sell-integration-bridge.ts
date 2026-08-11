/**
 * MO Sell Integration Bridge
 *
 * Writes a confirmed Paystack order into all Busmo modules:
 * storeOrder, stock decrement, customer upsert, store earnings.
 *
 * All writes go through Supabase (getSupabaseServer). Firestore-only
 * collections that have no Supabase table (sales, cashFlow, notifications)
 * are intentionally dropped — the dashboard does not read them.
 */

import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import { computeOrderCommission, isPlatformManaged, currentMonthKey } from '@/lib/pricing';
import type {
  IntegrationBridgeParams,
  IntegrationBridgeResult,
  OrderLineItem,
  CheckoutSession,
  StoreConfig,
} from '@/types/mo-sell.types';

// ─── Email helpers (fire-and-forget, non-blocking) ────────────────────────────

async function sendOrderConfirmationEmail(params: {
  customerEmail: string;
  orderNumber: string;
  lineItems: OrderLineItem[];
  total: number;
  storeName: string;
  orderUrl: string;
  storeSlug: string;
  businessId: string;
  orderId: string;
}): Promise<void> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://mo-sell.store'}/api/email/order-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = (await res.json().catch(() => null)) as { success?: boolean; stub?: boolean } | null;
    const ok = res.ok && data?.success !== false;
    const status = ok ? 'sent' : data?.stub ? 'stub' : 'failed';

    if (!ok) {
      console.error('[IntegrationBridge] Order confirmation email NOT delivered for', params.orderNumber, {
        httpStatus: res.status,
        providerStatus: data?.stub ? 'stub' : 'failure',
      });
    }

    // Surface delivery status on the order so merchants can follow up
    try {
      const supabase = getSupabaseServer();
      await supabase
        .from('storeOrders')
        .update({
          customerEmailStatus: status,
          customerEmailSentAt: ok ? new Date().toISOString() : null,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', params.orderId);
    } catch (updateErr) {
      console.error('[IntegrationBridge] Failed to record email status on order:', updateErr);
    }
  } catch (err) {
    console.error('[IntegrationBridge] sendOrderConfirmationEmail failed:', err);
  }
}

async function sendNewOrderEmail(params: {
  merchantEmail: string;
  orderNumber: string;
  customerName: string;
  total: number;
  storeName: string;
}): Promise<void> {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://mo-sell.store'}/api/email/new-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  } catch (err) {
    console.error('[IntegrationBridge] sendNewOrderEmail failed:', err);
  }
}

// ─── Main function ─────────────────────────────────────────────────────────────

export async function processConfirmedOrder(
  params: IntegrationBridgeParams
): Promise<IntegrationBridgeResult> {
  const { businessId, sessionId, paystackData, settlementDate } = params;
  const supabase = getSupabaseServer();
  const timestamp = new Date().toISOString();

  // 1. Load checkout session
  const { data: sessionRow, error: sessionError } = await supabase
    .from('checkoutSessions')
    .select('*')
    .eq('id', sessionId)
    .eq('businessId', businessId)
    .maybeSingle();
  if (sessionError) throw sessionError;
  if (!sessionRow) {
    throw new Error(`CheckoutSession ${sessionId} not found`);
  }
  const session = sessionRow as unknown as CheckoutSession;

  // 2. Load store config for email + canonical URL
  const { data: configRow } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .maybeSingle();
  const config = (configRow ?? undefined) as StoreConfig | undefined;

  const storeName = config?.storeName ?? 'Your Store';
  const storeLinkBase =
    config?.customDomainStatus === 'verified' && config?.customDomain
      ? `https://${config.customDomain}`
      : `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://mo-sell.store'}/store/${config?.storeSlug ?? ''}`;

  // 3. Derive order total from Paystack (source of truth: kobo → NGN)
  const verifiedTotal = paystackData.amount / 100;
  const orderId = 'ord_' + crypto.randomUUID();
  const { data: orderNumberSeq, error: orderNumberError } = await supabase
    .rpc('next_order_number', { p_business_id: businessId });
  if (orderNumberError || orderNumberSeq == null) {
    throw new Error(orderNumberError?.message ?? 'Failed to generate order number');
  }
  const orderNumber = `ORD-${String(orderNumberSeq).padStart(5, '0')}`;
  const orderUrl = `${storeLinkBase}/order/${orderId}`;

  try {
    // ── Write 1: Create StoreOrder ─────────────────────────────────────────────
    const { error: orderError } = await supabase.from('storeOrders').insert({
      id: orderId,
      businessId,
      orderNumber,
      customerName:    session.customerName,
      customerEmail:   session.customerEmail,
      customerPhone:   session.customerPhone,
      deliveryOption:  session.deliveryOption,
      shippingAddress: session.shippingAddress,
      shippingZoneId:  session.shippingZoneId,
      shippingCost:    session.shippingCost,
      lineItems:       session.lineItems,
      subtotal:        session.subtotal,
      total:           verifiedTotal,
      paystackReference: paystackData.reference,
      status:          'paid',
      paymentStatus:   'paid',
      trackingNumber:  null,
      carrier:         null,
      statusHistory: [{
        status:    'paid',
        timestamp,
        changedBy: 'system',
      }],
      integrationStatus: 'completed',
      settlementDate: settlementDate ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    if (orderError) throw orderError;

    // ── Write 2: Decrement stock (physical products only) ──────────────────────
    // Validate stock before decrementing to prevent overselling
    const physicalItems = session.lineItems.filter(item => item.productType === 'physical');
    for (const item of physicalItems) {
      if (!item.productId) continue;
      const { data: productRow } = await supabase
        .from('storeProducts')
        .select('*')
        .eq('id', item.productId)
        .eq('businessId', businessId)
        .maybeSingle();
      if (!productRow) continue;
      const currentStock = productRow.stock ?? 0;
      if (currentStock < item.quantity) {
        throw new Error(`Insufficient stock for "${item.displayName}": requested ${item.quantity}, available ${currentStock}`);
      }
      const { error: stockError } = await supabase
        .from('storeProducts')
        .update({ stock: currentStock - item.quantity, updatedAt: timestamp })
        .eq('id', item.productId);
      if (stockError) throw stockError;
    }

    // ── Write 3: Upsert customer ───────────────────────────────────────────────
    // Check for existing customer by email first
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('businessId', businessId)
      .eq('email', session.customerEmail)
      .limit(1)
      .maybeSingle();

    if (existingCustomer) {
      const { error: custError } = await supabase
        .from('customers')
        .update({
          totalOrders: (existingCustomer.totalOrders ?? 0) + 1,
          totalSpend:  (existingCustomer.totalSpend ?? 0) + verifiedTotal,
          updatedAt:   timestamp,
        })
        .eq('id', existingCustomer.id);
      if (custError) throw custError;
    } else {
      const { error: custError } = await supabase.from('customers').insert({
        name:        session.customerName,
        email:       session.customerEmail,
        phone:       session.customerPhone,
        totalOrders: 1,
        totalSpend:  verifiedTotal,
        businessId,
        storeSlug:   config?.storeSlug ?? null,
        source:      'mo_sell',
        tags:        [],
        createdAt:   timestamp,
        updatedAt:   timestamp,
      });
      if (custError) throw custError;
    }

    // ── Write 4: Store earnings + commission (managed payments / billing model) ─
    const platformManaged = isPlatformManaged(config);
    let commissionRate = 0;
    let commissionAmount = 0;
    if (platformManaged) {
      const commission = computeOrderCommission(session.lineItems, config, verifiedTotal);
      commissionRate = commission.effectiveRate;
      commissionAmount = commission.commissionAmount;
      const netAmount        = Math.round((verifiedTotal - commissionAmount) * 100) / 100;
      const { error: earningError } = await supabase.from('storeEarnings').insert({
        businessId,
        orderId,
        orderNumber,
        customerName:     session.customerName,
        grossAmount:      verifiedTotal,
        commissionRate,
        commissionAmount,
        netAmount,
        currency:         config?.currency ?? 'NGN',
        status:           'available',
        payoutRequestId:  null,
        settlementDate:   settlementDate ?? null,
        createdAt:        timestamp,
        updatedAt:        timestamp,
      });
      if (earningError) throw earningError;

      // Snapshot the commission on the order row
      const { error: commissionError } = await supabase
        .from('storeOrders')
        .update({
          commissionRate,
          commissionAmount,
          netAmount,
          updatedAt: timestamp,
        })
        .eq('id', orderId);
      if (commissionError) throw commissionError;
    }

    // ── Write 4b: Revenue rollup (feeds conditional monthly billing) ─────────
    const monthKey = currentMonthKey();
    const { error: rollupError } = await supabase
      .from('businessMonthlyRevenue')
      .upsert({
        businessId,
        month: monthKey,
        revenue: verifiedTotal,
        commission: commissionAmount,
        orders: 1,
        updatedAt: timestamp,
      }, { onConflict: 'businessId,month' });
    if (rollupError) throw rollupError;

    // ── Write 5: (removed) Ask Mo e-book royalty commission — generation is
    // paid for up-front with Ask Mo tokens, no per-sale commission is taken. ──

  } catch (writeErr) {
    console.error('[IntegrationBridge] Write failed:', {
      businessId, sessionId, error: writeErr,
    });
    // Mark session as integration_pending for merchant retry UI
    try {
      await supabase
        .from('checkoutSessions')
        .update({
          status: 'payment_confirmed_integration_pending',
          updatedAt: new Date().toISOString(),
        })
        .eq('id', sessionId);
    } catch {
      /* non-fatal */
    }
    throw writeErr;
  }

  // ── Fire-and-forget emails (non-blocking) ─────────────────────────────────
  sendOrderConfirmationEmail({
    customerEmail: session.customerEmail,
    orderNumber,
    lineItems:     session.lineItems,
    total:         verifiedTotal,
    storeName,
    orderUrl,
    storeSlug:     config?.storeSlug ?? '',
    businessId,
    orderId,
  }).catch(console.error);

  if (config?.contactEmail) {
    sendNewOrderEmail({
      merchantEmail: config.contactEmail,
      orderNumber,
      customerName:  session.customerName,
      total:         verifiedTotal,
      storeName,
    }).catch(console.error);
  }

  return { orderId };
}
