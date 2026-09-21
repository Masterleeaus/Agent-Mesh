-- ResQAI V2 Migration 028
-- Date:    2026-06-29
-- Purpose: Create task_assignments_v2 table
--
-- Applied to: ResQAI V2 Pod
-- Schema: v2

-- ============================================================
-- Step 1: Create task_assignments_v2 table
-- ============================================================
-- lemma table create task_assignments_v2
--   id --type UUID --pk
--   task_id --type UUID --nullable                  -- FK -> tasks_v2(id) ON DELETE CASCADE
--   assigned_to --type TEXT --nullable
--   assigned_by --type UUID --nullable
--   assigned_at --type TIMESTAMPTZ --nullable
--   status --type TEXT --nullable --default "active"
--   notes --type TEXT --nullable
--   created_at --type TIMESTAMPTZ --nullable

-- Verify: lemma table describe task_assignments_v2

-- ============================================================
-- Step 2: Add indexes
-- ============================================================
-- lemma table add-index task_assignments_v2 task_id
-- lemma table add-index task_assignments_v2 assigned_to
-- lemma table add-index task_assignments_v2 assigned_at

-- Verify: lemma table list-indexes task_assignments_v2
