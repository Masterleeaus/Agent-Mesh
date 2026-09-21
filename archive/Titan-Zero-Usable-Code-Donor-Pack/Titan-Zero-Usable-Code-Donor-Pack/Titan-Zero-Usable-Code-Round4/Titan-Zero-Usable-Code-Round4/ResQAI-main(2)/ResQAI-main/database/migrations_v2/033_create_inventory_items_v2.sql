-- ResQAI V2 Migration 033
-- Date:    2026-06-29
-- Purpose: Create inventory_items_v2 table
--
-- Applied to: ResQAI V2 Pod
-- Schema: v2

-- ============================================================
-- Step 1: Create inventory_items_v2 table
-- ============================================================
-- lemma table create inventory_items_v2
--   id --type UUID --pk
--   name --type TEXT --notnull
--   sku --type TEXT --notnull --unique
--   description --type TEXT --nullable
--   category --type TEXT --nullable
--   unit_price_cents --type INTEGER --nullable --default 0
--   quantity_on_hand --type INTEGER --nullable --default 0
--   reorder_threshold --type INTEGER --nullable --default 10
--   reorder_quantity --type INTEGER --nullable --default 50
--   supplier_info --type TEXT --nullable
--   created_by --type UUID --nullable                -- FK -> users_v2(id)
--   updated_by --type UUID --nullable                -- FK -> users_v2(id)
--   created_at --type TIMESTAMPTZ --nullable
--   updated_at --type TIMESTAMPTZ --nullable
--   deleted_at --type TIMESTAMPTZ --nullable
--   version --type INTEGER --nullable --default 1

-- Verify: lemma table describe inventory_items_v2

-- ============================================================
-- Step 2: Add indexes
-- ============================================================
-- lemma table add-index inventory_items_v2 sku
-- lemma table add-index inventory_items_v2 category
-- lemma table add-index inventory_items_v2 low_stock --type INDEX --expression "quantity_on_hand <= reorder_threshold"

-- Verify: lemma table list-indexes inventory_items_v2
