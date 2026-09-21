-- ResQAI V2 Rollback 033
-- Date:    2026-06-29
-- Purpose: Rollback inventory_items_v2 table
-- Reverses: 033_create_inventory_items_v2.sql
--
lemma table drop inventory_items_v2
-- Verify: lemma table list | grep inventory_items_v2  (should return empty)
