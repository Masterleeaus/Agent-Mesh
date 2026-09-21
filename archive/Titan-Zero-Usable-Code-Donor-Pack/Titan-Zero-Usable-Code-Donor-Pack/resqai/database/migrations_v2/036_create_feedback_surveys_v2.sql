-- ResQAI V2 Migration 036
-- Date:    2026-06-29
-- Purpose: Create feedback_surveys_v2 table
--
-- Applied to: ResQAI V2 Pod
-- Schema: v2

-- ============================================================
-- Step 1: Create feedback_surveys_v2 table
-- ============================================================
-- lemma table create feedback_surveys_v2
--   id --type UUID --pk
--   feedback_id --type UUID --nullable               -- FK -> feedback_v2(id) ON DELETE CASCADE
--   question --type TEXT --nullable
--   response --type TEXT --nullable
--   response_value --type INTEGER --nullable
--   created_at --type TIMESTAMPTZ --nullable

-- Verify: lemma table describe feedback_surveys_v2

-- ============================================================
-- Step 2: Add indexes
-- ============================================================
-- lemma table add-index feedback_surveys_v2 feedback_id

-- Verify: lemma table list-indexes feedback_surveys_v2
