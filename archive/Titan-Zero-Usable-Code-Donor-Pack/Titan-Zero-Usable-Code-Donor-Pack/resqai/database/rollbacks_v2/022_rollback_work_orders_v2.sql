-- ResQAI V2 Rollback 022
-- Date:    2026-06-29
-- Purpose: Rollback work_orders_v2 table
-- Reverses: 022_create_work_orders_v2.sql
--
lemma table drop work_orders_v2
-- Verify: lemma table list | grep work_orders_v2  (should return empty)
