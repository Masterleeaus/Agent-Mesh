-- Issue #724: bounded canonical state for field permits, inspections and defects.
-- These tables are Field-owned records. Work-order lifecycle remains canonical
-- in work_orders; blocker rows are derived projections only.

CREATE TABLE IF NOT EXISTS field_permits (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  account_id UUID NOT NULL,
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  permit_type TEXT NOT NULL CHECK(permit_type IN ('building','electrical','plumbing','mechanical','fire','excavation','environmental','occupancy','other')),
  state TEXT NOT NULL CHECK(state IN ('not_applied','application_submitted','approved','active','inspection_required','inspection_passed','inspection_failed','expired','revoked')),
  expiry_date DATE,
  provenance JSON NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  idempotency_key TEXT,
  CHECK (length(trim(company_id)) > 0),
  CHECK (idempotency_key IS NULL OR length(trim(idempotency_key)) > 0)
);
CREATE INDEX IF NOT EXISTS idx_field_permits_work_order ON field_permits(company_id,work_order_id);

CREATE TABLE IF NOT EXISTS field_permit_inspections (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  account_id UUID NOT NULL,
  permit_id TEXT NOT NULL REFERENCES field_permits(id) ON DELETE CASCADE,
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  inspection_date DATE NOT NULL,
  result TEXT NOT NULL CHECK(result IN ('scheduled','passed','failed','cancelled')),
  provenance JSON NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  idempotency_key TEXT,
  CHECK (length(trim(company_id)) > 0),
  CHECK (idempotency_key IS NULL OR length(trim(idempotency_key)) > 0)
);

CREATE TABLE IF NOT EXISTS field_defects (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  account_id UUID NOT NULL,
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  punch_list_id TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('minor','moderate','major','critical')),
  state TEXT NOT NULL CHECK(state IN ('open','assigned','in_progress','completed','verified','rejected','deferred')),
  verified_by_ref TEXT,
  verified_date DATE,
  defer_reason TEXT,
  provenance JSON NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  idempotency_key TEXT,
  CHECK (length(trim(company_id)) > 0),
  CHECK (idempotency_key IS NULL OR length(trim(idempotency_key)) > 0)
);
CREATE INDEX IF NOT EXISTS idx_field_defects_work_order ON field_defects(company_id,work_order_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_field_permits_idempotency ON field_permits(company_id,idempotency_key);
CREATE UNIQUE INDEX IF NOT EXISTS uq_field_permit_inspections_idempotency ON field_permit_inspections(company_id,idempotency_key);
CREATE UNIQUE INDEX IF NOT EXISTS uq_field_defects_idempotency ON field_defects(company_id,idempotency_key);

-- Cross-record work-order, permit and verifier boundary checks are enforced by
-- the governed field mutation layer inside the same portable transaction.
-- Keep this migration declarative so the schema can be applied by both the
-- PostgreSQL and MySQL runtime paths without PL/pgSQL trigger dependencies.
-- company_id remains the only canonical tenant boundary; account_id is a
-- compatibility storage field until the web schema migration is completed.
