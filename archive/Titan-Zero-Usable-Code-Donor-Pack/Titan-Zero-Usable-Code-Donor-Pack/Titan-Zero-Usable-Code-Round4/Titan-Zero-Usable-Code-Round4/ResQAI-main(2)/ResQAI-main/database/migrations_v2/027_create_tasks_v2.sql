-- ResQAI V2 Migration 027
-- Date:    2026-06-29
-- Purpose: Create tasks_v2 table
--
-- Applied to: ResQAI V2 Pod
-- Schema: v2

-- ============================================================
-- Step 1: Create tasks_v2 table
-- ============================================================
-- lemma table create tasks_v2
--   id --type UUID --pk
--   title --type TEXT --notnull
--   description --type TEXT --nullable
--   status --type TEXT --nullable --default "open"
--   priority --type TEXT --nullable --default "medium"
--   assigned_to --type TEXT --nullable
--   created_by --type TEXT --nullable
--   due_date --type TIMESTAMPTZ --nullable
--   completed_at --type TIMESTAMPTZ --nullable
--   related_entity_type --type TEXT --nullable
--   related_entity_id --type UUID --nullable
--   created_at --type TIMESTAMPTZ --nullable
--   updated_at --type TIMESTAMPTZ --nullable
--   deleted_at --type TIMESTAMPTZ --nullable
--   version --type INTEGER --nullable --default 1

-- Verify: lemma table describe tasks_v2

-- ============================================================
-- Step 2: Add indexes
-- ============================================================
-- lemma table add-index tasks_v2 status
-- lemma table add-index tasks_v2 assigned_to
-- lemma table add-index tasks_v2 priority
-- lemma table add-index tasks_v2 due_date
-- lemma table add-index tasks_v2 related_entity --type INDEX --expression "(related_entity_type, related_entity_id)"
-- lemma table add-index tasks_v2 status_priority_due_date --type INDEX --expression "(status, priority, due_date)"

-- Verify: lemma table list-indexes tasks_v2
