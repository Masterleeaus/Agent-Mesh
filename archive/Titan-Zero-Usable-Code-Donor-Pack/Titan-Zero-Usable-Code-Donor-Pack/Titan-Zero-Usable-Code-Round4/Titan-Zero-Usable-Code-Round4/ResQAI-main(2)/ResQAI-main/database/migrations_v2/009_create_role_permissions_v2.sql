-- ResQAI V2 Migration 009
-- Date:    2026-06-29
-- Purpose: Create role_permissions_v2 table for RBAC policy definitions
--
-- Applied to: ResQAI V2 Pod
-- Schema: v2

-- ============================================================
-- Step 1: Create role_permissions_v2 table
-- ============================================================
-- lemma table create role_permissions_v2 \
--   id:UUID --pk \
--   role_id:UUID \
--   resource:TEXT --not-null \
--   action:TEXT --not-null \
--   scope:TEXT --default 'own' \
--   created_at:TIMESTAMPTZ

-- ============================================================
-- Step 2: Add foreign key and constraints
-- ============================================================
-- lemma table add-foreign-key role_permissions_v2 fk_rp_role \
--   --from role_id --to user_roles_v2(id) --on-delete CASCADE
-- lemma table add-unique role_permissions_v2 uq_rp_role_res_action \
--   --fields role_id,resource,action

-- ============================================================
-- Step 3: Add indexes
-- ============================================================
-- lemma table add-index role_permissions_v2 idx_rp_role_id --using btree --fields role_id
-- lemma table add-index role_permissions_v2 idx_rp_resource --using btree --fields resource

-- Verify: lemma table describe role_permissions_v2
-- Verify: lemma table indexes role_permissions_v2
-- Expected: idx_rp_role_id, idx_rp_resource
-- Expected: uq_rp_role_res_action (unique on role_id + resource + action)
-- Expected: fk_rp_role (role_id -> user_roles_v2(id) ON DELETE CASCADE)
