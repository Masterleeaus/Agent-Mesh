-- ResQAI V2 Rollback 002
-- Date:    2026-06-29
-- Purpose: Rollback system_settings_v2 table
-- Reverses: 002_create_system_settings_v2.sql
--
lemma table drop system_settings_v2
-- Verify: lemma table list | grep system_settings_v2  (should return empty)
