-- 028_audio_video_product_fields.sql
-- Support Beat/Music/Audio and Video digital product subtypes.

ALTER TABLE "public"."storeProducts" ADD COLUMN IF NOT EXISTS "bpm" integer;
ALTER TABLE "public"."storeProducts" ADD COLUMN IF NOT EXISTS "musicalKey" text;
ALTER TABLE "public"."storeProducts" ADD COLUMN IF NOT EXISTS "genre" text;
ALTER TABLE "public"."storeProducts" ADD COLUMN IF NOT EXISTS "trackDuration" text;
ALTER TABLE "public"."storeProducts" ADD COLUMN IF NOT EXISTS "videoDuration" text;
ALTER TABLE "public"."storeProducts" ADD COLUMN IF NOT EXISTS "resolution" text;
