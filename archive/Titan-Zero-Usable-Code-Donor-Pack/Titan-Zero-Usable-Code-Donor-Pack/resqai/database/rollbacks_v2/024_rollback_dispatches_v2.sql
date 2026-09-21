-- ResQAI V2 Rollback 024
-- Date:    2026-06-29
-- Purpose: Rollback dispatches_v2 table
-- Reverses: 024_create_dispatches_v2.sql
--
lemma table drop dispatches_v2
-- Verify: lemma table list | grep dispatches_v2  (should return empty)
