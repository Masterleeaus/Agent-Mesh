-- ResQAI V2 Rollback 008
-- Date:    2026-06-29
-- Purpose: Rollback user_sessions_v2 table
-- Reverses: 008_create_user_sessions_v2.sql
--
lemma table drop user_sessions_v2
-- Verify: lemma table list | grep user_sessions_v2  (should return empty)
