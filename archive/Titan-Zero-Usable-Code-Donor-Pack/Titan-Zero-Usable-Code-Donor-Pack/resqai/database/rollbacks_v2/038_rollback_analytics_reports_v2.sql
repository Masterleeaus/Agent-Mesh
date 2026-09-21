-- ResQAI V2 Rollback 038
-- Date:    2026-06-29
-- Purpose: Rollback analytics_reports_v2 table
-- Reverses: 038_create_analytics_reports_v2.sql
--
lemma table drop analytics_reports_v2
-- Verify: lemma table list | grep analytics_reports_v2  (should return empty)
