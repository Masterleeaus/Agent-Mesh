-- ResQAI V2 Rollback 031
-- Date:    2026-06-29
-- Purpose: Rollback account_health_scans_v2 table
-- Reverses: 031_create_account_health_scans_v2.sql
--
lemma table drop account_health_scans_v2
-- Verify: lemma table list | grep account_health_scans_v2  (should return empty)
