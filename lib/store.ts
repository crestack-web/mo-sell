import { getSupabaseServer } from '@/lib/database/postgresql-adapter';

export interface PublicStoreConfig {
  businessId: string;
  storeSlug: string;
  storeName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  businessCategory: string;
  currency: string;
  contactEmail: string;
  contactPhone: string;
  status: string;
  theme: any;
  tagline: string | null;
  storePolicy: string | null;
  sections: any;
  enabledProductTypes: any;
  pickupLocations: any;
  customDomain: string | null;
  customDomainStatus: string;
  paystackPublicKey: string;
  fontFamily: string | null;
  bgColor: string | null;
  bodyTextColor: string | null;
  headerStyle: any;
  buttonStyle: any;
  linkBio: any;
  useOwnPaystack: boolean;
  whopEnabled: boolean;
  managedPayments: boolean;
  payoutBankName: string | null;
  payoutBankCode: string | null;
  payoutAccountName: string | null;
  payoutAccountNumber: string | null;
}

/**
 * Load a store's public config from Supabase for a given store slug.
 * Mirrors the shape the storefront pages used to read from Firestore
 * (businesses/{businessId}/store/config), which the adapter maps to the
 * businesses row.
 */
export async function getStoreConfigBySlug(storeSlug: string): Promise<PublicStoreConfig | null> {
  const db = getSupabaseServer();

  // O(1) lookup: storeIndex maps slug -> businessId
  const idx = await db.from('storeIndex').select('*').eq('id', storeSlug).maybeSingle();

  let row: any = null;
  let businessId = '';

  if (!idx.error && idx.data?.businessId) {
    const biz = await db.from('businesses').select('*').eq('id', idx.data.businessId).maybeSingle();
    if (!biz.error && biz.data) {
      row = biz.data;
      businessId = idx.data.businessId;
    }
  }

  // Fallback: match the businesses row directly by storeSlug
  if (!row) {
    const biz = await db.from('businesses').select('*').eq('storeSlug', storeSlug).maybeSingle();
    if (!biz.error && biz.data) {
      row = biz.data;
      businessId = biz.data.id;
    }
  }

  if (!row) return null;
  if ((row.status ?? 'draft') !== 'active') return null;

  return {
    businessId,
    storeSlug: row.storeSlug ?? storeSlug,
    storeName: row.storeName ?? '',
    logoUrl: row.logoUrl ?? null,
    primaryColor: row.primaryColor ?? '#0EA5E9',
    secondaryColor: row.secondaryColor ?? '#6366F1',
    businessCategory: row.businessCategory ?? '',
    currency: row.currency ?? 'NGN',
    contactEmail: row.contactEmail ?? '',
    contactPhone: row.contactPhone ?? '',
    status: row.status ?? 'draft',
    theme: row.theme ?? 'luxe',
    tagline: row.tagline ?? null,
    storePolicy: row.storePolicy ?? null,
    sections: row.sections ?? null,
    enabledProductTypes: row.enabledProductTypes ?? ['physical'],
    pickupLocations: row.pickupLocations ?? [],
    customDomain: row.customDomain ?? null,
    customDomainStatus: row.customDomainStatus ?? 'pending',
    paystackPublicKey: row.paystackPublicKey ?? '',
    fontFamily: row.fontFamily ?? null,
    bgColor: row.bgColor ?? null,
    bodyTextColor: row.bodyTextColor ?? null,
    headerStyle: row.headerStyle ?? 'left',
    buttonStyle: row.buttonStyle ?? 'pill',
    linkBio: row.linkBio ?? null,
    useOwnPaystack: row.useOwnPaystack ?? false,
    whopEnabled: row.whopEnabled ?? false,
    managedPayments: row.managedPayments ?? true,
    payoutBankName: row.payoutBankName ?? null,
    payoutBankCode: row.payoutBankCode ?? null,
    payoutAccountName: row.payoutAccountName ?? null,
    payoutAccountNumber: row.payoutAccountNumber ?? null,
  };
}
