-- ResQAI V2 Migration 031
-- Date:    2026-06-29
-- Purpose: Create account_health_scans_v2 table
--
-- Applied to: ResQAI V2 Pod
-- Schema: v2

-- ============================================================
-- Step 1: Create account_health_scans_v2 table
-- ============================================================
-- lemma table create account_health_scans_v2
--   id --type UUID --pk
--   account_id --type UUID --nullable                -- FK -> accounts_v2(id) ON DELETE CASCADE
--   scan_date --type TIMESTAMPTZ --nullable --default "NOW()"
--   health_before --type TEXT --nullable
--   health_after --type TEXT --nullable
--   health_score_before --type DOUBLE PRECISION --nullable
--   health_score_after --type DOUBLE PRECISION --nullable
--   risk_factors --type JSONB --nullable --default '[]'
--   triggered_by --type TEXT --nullable
--   notes --type TEXT --nullable
--   created_at --type TIMESTAMPTZ --nullable

-- Verify: lemma table describe account_health_scans_v2

-- ============================================================
-- Step 2: Add indexes
-- ============================================================
-- lemma table add-index account_health_scans_v2 account_id
-- lemma table add-index account_health_scans_v2 scan_date
-- lemma table add-index account_health_scans_v2 health_after

-- Verify: lemma table list-indexes account_health_scans_v2
