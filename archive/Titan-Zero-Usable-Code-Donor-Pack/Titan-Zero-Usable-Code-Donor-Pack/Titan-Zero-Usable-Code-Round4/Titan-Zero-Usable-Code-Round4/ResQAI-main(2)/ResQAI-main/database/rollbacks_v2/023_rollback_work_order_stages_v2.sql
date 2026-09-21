-- ResQAI V2 Rollback 023
-- Date:    2026-06-29
-- Purpose: Rollback work_order_stages_v2 table
-- Reverses: 023_create_work_order_stages_v2.sql
--
lemma table drop work_order_stages_v2
-- Verify: lemma table list | grep work_order_stages_v2  (should return empty)
