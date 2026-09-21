-- ResQAI V2 Migration 041
-- Date:    2026-06-29
-- Purpose: Create events_v2 table
--
-- Applied to: ResQAI V2 Pod
-- Schema: v2

-- ============================================================
-- Step 1: Create events_v2 table
-- ============================================================
-- lemma table create events_v2
--   id --type UUID --pk
--   event_name --type TEXT --notnull
--   producer_app --type TEXT --nullable
--   producer_entity_type --type TEXT --nullable
--   producer_entity_id --type UUID --nullable
--   payload --type JSONB --nullable
--   correlation_id --type TEXT --nullable
--   status --type TEXT --nullable --default "processed"
--   created_at --type TIMESTAMPTZ --nullable

-- Verify: lemma table describe events_v2

-- ============================================================
-- Step 2: Add indexes
-- ============================================================
-- lemma table add-index events_v2 event_name
-- lemma table add-index events_v2 producer --type INDEX --expression "(producer_entity_type, producer_entity_id)"
-- lemma table add-index events_v2 correlation_id
-- lemma table add-index events_v2 created_at_desc --type INDEX --expression "created_at DESC"

-- Verify: lemma table list-indexes events_v2
