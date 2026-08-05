import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeCreatorEmail, sendWelcomeBrandEmail } from '@/lib/services/email/welcome-emails';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, email, name, businessName, brandName } = body;

    if (!role || !email) {
      return NextResponse.json({ error: 'role and email are required' }, { status: 400 });
    }

    if (role === 'brand') {
      const result = await sendWelcomeBrandEmail({
        email,
        name: name || brandName || '',
        brandName: brandName || name || 'your brand',
      });
      return NextResponse.json({ success: result.success });
    }

    const result = await sendWelcomeCreatorEmail({
      email,
      name: name || '',
      businessName: businessName || undefined,
    });
    return NextResponse.json({ success: result.success });
  } catch (err) {
    console.error('[Welcome Email] Error:', err);
    return NextResponse.json({ error: 'Failed to send welcome email' }, { status: 500 });
  }
}
