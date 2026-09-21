-- ResQAI V2 Migration 002
-- Date:    2026-06-29
-- Purpose: Create system_settings_v2 table for key-value configuration
--
-- Applied to: ResQAI V2 Pod
-- Schema: v2

-- ============================================================
-- Step 1: Create system_settings_v2 table
-- ============================================================
-- lemma table create system_settings_v2 \
--   id:UUID --pk \
--   key:TEXT --not-null --unique \
--   value:TEXT \
--   type:TEXT \
--   description:TEXT \
--   updated_by:TEXT \
--   created_at:TIMESTAMPTZ \
--   updated_at:TIMESTAMPTZ

-- ============================================================
-- Step 2: Add indexes
-- ============================================================
-- lemma table add-index system_settings_v2 idx_syssettings_key --using btree --fields key

-- Verify: lemma table describe system_settings_v2
-- Verify: lemma table indexes system_settings_v2
-- Expected: idx_syssettings_key on (key)
