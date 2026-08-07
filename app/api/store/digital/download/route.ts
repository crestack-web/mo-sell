import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get('orderNumber');
  const productId = searchParams.get('productId');
  const email = searchParams.get('email');

  if (!orderNumber || !productId || !email) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServer();

    // Find the order by orderNumber
    const { data: order } = await supabase
      .from('storeOrders')
      .select('*')
      .eq('orderNumber', orderNumber)
      .maybeSingle();
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify the order belongs to this customer
    if (order.customerEmail !== email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Verify the product is in the order and is digital
    const lineItem = order.lineItems.find((item: any) => item.productId === productId);
    if (!lineItem) {
      return NextResponse.json({ error: 'Product not found in order' }, { status: 404 });
    }

    if (lineItem.productType !== 'digital') {
      return NextResponse.json({ error: 'This product is not a digital download' }, { status: 400 });
    }

    // Get the product details to retrieve the digitalFileUrl
    const businessId = order.businessId;
    const { data: product } = await supabase
      .from('storeProducts')
      .select('*')
      .eq('id', productId)
      .eq('businessId', businessId)
      .maybeSingle();

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const digitalFileUrl = product.digitalFileUrl;

    if (!digitalFileUrl) {
      return NextResponse.json({ error: 'Digital file not available' }, { status: 404 });
    }

    // Log the download
    const downloads = Array.isArray(order.downloads) ? order.downloads : [];
    downloads.push({
      productId,
      productName: lineItem.displayName,
      downloadedAt: new Date().toISOString(),
      email,
    });
    await supabase
      .from('storeOrders')
      .update({ downloads })
      .eq('id', order.id);

    // Redirect to the file URL
    return NextResponse.redirect(digitalFileUrl);
  } catch (err) {
    console.error('[Digital Download] Error:', err);
    return NextResponse.json({ error: 'Failed to process download' }, { status: 500 });
  }
}