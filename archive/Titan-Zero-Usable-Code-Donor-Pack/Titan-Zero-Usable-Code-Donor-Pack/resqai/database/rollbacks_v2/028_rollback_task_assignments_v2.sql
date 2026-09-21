-- ResQAI V2 Rollback 028
-- Date:    2026-06-29
-- Purpose: Rollback task_assignments_v2 table
-- Reverses: 028_create_task_assignments_v2.sql
--
lemma table drop task_assignments_v2
-- Verify: lemma table list | grep task_assignments_v2  (should return empty)
