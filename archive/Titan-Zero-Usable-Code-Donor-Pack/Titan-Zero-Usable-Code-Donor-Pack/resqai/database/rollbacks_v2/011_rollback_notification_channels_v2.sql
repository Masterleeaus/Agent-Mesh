-- ResQAI V2 Rollback 011
-- Date:    2026-06-29
-- Purpose: Rollback notification_channels_v2 table
-- Reverses: 011_create_notification_channels_v2.sql
--
lemma table drop notification_channels_v2
-- Verify: lemma table list | grep notification_channels_v2  (should return empty)
