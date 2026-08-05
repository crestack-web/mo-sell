# Environment Variables

## AI Provider - Groq

The mo-sell application uses Groq for all AI features (Ask Mo, content hub, support chat, UGC ideas, store wizard). Groq's API is OpenAI-compatible.

```env
GROQ_API_KEY=your_groq_api_key_here
AI_MODEL=llama-3.1-8b-instant
```

### Getting a Groq API Key

1. Go to https://console.groq.com/
2. Create an account or sign in
3. Navigate to API Keys
4. Generate a new API key
5. Add the key to your environment variables

## Database Provider

Choose between Firebase and Supabase for the database:

```env
DATABASE_PROVIDER=firebase  # Options: firebase, supabase
```

### Supabase Configuration (if using DATABASE_PROVIDER=supabase)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

### Brand Auth setup (Supabase)

Run these in the Supabase SQL Editor once, then redeploy:
- `supabase/migrations/001_email_otps.sql` — OTP table (brand email verification)
- `supabase/migrations/002_brands.sql` — `brands` table + RLS policies

Then in Supabase Dashboard → Authentication:
1. **Settings → Email** — turn OFF "Confirm email" (the app verifies emails itself via OTP).
2. **Providers → Google** — enable it and add your Google OAuth Client ID/Secret.
3. **URL Configuration → Redirect URLs** — add `https://your-domain.com/brand-auth/callback`.
4. Add the same redirect URL to the Google OAuth console's authorized redirect URIs.

### Firebase Configuration (if using DATABASE_PROVIDER=firebase)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_SERVICE_ACCOUNT_KEY=your_service_account_key
```

## Storage Provider

Choose between Firebase Storage and Cloudflare R2 for file storage:

```env
STORAGE_PROVIDER=firebase  # Options: firebase, r2
```

### Cloudflare R2 Configuration (if using STORAGE_PROVIDER=r2)

```env
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET=mo-sell-uploads
R2_PUBLIC_URL=https://your-account.r2.cloudflarestorage.com/mo-sell-uploads
```

## Payment Configuration

```env
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_CALLBACK_URL=your_callback_url
```

## Vercel Deployment

Add these environment variables in your Vercel project settings:
1. Go to your Vercel dashboard
2. Navigate to the mo-sell project
3. Go to Settings > Environment Variables
4. Add all the required variables above
5. Redeploy the project
