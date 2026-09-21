-- ResQAI V2 Rollback 005
-- Date:    2026-06-29
-- Purpose: Rollback knowledge_categories_v2 table
-- Reverses: 005_create_knowledge_categories_v2.sql
--
lemma table drop knowledge_categories_v2
-- Verify: lemma table list | grep knowledge_categories_v2  (should return empty)
