-- Public bearer-link responses have no authenticated Titan actor. Preserve
-- their audit provenance as actor_id NULL without changing tenant scope or
-- existing actor/history rows.
ALTER TABLE audit_log
  MODIFY COLUMN actor_id CHAR(36) NULL;
