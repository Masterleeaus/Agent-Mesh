-- ResQAI V2 Rollback 013
-- Date:    2026-06-29
-- Purpose: Rollback customer_addresses_v2 table
-- Reverses: 013_create_customer_addresses_v2.sql
--
lemma table drop customer_addresses_v2
-- Verify: lemma table list | grep customer_addresses_v2  (should return empty)
