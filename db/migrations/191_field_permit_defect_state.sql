-- Issue #724: bounded canonical state for field permits, inspections and defects.
-- These tables are Field-owned records. Work-order lifecycle remains canonical
-- in work_orders; blocker rows are derived projections only.

CREATE TABLE IF NOT EXISTS field_permits (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  account_id UUID NOT NULL,
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  permit_type TEXT NOT NULL,
  state TEXT NOT NULL,
  expiry_date DATE,
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (length(trim(company_id)) > 0)
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
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (length(trim(company_id)) > 0)
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
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (length(trim(company_id)) > 0)
);
CREATE INDEX IF NOT EXISTS idx_field_defects_work_order ON field_defects(company_id,work_order_id);
