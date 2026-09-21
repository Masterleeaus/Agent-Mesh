-- ResQAI V2 Migration 018
-- Date:    2026-06-29
-- Purpose: Create ticket_messages_v2 table
--
-- Applied to: ResQAI V2 Pod
-- Schema: v2

-- ============================================================
-- Step 1: Create ticket_messages_v2 table
-- ============================================================
-- lemma table create ticket_messages_v2
--   id --type UUID --pk
--   ticket_id --type UUID --nullable               -- FK -> tickets_v2(id) ON DELETE CASCADE
--   author_type --type TEXT --nullable
--   author_id --type UUID --nullable
--   message_text --type TEXT --nullable
--   is_internal --type BOOLEAN --nullable --default false
--   created_at --type TIMESTAMPTZ --nullable

-- Verify: lemma table describe ticket_messages_v2

-- ============================================================
-- Step 2: Add indexes
-- ============================================================
-- lemma table add-index ticket_messages_v2 ticket_id_created_at --type INDEX --expression "(ticket_id, created_at ASC)"
-- lemma table add-index ticket_messages_v2 author_type_author_id --type INDEX --expression "(author_type, author_id)"

-- Verify: lemma table list-indexes ticket_messages_v2
