-- Agent 3 Pass 06: portable estimate revision lineage.
-- Mirrors the existing PostgreSQL estimate-engine revision columns without
-- introducing a parallel quote/version subsystem.
ALTER TABLE estimates
  ADD COLUMN IF NOT EXISTS parent_estimate_id CHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS revision SMALLINT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS engine_version VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS rules_version VARCHAR(100) NULL;

CREATE INDEX idx_estimates_parent_revision
  ON estimates (account_id, parent_estimate_id, revision);
