-- 021_mo_lessons.sql
-- Create table for MO's little lessons content
-- Stores educational content with rich JSONB structure for flexible content rendering

CREATE TABLE IF NOT EXISTS "mo_lessons" (
  "id" text primary key default gen_random_uuid()::text,
  "slug" text unique not null,
  "title" text not null,
  "description" text,
  "icon" text,
  "read_time" text, -- e.g., "5 min read"
  "content" jsonb, -- Rich content structure (sections, paragraphs, images, etc.)
  "category" text, -- e.g., "sales", "marketing", "operations"
  "difficulty" text, -- e.g., "beginner", "intermediate", "advanced"
  "featured" boolean default false,
  "order_index" int,
  "created_at" timestamptz default now(),
  "updated_at" timestamptz default now()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS "idx_mo_lessons_slug" ON "mo_lessons" ("slug");
CREATE INDEX IF NOT EXISTS "idx_mo_lessons_category" ON "mo_lessons" ("category");
CREATE INDEX IF NOT EXISTS "idx_mo_lessons_difficulty" ON "mo_lessons" ("difficulty");
CREATE INDEX IF NOT EXISTS "idx_mo_lessons_featured" ON "mo_lessons" ("featured");
CREATE INDEX IF NOT EXISTS "idx_mo_lessons_order" ON "mo_lessons" ("order_index");

-- Add comment to document the content structure
COMMENT ON TABLE "mo_lessons" IS 'Stores MO educational lessons with rich content structure';
COMMENT ON COLUMN "mo_lessons"."content" IS 'JSONB structure with sections array containing heading, paragraph, list, tip, image types';
COMMENT ON COLUMN "mo_lessons"."slug" IS 'URL-friendly identifier for lesson pages';
