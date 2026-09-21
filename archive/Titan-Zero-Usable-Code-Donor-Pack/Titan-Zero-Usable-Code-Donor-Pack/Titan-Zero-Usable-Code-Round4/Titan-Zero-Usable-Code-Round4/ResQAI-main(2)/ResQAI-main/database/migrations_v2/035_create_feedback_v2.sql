-- ResQAI V2 Migration 035
-- Date:    2026-06-29
-- Purpose: Create feedback_v2 table
--
-- Applied to: ResQAI V2 Pod
-- Schema: v2

-- ============================================================
-- Step 1: Create feedback_v2 table
-- ============================================================
-- lemma table create feedback_v2
--   id --type UUID --pk
--   ticket_id --type UUID --nullable
--   appointment_id --type UUID --nullable
--   customer_id --type UUID --nullable                -- FK -> customers_v2(id)
--   rating --type INTEGER --nullable                 -- CHECK 1-5
--   comment --type TEXT --nullable
--   source --type TEXT --nullable
--   response_requested --type BOOLEAN --nullable --default false
--   responded_at --type TIMESTAMPTZ --nullable
--   created_at --type TIMESTAMPTZ --nullable
--   deleted_at --type TIMESTAMPTZ --nullable

-- Verify: lemma table describe feedback_v2

-- ============================================================
-- Step 2: Add indexes
-- ============================================================
-- lemma table add-index feedback_v2 ticket_id
-- lemma table add-index feedback_v2 appointment_id
-- lemma table add-index feedback_v2 customer_id
-- lemma table add-index feedback_v2 rating
-- lemma table add-index feedback_v2 customer_created_at_desc --type INDEX --expression "(customer_id, created_at DESC)"

-- Verify: lemma table list-indexes feedback_v2
