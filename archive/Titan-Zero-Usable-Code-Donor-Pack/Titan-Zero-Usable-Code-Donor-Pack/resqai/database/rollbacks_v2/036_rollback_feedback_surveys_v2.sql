-- ResQAI V2 Rollback 036
-- Date:    2026-06-29
-- Purpose: Rollback feedback_surveys_v2 table
-- Reverses: 036_create_feedback_surveys_v2.sql
--
lemma table drop feedback_surveys_v2
-- Verify: lemma table list | grep feedback_surveys_v2  (should return empty)
