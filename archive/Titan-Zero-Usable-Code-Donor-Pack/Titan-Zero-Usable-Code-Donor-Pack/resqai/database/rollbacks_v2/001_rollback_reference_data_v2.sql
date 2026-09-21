-- ResQAI V2 Rollback 001
-- Date:    2026-06-29
-- Purpose: Rollback reference_data_v2 table
-- Reverses: 001_create_reference_data_v2.sql
--
lemma table drop reference_data_v2
-- Verify: lemma table list | grep reference_data_v2  (should return empty)
