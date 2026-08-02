/**
 * One-time Migration Script: Firestore → Supabase
 * 
 * This script migrates all data from Firebase Firestore to Supabase PostgreSQL.
 * Run this ONCE after setting up your Supabase database.
 * 
 * Usage:
 *   npx ts-node scripts/migrate.ts
 *   npx ts-node scripts/migrate.ts --dry-run
 */

import { getAdminDb } from '@/lib/firebase-admin';
import { supabaseServer } from '@/lib/database/postgresql-adapter';

const DRY_RUN = process.argv.includes('--dry-run');

// Statistics
const stats = {
  businesses: { total: 0, migrated: 0, errors: 0 },
  products: { total: 0, migrated: 0, errors: 0 },
  customers: { total: 0, migrated: 0, errors: 0 },
  orders: { total: 0, migrated: 0, errors: 0 },
  orderItems: { total: 0, migrated: 0, errors: 0 },
};

/**
 * Migrate businesses table
 */
async function migrateBusinesses(db: any): Promise<void> {
  console.log('\n📦 Migrating businesses...');
  
  try {
    const snapshot = await db.collection('businesses').get();
    stats.businesses.total = snapshot.size;

    for (const doc of snapshot.docs) {
      try {
        const data = doc.data();
        
        if (DRY_RUN) {
          console.log(`  [DRY RUN] Would migrate business: ${doc.id}`);
          stats.businesses.migrated++;
          continue;
        }

        const { error } = await supabaseServer
          .from('businesses')
          .upsert({
            id: doc.id,
            store_slug: data.storeSlug || data.store_slug,
            store_name: data.storeName || data.store_name,
            contact_email: data.contactEmail || data.contact_email,
            status: data.status || 'draft',
            created_at: data.createdAt || new Date().toISOString(),
            updated_at: data.updatedAt || new Date().toISOString(),
          });

        if (error) {
          console.error(`  ❌ Failed to migrate business ${doc.id}:`, error);
          stats.businesses.errors++;
        } else {
          console.log(`  ✅ Migrated business: ${data.storeName || doc.id}`);
          stats.businesses.migrated++;
        }
      } catch (err) {
        console.error(`  ❌ Error migrating business ${doc.id}:`, err);
        stats.businesses.errors++;
      }
    }
  } catch (error) {
    console.error('❌ Failed to fetch businesses:', error);
  }
}

/**
 * Migrate products table
 */
async function migrateProducts(db: any): Promise<void> {
  console.log('\n📦 Migrating products...');
  
  try {
    const snapshot = await db.collectionGroup('storeProducts').get();
    stats.products.total = snapshot.size;

    for (const doc of snapshot.docs) {
      try {
        const data = doc.data();
        const businessId = doc.ref.path.split('/')[1];
        
        if (DRY_RUN) {
          console.log(`  [DRY RUN] Would migrate product: ${data.displayName}`);
          stats.products.migrated++;
          continue;
        }

        const { error } = await supabaseServer
          .from('products')
          .upsert({
            id: doc.id,
            business_id: businessId,
            display_name: data.displayName || data.display_name,
            price: data.price || 0,
            product_type: data.productType || data.product_type || 'physical',
            digital_file_url: data.digitalFileUrl || data.digital_file_url,
            images: data.images || [],
            available: data.available ?? true,
            stock: data.stock || 0,
            created_at: data.createdAt || new Date().toISOString(),
            updated_at: data.updatedAt || new Date().toISOString(),
          });

        if (error) {
          console.error(`  ❌ Failed to migrate product ${doc.id}:`, error);
          stats.products.errors++;
        } else {
          console.log(`  ✅ Migrated product: ${data.displayName || doc.id}`);
          stats.products.migrated++;
        }
      } catch (err) {
        console.error(`  ❌ Error migrating product ${doc.id}:`, err);
        stats.products.errors++;
      }
    }
  } catch (error) {
    console.error('❌ Failed to fetch products:', error);
  }
}

/**
 * Migrate customers table
 */
async function migrateCustomers(db: any): Promise<void> {
  console.log('\n📦 Migrating customers...');
  
  try {
    const snapshot = await db.collectionGroup('customers').get();
    stats.customers.total = snapshot.size;

    for (const doc of snapshot.docs) {
      try {
        const data = doc.data();
        const businessId = doc.ref.path.split('/')[1];
        
        if (DRY_RUN) {
          console.log(`  [DRY RUN] Would migrate customer: ${data.name || data.email}`);
          stats.customers.migrated++;
          continue;
        }

        const { error } = await supabaseServer
          .from('customers')
          .upsert({
            id: doc.id,
            business_id: businessId,
            name: data.name || 'Unknown',
            email: data.email || '',
            phone: data.phone || '',
            total_orders: data.totalOrders || data.total_orders || 0,
            total_spend: data.totalSpend || data.total_spend || 0,
            created_at: data.createdAt || new Date().toISOString(),
            updated_at: data.updatedAt || new Date().toISOString(),
          });

        if (error) {
          console.error(`  ❌ Failed to migrate customer ${doc.id}:`, error);
          stats.customers.errors++;
        } else {
          console.log(`  ✅ Migrated customer: ${data.name || data.email}`);
          stats.customers.migrated++;
        }
      } catch (err) {
        console.error(`  ❌ Error migrating customer ${doc.id}:`, err);
        stats.customers.errors++;
      }
    }
  } catch (error) {
    console.error('❌ Failed to fetch customers:', error);
  }
}

/**
 * Migrate orders table
 */
async function migrateOrders(db: any): Promise<void> {
  console.log('\n📦 Migrating orders...');
  
  try {
    const snapshot = await db.collectionGroup('storeOrders').get();
    stats.orders.total = snapshot.size;

    for (const doc of snapshot.docs) {
      try {
        const data = doc.data();
        const businessId = doc.ref.path.split('/')[1];
        
        if (DRY_RUN) {
          console.log(`  [DRY RUN] Would migrate order: ${data.orderNumber}`);
          stats.orders.migrated++;
          continue;
        }

        const { error } = await supabaseServer
          .from('orders')
          .upsert({
            id: doc.id,
            business_id: businessId,
            order_number: data.orderNumber || `ORD-${doc.id.slice(0, 8)}`,
            customer_name: data.customerName || 'Unknown',
            customer_email: data.customerEmail || '',
            customer_phone: data.customerPhone || '',
            total: data.total || 0,
            status: data.status || 'paid',
            payment_status: data.paymentStatus || 'paid',
            paystack_reference: data.paystackReference || null,
            created_at: data.createdAt || new Date().toISOString(),
            updated_at: data.updatedAt || new Date().toISOString(),
          });

        if (error) {
          console.error(`  ❌ Failed to migrate order ${doc.id}:`, error);
          stats.orders.errors++;
        } else {
          console.log(`  ✅ Migrated order: ${data.orderNumber || doc.id}`);
          stats.orders.migrated++;
        }

        // Migrate order items
        if (data.lineItems && Array.isArray(data.lineItems)) {
          for (const item of data.lineItems) {
            try {
              const itemId = `${doc.id}_${item.productId || Date.now()}`;
              
              if (!DRY_RUN) {
                const { error: itemError } = await supabaseServer
                  .from('order_items')
                  .upsert({
                    id: itemId,
                    order_id: doc.id,
                    product_id: item.productId,
                    product_type: item.productType || 'physical',
                    display_name: item.displayName || 'Unknown',
                    quantity: item.quantity || 1,
                    unit_price: item.unitPrice || 0,
                    line_total: item.lineTotal || 0,
                  });

                if (itemError) {
                  console.error(`  ❌ Failed to migrate order item ${itemId}:`, itemError);
                  stats.orderItems.errors++;
                } else {
                  stats.orderItems.migrated++;
                }
              } else {
                stats.orderItems.migrated++;
              }
            } catch (err) {
              console.error(`  ❌ Error migrating order item:`, err);
              stats.orderItems.errors++;
            }
          }
          stats.orderItems.total += data.lineItems.length;
        }
      } catch (err) {
        console.error(`  ❌ Error migrating order ${doc.id}:`, err);
        stats.orders.errors++;
      }
    }
  } catch (error) {
    console.error('❌ Failed to fetch orders:', error);
  }
}

/**
 * Print migration summary
 */
function printSummary(): void {
  console.log('\n' + '='.repeat(60));
  console.log('MIGRATION SUMMARY');
  console.log('='.repeat(60));
  
  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN - No data was actually migrated\n');
  }

  for (const [table, data] of Object.entries(stats)) {
    console.log(`\n${table.toUpperCase()}:`);
    console.log(`  Total:     ${data.total}`);
    console.log(`  Migrated:  ${data.migrated}`);
    console.log(`  Errors:    ${data.errors}`);
  }

  console.log('\n' + '='.repeat(60));
}

/**
 * Main migration function
 */
async function migrate(): Promise<void> {
  console.log('🚀 Starting Firestore → Supabase migration...');
  console.log(DRY_RUN ? '⚠️  DRY RUN MODE - No data will be written' : '✅ PRODUCTION MODE');

  try {
    // Initialize Firestore
    const db = getAdminDb();

    // Run migrations in order
    await migrateBusinesses(db);
    await migrateProducts(db);
    await migrateCustomers(db);
    await migrateOrders(db);

    // Print summary
    printSummary();

    if (!DRY_RUN) {
      console.log('\n✅ Migration complete!');
      console.log('Next steps:');
      console.log('1. Verify data in Supabase');
      console.log('2. Update DATABASE_PROVIDER=supabase in Vercel');
      console.log('3. Test the application');
      console.log('4. Delete Firebase project (optional)');
    } else {
      console.log('\n✅ Dry run complete. Run without --dry-run to migrate data.');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});