-- ResQAI V2 Rollback 017
-- Date:    2026-06-29
-- Purpose: Rollback tickets_v2 table
-- Reverses: 017_create_tickets_v2.sql
--
lemma table drop tickets_v2
-- Verify: lemma table list | grep tickets_v2  (should return empty)
