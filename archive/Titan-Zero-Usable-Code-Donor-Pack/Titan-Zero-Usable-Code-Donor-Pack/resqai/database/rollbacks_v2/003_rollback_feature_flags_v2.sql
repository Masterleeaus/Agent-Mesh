-- ResQAI V2 Rollback 003
-- Date:    2026-06-29
-- Purpose: Rollback feature_flags_v2 table
-- Reverses: 003_create_feature_flags_v2.sql
--
lemma table drop feature_flags_v2
-- Verify: lemma table list | grep feature_flags_v2  (should return empty)
