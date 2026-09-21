-- ResQAI V2 Migration 039
-- Date:    2026-06-29
-- Purpose: Create analytics_schedules_v2 table
--
-- Applied to: ResQAI V2 Pod
-- Schema: v2

-- ============================================================
-- Step 1: Create analytics_schedules_v2 table
-- ============================================================
-- lemma table create analytics_schedules_v2
--   id --type UUID --pk
--   report_id --type UUID --nullable                 -- FK -> analytics_reports_v2(id) ON DELETE CASCADE
--   frequency --type TEXT --nullable
--   recipients --type "TEXT[]" --nullable
--   format --type TEXT --nullable --default "pdf"
--   is_active --type BOOLEAN --nullable --default true
--   last_sent_at --type TIMESTAMPTZ --nullable
--   next_scheduled_at --type TIMESTAMPTZ --nullable
--   created_at --type TIMESTAMPTZ --nullable
--   updated_at --type TIMESTAMPTZ --nullable

-- Verify: lemma table describe analytics_schedules_v2

-- ============================================================
-- Step 2: Add indexes
-- ============================================================
-- lemma table add-index analytics_schedules_v2 report_id
-- lemma table add-index analytics_schedules_v2 active_schedule --type INDEX --expression "(is_active, next_scheduled_at)"

-- Verify: lemma table list-indexes analytics_schedules_v2
