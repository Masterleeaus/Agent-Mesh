-- ResQAI V2 Rollback 034
-- Date:    2026-06-29
-- Purpose: Rollback inventory_transactions_v2 table
-- Reverses: 034_create_inventory_transactions_v2.sql
--
lemma table drop inventory_transactions_v2
-- Verify: lemma table list | grep inventory_transactions_v2  (should return empty)
