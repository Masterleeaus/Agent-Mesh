-- 004_worker_access.sql
-- Company-scoped worker access facts. These grants are inputs to Authority;
-- they never constitute execution authority by themselves.
CREATE TABLE IF NOT EXISTS worker_access_assignments (
  company_id TEXT NOT NULL,
  assignment_id TEXT NOT NULL,
  worker_id TEXT NOT NULL,
  permissions TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(permissions)),
  entitlements TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(entitlements)),
  status TEXT NOT NULL CHECK (status IN ('active','suspended','revoked','expired')),
  granted_by TEXT,
  granted_at TEXT NOT NULL,
  expires_at TEXT,
  supersedes_assignment_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(company_id, assignment_id),
  FOREIGN KEY(company_id, supersedes_assignment_id)
    REFERENCES worker_access_assignments(company_id, assignment_id)
);
CREATE INDEX IF NOT EXISTS idx_worker_access_resolve
  ON worker_access_assignments(company_id, worker_id, granted_at DESC);
CREATE TRIGGER IF NOT EXISTS worker_access_assignments_no_update
BEFORE UPDATE ON worker_access_assignments BEGIN SELECT RAISE(ABORT,'worker-access-history-immutable'); END;
CREATE TRIGGER IF NOT EXISTS worker_access_assignments_no_delete
BEFORE DELETE ON worker_access_assignments BEGIN SELECT RAISE(ABORT,'worker-access-history-immutable'); END;
