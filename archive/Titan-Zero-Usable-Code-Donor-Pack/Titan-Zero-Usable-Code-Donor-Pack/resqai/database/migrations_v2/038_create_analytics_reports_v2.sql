-- ResQAI V2 Migration 038
-- Date:    2026-06-29
-- Purpose: Create analytics_reports_v2 table
--
-- Applied to: ResQAI V2 Pod
-- Schema: v2

-- ============================================================
-- Step 1: Create analytics_reports_v2 table
-- ============================================================
-- lemma table create analytics_reports_v2
--   id --type UUID --pk
--   name --type TEXT --notnull
--   description --type TEXT --nullable
--   config --type JSONB --nullable --default '{}'
--   created_by --type UUID --nullable               -- FK -> users_v2(id)
--   is_public --type BOOLEAN --nullable --default false
--   created_at --type TIMESTAMPTZ --nullable
--   updated_at --type TIMESTAMPTZ --nullable

-- Verify: lemma table describe analytics_reports_v2

-- ============================================================
-- Step 2: Add indexes
-- ============================================================
-- lemma table add-index analytics_reports_v2 created_by
-- lemma table add-index analytics_reports_v2 is_public

-- Verify: lemma table list-indexes analytics_reports_v2
