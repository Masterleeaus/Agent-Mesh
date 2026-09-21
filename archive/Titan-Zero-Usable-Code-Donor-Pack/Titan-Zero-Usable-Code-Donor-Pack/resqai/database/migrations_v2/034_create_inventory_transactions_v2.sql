-- ResQAI V2 Migration 034
-- Date:    2026-06-29
-- Purpose: Create inventory_transactions_v2 table
--
-- Applied to: ResQAI V2 Pod
-- Schema: v2

-- ============================================================
-- Step 1: Create inventory_transactions_v2 table
-- ============================================================
-- lemma table create inventory_transactions_v2
--   id --type UUID --pk
--   item_id --type UUID --nullable                   -- FK -> inventory_items_v2(id) ON DELETE RESTRICT
--   transaction_type --type TEXT --nullable
--   quantity --type INTEGER --nullable
--   reference_type --type TEXT --nullable
--   reference_id --type UUID --nullable
--   technician_id --type UUID --nullable
--   notes --type TEXT --nullable
--   created_at --type TIMESTAMPTZ --nullable

-- Verify: lemma table describe inventory_transactions_v2

-- ============================================================
-- Step 2: Add indexes
-- ============================================================
-- lemma table add-index inventory_transactions_v2 item_id
-- lemma table add-index inventory_transactions_v2 transaction_type
-- lemma table add-index inventory_transactions_v2 reference --type INDEX --expression "(reference_type, reference_id)"
-- lemma table add-index inventory_transactions_v2 created_at_desc --type INDEX --expression "created_at DESC"

-- Verify: lemma table list-indexes inventory_transactions_v2
