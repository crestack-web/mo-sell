# How to Flip to Supabase

## Prerequisites

1. ✅ Supabase project created
2. ✅ Database schema created (see SQL below)
3. ✅ Environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`
   - `GROQ_API_KEY`
   - `RESEND_API_KEY` (for OTP emails)
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` (for storage)

## Step 1: Create Database Schema

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Users (for auth)
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_products_business ON products(business_id);
CREATE INDEX idx_orders_business ON orders(business_id);
CREATE INDEX idx_orders_email ON orders(customer_email);
CREATE INDEX idx_customers_business_email ON customers(business_id, email);

-- Email OTPs (custom branded OTP signup flow)
-- REQUIRED: without this, OTP verification fails on serverless (Vercel)
CREATE TABLE IF NOT EXISTS email_otps (
  email VARCHAR(255) PRIMARY KEY,
  otp VARCHAR(6) NOT NULL,
  full_name TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_otps_expires_at ON email_otps(expires_at);
```

> Note: the same schema lives in `supabase/migrations/001_email_otps.sql`.

## Step 2: Install Dependencies

```bash
npm install @supabase/supabase-js groq-sdk @aws-sdk/client-s3 resend
```

## Step 3: Test Migration (Dry Run)

```bash
npx ts-node scripts/migrate.ts --dry-run
```

This will show you what will be migrated without actually writing anything.

## Step 4: Run Migration

```bash
npx ts-node scripts/migrate.ts
```

Watch for errors. The script will show you:
- Total records found
- Successfully migrated
- Any errors

## Step 5: Switch to Supabase Database

In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Change `DATABASE_PROVIDER` from `firestore` to `supabase`
3. Redeploy

OR in your `.env.local`:
```env
DATABASE_PROVIDER=supabase
```

## Step 6: Test the Application

1. Visit your deployed app
2. Test product browsing
3. Test checkout flow
4. Verify orders are created in Supabase

## Step 7: Migrate Storage (Optional)

If you want to use Cloudflare R2:

1. Set environment variables:
   ```env
   STORAGE_PROVIDER=r2
   R2_ACCOUNT_ID=your-account-id
   R2_ACCESS_KEY_ID=your-access-key
   R2_SECRET_ACCESS_KEY=your-secret-key
   R2_BUCKET=mo-sell-uploads
   R2_PUBLIC_URL=https://your-account.r2.cloudflarestorage.com/mo-sell-uploads
   ```

2. Redeploy

## Step 8: Clean Up (After 1-2 Weeks)

Once you've verified everything works:

1. **Keep Firebase** for 1-2 weeks as backup
2. **Delete Firebase project** when confident
3. **Remove Firebase SDKs**:
   ```bash
   npm uninstall firebase
   ```

## Rollback Plan

If something goes wrong:

```bash
# Switch back to Firestore
# In Vercel:
DATABASE_PROVIDER=firestore

# Redeploy
```

## File Structure After Migration

```
lib/
├── database/
│   ├── adapter.ts           # Database abstraction interface
│   ├── postgresql-adapter.ts # Supabase implementation
│   └── firestore-adapter.ts # Firestore (for rollback)
├── storage/
│   ├── adapter.ts           # Storage abstraction
│   ├── r2-adapter.ts        # Cloudflare R2
│   └── firebase-adapter.ts  # Firebase Storage
├── auth.ts                  # Supabase Auth helpers
└── ai.ts                    # Groq AI integration

app/api/
├── send-otp/route.ts        # Resend OTP emails
├── webhooks/paystack/       # Paystack webhooks
└── invoice-pdf/route.ts     # PDF generation

scripts/
└── migrate.ts               # Firestore → Supabase migration
```

## Environment Variables Reference

### Required for Supabase
```env
DATABASE_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_KEY=eyJhbG...
```

### Required for AI (Groq)
```env
GROQ_API_KEY=gsk_...
```

### Required for Email (Resend)
```env
RESEND_API_KEY=re_...
```

### Optional for Storage (R2)
```env
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET=mo-sell-uploads
R2_PUBLIC_URL=https://your-account.r2.cloudflarestorage.com/mo-sell-uploads
```

## Troubleshooting

### "Supabase connection failed"
- Check `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in Vercel
- Verify Supabase project is active

### "Migration script fails"
- Run with `--dry-run` first to check for data issues
- Check Supabase logs for constraint violations
- Ensure all tables are created before running migration

### "Storage upload fails"
- Verify R2 credentials
- Check bucket permissions (public-read)
- Ensure CORS is configured in R2

## Support

If you encounter issues:
1. Check Vercel logs
2. Check Supabase logs
3. Run migration with `--dry-run` to debug
4. Rollback to Firestore if needed