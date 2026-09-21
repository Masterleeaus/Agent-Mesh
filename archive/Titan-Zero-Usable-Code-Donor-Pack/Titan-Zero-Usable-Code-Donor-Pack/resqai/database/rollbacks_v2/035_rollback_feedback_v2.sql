-- ResQAI V2 Rollback 035
-- Date:    2026-06-29
-- Purpose: Rollback feedback_v2 table
-- Reverses: 035_create_feedback_v2.sql
--
lemma table drop feedback_v2
-- Verify: lemma table list | grep feedback_v2  (should return empty)
