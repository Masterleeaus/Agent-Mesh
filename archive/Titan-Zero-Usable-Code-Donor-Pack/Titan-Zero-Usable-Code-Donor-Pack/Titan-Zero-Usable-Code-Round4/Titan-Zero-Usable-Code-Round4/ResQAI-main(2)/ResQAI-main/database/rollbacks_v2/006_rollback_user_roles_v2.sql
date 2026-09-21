-- ResQAI V2 Rollback 006
-- Date:    2026-06-29
-- Purpose: Rollback user_roles_v2 table
-- Reverses: 006_create_user_roles_v2.sql
--
lemma table drop user_roles_v2
-- Verify: lemma table list | grep user_roles_v2  (should return empty)
