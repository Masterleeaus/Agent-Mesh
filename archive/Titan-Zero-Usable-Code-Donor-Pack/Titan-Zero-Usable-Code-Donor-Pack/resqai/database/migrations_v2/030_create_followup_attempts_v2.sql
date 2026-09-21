-- ResQAI V2 Migration 030
-- Date:    2026-06-29
-- Purpose: Create followup_attempts_v2 table
--
-- Applied to: ResQAI V2 Pod
-- Schema: v2

-- ============================================================
-- Step 1: Create followup_attempts_v2 table
-- ============================================================
-- lemma table create followup_attempts_v2
--   id --type UUID --pk
--   followup_id --type UUID --nullable               -- FK -> followups_v2(id) ON DELETE CASCADE
--   attempted_at --type TIMESTAMPTZ --nullable
--   channel --type TEXT --nullable
--   outcome --type TEXT --nullable
--   notes --type TEXT --nullable
--   created_at --type TIMESTAMPTZ --nullable

-- Verify: lemma table describe followup_attempts_v2

-- ============================================================
-- Step 2: Add indexes
-- ============================================================
-- lemma table add-index followup_attempts_v2 followup_id
-- lemma table add-index followup_attempts_v2 attempted_at
-- lemma table add-index followup_attempts_v2 outcome

-- Verify: lemma table list-indexes followup_attempts_v2
