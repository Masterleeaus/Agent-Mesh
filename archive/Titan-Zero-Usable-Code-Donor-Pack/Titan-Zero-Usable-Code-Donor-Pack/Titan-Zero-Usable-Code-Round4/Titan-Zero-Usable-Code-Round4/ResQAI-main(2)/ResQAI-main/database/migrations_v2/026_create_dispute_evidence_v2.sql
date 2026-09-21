-- ResQAI V2 Migration 026
-- Date:    2026-06-29
-- Purpose: Create dispute_evidence_v2 table
--
-- Applied to: ResQAI V2 Pod
-- Schema: v2

-- ============================================================
-- Step 1: Create dispute_evidence_v2 table
-- ============================================================
-- lemma table create dispute_evidence_v2
--   id --type UUID --pk
--   dispute_id --type UUID --nullable                -- FK -> disputes_v2(id) ON DELETE CASCADE
--   evidence_type --type TEXT --nullable
--   description --type TEXT --nullable
--   file_path --type TEXT --nullable
--   uploaded_by --type TEXT --nullable
--   created_at --type TIMESTAMPTZ --nullable

-- Verify: lemma table describe dispute_evidence_v2

-- ============================================================
-- Step 2: Add indexes
-- ============================================================
-- lemma table add-index dispute_evidence_v2 dispute_id
-- lemma table add-index dispute_evidence_v2 evidence_type

-- Verify: lemma table list-indexes dispute_evidence_v2
