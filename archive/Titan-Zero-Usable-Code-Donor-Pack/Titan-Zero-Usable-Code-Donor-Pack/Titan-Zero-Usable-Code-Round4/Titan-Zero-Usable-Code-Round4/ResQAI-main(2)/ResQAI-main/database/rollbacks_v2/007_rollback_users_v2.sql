-- ResQAI V2 Rollback 007
-- Date:    2026-06-29
-- Purpose: Rollback users_v2 table
-- Reverses: 007_create_users_v2.sql
--
lemma table drop users_v2
-- Verify: lemma table list | grep users_v2  (should return empty)
