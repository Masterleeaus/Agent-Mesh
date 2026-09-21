-- ResQAI V2 Rollback 021
-- Date:    2026-06-29
-- Purpose: Rollback appointment_reminders_v2 table
-- Reverses: 021_create_appointment_reminders_v2.sql
--
lemma table drop appointment_reminders_v2
-- Verify: lemma table list | grep appointment_reminders_v2  (should return empty)
