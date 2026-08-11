import type { Timestamp } from 'firebase-admin/firestore';

// ─── Store Config ─────────────────────────────────────────────────────────────

export interface DomainPurchaseRecord {
  domain: string;
  godaddyRegistrationId: string;
  paystackReference: string;
  purchasedAt: Timestamp;
  renewalDate: Timestamp;
  renewalPriceNgn: number;
  autoRenew: boolean;
  registrationStatus: 'pending' | 'active' | 'failed';
}

export type StorefrontTheme =
  | 'luxe'
  | 'atelier' | 'citrus' | 'nordly' | 'neotech'
  | 'terra' | 'volt' | 'botanica' | 'prism'
  | 'ankara' | 'midnight' | 'harmattan' | 'neon' | 'sunset' | 'mono'
  | 'blush' | 'rose' | 'pearl' | 'cherry' | 'quiet' | 'concrete' | 'chrome';

// ─── Theme Section Editor ─────────────────────────────────────────────────────

export type StoreSectionType =
  | 'header'
  | 'announcement'
  | 'hero'
  | 'featured'
  | 'collections'
  | 'about'
  | 'testimonials'
  | 'instagram'
  | 'newsletter'
  | 'footer';

export interface HeroSectionSettings {
  heading?: string;           // override store name
  subheading?: string;        // override tagline
  ctaLabel?: string;          // e.g. "Shop Now →"
  ctaUrl?: string;            // defaults to "#products"
  backgroundImage?: string | null;
  overlayOpacity?: number;    // 0-1
  textAlign?: 'left' | 'center' | 'right';
  showTagline?: boolean;
  badgeText?: string;         // Small decorative text above heading (e.g. "New Collection", "Professional Services")
  showBadge?: boolean;        // Show/hide badge text
}

export interface CollectionsSectionSettings {
  heading?: string;
  layout?: 'strip' | 'grid';
  maxItems?: number;
  showCoverImages?: boolean;
}

export interface FeaturedSectionSettings {
  heading?: string;
  maxItems?: number;
  columns?: 2 | 3 | 4;
}

export interface ProductsSectionSettings {
  heading?: string;
  columns?: 2 | 3 | 4;
  showFilters?: boolean;
  defaultSort?: 'newest' | 'price_asc' | 'price_desc';
}

export interface AnnouncementSectionSettings {
  text: string;
  backgroundColor?: string;
  textColor?: string;
  dismissible?: boolean;
  linkLabel?: string;
  linkUrl?: string;
}

export interface HeaderSectionSettings {
  showSearch?: boolean;
  showCartCount?: boolean;
  sticky?: boolean;
  hideStoreNameWithLogo?: boolean;
  navLinks?: { label: string; url: string }[];
}

export interface FooterSectionSettings {
  showPoweredBy?: boolean;
  customText?: string;
  showLogo?: boolean;
  links?: { label: string; url: string }[];
  socials?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    tiktok?: string;
    whatsapp?: string;
    youtube?: string;
  };
}

export interface AboutSectionSettings {
  heading?: string;
  body?: string;
  imageUrl?: string | null;
  imagePosition?: 'left' | 'right';
}

export interface TestimonialsSectionSettings {
  heading?: string;
  testimonials?: { name: string; text: string; rating?: number }[];
}

export interface InstagramSectionSettings {
  heading?: string;
  handle?: string;
}

export interface NewsletterSectionSettings {
  heading?: string;
  subheading?: string;
  buttonLabel?: string;
  placeholder?: string;
}

export type SectionSettings =
  | HeroSectionSettings
  | CollectionsSectionSettings
  | FeaturedSectionSettings
  | ProductsSectionSettings
  | AnnouncementSectionSettings
  | HeaderSectionSettings
  | FooterSectionSettings
  | AboutSectionSettings
  | TestimonialsSectionSettings
  | InstagramSectionSettings
  | NewsletterSectionSettings;

export interface StoreSection {
  id: string;
  type: StoreSectionType;
  enabled: boolean;
  order: number;
  settings: SectionSettings;
}

export const DEFAULT_SECTIONS: StoreSection[] = [
  { id: 'header',       type: 'header',       enabled: true,  order: 0,  settings: { showSearch: false, showCartCount: true, sticky: true } },
  { id: 'announcement', type: 'announcement', enabled: false, order: 1,  settings: { text: 'Free delivery on orders over ₦20,000', backgroundColor: '#0F172A', textColor: '#fff' } },
  { id: 'hero',         type: 'hero',         enabled: true,  order: 2,  settings: { ctaLabel: 'Shop Now', ctaUrl: '#products', textAlign: 'left', showTagline: true, badgeText: '', showBadge: false } },
  { id: 'featured',     type: 'featured',     enabled: true,  order: 3,  settings: { heading: 'Shop Bestsellers', maxItems: 4, columns: 4 } },
  { id: 'collections',  type: 'collections',  enabled: true,  order: 4,  settings: { heading: 'Collections', layout: 'strip', maxItems: 6, showCoverImages: true } },
  { id: 'about',        type: 'about',        enabled: false, order: 5,  settings: { heading: 'Our Story', body: 'Tell customers about your brand and what makes you special.', imagePosition: 'right' } },
  { id: 'testimonials', type: 'testimonials', enabled: false, order: 6,  settings: { heading: 'What our customers say', testimonials: [] } },
  { id: 'instagram',    type: 'instagram',    enabled: false, order: 7,  settings: { heading: 'Follow us on Instagram', handle: '' } },
  { id: 'newsletter',   type: 'newsletter',   enabled: false, order: 8,  settings: { heading: 'Join our community', subheading: 'Get the latest updates, offers and more.', buttonLabel: 'Subscribe', placeholder: 'Enter your email' } },
  { id: 'footer',       type: 'footer',       enabled: true,  order: 9,  settings: { showPoweredBy: true, showLogo: true } },
];

export interface StoreConfig {
  storeSlug: string;
  storeName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  businessCategory: string;
  currency: string;
  contactEmail: string;
  contactPhone: string;
  status: 'draft' | 'active' | 'paused';
  theme: StorefrontTheme;
  tagline?: string | null;
  storePolicy?: string | null;
  sections?: StoreSection[];
  /** Custom font family (Google Font name) */
  fontFamily?: string | null;
  /** Button style: pill, square, rounded */
  buttonStyle?: 'pill' | 'square' | 'rounded';
  /** Custom body text color override */
  bodyTextColor?: string | null;
  /** Header style: 'left' (logo left), 'center' (logo centered), 'minimal' (no header) */
  headerStyle?: 'left' | 'center' | 'minimal';
  /** Background color override for link-style themes */
  bgColor?: string | null;
  /** Busmo collects payments on behalf of merchant, charges 5% commission */
  managedPayments?: boolean;
  /** Merchant bank account for payouts (only stored when managedPayments = true) */
  payoutBankName?: string | null;
  payoutAccountNumber?: string | null;
  payoutAccountName?: string | null;
  paystackPublicKey: string;
  enabledProductTypes: Array<'physical' | 'digital' | 'service'>;
  pickupLocations: Array<{ name: string; address: string }>;
  customDomain: string | null;
  customDomainStatus: 'pending' | 'verified' | 'failed';
  customDomainVerifiedAt: Timestamp | null;
  domainPurchaseRecord: DomainPurchaseRecord | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Store Products ───────────────────────────────────────────────────────────

export interface StorefrontProduct {
  productId: string;
  productType: 'physical' | 'digital' | 'service';
  displayName: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  category: string;
  collectionIds: string[];
  tags: string[];
  stock: number;
  sku: string | null;
  available: boolean;
  featured: boolean;
  digitalFileUrl: string | null;
  deliveryNote: string | null;
  /** How digital products display on storefront: 'button' (buy button) or 'callout' (highlighted card) */
  displayType?: 'button' | 'callout';
  lowStockThreshold: number;
  /** Physical product variant options (e.g. Size, Color) */
  variants?: ProductVariant[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProductVariant {
  name: string;
  options: ProductVariantOption[];
}

export interface ProductVariantOption {
  label: string;
  price: number | null;
  stock: number | null;
  sku: string | null;
}

// ─── Collections ──────────────────────────────────────────────────────────────

export interface StoreCollection {
  title: string;
  description: string;
  coverImageUrl: string | null;
  productIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending_payment' | 'paid' | 'processing'
  | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: Timestamp;
  changedBy: string;
}

export interface OrderLineItem {
  productId: string;
  productType: 'physical' | 'digital' | 'service';
  displayName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface StoreOrder {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryOption: 'delivery' | 'pickup';
  shippingAddress: string | null;
  shippingZoneId: string | null;
  shippingCost: number;
  lineItems: OrderLineItem[];
  subtotal: number;
  total: number;
  paystackReference: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  trackingNumber: string | null;
  carrier: string | null;
  statusHistory: StatusHistoryEntry[];
  integrationStatus: 'pending' | 'completed' | 'failed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Checkout Sessions ────────────────────────────────────────────────────────

export type CheckoutSessionStatus =
  | 'pending' | 'payment_initiated' | 'payment_confirmed'
  | 'payment_confirmed_integration_pending' | 'completed' | 'expired';

export interface CheckoutSession {
  storeSlug: string;
  businessId: string;
  lineItems: OrderLineItem[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryOption: 'delivery' | 'pickup';
  shippingAddress: string | null;
  shippingZoneId: string | null;
  shippingCost: number;
  subtotal: number;
  total: number;
  paystackReference: string | null;
  status: CheckoutSessionStatus;
  expiresAt: Timestamp;
  createdAt: Timestamp;
}

// ─── Shipping Zones ───────────────────────────────────────────────────────────

export interface ShippingZone {
  zoneName: string;
  regions: string[];
  flatRate: number;
  estimatedDeliveryDays: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export type AnalyticsEventType =
  | 'page_view' | 'add_to_cart' | 'checkout_initiated' | 'order_completed';

export interface StoreAnalyticsEvent {
  eventType: AnalyticsEventType;
  storeSlug: string;
  pageType: string | null;
  productId: string | null;
  timestamp: Timestamp;
}

// ─── Cart (client-side) ───────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  displayName: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  maxStock: number;
  productType: 'physical' | 'digital' | 'service';
}

export interface Cart {
  storeSlug: string;
  items: CartItem[];
  updatedAt: number;
}

// ─── Integration Bridge ───────────────────────────────────────────────────────

export interface PaystackTransactionData {
  reference: string;
  status: string;
  amount: number;
  currency: string;
  metadata: Record<string, unknown>;
}

export interface IntegrationBridgeParams {
  businessId: string;
  sessionId: string;
  paystackData: PaystackTransactionData;
  /** Settlement date ISO string (e.g. 7 days from now for Whop payments) */
  settlementDate?: string;
}

export interface IntegrationBridgeResult {
  orderId: string;
}

// ─── Managed Payments — Earnings & Payouts ───────────────────────────────────

export type EarningStatus = 'pending' | 'available' | 'paid_out';

export interface StoreEarning {
  orderId: string;
  orderNumber: string;
  customerName: string;
  grossAmount: number;       // order total
  commissionRate: number;    // e.g. 0.05
  commissionAmount: number;  // grossAmount * commissionRate
  netAmount: number;         // grossAmount - commissionAmount
  currency: string;
  status: EarningStatus;
  payoutRequestId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type PayoutStatus = 'requested' | 'sent' | 'processing' | 'completed' | 'rejected';

export interface PayoutRequest {
  businessId: string;
  amount: number;              // total net amount being requested
  currency: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  earningIds: string[];        // storeEarnings doc IDs included in this payout
  status: PayoutStatus;
  rejectionReason: string | null;
  processedAt: Timestamp | null;
  sentAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Bookings ────────────────────────────────────────────────────────────────

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface AvailabilitySlot {
  day: DayOfWeek;
  enabled: boolean;
  startTime: string;   // "09:00"
  endTime: string;     // "17:00"
}

export interface BookingAvailability {
  businessId: string;
  slots: AvailabilitySlot[];
  slotDurationMinutes: number;   // e.g. 30, 60
  bufferMinutes: number;         // gap between slots
  blockedDates: string[];        // ISO date strings e.g. ["2026-08-15"]
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Booking {
  businessId: string;
  storeSlug: string;
  productId: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;                // ISO date "2026-08-15"
  startTime: string;           // "10:00"
  endTime: string;             // "10:30"
  notes: string | null;
  status: BookingStatus;
  orderId: string | null;      // linked order if paid
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Customers ───────────────────────────────────────────────────────────────

export type CustomerTag = 'buyer' | 'subscriber' | 'booking' | 'repeat';

export interface StoreCustomer {
  businessId: string;
  storeSlug: string;
  name: string;
  email: string;
  phone: string | null;
  tags: CustomerTag[];
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: Timestamp | null;
  subscribedAt: Timestamp | null;  // newsletter/email signup
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
