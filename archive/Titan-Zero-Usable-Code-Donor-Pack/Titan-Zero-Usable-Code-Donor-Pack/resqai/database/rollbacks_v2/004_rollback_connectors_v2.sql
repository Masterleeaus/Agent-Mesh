-- ResQAI V2 Rollback 004
-- Date:    2026-06-29
-- Purpose: Rollback connectors_v2 table
-- Reverses: 004_create_connectors_v2.sql
--
lemma table drop connectors_v2
-- Verify: lemma table list | grep connectors_v2  (should return empty)
