-- ResQAI V2 Rollback 025
-- Date:    2026-06-29
-- Purpose: Rollback disputes_v2 table
-- Reverses: 025_create_disputes_v2.sql
--
lemma table drop disputes_v2
-- Verify: lemma table list | grep disputes_v2  (should return empty)
