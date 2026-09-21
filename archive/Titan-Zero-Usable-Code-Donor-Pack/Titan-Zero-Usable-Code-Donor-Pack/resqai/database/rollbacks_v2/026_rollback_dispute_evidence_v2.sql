-- ResQAI V2 Rollback 026
-- Date:    2026-06-29
-- Purpose: Rollback dispute_evidence_v2 table
-- Reverses: 026_create_dispute_evidence_v2.sql
--
lemma table drop dispute_evidence_v2
-- Verify: lemma table list | grep dispute_evidence_v2  (should return empty)
