import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const CAMPAIGN_BUSINESS_ID = 'biz_5c5ce109-79a';
const CAMPAIGN_TAG = 'follower-to-founder-video';
const CAMPAIGN_PRODUCT_ID = '6333f5ff-2387-4b70-873d-2495f7759619';
const PRODUCT_NAME = 'From Follower to Founder: Your Blueprint to Building a Profitable Business from Scratch';

/**
 * Read-only campaign preview endpoint. Both the ownership lookup and campaign
 * query run with the authenticated user's token, so Supabase RLS is enforced.
 * Campaign data is never read through a service-role client or written to the
 * real storeOrders table.
 */
export async function GET(req: NextRequest) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.json({ error: 'Server not configured' }, { status: 503 });

  try {
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify the business through the caller's authenticated client as well.
    const { data: userRow, error: userError } = await userClient
      .from('users')
      .select('id, businessId')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (userError) {
      console.error('[Campaign preview] Owner lookup failed:', userError.message);
      return NextResponse.json({ error: 'Campaign preview is unavailable' }, { status: 503 });
    }
    if (!userRow || userRow.businessId !== CAMPAIGN_BUSINESS_ID) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // This query intentionally uses the authenticated client, not service role.
    // If RLS does not permit the owner to read the campaign rows, fail closed.
    const { data: rows, error } = await userClient
      .from('storeOrderCampaignDemos')
      .select('id, businessId, orderNumber, customerName, customerEmail, customerPhone, lineItems, subtotal, total, status, paymentStatus, createdAt, campaignTag, isDemo')
      .eq('businessId', CAMPAIGN_BUSINESS_ID)
      .eq('campaignTag', CAMPAIGN_TAG)
      .eq('isDemo', true)
      .order('createdAt', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('[Campaign preview] RLS-scoped query failed:', error.message);
      return NextResponse.json({ error: 'Campaign preview is unavailable' }, { status: 503 });
    }

    const campaignOrders = (rows ?? []).map((row: any) => {
      const sourceItems = Array.isArray(row.lineItems) ? row.lineItems : [];
      const lineItems = sourceItems.map((item: any) => ({
        productId: item.productId ?? CAMPAIGN_PRODUCT_ID,
        displayName: item.displayName ?? item.name ?? PRODUCT_NAME,
        productType: 'digital',
        quantity: Number(item.quantity ?? 1),
        unitPrice: Number(item.unitPrice ?? item.price ?? 0),
        lineTotal: Number(item.lineTotal ?? item.total ?? 0),
      }));
      return {
        id: row.id,
        orderNumber: row.orderNumber,
        customerName: row.customerName || 'Campaign customer',
        customerEmail: row.customerEmail || '',
        customerPhone: row.customerPhone || '',
        total: Number(row.total ?? 0),
        subtotal: Number(row.subtotal ?? row.total ?? 0),
        shippingCost: 0,
        createdAt: row.createdAt,
        status: 'demo',
        paymentStatus: 'demo',
        lineItems,
        isDemo: true,
      };
    });

    const simulatedVolume = campaignOrders.reduce((sum: number, order: any) => sum + order.total, 0);
    return NextResponse.json({
      campaign: CAMPAIGN_TAG,
      productId: CAMPAIGN_PRODUCT_ID,
      productName: PRODUCT_NAME,
      currency: 'NGN',
      orders: campaignOrders,
      metrics: {
        orderCount: campaignOrders.length,
        simulatedVolume,
        averageOrderValue: campaignOrders.length ? simulatedVolume / campaignOrders.length : 0,
      },
      isDemo: true,
      financialMeaning: 'Simulated campaign volume only; not verified payments, revenue, earnings, or settlement data.',
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('[Campaign preview] Request failed:', error);
    return NextResponse.json({ error: 'Failed to load campaign preview' }, { status: 500 });
  }
}
