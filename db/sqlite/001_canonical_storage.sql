PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS operational_events (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  aggregate_type TEXT,
  aggregate_id TEXT,
  payload_json TEXT NOT NULL DEFAULT '{}',
  occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_operational_events_company_time ON operational_events(company_id, occurred_at);

CREATE TABLE IF NOT EXISTS decision_records (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  subject_type TEXT NOT NULL,
  subject_id TEXT,
  status TEXT NOT NULL,
  decision_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_decisions_company_status ON decision_records(company_id, status);

CREATE TABLE IF NOT EXISTS authority_records (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  subject_type TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  authority_level TEXT NOT NULL,
  authority_json TEXT NOT NULL DEFAULT '{}',
  granted_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, subject_type, subject_id)
);
CREATE INDEX IF NOT EXISTS idx_authority_company_subject ON authority_records(company_id, subject_type, subject_id);

CREATE TABLE IF NOT EXISTS evidence_records (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL,
  subject_type TEXT,
  subject_id TEXT,
  content_json TEXT NOT NULL,
  provenance_json TEXT NOT NULL DEFAULT '{}',
  content_hash TEXT,
  captured_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_evidence_company_subject ON evidence_records(company_id, subject_type, subject_id);

-- Intelligence/recommendation persistence is deliberately separate from
-- decisions and authority. Inserting here never grants execution authority.
CREATE TABLE IF NOT EXISTS intelligence_records (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  intelligence_type TEXT NOT NULL,
  subject_type TEXT,
  subject_id TEXT,
  result_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_intelligence_company_subject ON intelligence_records(company_id, subject_type, subject_id);
