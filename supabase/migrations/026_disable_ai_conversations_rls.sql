-- 026: Disable RLS on Ask MO conversation tables.
--
-- Migration 008 intentionally left RLS off on ai_conversations / ai_conversation_meta
-- to match the rest of the app (businesses, storeProducts, etc.), which scope client
-- data by businessId in queries rather than enforcing it in the database. The tables
-- were later switched to RLS with no policies, which silently blocked every save/load
-- from the client-side Supabase adapter — Ask MO chat history never persisted.
-- Re-disable RLS so history saves and restores work again.

ALTER TABLE public.ai_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversation_meta DISABLE ROW LEVEL SECURITY;
