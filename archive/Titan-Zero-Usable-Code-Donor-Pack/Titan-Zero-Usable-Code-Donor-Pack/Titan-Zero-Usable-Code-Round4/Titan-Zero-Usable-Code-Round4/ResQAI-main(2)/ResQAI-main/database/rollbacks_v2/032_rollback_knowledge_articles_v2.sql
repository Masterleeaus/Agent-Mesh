-- ResQAI V2 Rollback 032
-- Date:    2026-06-29
-- Purpose: Rollback knowledge_articles_v2 table
-- Reverses: 032_create_knowledge_articles_v2.sql
--
lemma table drop knowledge_articles_v2
-- Verify: lemma table list | grep knowledge_articles_v2  (should return empty)
