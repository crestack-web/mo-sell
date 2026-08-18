import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import { generateEbookPdf } from '@/lib/ask-mo-pdf';

// ── Helper: create a product in storeProducts (generates ebook PDF when present) ─

export async function createProductInFirestore(
  businessId: string,
  productData: Record<string, unknown>,
  storeConfig: Record<string, unknown> | null,
): Promise<Record<string, unknown>> {
  const supabase = getSupabaseServer();
  const pdfContent = productData.pdfContent as
    | { title?: string; subtitle?: string; chapters?: { heading?: string; body?: string }[]; author?: string }
    | undefined;
  const productType = productData.productType === 'physical' ? 'physical' : 'digital';
  const chapters = Array.isArray(pdfContent?.chapters)
    ? pdfContent.chapters.filter(c => c && (c.heading || c.body))
    : [];

  let digitalFileUrl: string | null = null;
  let digitalFileName: string | null = null;
  if (chapters.length > 0) {
    const uploaded = await generateEbookPdf({
      businessId,
      title: pdfContent?.title || String(productData.displayName || 'Digital Product'),
      subtitle: pdfContent?.subtitle,
      chapters,
      author: pdfContent?.author,
      storeName: (storeConfig?.storeName as string) ?? null,
    });
    digitalFileUrl = uploaded.url;
    digitalFileName = uploaded.fileName;
  }

  if (productType === 'digital' && !digitalFileUrl) {
    throw new Error(
      'This digital product has no deliverable file. Ask MO to generate ebook content (chapters) before approving so customers get a download after purchase.',
    );
  }

  const payload: Record<string, unknown> = {
    displayName: productData.displayName,
    description: productData.description ?? '',
    price: productData.price ?? 0,
    currency: (productData.currency as string) || (storeConfig?.currency as string) || 'NGN',
    productType,
    digitalSubtype: productType === 'digital' ? (productData.digitalSubtype ?? 'ebook') : null,
    category: productData.category ?? 'general',
    tags: Array.isArray(productData.tags) ? productData.tags : [],
    images: Array.isArray(productData.images) ? productData.images : [],
    collectionIds: [],
    stock: productType === 'physical' ? (productData.stock ?? 10) : 9999,
    sku: productData.sku ?? null,
    available: true,
    featured: false,
    digitalFileUrl,
    digitalFileName,
    pdfContent: chapters.length > 0 ? pdfContent : null,
    deliveryNote: productType === 'physical' ? (productData.deliveryNote ?? null) : null,
    compareAtPrice: productData.compareAtPrice ?? null,
    lowStockThreshold: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const productId = 'prod_' + crypto.randomUUID();

  const { error: insertError } = await supabase
    .from('storeProducts')
    .insert({ id: productId, businessId, ...payload, productId });

  if (insertError) {
    console.error('[AskMo] Failed to create product:', insertError);
    throw new Error(insertError.message || 'Failed to create product');
  }

  return { id: productId, ...payload };
}

// ── Helper: update an existing product in storeProducts ─────────────────────
// Applies only the fields the user changed (nulls are skipped so existing
// values are kept). Regenerates the ebook PDF when pdfContent is provided.

export async function updateProductInFirestore(
  businessId: string,
  productId: string,
  productData: Record<string, unknown>,
  storeConfig: Record<string, unknown> | null,
): Promise<Record<string, unknown>> {
  const supabase = getSupabaseServer();

  // Confirm the product exists and belongs to this business
  const { data: existing, error: fetchError } = await supabase
    .from('storeProducts')
    .select('*')
    .eq('id', productId)
    .eq('businessId', businessId)
    .single();

  if (fetchError || !existing) {
    throw new Error('Product not found or you do not have access to it');
  }

  const pdfContent = productData.pdfContent as
    | { title?: string; subtitle?: string; chapters?: { heading?: string; body?: string }[]; author?: string }
    | undefined;
  const chapters = Array.isArray(pdfContent?.chapters)
    ? pdfContent.chapters.filter(c => c && (c.heading || c.body))
    : [];

  // Only touch fields the AI actually wants to change; null means "keep current"
  const simpleKeys = ['displayName', 'description', 'price', 'category', 'tags', 'stock', 'deliveryNote'] as const;
  const payload: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  for (const key of simpleKeys) {
    const value = productData[key];
    if (value !== undefined && value !== null && value !== '') {
      payload[key] = value;
    }
  }

  // Regenerate the PDF when the ebook content changed
  if (chapters.length > 0) {
    const uploaded = await generateEbookPdf({
      businessId,
      title: pdfContent?.title || String(productData.displayName || existing.displayName || 'Digital Product'),
      subtitle: pdfContent?.subtitle,
      chapters,
      author: pdfContent?.author,
      storeName: (storeConfig?.storeName as string) ?? null,
    });
    payload.digitalFileUrl = uploaded.url;
    payload.digitalFileName = uploaded.fileName;
    payload.pdfContent = pdfContent;
    payload.productType = 'digital';
    payload.digitalSubtype = existing.digitalSubtype || 'ebook';
  }

  if (Object.keys(payload).length <= 1) {
    throw new Error('No changes to apply — tell MO what to change');
  }

  const { error: updateError } = await supabase
    .from('storeProducts')
    .update(payload)
    .eq('id', productId)
    .eq('businessId', businessId);

  if (updateError) {
    console.error('[AskMo] Failed to update product:', updateError);
    throw new Error(updateError.message || 'Failed to update product');
  }

  return { id: productId, ...existing, ...payload };
}
