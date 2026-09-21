-- ResQAI V2 Migration 023
-- Date:    2026-06-29
-- Purpose: Create work_order_stages_v2 table
--
-- Applied to: ResQAI V2 Pod
-- Schema: v2

-- ============================================================
-- Step 1: Create work_order_stages_v2 table
-- ============================================================
-- lemma table create work_order_stages_v2
--   id --type UUID --pk
--   work_order_id --type UUID --nullable             -- FK -> work_orders_v2(id) ON DELETE CASCADE
--   stage_name --type TEXT --nullable
--   entered_at --type TIMESTAMPTZ --nullable
--   exited_at --type TIMESTAMPTZ --nullable
--   duration_seconds --type INTEGER --nullable
--   geo_location --type JSONB --nullable
--   notes --type TEXT --nullable
--   created_at --type TIMESTAMPTZ --nullable

-- Verify: lemma table describe work_order_stages_v2

-- ============================================================
-- Step 2: Add indexes
-- ============================================================
-- lemma table add-index work_order_stages_v2 work_order_id
-- lemma table add-index work_order_stages_v2 stage_name

-- Verify: lemma table list-indexes work_order_stages_v2
