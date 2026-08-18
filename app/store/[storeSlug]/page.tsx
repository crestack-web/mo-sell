import React from 'react';
import { notFound } from 'next/navigation';
import { getThemeComponentsServer, isCreatorTheme, resolveEcommerceTheme, type ThemeId } from '@/themes/registry';
import type { ProductCardData } from '@/themes/types';
import { CreatorProductTabs } from './creator-product-tabs';
import { EmailSignup } from './components/EmailSignup';
import type {
  StoreSection,
  HeroSectionSettings, CollectionsSectionSettings,
  FeaturedSectionSettings, AnnouncementSectionSettings,
  AboutSectionSettings, TestimonialsSectionSettings,
  InstagramSectionSettings, NewsletterSectionSettings,
  FooterSectionSettings, HeaderSectionSettings,
} from '@/types/mo-sell.types';
import { DEFAULT_SECTIONS } from '@/types/mo-sell.types';
import { getSupabaseServer } from '@/lib/database/postgresql-adapter';
import { getStoreConfigBySlug } from '@/lib/store';
import { SocialIcon } from '@/components/SocialBrand';

async function getStoreConfig(storeSlug: string) {
  try {
    return await getStoreConfigBySlug(storeSlug);
  } catch { return null; }
}

async function getProducts(businessId: string, filter?: { featured?: boolean }) {
  try {
    const supabase = getSupabaseServer();
    const { data: rows } = await supabase
      .from('storeProducts')
      .select('*')
      .eq('businessId', businessId);
    const products = (rows ?? [])
      .filter((r: any) => (r.status ?? 'active') !== 'draft')
      .filter((r: any) => r.available === true)
      .filter((r: any) => (filter?.featured ? r.featured === true : true))
      .slice(0, 100);
    return products.map((row: any) => {
      const images = typeof row.images === 'string' ? JSON.parse(row.images || '[]') : (Array.isArray(row.images) ? row.images : []);
      return {
        id: row.id,
        displayName: row.displayName ?? '',
        price: row.price ?? 0,
        compareAtPrice: row.compareAtPrice ?? null,
        images,
        category: row.category ?? '',
        available: row.available ?? true,
        stock: row.stock ?? 0,
        productType: row.productType ?? 'physical',
        description: row.description ?? '',
        rating: typeof row.rating === 'number' ? row.rating : undefined,
        reviewCount: typeof row.reviewCount === 'number' ? row.reviewCount : undefined,
      } as ProductCardData;
    });
  } catch { return []; }
}

async function getCollections(businessId: string) {
  try {
    const supabase = getSupabaseServer();
    const { data: rows } = await supabase
      .from('storeCollections')
      .select('*')
      .eq('businessId', businessId);
    return (rows ?? []).slice(0, 20).map((row: any) => {
      return {
        id: row.id,
        title: row.title ?? row.name ?? '',
        coverImageUrl: row.coverImageUrl ?? null,
        description: row.description ?? '',
        productCount: row.productCount ?? undefined,
      };
    });
  } catch { return []; }
}

function ThemeProductGrid({ products, storeSlug, currency, columns, emptyMessage, ProductCard }: {
  products: ProductCardData[];
  storeSlug: string;
  currency: string;
  columns: number;
  emptyMessage?: string;
  ProductCard: React.ComponentType<{ product: ProductCardData; storeSlug: string; currency: string }>;
}) {
  if (products.length === 0) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', color: '#9CA3AF', fontSize: '0.9rem' }}>
        {emptyMessage || 'No products yet.'}
      </div>
    );
  }
  return (
    <div className="sf-product-grid" style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, 200px), 1fr))`,
      gap: 24,
      width: '100%',
      boxSizing: 'border-box',
    }}>
      {products.map(p => (
        <ProductCard key={p.id} product={p} storeSlug={storeSlug} currency={currency} />
      ))}
    </div>
  );
}

function SearchResults({ query, products, storeSlug, currency, SearchBar, ProductCard }: {
  query: string;
  products: ProductCardData[];
  storeSlug: string;
  currency: string;
  SearchBar: React.ComponentType<{ initialQuery?: string; storeSlug: string; compact?: boolean; autoFocus?: boolean }>;
  ProductCard: React.ComponentType<{ product: ProductCardData; storeSlug: string; currency: string }>;
}) {
  const q = query.toLowerCase();
  const results = products.filter(p =>
    p.displayName.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    (p.description ?? '').toLowerCase().includes(q),
  );

  return (
    <div className="sf-page sf-section" style={{ paddingTop: 40 }}>
      <p className="sf-section-title">Search</p>
      <div style={{ marginBottom: 24 }}>
        <SearchBar initialQuery={query} storeSlug={storeSlug} autoFocus />
      </div>
      <p style={{ fontSize: '0.9rem', color: 'var(--sf-text-2)', marginBottom: 20 }}>
        {results.length > 0
          ? `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`
          : `No products found for "${query}"`}
      </p>
      {results.length > 0 ? (
        <ThemeProductGrid products={results} storeSlug={storeSlug} currency={currency} columns={3} ProductCard={ProductCard} />
      ) : (
        <div style={{ padding: '48px 24px', textAlign: 'center', color: '#9CA3AF', fontSize: '0.9rem' }}>
          Try a different search term or browse all products.
        </div>
      )}
    </div>
  );
}

export default async function StorefrontHomePage({
  params,
  searchParams,
}: {
  params: Promise<{ storeSlug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { storeSlug } = await params;
  const { q } = await searchParams;
  const query = (q ?? '').trim();
  const config = await getStoreConfig(storeSlug);
  if (!config) notFound();

  const theme = resolveEcommerceTheme(config.theme);

  let components: Awaited<ReturnType<typeof getThemeComponentsServer>>;
  try {
    components = await getThemeComponentsServer(theme as ThemeId);
  } catch {
    components = await getThemeComponentsServer('luxe' as ThemeId);
  }

  const savedSections: StoreSection[] = config.sections ?? [];
  const sections: StoreSection[] = DEFAULT_SECTIONS.map(def => {
    const saved = savedSections.find(s => s.id === def.id);
    return saved ? { ...def, ...saved, settings: { ...def.settings, ...saved.settings } } : def;
  }).sort((a, b) => a.order - b.order);

  const needFeatured    = sections.some(s => s.type === 'featured'    && s.enabled);
  const needCollections = sections.some(s => s.type === 'collections' && s.enabled);

  const [featured, allProducts, collections] = await Promise.all([
    needFeatured    ? getProducts(config.businessId, { featured: true }) : Promise.resolve([]),
    getProducts(config.businessId),
    needCollections ? getCollections(config.businessId) : Promise.resolve([]),
  ]);

  try {
    const supabaseAnalytics = getSupabaseServer();
    supabaseAnalytics.from('storeAnalytics').insert({
      eventType: 'page_view', storeSlug, businessId: config.businessId, pageType: 'home',
      createdAt: new Date().toISOString(),
    }).then(() => {}, () => {});
  } catch {}

  const Hero = components.Hero;
  const ProductCard = components.ProductCard;
  const CollectionCard = components.CollectionCard;
  const SearchBar = components.SearchBar;

  const headerDef = DEFAULT_SECTIONS.find(s => s.id === 'header')!;
  const headerSaved = savedSections.find(s => s.id === 'header');
  const headerSettings = {
    ...headerDef.settings as HeaderSectionSettings,
    ...(headerSaved?.settings as HeaderSectionSettings ?? {}),
  };
  const showSearch = headerSettings.showSearch ?? false;

  if (query) {
    return (
      <div>
        <SearchResults
          query={query}
          products={allProducts}
          storeSlug={storeSlug}
          currency={config.currency}
          SearchBar={SearchBar}
          ProductCard={ProductCard}
        />
      </div>
    );
  }

  return (
    <div id="products">
      {sections.map(section => {
        if (!section.enabled) return null;
        const s = section.settings as Record<string, unknown>;

        switch (section.type) {

          case 'announcement': {
            const text = s.text as string;
            if (!text) return null;
            return (
              <div key={section.id} className="sf-announcement" style={{ background: (s.backgroundColor as string) || '#0F172A', color: (s.textColor as string) || '#fff' }}>
                <span>{text}</span>
                {(s.linkLabel as string) && (s.linkUrl as string) && <a href={s.linkUrl as string} style={{ color: 'inherit', textDecoration: 'underline', opacity: 0.8 }}>{s.linkLabel as string}</a>}
              </div>
            );
          }

          case 'hero': {
            const hs = s as HeroSectionSettings;
            const footerSection = sections.find(sec => sec.type === 'footer');
            const footerSettings = footerSection?.settings as FooterSectionSettings | undefined;
            return (
              <Hero key={section.id}
                storeName={hs.heading || config.storeName}
                tagline={hs.showTagline !== false ? (hs.subheading || config.tagline || null) : null}
                primaryColor={config.primaryColor ?? '#C9A84C'}
                secondaryColor={config.secondaryColor ?? '#8B7355'}
                ctaLabel={hs.ctaLabel || 'Shop Now'}
                ctaUrl={hs.ctaUrl || '#products'}
                backgroundImage={hs.backgroundImage ?? null}
                backgroundBlur={hs.backgroundBlur ?? 0}
                backgroundOpacity={hs.backgroundOpacity ?? 1}
                overlayOpacity={hs.overlayOpacity ?? 1}
                textAlign={hs.textAlign ?? 'left'}
                buttonStyle={config.buttonStyle ?? 'pill'}
                socialLinks={footerSettings?.socials}
                businessCategory={config.businessCategory}
                badgeText={hs.showBadge !== false ? (hs.badgeText || null) : null}
                showBadge={hs.showBadge !== false}
                bgColor={config.bgColor ?? null}
                bodyTextColor={config.bodyTextColor ?? null}
              />
            );
          }

          case 'featured': {
            if ((featured as ProductCardData[]).length === 0) return null;
            const fs = s as FeaturedSectionSettings;
            return (
              <div key={section.id} className="sf-page sf-section">
                <p className="sf-section-title">{fs.heading || 'Shop Bestsellers'}</p>
                <ThemeProductGrid
                  products={(featured as ProductCardData[]).slice(0, fs.maxItems ?? 8)}
                  storeSlug={storeSlug}
                  currency={config.currency}
                  columns={fs.columns ?? 4}
                  ProductCard={ProductCard}
                />
              </div>
            );
          }

          case 'collections': {
            if (collections.length === 0) return null;
            const cs = s as CollectionsSectionSettings;
            const visible = collections.slice(0, cs.maxItems ?? 6);
            return (
              <div key={section.id} className="sf-page sf-section">
                <p className="sf-section-title">{cs.heading || 'Collections'}</p>
                <div className="sf-collection-grid">
                  {visible.map((col: any, i: number) => (
                    <CollectionCard key={col.id} collection={col} storeSlug={storeSlug} index={i} />
                  ))}
                </div>
              </div>
            );
          }

          case 'about': {
            const as_ = s as AboutSectionSettings;
            if (!as_.body && !as_.imageUrl) return null;
            return (
              <div key={section.id} className="sf-page">
                <div className="sf-about" style={{ direction: as_.imagePosition === 'left' ? 'rtl' : 'ltr' }}>
                  {as_.imageUrl && <img src={as_.imageUrl} alt="" className="sf-about-img" style={{ direction: 'ltr' }} />}
                  <div className="sf-about-body" style={{ direction: 'ltr' }}>
                    <h2>{as_.heading || 'Our Story'}</h2>
                    <p>{as_.body}</p>
                  </div>
                </div>
              </div>
            );
          }

          case 'testimonials': {
            const ts = s as TestimonialsSectionSettings;
            const items = ts.testimonials ?? [];
            if (items.length === 0) return null;
            return (
              <div key={section.id} className="sf-page sf-testimonials">
                <p className="sf-section-title">{ts.heading || 'What our customers say'}</p>
                <div className="sf-testimonials-grid">
                  {items.map((t, i) => (
                    <div key={i} className="sf-testimonial-card">
                      <div className="sf-testimonial-stars">{'★'.repeat(t.rating ?? 5)}</div>
                      <p className="sf-testimonial-text">&ldquo;{t.text}&rdquo;</p>
                      <p className="sf-testimonial-name">— {t.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          case 'instagram': {
            const is = s as InstagramSectionSettings;
            return (
              <div key={section.id} className="sf-page sf-instagram">
                <p className="sf-section-title">{is.heading || 'Follow us on Instagram'}</p>
                <div className="sf-instagram-grid">
                  {[...Array(6)].map((_, i) => <div key={i} className="sf-instagram-cell" />)}
                </div>
                {is.handle && <p style={{ textAlign: 'center', marginTop: 14, fontSize: '0.875rem', color: 'var(--sf-text-2)' }}>{is.handle}</p>}
              </div>
            );
          }

          case 'newsletter': {
            const ns = s as NewsletterSectionSettings;
            return (
              <EmailSignup
                key={section.id}
                businessId={config.businessId}
                storeSlug={storeSlug}
                heading={ns.heading}
                subheading={ns.subheading}
                placeholder={ns.placeholder}
                buttonLabel={ns.buttonLabel}
              />
            );
          }

          case 'footer': {
            const fs = (s as FooterSectionSettings) ?? {};
            const socialEntries = fs.socials ? Object.entries(fs.socials).filter(([, v]) => v) as [string, string][] : [];
            return (
              <footer key={section.id} className="sf-footer">
                <div className="sf-footer-inner">
                  {fs.showLogo !== false && config.logoUrl && (
                    <img src={config.logoUrl} alt={config.storeName} className="sf-footer-logo" />
                  )}
                  {fs.links && fs.links.length > 0 && (
                    <nav className="sf-footer-nav">
                      {fs.links.map((link, i) => (
                        <a key={i} href={link.url} className="sf-footer-link">{link.label}</a>
                      ))}
                    </nav>
                  )}
                  {socialEntries.length > 0 && (
                    <div className="sf-footer-socials">
                      {socialEntries.map(([platform, url]) => (
                        <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="sf-footer-social-link" aria-label={platform}>
                          <SocialIcon platform={platform} size={16} />
                        </a>
                      ))}
                    </div>
                  )}
                  <p className="sf-footer-text">
                    {fs.customText || `${config.storeName}. All rights reserved.`}
                  </p>
                  {fs.showPoweredBy !== false && (
                    <p className="sf-footer-powered">Powered by <a href="https://busmo.co" target="_blank" rel="noopener noreferrer">MO Sell</a></p>
                  )}
                </div>
              </footer>
            );
          }

          default:
            return null;
        }
      })}

      {allProducts.length > 0 ? (
        <div className="sf-page sf-section" id="products">
          {isCreatorTheme(theme) ? (
            <CreatorProductTabs
              products={allProducts}
              storeSlug={storeSlug}
              currency={config.currency}
              ProductCard={ProductCard}
              columns={3}
            />
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <p className="sf-section-title" style={{ marginBottom: 0 }}>
                  All Products
                  <span style={{ marginLeft: 10, fontSize: '0.78rem', fontWeight: 500, color: 'var(--sf-text-3)' }}>
                    {allProducts.length} item{allProducts.length !== 1 ? 's' : ''}
                  </span>
                </p>
                {showSearch && <SearchBar storeSlug={storeSlug} compact />}
              </div>
              <ThemeProductGrid
                products={allProducts}
                storeSlug={storeSlug}
                currency={config.currency}
                columns={3}
                emptyMessage="No products yet. Check back soon!"
                ProductCard={ProductCard}
              />
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
