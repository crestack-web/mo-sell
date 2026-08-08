# Environment Variables

## AI Provider — Groq (default)

Groq is the default and only active provider until routing is enabled. Groq's API is OpenAI-compatible.

```env
GROQ_API_KEY=your_groq_api_key_here
AI_MODEL=llama-3.3-70b-versatile
AI_MODEL_FAST=llama-3.1-8b-instant          # Ask MO chat
GROQ_DEFAULT_MODEL=llama-3.3-70b-versatile  # new explicit knob (falls back to AI_MODEL / AI_MODEL_FAST)
GROQ_FAST_MODEL=llama-3.1-8b-instant        # optional alias used by Ask MO chat
PDF_MODEL=llama-3.3-70b-versatile           # Ask MO designed PDF ebooks
PEXELS_API_KEY=your_pexels_api_key_here   # optional — images for Ask MO designed PDF ebooks
```

## AI Providers — Mistral & OpenAI (optional, router-aware)

MO-sell has a provider-agnostic AI layer (`lib/ai/`). The model router classifies
every request by task + complexity and picks a provider chain. **Routing is
disabled by default**, so Groq stays the only active provider until the
benchmark passes (`npx tsx scripts/ai-benchmark.ts`).

```env
# Keys (add these to Vercel when you are ready to enable routing)
MISTRAL_API_KEY=your_mistral_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Switches (all optional; defaults shown)
AI_ROUTING_ENABLED=false          # 'true' activates task/complexity-based routing
AI_PROVIDER=auto                  # 'auto' | 'groq' | 'mistral' | 'openai' (manual override)
MISTRAL_ENABLED=true              # 'false' to disable even with a key set
OPENAI_ENABLED=true               # 'false' to disable even with a key set
GROQ_ENABLED=true                 # 'false' to disable even with a key set

# Model defaults (optional)
MISTRAL_DEFAULT_MODEL=open-mistral-nemo
OPENAI_DEFAULT_MODEL=gpt-4o-mini

# Limits & cost guards (optional)
MAX_INPUT_TOKENS_PER_REQUEST=12000
MAX_OUTPUT_TOKENS_PER_REQUEST=8192
MAX_OPENAI_REQUESTS_PER_USER_PER_DAY=20
MAX_OPENAI_REQUESTS_PER_BUSINESS_PER_DAY=40
```

Routing policy (see `lib/ai/config.ts`): LOW → Mistral/Groq, MEDIUM → Mistral,
HIGH → OpenAI → Mistral → Groq. Hausa + HIGH → OpenAI first. PDF ebooks and
history summaries stay pinned to Groq. Every call is logged to the `ai_usage`
table (migration 015) — never throws, and OpenAI requests are capped per
business/day before spend.

### Getting a Pexels API Key (Ask MO PDF images)

1. Go to https://www.pexels.com/api/
2. Sign in and create an API key
3. Add `PEXELS_API_KEY` to your environment. If it is missing, Ask MO still generates the PDF using colored placeholders instead of photos.

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
