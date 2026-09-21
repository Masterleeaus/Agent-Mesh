-- ResQAI V2 Migration 019
-- Date:    2026-06-29
-- Purpose: Create ticket_attachments_v2 table
--
-- Applied to: ResQAI V2 Pod
-- Schema: v2

-- ============================================================
-- Step 1: Create ticket_attachments_v2 table
-- ============================================================
-- lemma table create ticket_attachments_v2
--   id --type UUID --pk
--   ticket_id --type UUID --nullable               -- FK -> tickets_v2(id) ON DELETE CASCADE
--   file_name --type TEXT --nullable
--   file_type --type TEXT --nullable
--   file_size --type INTEGER --nullable
--   storage_path --type TEXT --nullable
--   uploaded_by --type UUID --nullable               -- FK -> users_v2(id)
--   created_at --type TIMESTAMPTZ --nullable

-- Verify: lemma table describe ticket_attachments_v2

-- ============================================================
-- Step 2: Add indexes
-- ============================================================
-- lemma table add-index ticket_attachments_v2 ticket_id
-- lemma table add-index ticket_attachments_v2 uploaded_by

-- Verify: lemma table list-indexes ticket_attachments_v2
