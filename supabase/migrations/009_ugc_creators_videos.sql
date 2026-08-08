-- UGC Creator Marketplace: ugcCreators + ugcVideos
-- Replaces the Firebase `ugcCreators` / `ugcVideos` collections.
-- Table and column names are QUOTED camelCase and match the Firebase document
-- keys / PostgREST payload keys verbatim. Unquoted mixed-case identifiers would
-- be folded to lowercase by Postgres and break the adapter's passthrough.

create table if not exists public."ugcCreators" (
  id text primary key,
  "userId" text,
  "username" text,
  "name" text,
  "displayName" text,
  "bio" text,
  "avatarUrl" text,
  "email" text,
  "contactEmail" text,
  "niches" jsonb,
  "isActive" boolean default true,
  "isBanned" boolean default false,
  "price30s" numeric default 0,
  "price60s" numeric default 0,
  "currency" text default 'NGN',
  "deliveryDays" integer default 3,
  "rating" numeric default 0,
  "totalOrders" integer default 0,
  "totalEarnings" numeric default 0,
  "socialLinks" jsonb,
  "followerCounts" jsonb,
  "socialVerified" jsonb,
  "socialStats" jsonb,
  "portfolioImages" jsonb,
  "bankName" text,
  "bankCode" text,
  "accountNumber" text,
  "accountName" text,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

create index if not exists ugc_creators_username_idx on public."ugcCreators" ("username");
create index if not exists ugc_creators_userid_idx on public."ugcCreators" ("userId");
create index if not exists ugc_creators_active_idx on public."ugcCreators" ("isActive");

create table if not exists public."ugcVideos" (
  id uuid primary key default gen_random_uuid(),
  "creatorId" text,
  "url" text,
  "thumbnail" text,
  "title" text,
  "duration" numeric,
  "hasWatermark" boolean default false,
  "tags" jsonb,
  "createdAt" timestamptz default now()
);

create index if not exists ugc_videos_creator_idx on public."ugcVideos" ("creatorId");
create index if not exists ugc_videos_watermark_idx on public."ugcVideos" ("creatorId", "hasWatermark");
