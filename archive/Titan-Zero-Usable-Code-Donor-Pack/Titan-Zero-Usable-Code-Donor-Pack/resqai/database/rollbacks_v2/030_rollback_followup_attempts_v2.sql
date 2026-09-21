-- ResQAI V2 Rollback 030
-- Date:    2026-06-29
-- Purpose: Rollback followup_attempts_v2 table
-- Reverses: 030_create_followup_attempts_v2.sql
--
lemma table drop followup_attempts_v2
-- Verify: lemma table list | grep followup_attempts_v2  (should return empty)
