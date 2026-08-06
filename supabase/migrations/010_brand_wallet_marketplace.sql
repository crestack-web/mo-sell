-- Brand Video Marketplace + Wallet
-- Replaces the Firebase `ugc_videos`, `purchased_videos` and `wallet_transactions`
-- collections used by the brand video-purchase and wallet top-up flows.
-- camelCase quoted columns match the Firestore-style payloads verbatim.

-- Marketplace catalog of creator videos brands can buy (public).
-- id auto-generates so the adapter's add()/doc().set() both work.
create table if not exists public.ugc_videos (
  id text primary key default gen_random_uuid()::text,
  creatorId text,
  title text,
  url text,
  thumbnail text,
  creatorName text,
  creatorUsername text,
  creatorAvatar text,
  platform text,
  price numeric default 20,
  tags jsonb,
  createdAt timestamptz default now()
);

-- Videos a brand has purchased.
create table if not exists public.purchased_videos (
  id text primary key default gen_random_uuid()::text,
  brandId text,
  videoId text,
  creatorId text,
  creatorName text,
  creatorUsername text,
  creatorAvatar text,
  videoTitle text,
  videoThumbnail text,
  videoUrl text,
  platform text,
  price numeric default 0,
  paymentMethod text,
  licenseType text,
  purchaseDate timestamptz default now(),
  status text default 'active',
  tags jsonb,
  platformViews numeric default 0,
  platformLikes numeric default 0,
  platformComments numeric default 0,
  platformShares numeric default 0,
  createdAt timestamptz default now()
);

create index if not exists purchased_videos_brand_idx on public.purchased_videos (brandId);
create index if not exists purchased_videos_video_idx on public.purchased_videos (videoId);

-- Brand wallet ledger (top-ups, video purchases, refunds).
create table if not exists public.wallet_transactions (
  id text primary key default gen_random_uuid()::text,
  brandId text,
  type text,
  amount numeric default 0,
  amountUsd numeric default 0,
  amountNgn numeric default 0,
  currency text,
  balanceBefore numeric default 0,
  balanceAfter numeric default 0,
  description text,
  videoId text,
  paymentMethod text,
  paymentReference text,
  status text default 'pending',
  metadata jsonb,
  createdAt timestamptz default now(),
  updatedAt timestamptz default now()
);

create index if not exists wallet_transactions_brand_idx on public.wallet_transactions (brandId);

-- Currency preference persisted by the top-up route.
alter table brands add column if not exists "topupCurrency" text;

-- RLS: brands may only read/write their own purchases + transactions,
-- mirroring the brands table's `userId = auth.uid()` ownership model.
alter table purchased_videos enable row level security;
alter table wallet_transactions enable row level security;

drop policy if exists purchased_videos_select_own on purchased_videos;
create policy purchased_videos_select_own
  on purchased_videos
  for select
  to authenticated
  using (brandId in (select id::text from brands where "userId" = auth.uid()));

drop policy if exists purchased_videos_insert_own on purchased_videos;
create policy purchased_videos_insert_own
  on purchased_videos
  for insert
  to authenticated
  with check (brandId in (select id::text from brands where "userId" = auth.uid()));

drop policy if exists purchased_videos_update_own on purchased_videos;
create policy purchased_videos_update_own
  on purchased_videos
  for update
  to authenticated
  using (brandId in (select id::text from brands where "userId" = auth.uid()));

drop policy if exists purchased_videos_delete_own on purchased_videos;
create policy purchased_videos_delete_own
  on purchased_videos
  for delete
  to authenticated
  using (brandId in (select id::text from brands where "userId" = auth.uid()));

drop policy if exists wallet_transactions_select_own on wallet_transactions;
create policy wallet_transactions_select_own
  on wallet_transactions
  for select
  to authenticated
  using (brandId in (select id::text from brands where "userId" = auth.uid()));

drop policy if exists wallet_transactions_insert_own on wallet_transactions;
create policy wallet_transactions_insert_own
  on wallet_transactions
  for insert
  to authenticated
  with check (brandId in (select id::text from brands where "userId" = auth.uid()));

drop policy if exists wallet_transactions_update_own on wallet_transactions;
create policy wallet_transactions_update_own
  on wallet_transactions
  for update
  to authenticated
  using (brandId in (select id::text from brands where "userId" = auth.uid()));

drop policy if exists wallet_transactions_delete_own on wallet_transactions;
create policy wallet_transactions_delete_own
  on wallet_transactions
  for delete
  to authenticated
  using (brandId in (select id::text from brands where "userId" = auth.uid()));
