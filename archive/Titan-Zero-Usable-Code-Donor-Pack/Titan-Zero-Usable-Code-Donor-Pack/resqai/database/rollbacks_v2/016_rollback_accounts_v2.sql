-- ResQAI V2 Rollback 016
-- Date:    2026-06-29
-- Purpose: Rollback accounts_v2 table
-- Reverses: 016_create_accounts_v2.sql
--
lemma table drop accounts_v2
-- Verify: lemma table list | grep accounts_v2  (should return empty)
