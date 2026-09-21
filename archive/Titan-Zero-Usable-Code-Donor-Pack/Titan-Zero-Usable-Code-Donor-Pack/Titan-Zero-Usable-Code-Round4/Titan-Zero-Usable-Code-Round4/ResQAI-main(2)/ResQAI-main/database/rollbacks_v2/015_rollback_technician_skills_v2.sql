-- ResQAI V2 Rollback 015
-- Date:    2026-06-29
-- Purpose: Rollback technician_skills_v2 table
-- Reverses: 015_create_technician_skills_v2.sql
--
lemma table drop technician_skills_v2
-- Verify: lemma table list | grep technician_skills_v2  (should return empty)
