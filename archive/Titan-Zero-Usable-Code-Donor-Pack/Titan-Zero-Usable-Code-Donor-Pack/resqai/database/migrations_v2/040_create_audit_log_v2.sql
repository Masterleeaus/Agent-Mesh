-- ResQAI V2 Migration 040
-- Date:    2026-06-29
-- Purpose: Create audit_log_v2 table
--
-- Applied to: ResQAI V2 Pod
-- Schema: v2

-- ============================================================
-- Step 1: Create audit_log_v2 table
-- ============================================================
-- lemma table create audit_log_v2
--   id --type UUID --pk
--   entity_type --type TEXT --notnull
--   entity_id --type UUID --notnull
--   action --type TEXT --notnull
--   actor_type --type TEXT --nullable
--   actor_id --type TEXT --nullable
--   previous_state --type JSONB --nullable
--   new_state --type JSONB --nullable
--   changed_fields --type "TEXT[]" --nullable
--   ip_address --type TEXT --nullable
--   user_agent --type TEXT --nullable
--   correlation_id --type TEXT --nullable
--   created_at --type TIMESTAMPTZ --nullable --default "NOW()"

-- Verify: lemma table describe audit_log_v2

-- ============================================================
-- Step 2: Add indexes
-- ============================================================
-- lemma table add-index audit_log_v2 entity_type_entity_id --type INDEX --expression "(entity_type, entity_id)"
-- lemma table add-index audit_log_v2 entity_type_created_at_desc --type INDEX --expression "(entity_type, created_at DESC)"
-- lemma table add-index audit_log_v2 actor_type_actor_id --type INDEX --expression "(actor_type, actor_id)"
-- lemma table add-index audit_log_v2 action
-- lemma table add-index audit_log_v2 created_at_desc --type INDEX --expression "created_at DESC"
-- lemma table add-index audit_log_v2 correlation_id

-- Verify: lemma table list-indexes audit_log_v2
