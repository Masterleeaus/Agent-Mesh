-- 003_authority_persistence.sql
-- Durable, company-scoped persistence for the existing Titan Authority contracts.
-- These tables store evaluated/verified authority facts; they do not grant authority.

CREATE TABLE IF NOT EXISTS authority_autonomy_snapshots (
  company_id TEXT NOT NULL,
  decision_id TEXT NOT NULL,
  capability TEXT NOT NULL,
  worker_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('verified','suspended','revoked','expired')),
  verified_at TEXT NOT NULL,
  expires_at TEXT,
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (company_id, decision_id)
);
CREATE INDEX IF NOT EXISTS idx_authority_autonomy_resolve
  ON authority_autonomy_snapshots(company_id, capability, worker_id, verified_at DESC);

CREATE TABLE IF NOT EXISTS authority_decisions (
  company_id TEXT NOT NULL,
  authority_decision_id TEXT NOT NULL,
  worker_id TEXT NOT NULL,
  capability TEXT NOT NULL,
  operation_id TEXT,
  action_id TEXT,
  decision TEXT NOT NULL CHECK (decision IN ('ALLOW','APPROVAL_REQUIRED','EVIDENCE_REQUIRED','ESCALATE','DENY','AUTHORITY_UNAVAILABLE','RECOVERY_REQUIRED')),
  evaluated_at TEXT NOT NULL,
  supersedes_authority_decision_id TEXT,
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (company_id, authority_decision_id),
  FOREIGN KEY (company_id, supersedes_authority_decision_id)
    REFERENCES authority_decisions(company_id, authority_decision_id)
);
CREATE INDEX IF NOT EXISTS idx_authority_decision_resolve
  ON authority_decisions(company_id, worker_id, capability, evaluated_at DESC);

CREATE TABLE IF NOT EXISTS authority_approvals (
  company_id TEXT NOT NULL,
  approval_id TEXT NOT NULL,
  approval_scope TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('required','pending','approved','denied','expired','revoked')),
  approver_id TEXT,
  granted_at TEXT,
  expires_at TEXT,
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (company_id, approval_id)
);
CREATE INDEX IF NOT EXISTS idx_authority_approval_scope
  ON authority_approvals(company_id, approval_scope, created_at DESC);

-- Authority history is append-only at the application boundary. SQLite triggers
-- make accidental mutation/deletion fail closed even if a caller bypasses the store.
CREATE TRIGGER IF NOT EXISTS authority_autonomy_snapshots_no_update
BEFORE UPDATE ON authority_autonomy_snapshots BEGIN SELECT RAISE(ABORT,'authority-history-immutable'); END;
CREATE TRIGGER IF NOT EXISTS authority_autonomy_snapshots_no_delete
BEFORE DELETE ON authority_autonomy_snapshots BEGIN SELECT RAISE(ABORT,'authority-history-immutable'); END;
CREATE TRIGGER IF NOT EXISTS authority_decisions_no_update
BEFORE UPDATE ON authority_decisions BEGIN SELECT RAISE(ABORT,'authority-history-immutable'); END;
CREATE TRIGGER IF NOT EXISTS authority_decisions_no_delete
BEFORE DELETE ON authority_decisions BEGIN SELECT RAISE(ABORT,'authority-history-immutable'); END;
CREATE TRIGGER IF NOT EXISTS authority_approvals_no_update
BEFORE UPDATE ON authority_approvals BEGIN SELECT RAISE(ABORT,'authority-history-immutable'); END;
CREATE TRIGGER IF NOT EXISTS authority_approvals_no_delete
BEFORE DELETE ON authority_approvals BEGIN SELECT RAISE(ABORT,'authority-history-immutable'); END;
