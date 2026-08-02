import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/database/postgresql-adapter';

export async function GET(req: NextRequest) {
  try {
    const searchParams = new URL(req.url).searchParams;
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    // Fetch order from Supabase
    const { data: order, error } = await supabaseServer
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Generate PDF (simplified - in production use pdfkit or similar)
    const pdfContent = generateInvoicePDF(order);

    return new NextResponse(pdfContent, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=invoice-${order.order_number}.pdf`,
      },
    });
  } catch (error) {
    console.error('[Invoice PDF] Error:', error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}

function generateInvoicePDF(order: any): Buffer {
  // Simplified PDF generation
  // In production, use pdfkit or @react-pdf/renderer
  const content = `
INVOICE
=======

Order Number: ${order.order_number}
Date: ${new Date(order.created_at).toLocaleDateString()}

Customer Information:
---------------------
Name: ${order.customer_name}
Email: ${order.customer_email}

Order Details:
--------------
Total: ₦${order.total.toLocaleString()}
Status: ${order.status}

Payment Status: ${order.payment_status}

Thank you for your business!
  `;

  return Buffer.from(content, 'utf-8');
}