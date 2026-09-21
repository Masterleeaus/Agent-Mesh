-- ResQAI V2 Rollback 040
-- Date:    2026-06-29
-- Purpose: Rollback audit_log_v2 table
-- Reverses: 040_create_audit_log_v2.sql
--
lemma table drop audit_log_v2
-- Verify: lemma table list | grep audit_log_v2  (should return empty)
