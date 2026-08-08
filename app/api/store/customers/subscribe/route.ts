import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';

/**
 * POST /api/store/customers/subscribe
 * Creates or updates a customer record for email/newsletter signup.
 * Body: { businessId, storeSlug, email, name? }
 *
 * If a customer with this email already exists:
 *   - Updates subscribedAt and ensures 'subscriber' tag is present
 * If not:
 *   - Creates new customer with tags: ['subscriber']
 */
export async function POST(req: NextRequest) {
  let body: {
    businessId?: string;
    storeSlug?: string;
    email?: string;
    name?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { businessId, storeSlug, email, name } = body;

  if (!businessId || !storeSlug || !email) {
    return NextResponse.json(
      { error: 'businessId, storeSlug, and email are required' },
      { status: 400 },
    );
  }

  // Basic email format validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();
    const normalizedEmail = email.toLowerCase().trim();

    // Check if customer already exists with this email for this business
    const { data: existing, error: lookupError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('businessId', businessId)
      .maybeSingle();

    if (lookupError) {
      console.error('[Subscribe] Customer lookup error:', lookupError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (existing) {
      // Update existing customer
      const currentTags: string[] = Array.isArray(existing.tags) ? existing.tags : [];

      const updates: Record<string, any> = {
        subscribedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (name && !existing.name) {
        updates.name = name;
      }

      // Add 'subscriber' tag if not already present
      if (!currentTags.includes('subscriber')) {
        updates.tags = [...currentTags, 'subscriber'];
      }

      const { error: updateError } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', existing.id);

      if (updateError) {
        console.error('[Subscribe] Customer update error:', updateError);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }

      return NextResponse.json({
        customerId: existing.id,
        updated: true,
      });
    } else {
      // Create new customer
      const customerId = 'cus_' + crypto.randomUUID();
      const now = new Date().toISOString();

      const { error: insertError } = await supabase
        .from('customers')
        .insert({
          id: customerId,
          businessId,
          storeSlug,
          name: name ?? '',
          email: normalizedEmail,
          phone: null,
          tags: ['subscriber'],
          totalOrders: 0,
          totalSpent: 0,
          lastOrderAt: null,
          subscribedAt: now,
          createdAt: now,
          updatedAt: now,
        });

      if (insertError) {
        console.error('[Subscribe] Customer insert error:', insertError);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }

      return NextResponse.json({
        customerId,
        updated: false,
      }, { status: 201 });
    }
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
