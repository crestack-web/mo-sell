import { sendEmail, renderShell, formatMoney, APP_URL } from './core';

export interface NewOrderToMerchantData {
  merchantEmail: string;
  orderNumber: string;
  customerName: string;
  total: number;
  storeName: string;
  currency?: string;
}

export async function sendNewOrderEmailToMerchant(data: NewOrderToMerchantData) {
  const total = formatMoney(data.total, data.currency);
  const html = renderShell({
    title: 'New order! 🛒',
    subtitle: `Order ${data.orderNumber} just came in for ${data.storeName}.`,
    body: `
      <div style="background: #F7FAFC; border: 1px solid #E0EFFA; border-radius: 12px; padding: 20px; margin: 16px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #8AAABF;">Order number</td>
            <td style="padding: 6px 0; text-align: right; color: #0C1A2E; font-weight: 700;">${data.orderNumber}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #8AAABF;">Customer</td>
            <td style="padding: 6px 0; text-align: right; color: #0C1A2E; font-weight: 600;">${data.customerName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #8AAABF;">Order total</td>
            <td style="padding: 6px 0; text-align: right; color: #16A34A; font-weight: 800;">${total}</td>
          </tr>
        </table>
      </div>
      <p>Review the order and start fulfilling it from your dashboard.</p>
    `,
    ctaText: 'View order',
    ctaUrl: `${APP_URL()}/dashboard/orders`,
  });
  return sendEmail({
    to: data.merchantEmail,
    name: data.storeName,
    subject: `New order ${data.orderNumber} — ${data.customerName} paid ${total}`,
    html,
  });
}

export interface OrderShippedData {
  email: string;
  customerName: string;
  orderNumber: string;
  storeName: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

export async function sendOrderShippedEmail(data: OrderShippedData) {
  const html = renderShell({
    title: 'Your order is on its way 📦',
    subtitle: `Hi ${data.customerName}, good news from ${data.storeName}.`,
    body: `
      <p>Your order <strong>#${data.orderNumber}</strong> has been shipped and is on its way to you.</p>
      <div style="background: #F7FAFC; border: 1px solid #E0EFFA; border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 14px;">
        ${data.carrier ? `<p style="margin: 0 0 6px;"><strong>Carrier:</strong> ${data.carrier}</p>` : ''}
        ${data.trackingNumber ? `<p style="margin: 0;"><strong>Tracking number:</strong> ${data.trackingNumber}</p>` : ''}
      </div>
      ${data.trackingUrl ? `<p>Track your package <a href="${data.trackingUrl}" style="color:#0EA5E9;">here</a>.</p>` : ''}
      <p>Thanks for shopping with ${data.storeName}!</p>
    `,
    ctaText: 'Track my order',
    ctaUrl: data.trackingUrl || `${APP_URL()}`,
  });
  return sendEmail({
    to: data.email,
    name: data.customerName,
    subject: `Your order ${data.orderNumber} has shipped 🚚`,
    html,
  });
}

export interface OrderDeliveredData {
  email: string;
  customerName: string;
  orderNumber: string;
  storeName: string;
}

export async function sendOrderDeliveredEmail(data: OrderDeliveredData) {
  const html = renderShell({
    title: 'Order delivered ✅',
    subtitle: `Hi ${data.customerName}, your order from ${data.storeName} has arrived.`,
    body: `
      <p>Your order <strong>#${data.orderNumber}</strong> has been delivered. We hope you love it!</p>
      <p>Enjoying your purchase? Leave a review — it really helps ${data.storeName} grow.</p>
    `,
    ctaText: 'Back to the store',
    ctaUrl: `${APP_URL()}`,
  });
  return sendEmail({
    to: data.email,
    name: data.customerName,
    subject: `Your order ${data.orderNumber} has been delivered 🎉`,
    html,
  });
}
