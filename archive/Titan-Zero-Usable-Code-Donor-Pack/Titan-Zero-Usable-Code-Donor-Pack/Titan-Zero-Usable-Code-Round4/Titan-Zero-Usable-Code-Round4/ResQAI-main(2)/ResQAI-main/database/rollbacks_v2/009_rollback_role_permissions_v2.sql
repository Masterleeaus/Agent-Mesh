-- ResQAI V2 Rollback 009
-- Date:    2026-06-29
-- Purpose: Rollback role_permissions_v2 table
-- Reverses: 009_create_role_permissions_v2.sql
--
lemma table drop role_permissions_v2
-- Verify: lemma table list | grep role_permissions_v2  (should return empty)
