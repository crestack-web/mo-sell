import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabase-server';

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 30);
}

/**
 * Completes the final onboarding step: creates the free PAYG store.
 * Uses the service-role client so Google (and email) sign-ups are not
 * blocked by RLS or missing client-side grants.
 */
export async function POST(req: NextRequest) {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
    }

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 503 });
    }

    // Verify the caller's JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const businessName =
      (typeof body.businessName === 'string' && body.businessName.trim()) || 'My Store';
    const uid = user.id;
    const bid =
      (typeof body.businessId === 'string' && body.businessId) ||
      `biz_${uid.slice(0, 12)}`;
    const storeSlug = slugify(businessName) || `store-${uid.slice(0, 8)}`;
    const now = new Date().toISOString();

    // 1) Upsert business + store config (same row — adapter maps store/config → businesses)
    const businessPayload = {
      id: bid,
      ownerUserId: uid,
      businessName,
      storeSlug,
      storeName: businessName,
      logoUrl: null,
      primaryColor: '#0EA5E9',
      secondaryColor: '#6366F1',
      businessCategory: 'physical-products',
      currency: 'NGN',
      contactEmail: user.email || '',
      contactPhone: '',
      status: 'draft',
      theme: 'luxe',
      tagline: '',
      storePolicy: '',
      paystackPublicKey: '',
      enabledProductTypes: ['physical'],
      pickupLocations: [],
      customDomain: null,
      customDomainStatus: 'pending',
      customDomainVerifiedAt: null,
      domainPurchaseRecord: null,
      onboardingAnswers: {},
      billingModel: 'pay_as_you_go',
      billingStatus: 'active',
      commissionRate: 0.2,
      updatedAt: now,
      createdAt: now,
    };

    const { error: bizError } = await supabaseServer
      .from('businesses')
      .upsert(businessPayload, { onConflict: 'id' });

    if (bizError) {
      console.error('[complete-onboarding] businesses upsert:', bizError);
      return NextResponse.json(
        { error: bizError.message || 'Failed to create store' },
        { status: 500 }
      );
    }

    // 2) storeIndex slug → business
    const { error: indexError } = await supabaseServer.from('storeIndex').upsert(
      {
        id: storeSlug,
        businessId: bid,
        storeName: businessName,
        updatedAt: now,
      },
      { onConflict: 'id' }
    );

    if (indexError) {
      console.error('[complete-onboarding] storeIndex upsert:', indexError);
      // Non-fatal if slug collision; continue so onboarding can finish
    }

    // 3) Mark user onboarding complete (only columns that exist on users)
    const { error: userUpdateError } = await supabaseServer
      .from('users')
      .update({
        businessId: bid,
        businessName,
        onboardingComplete: true,
        moSellAccess: true,
        updatedAt: now,
      })
      .eq('id', uid);

    if (userUpdateError) {
      console.error('[complete-onboarding] users update:', userUpdateError);
      // Try upsert if row is missing (edge case for Google)
      const { error: userUpsertError } = await supabaseServer.from('users').upsert(
        {
          id: uid,
          email: user.email || '',
          displayName:
            (user.user_metadata?.full_name as string) ||
            (user.user_metadata?.name as string) ||
            user.email?.split('@')[0] ||
            'User',
          businessId: bid,
          businessName,
          onboardingComplete: true,
          moSellAccess: true,
          emailVerified: true,
          plan: 'starter',
          createdAt: now,
          updatedAt: now,
        },
        { onConflict: 'id' }
      );
      if (userUpsertError) {
        console.error('[complete-onboarding] users upsert:', userUpsertError);
        return NextResponse.json(
          { error: userUpsertError.message || 'Failed to update profile' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      businessId: bid,
      storeSlug,
    });
  } catch (err: unknown) {
    console.error('[complete-onboarding] unexpected:', err);
    const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
