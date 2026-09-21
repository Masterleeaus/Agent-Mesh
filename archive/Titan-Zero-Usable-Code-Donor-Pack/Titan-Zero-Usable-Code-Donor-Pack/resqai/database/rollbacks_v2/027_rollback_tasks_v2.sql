-- ResQAI V2 Rollback 027
-- Date:    2026-06-29
-- Purpose: Rollback tasks_v2 table
-- Reverses: 027_create_tasks_v2.sql
--
lemma table drop tasks_v2
-- Verify: lemma table list | grep tasks_v2  (should return empty)
