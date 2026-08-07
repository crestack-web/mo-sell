import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import {
  TOKEN_COSTS,
  getMonthlyAllowance,
  TOKEN_BALANCE_FIELD,
  TOKEN_MONTH_USAGE_FIELD,
  TOKEN_MONTH_RESET_FIELD,
} from '@/lib/ask-mo-tokens';

// ─── GET: balance + costs + packages ─────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const plan = searchParams.get('plan');

    if (!businessId) {
      return NextResponse.json({ error: 'businessId required' }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: cfgData } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .maybeSingle();

    const balance = (cfgData?.[TOKEN_BALANCE_FIELD] as number) ?? 0;
    const monthUsage = (cfgData?.[TOKEN_MONTH_USAGE_FIELD] as number) ?? 0;
    const monthReset = (cfgData?.[TOKEN_MONTH_RESET_FIELD] as number) ?? 0;
    const monthlyAllowance = getMonthlyAllowance(plan);

    // Auto-reset monthly usage if new month
    const now = Date.now();
    const currentMonth = new Date(now).toISOString().slice(0, 7);
    const resetMonth = monthReset ? new Date(monthReset).toISOString().slice(0, 7) : '';
    const effectiveMonthUsage = resetMonth === currentMonth ? monthUsage : 0;

    return NextResponse.json({
      balance,
      monthUsage: effectiveMonthUsage,
      monthlyAllowance,
      costs: TOKEN_COSTS,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Tokens] GET error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── POST: deduct tokens (called after successful AI response) ──────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, amount, plan } = body as {
      businessId: string;
      amount: number;
      plan?: string;
    };

    if (!businessId || !amount || amount < 0) {
      return NextResponse.json({ error: 'businessId and valid amount required' }, { status: 400 });
    }

    const supabase = getSupabaseServer();

    // Read-modify-write to avoid clobbering concurrent updates
    const { data: row } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .maybeSingle();
    const data = row ?? {};
    const currentBalance = (data[TOKEN_BALANCE_FIELD] as number) ?? 0;
    const currentMonthUsage = (data[TOKEN_MONTH_USAGE_FIELD] as number) ?? 0;
    const monthReset = (data[TOKEN_MONTH_RESET_FIELD] as number) ?? 0;

    if (currentBalance < amount) {
      throw new Error('Insufficient tokens');
    }

    const now = Date.now();
    const currentMonth = new Date(now).toISOString().slice(0, 7);
    const resetMonth = monthReset ? new Date(monthReset).toISOString().slice(0, 7) : '';

    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        [TOKEN_BALANCE_FIELD]: currentBalance - amount,
        [TOKEN_MONTH_USAGE_FIELD]: (resetMonth === currentMonth ? currentMonthUsage : 0) + amount,
        [TOKEN_MONTH_RESET_FIELD]: now,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', businessId);
    if (updateError) throw updateError;

    return NextResponse.json({ success: true, balance: currentBalance - amount });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'Insufficient tokens') {
      return NextResponse.json({ error: 'Insufficient tokens' }, { status: 403 });
    }
    console.error('[Tokens] Deduct error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
