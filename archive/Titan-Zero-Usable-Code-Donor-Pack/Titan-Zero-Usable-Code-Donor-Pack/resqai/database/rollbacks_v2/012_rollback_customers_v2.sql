-- ResQAI V2 Rollback 012
-- Date:    2026-06-29
-- Purpose: Rollback customers_v2 table
-- Reverses: 012_create_customers_v2.sql
--
lemma table drop customers_v2
-- Verify: lemma table list | grep customers_v2  (should return empty)
