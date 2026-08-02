# Firebase Migration Plan for MO Sell

## Executive Summary

This document outlines a comprehensive strategy to migrate MO Sell from Firebase to alternative services without disrupting current operations. The migration follows a phased approach with zero-downtime cutover.

---

## Current Firebase Dependencies

### 1. **Firestore** (Primary Database)
- **Usage:** Orders, products, customers, store configs, checkout sessions, inventory
- **Impact:** CRITICAL - Core to all operations
- **Collections:**
  - `businesses/{businessId}/store/config`
  - `businesses/{businessId}/storeProducts`
  - `businesses/{businessId}/storeOrders`
  - `businesses/{businessId}/customers`
  - `businesses/{businessId}/sales`
  - `businesses/{businessId}/checkoutSessions`
  - `storeIndex` (global store lookup)
  - `ugcOrders`, `ugcCreators` (UGC marketplace)

### 2. **Firebase Authentication**
- **Usage:** Staff login, user authentication
- **Impact:** MEDIUM - Can run in parallel
- **Features Used:** Email/password, OAuth providers

### 3. **Firebase Storage**
- **Usage:** Product images, avatars, digital files
- **Impact:** MEDIUM - URLs need updating
- **Files:** Product photos, profile pictures, digital downloads

### 4. **Firebase Functions**
- **Usage:** Send OTP emails, background tasks
- **Impact:** LOW - Can be replaced with API routes

---

## Migration Strategy

### **Recommended Stack**

| Firebase Service | Replacement | Why |
|------------------|-------------|-----|
| Firestore | **PostgreSQL** | ACID compliance, relational data, better queries |
| Firebase Auth | **NextAuth.js** | Flexible, supports multiple providers, self-hosted |
| Firebase Storage | **Cloudflare R2** | No egress fees, S3-compatible, cheaper |
| Firebase Functions | **Next.js API Routes** | Already using Vercel, unified codebase |

---

## Phase 1: Database Migration (Weeks 1-4)

### **Goal:** Move from Firestore to PostgreSQL without downtime

### Step 1.1: Create Database Abstraction Layer (Week 1)

**Files to create:**
```
lib/database/
├── adapter.ts          # Main interface
├── firestore-adapter.ts # Current implementation
├── postgresql-adapter.ts # New implementation
└── index.ts            # Factory function
```

**Implementation:**
```typescript
// lib/database/adapter.ts
export interface DatabaseAdapter {
  collection(name: string): CollectionAdapter;
  doc(path: string): DocumentAdapter;
}

export interface CollectionAdapter {
  doc(id?: string): DocumentAdapter;
  where(field: string, op: string, value: any): QueryAdapter;
  limit(n: number): QueryAdapter;
  get(): Promise<QuerySnapshot>;
  add(data: any): Promise<DocumentReference>;
}

export interface DocumentAdapter {
  get(): Promise<DocumentSnapshot>;
  set(data: any, options?: any): Promise<void>;
  update(data: any): Promise<void>;
  delete(): Promise<void>;
}

// lib/database/index.ts
export function getDatabase(): DatabaseAdapter {
  const provider = process.env.DATABASE_PROVIDER || 'firestore';
  if (provider === 'postgresql') {
    return new PostgreSQLAdapter();
  }
  return new FirestoreAdapter();
}
```

### Step 1.2: Implement PostgreSQL Adapter (Week 1-2)

**PostgreSQL Schema:**
```sql
-- Businesses (stores)
CREATE TABLE businesses (
  id VARCHAR(255) PRIMARY KEY,
  store_slug VARCHAR(255) UNIQUE NOT NULL,
  store_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Store Configs
CREATE TABLE store_configs (
  business_id VARCHAR(255) PRIMARY KEY REFERENCES businesses(id),
  theme VARCHAR(50) DEFAULT 'luxe',
  primary_color VARCHAR(50),
  secondary_color VARCHAR(50),
  sections JSONB,
  link_bio JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  id VARCHAR(255) PRIMARY KEY,
  business_id VARCHAR(255) REFERENCES businesses(id),
  display_name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  product_type VARCHAR(50) DEFAULT 'physical',
  digital_file_url TEXT,
  images JSONB,
  available BOOLEAN DEFAULT true,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id VARCHAR(255) PRIMARY KEY,
  business_id VARCHAR(255) REFERENCES businesses(id),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  total DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'paid',
  payment_status VARCHAR(50) DEFAULT 'paid',
  paystack_reference VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Order Items
CREATE TABLE order_items (
  id VARCHAR(255) PRIMARY KEY,
  order_id VARCHAR(255) REFERENCES orders(id),
  product_id VARCHAR(255),
  product_type VARCHAR(50),
  display_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  line_total DECIMAL(10,2) NOT NULL
);

-- Customers
CREATE TABLE customers (
  id VARCHAR(255) PRIMARY KEY,
  business_id VARCHAR(255) REFERENCES businesses(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  total_orders INTEGER DEFAULT 0,
  total_spend DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_products_business ON products(business_id);
CREATE INDEX idx_orders_business ON orders(business_id);
CREATE INDEX idx_orders_email ON orders(customer_email);
CREATE INDEX idx_customers_business_email ON customers(business_id, email);
```

### Step 1.3: Dual-Write Implementation (Week 2-3)

**Strategy:**
- Write to both Firestore and PostgreSQL
- Read from Firestore only
- Log any inconsistencies for debugging

**Implementation:**
```typescript
// lib/database/postgresql-adapter.ts
export class PostgreSQLAdapter implements DatabaseAdapter {
  async collection(name: string): CollectionAdapter {
    return new PostgreSQLCollection(name, this.pool);
  }
  
  // ... implement all interface methods
}

// Update all service files to use dual-write
export async function processConfirmedOrder(params) {
  const db = getDatabase(); // Returns FirestoreAdapter during migration
  
  // Existing Firestore logic...
  
  // NEW: Also write to PostgreSQL
  if (process.env.DATABASE_DUAL_WRITE === 'true') {
    const pgDb = getPostgreSQLDatabase();
    await pgDb.orders.create({ ...orderData });
  }
}
```

### Step 1.4: Data Migration (Week 3)

**Script:**
```typescript
// scripts/migrate-firestore-to-postgres.ts
import { getAdminDb } from '@/lib/firebase-admin';
import { getPostgreSQLDatabase } from '@/lib/database/postgresql-adapter';

async function migrate() {
  const firestore = getAdminDb();
  const postgres = getPostgreSQLDatabase();
  
  // Migrate businesses
  const businesses = await firestore.collection('businesses').get();
  for (const doc of businesses.docs) {
    await postgres.businesses.create({
      id: doc.id,
      ...doc.data()
    });
  }
  
  // Migrate products, orders, customers...
  
  console.log('Migration complete');
}

migrate();
```

### Step 1.5: Cutover to PostgreSQL (Week 4)

**Steps:**
1. Set `DATABASE_PROVIDER=postgresql` in environment
2. Monitor for errors
3. Keep Firestore backup for 2 weeks
4. Rollback plan: Switch back to `DATABASE_PROVIDER=firestore`

---

## Phase 2: Authentication Migration (Weeks 5-6)

### Step 2.1: Install NextAuth.js

```bash
npm install next-auth
```

### Step 2.2: Create Auth Configuration

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Verify against PostgreSQL users table
        const user = await verifyUser(credentials.email, credentials.password);
        return user ? { id: user.id, email: user.email } : null;
      }
    })
  ],
  session: { strategy: 'jwt' }
};

export default NextAuth(authOptions);
```

### Step 2.3: Migrate Users

```sql
-- Create users table
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Step 2.4: Support Both Systems

```typescript
// lib/auth/migration.ts
export async function getCurrentUser() {
  // Try NextAuth session first
  const session = await getServerSession();
  if (session?.user) return session.user;
  
  // Fallback to Firebase Auth (during migration)
  const firebaseUser = await getFirebaseUser();
  if (firebaseUser) return firebaseUser;
  
  return null;
}
```

---

## Phase 3: File Storage Migration (Weeks 7-8)

### Step 3.1: Create Storage Abstraction

```typescript
// lib/storage/adapter.ts
export interface StorageAdapter {
  upload(path: string, file: Buffer): Promise<string>;
  getDownloadURL(path: string): Promise<string>;
  delete(path: string): Promise<void>;
}

export function getStorage(): StorageAdapter {
  const provider = process.env.STORAGE_PROVIDER || 'firebase';
  if (provider === 'r2') {
    return new R2StorageAdapter();
  }
  return new FirebaseStorageAdapter();
}
```

### Step 3.2: Migrate Files to Cloudflare R2

```typescript
// scripts/migrate-storage-to-r2.ts
import { getStorage } from '@/lib/storage/adapter';

async function migrateFiles() {
  const firebaseStorage = getFirebaseStorage();
  const r2Storage = getR2Storage();
  
  // List all files
  const files = await firebaseStorage.listAll();
  
  // Upload to R2
  for (const file of files.items) {
    const buffer = await firebaseStorage.get(file.fullPath);
    await r2Storage.upload(file.fullPath, buffer);
    console.log(`Migrated: ${file.fullPath}`);
  }
}
```

### Step 3.3: Update URLs in Database

```sql
-- Update product images
UPDATE products 
SET images = regexp_replace(images::text, 
  'firebasestorage.googleapis.com', 
  'your-account.r2.cloudflarestorage.com')::jsonb
WHERE images::text LIKE '%firebasestorage%';
```

---

## Phase 4: Remove Firebase Dependencies (Week 9)

### Files to Update:

1. **`lib/firebase-admin.ts`** → Remove, use PostgreSQL adapter
2. **`lib/server-firestore.ts`** → Remove, use database adapter
3. **`lib/firebase/index.ts`** → Remove, use NextAuth
4. **All API routes** → Already using adapters, no changes needed
5. **Client components** → Update to use NextAuth session

### Environment Variables to Remove:
```env
# Remove these:
FIREBASE_ADMIN_PRIVATE_KEY
FIREBASE_ADMIN_CLIENT_EMAIL
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET

# Keep these for fallback during migration:
DATABASE_PROVIDER=postgresql
STORAGE_PROVIDER=r2
```

---

## Testing Strategy

### 1. **Unit Tests**
- Test each adapter independently
- Mock database responses
- Ensure 100% test coverage for adapter layer

### 2. **Integration Tests**
```typescript
// tests/database-migration.test.ts
describe('Database Migration', () => {
  it('should write to both databases during dual-write', async () => {
    process.env.DATABASE_DUAL_WRITE = 'true';
    const result = await createOrder(orderData);
    
    // Verify in Firestore
    const firestoreOrder = await getFirestoreOrder(result.id);
    expect(firestoreOrder).toBeDefined();
    
    // Verify in PostgreSQL
    const postgresOrder = await getPostgresOrder(result.id);
    expect(postgresOrder).toBeDefined();
  });
});
```

### 3. **Production Validation**
- Enable dual-write in production
- Compare reads from both databases
- Fix any inconsistencies
- Monitor error rates

---

## Rollback Plan

### If Issues Occur:

1. **Database Issues:**
   ```bash
   # Switch back to Firestore
   DATABASE_PROVIDER=firestore
   ```
   
2. **Auth Issues:**
   ```typescript
   // Re-enable Firebase Auth fallback
   export async function getCurrentUser() {
     const nextauthUser = await getServerSession();
     if (nextauthUser) return nextauthUser;
     
     // Fallback to Firebase
     return getFirebaseUser();
   }
   ```

3. **Storage Issues:**
   ```bash
   # Switch back to Firebase Storage
   STORAGE_PROVIDER=firebase
   ```

---

## Cost Analysis

### Current Firebase Costs:
- Firestore: ~$50-200/month (depends on reads/writes)
- Firebase Auth: Free (up to 50k users)
- Firebase Storage: ~$10-50/month (egress fees)
- **Total:** ~$60-250/month

### After Migration:
- PostgreSQL (Neon/Supabase): $0-25/month (free tier available)
- NextAuth.js: Free (self-hosted)
- Cloudflare R2: $0-5/month (no egress fees)
- **Total:** ~$0-30/month

**Savings:** 50-90% cost reduction

---

## Timeline Summary

| Phase | Duration | Risk | Impact |
|-------|----------|------|--------|
| 1. Database Migration | 4 weeks | Medium | Critical |
| 2. Auth Migration | 2 weeks | Low | Medium |
| 3. Storage Migration | 2 weeks | Low | Medium |
| 4. Remove Firebase | 1 week | Low | Low |
| **Total** | **9 weeks** | **Low-Medium** | **Minimal** |

---

## Next Steps

1. **Immediate (This Week):**
   - Create database abstraction layer
   - Set up PostgreSQL database (Neon/Supabase)
   - Create schema

2. **Next Week:**
   - Implement PostgreSQL adapter
   - Start dual-write mode
   - Migrate non-critical data first (products, customers)

3. **Week 3-4:**
   - Migrate orders
   - Test extensively
   - Cutover to PostgreSQL reads

4. **Week 5+:**
   - Migrate authentication
   - Migrate storage
   - Remove Firebase dependencies

---

## Questions?

- Which PostgreSQL provider do you prefer? (Neon, Supabase, Railway, etc.)
- Do you want to start with database abstraction first?
- Should I create the adapter layer implementation?

This plan ensures zero downtime and allows rollback at any point.