-- ResQAI V2 Rollback 018
-- Date:    2026-06-29
-- Purpose: Rollback ticket_messages_v2 table
-- Reverses: 018_create_ticket_messages_v2.sql
--
lemma table drop ticket_messages_v2
-- Verify: lemma table list | grep ticket_messages_v2  (should return empty)
