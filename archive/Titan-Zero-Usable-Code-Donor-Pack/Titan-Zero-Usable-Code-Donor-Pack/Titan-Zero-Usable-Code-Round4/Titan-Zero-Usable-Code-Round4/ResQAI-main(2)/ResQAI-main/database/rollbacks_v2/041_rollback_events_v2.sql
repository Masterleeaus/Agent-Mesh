-- ResQAI V2 Rollback 041
-- Date:    2026-06-29
-- Purpose: Rollback events_v2 table
-- Reverses: 041_create_events_v2.sql
--
lemma table drop events_v2
-- Verify: lemma table list | grep events_v2  (should return empty)
