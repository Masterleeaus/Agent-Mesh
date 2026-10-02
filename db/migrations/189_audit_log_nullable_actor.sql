-- Public bearer-link responses have no authenticated Titan actor. Preserve
-- their audit provenance as actor_id NULL without changing tenant scope or
-- existing actor/history rows.
ALTER TABLE audit_log
  ALTER COLUMN actor_id DROP NOT NULL;
