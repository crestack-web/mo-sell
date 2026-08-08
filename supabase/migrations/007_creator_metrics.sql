-- Creator metrics table (UGC creator scoring)
--
-- Stores aggregated score data computed from the last ~20 posts of a
-- creator's TikTok or Instagram account via the /api/apify/creator-score
-- endpoint. Keyed by (platform, handle) so re-scoring upserts in place.
--
-- Run this in your Supabase SQL Editor once, then redeploy.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS creator_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  handle TEXT NOT NULL,
  followers BIGINT,
  avg_views BIGINT,
  er NUMERIC,
  top_hashtags JSONB,
  audience_guess JSONB,
  score INTEGER,
  posts_count INTEGER,
  raw JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (platform, handle)
);

CREATE INDEX IF NOT EXISTS idx_creator_metrics_score
  ON creator_metrics (score DESC);

CREATE INDEX IF NOT EXISTS idx_creator_metrics_handle
  ON creator_metrics (handle);
