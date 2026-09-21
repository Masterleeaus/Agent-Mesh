-- ResQAI V2 Rollback 010
-- Date:    2026-06-29
-- Purpose: Rollback notification_templates_v2 table
-- Reverses: 010_create_notification_templates_v2.sql
--
lemma table drop notification_templates_v2
-- Verify: lemma table list | grep notification_templates_v2  (should return empty)
