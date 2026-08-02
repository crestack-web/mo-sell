import { NextRequest, NextResponse } from 'next/server';
import { getServerFirestore as getAdminDb, FieldValue } from '@/lib/server-firestore';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get('orderNumber');
  const productId = searchParams.get('productId');
  const email = searchParams.get('email');

  if (!orderNumber || !productId || !email) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    const db = getAdminDb();

    // Find the order by orderNumber
    const ordersQuery = db.collection('businesses').collectionGroup('storeOrders')
      .where('orderNumber', '==', orderNumber)
      .limit(1);
    
    const ordersSnap = await ordersQuery.get();
    if (ordersSnap.empty) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderDoc = ordersSnap.docs[0];
    const order = orderDoc.data();

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
    const businessId = orderDoc.ref.path.split('/')[1];
    const productSnap = await db
      .collection('businesses').doc(businessId)
      .collection('storeProducts').doc(productId)
      .get();

    if (!productSnap.exists) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = productSnap.data();
    const digitalFileUrl = product?.digitalFileUrl;

    if (!digitalFileUrl) {
      return NextResponse.json({ error: 'Digital file not available' }, { status: 404 });
    }

    // Log the download
    await db.collection('businesses').doc(businessId).collection('storeOrders').doc(orderDoc.id).update({
      downloads: FieldValue.arrayUnion({
        productId,
        productName: lineItem.displayName,
        downloadedAt: new Date().toISOString(),
        email,
      }),
    });

    // Redirect to the file URL
    return NextResponse.redirect(digitalFileUrl);
  } catch (err) {
    console.error('[Digital Download] Error:', err);
    return NextResponse.json({ error: 'Failed to process download' }, { status: 500 });
  }
}