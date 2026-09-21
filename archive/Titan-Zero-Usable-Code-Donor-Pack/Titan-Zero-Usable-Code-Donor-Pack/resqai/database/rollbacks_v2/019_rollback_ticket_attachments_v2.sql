-- ResQAI V2 Rollback 019
-- Date:    2026-06-29
-- Purpose: Rollback ticket_attachments_v2 table
-- Reverses: 019_create_ticket_attachments_v2.sql
--
lemma table drop ticket_attachments_v2
-- Verify: lemma table list | grep ticket_attachments_v2  (should return empty)
