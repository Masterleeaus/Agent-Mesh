-- ResQAI V2 Rollback 014
-- Date:    2026-06-29
-- Purpose: Rollback technicians_v2 table
-- Reverses: 014_create_technicians_v2.sql
--
lemma table drop technicians_v2
-- Verify: lemma table list | grep technicians_v2  (should return empty)
