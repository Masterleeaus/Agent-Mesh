-- ResQAI V2 Migration 003
-- Date:    2026-06-29
-- Purpose: Create feature_flags_v2 table for application feature toggles
--
-- Applied to: ResQAI V2 Pod
-- Schema: v2

-- ============================================================
-- Step 1: Create feature_flags_v2 table
-- ============================================================
-- lemma table create feature_flags_v2 \
--   id:UUID --pk \
--   app:TEXT \
--   feature_name:TEXT \
--   enabled:BOOLEAN --default false \
--   rollout_percentage:INTEGER --default 0 \
--   created_by:TEXT \
--   updated_at:TIMESTAMPTZ \
--   created_at:TIMESTAMPTZ

-- ============================================================
-- Step 2: Add constraints and indexes
-- ============================================================
-- lemma table add-unique feature_flags_v2 uq_ff_app_feature --fields app,feature_name
-- lemma table add-index feature_flags_v2 idx_ff_enabled --using btree --fields enabled --where 'enabled = true'

-- Verify: lemma table describe feature_flags_v2
-- Verify: lemma table indexes feature_flags_v2
-- Expected: uq_ff_app_feature (unique on app + feature_name)
-- Expected: idx_ff_enabled (partial index WHERE enabled = true)
