-- ResQAI V2 Rollback 020
-- Date:    2026-06-29
-- Purpose: Rollback appointments_v2 table
-- Reverses: 020_create_appointments_v2.sql
--
lemma table drop appointments_v2
-- Verify: lemma table list | grep appointments_v2  (should return empty)
