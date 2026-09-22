-- Issue #724: governed field completion blockers.
-- Bounded permit/inspection and defect verification projections feed the
-- canonical work-order completion gate. They do not own work-order lifecycle.
-- NOTE: the web schema still uses account_id; company_id is stored as the
-- canonical boundary and must be supplied after boundary normalization.

CREATE TABLE IF NOT EXISTS field_completion_blockers (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  work_order_id TEXT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('permit', 'inspection', 'defect')),
  source_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  blocking BOOLEAN NOT NULL DEFAULT TRUE,
  resolved_at TIMESTAMP,
  provenance JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT field_completion_blockers_company_required CHECK (length(trim(company_id)) > 0),
  CONSTRAINT field_completion_blockers_source_required CHECK (length(trim(source_id)) > 0 AND length(trim(reason)) > 0),
  CONSTRAINT field_completion_blockers_unique_reason UNIQUE (company_id, work_order_id, source_type, source_id, reason)
);

CREATE INDEX IF NOT EXISTS idx_field_completion_blockers_open
  ON field_completion_blockers (company_id, work_order_id, blocking, resolved_at);

-- Cross-record boundary validation is enforced by the governed mutation layer
-- inside the same transaction for PostgreSQL and MySQL. Avoid dialect-specific
-- trigger functions here; company_id remains the canonical boundary.
