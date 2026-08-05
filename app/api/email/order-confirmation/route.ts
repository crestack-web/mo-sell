import { NextRequest, NextResponse } from 'next/server';
import { getServerFirestore as getAdminDb } from '@/lib/server-firestore';
import { sendEmail } from '@/lib/services/email/core';

async function sendOrderEmail(params: {
  to: string;
  name?: string;
  subject: string;
  html: string;
  text?: string;
  from?: { email: string; name: string };
}): Promise<{ success: boolean; stub?: boolean }> {
  const result = await sendEmail({
    to: params.to,
    name: params.name,
    subject: params.subject,
    html: params.html,
    text: params.text,
    from: params.from,
  });
  return { success: result.success, stub: result.provider === 'stub' };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerEmail,
      orderNumber,
      lineItems,
      total,
      storeName,
      orderUrl,
      storeSlug,
      businessId,
    } = body;

    if (!customerEmail || !orderNumber || !storeName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Load store config for sender info
    let merchantName = storeName;
    let merchantEmail = 'hello@mo-sell.store';
    let storeLink = orderUrl;

    if (businessId) {
      try {
        const db = getAdminDb();
        const configSnap = await db
          .collection('businesses').doc(businessId)
          .collection('store').doc('config')
          .get();

        if (configSnap.exists) {
          const config = configSnap.data();
          merchantName = config?.storeName || storeName;
          merchantEmail = config?.contactEmail || `${config?.storeSlug || storeSlug}@mo-sell.store`;
          
          if (config?.customDomainStatus === 'verified' && config?.customDomain) {
            storeLink = `https://${config.customDomain}/order/${orderUrl.split('/order/')[1]}`;
          }
        }
      } catch (err) {
        console.error('[Email] Failed to load store config:', err);
      }
    }

    // Filter digital products
    const digitalItems = lineItems.filter((item: any) => item.productType === 'digital');
    const physicalItems = lineItems.filter((item: any) => item.productType !== 'digital');

    // Generate download links for digital products
    const downloadLinks = digitalItems.map((item: any) => ({
      name: item.displayName,
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://mo-sell.store'}/api/store/digital/download?orderNumber=${orderNumber}&productId=${item.productId}&email=${encodeURIComponent(customerEmail)}`,
    }));

    // Build email content
    const subject = `Your order from ${merchantName} is confirmed!`;

    let htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 28px;">Order Confirmed!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Order #${orderNumber}</p>
        </div>
        
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="font-size: 16px; margin: 0 0 20px;">Hi there,</p>
          <p style="font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
            Thank you for your purchase! We're excited to let you know that your order has been confirmed.
          </p>
    `;

    // Add download section for digital products
    if (downloadLinks.length > 0) {
      htmlContent += `
        <div style="background: #fff; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h2 style="color: #059669; margin: 0 0 15px; font-size: 18px; display: flex; align-items: center; gap: 8px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Instant Download
          </h2>
          <p style="font-size: 14px; color: #374151; margin: 0 0 15px;">
            Your digital products are ready! Click the links below to download:
          </p>
          <div style="display: flex; flex-direction: column; gap: 10px;">
      `;

      downloadLinks.forEach((link: any) => {
        htmlContent += `
          <a href="${link.url}" style="display: inline-block; background: #10b981; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; text-align: center;">
            Download: ${link.name}
          </a>
        `;
      });

      htmlContent += `
          </div>
          <p style="font-size: 12px; color: #6b7280; margin: 15px 0 0;">
            💡 Tip: Save this email for future reference. Download links are valid for 30 days.
          </p>
        </div>
      `;
    }

    // Add order details
    htmlContent += `
        <div style="background: #fff; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 15px; font-size: 16px; color: #1a1a1a;">Order Details</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="border-bottom: 2px solid #e5e7eb;">
                <th style="text-align: left; padding: 8px 0; color: #6b7280; font-weight: 600;">Item</th>
                <th style="text-align: right; padding: 8px 0; color: #6b7280; font-weight: 600;">Price</th>
              </tr>
            </thead>
            <tbody>
    `;

    lineItems.forEach((item: any) => {
      htmlContent += `
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="padding: 10px 0; color: #1a1a1a;">
            ${item.displayName}
            <span style="color: #6b7280; font-size: 12px;"> × ${item.quantity}</span>
            ${item.productType === 'digital' ? '<span style="color: #10b981; font-size: 11px; margin-left: 5px;">📥 Digital</span>' : ''}
          </td>
          <td style="padding: 10px 0; text-align: right; color: #1a1a1a; font-weight: 600;">
            ₦${item.lineTotal.toLocaleString()}
          </td>
        </tr>
      `;
    });

    htmlContent += `
            </tbody>
            <tfoot>
              <tr style="border-top: 2px solid #e5e7eb; margin-top: 10px;">
                <td style="padding: 12px 0; font-weight: 700; color: #1a1a1a; font-size: 16px;">Total</td>
                <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #1a1a1a; font-size: 16px;">₦${total.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
    `;

    // Add shipping info for physical items
    if (physicalItems.length > 0) {
      htmlContent += `
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #92400e;">
            <strong>📦 Shipping:</strong> We'll notify you once your physical items are on their way.
          </p>
        </div>
      `;
    }

    // Footer
    htmlContent += `
        <div style="text-align: center; padding: 20px 0 0; border-top: 1px solid #e5e7eb; margin-top: 30px;">
          <p style="font-size: 13px; color: #6b7280; margin: 0 0 10px;">
            Questions? Contact us at <a href="mailto:${merchantEmail}" style="color: #667eea;">${merchantEmail}</a>
          </p>
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">
            Powered by <a href="https://mo-sell.store" style="color: #667eea; text-decoration: none;">MO Sell</a>
          </p>
        </div>
      </div>
    </div>
    `;

    const textContent = `
      Order Confirmed! Order #${orderNumber}
      
      Hi there,
      
      Thank you for your purchase from ${merchantName}!
      
      ${downloadLinks.length > 0 ? '\n📥 INSTANT DOWNLOAD LINKS:\n' + downloadLinks.map((link: any) => `• ${link.name}: ${link.url}`).join('\n') + '\n' : ''}
      
      Order Details:
      ${lineItems.map((item: any) => `• ${item.displayName} × ${item.quantity}: ₦${item.lineTotal.toLocaleString()}`).join('\n')}
      
      Total: ₦${total.toLocaleString()}
      
      Questions? Contact us at ${merchantEmail}
    `;

    const result = await sendOrderEmail({
      to: customerEmail,
      name: 'Customer',
      subject,
      html: htmlContent,
      text: textContent,
      from: {
        email: merchantEmail,
        name: merchantName,
      },
    });

    return NextResponse.json({ success: result.success });
  } catch (err) {
    console.error('[Email] Error:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}