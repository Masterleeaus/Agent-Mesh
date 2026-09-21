-- ResQAI V2 Rollback 029
-- Date:    2026-06-29
-- Purpose: Rollback followups_v2 table
-- Reverses: 029_create_followups_v2.sql
--
lemma table drop followups_v2
-- Verify: lemma table list | grep followups_v2  (should return empty)
