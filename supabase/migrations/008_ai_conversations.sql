-- 008: Ask MO chat history tables.
--
-- The Ask MO page previously wrote conversations through the Supabase adapter
-- using a Firestore-style subcollection path:
--     businesses/{businessId}/aiConversations
-- The adapter maps collection() names directly to table names, so that path
-- resolved to a literal table "businesses/{businessId}/aiConversations" which
-- never existed — every history save/load failed silently. This migration adds
-- the real tables the page now targets.
--
-- ai_conversations: one row per conversation (id = conv_<ts>_<rand>).
-- ai_conversation_meta: one row per business tracking the currently-open
-- conversation (id = businessId) so the last chat is restored on the next visit.

CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id TEXT PRIMARY KEY,
  "businessId" TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  "conversationHistory" JSONB NOT NULL DEFAULT '[]',
  preview TEXT,
  "createdAt" BIGINT,
  "updatedAt" BIGINT
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_business ON public.ai_conversations("businessId");

CREATE TABLE IF NOT EXISTS public.ai_conversation_meta (
  id TEXT PRIMARY KEY,
  "activeConvId" TEXT,
  "updatedAt" BIGINT
);

-- NOTE: RLS is intentionally left disabled to match the rest of the app's
-- client-side business data (e.g. the businesses table), which is scoped in
-- queries by businessId rather than enforced in the database. If you later
-- harden the schema, scope policies via the users -> businessId mapping.
