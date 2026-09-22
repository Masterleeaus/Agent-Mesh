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
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  idempotency_key TEXT,
  CHECK (length(trim(company_id)) > 0),
  CHECK (length(trim(idempotency_key)) > 0)
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

CREATE UNIQUE INDEX IF NOT EXISTS uq_field_permits_idempotency ON field_permits(company_id,idempotency_key);
CREATE UNIQUE INDEX IF NOT EXISTS uq_field_permit_inspections_idempotency ON field_permit_inspections(company_id,idempotency_key);
CREATE UNIQUE INDEX IF NOT EXISTS uq_field_defects_idempotency ON field_defects(company_id,idempotency_key);


-- Fail closed if compatibility account boundaries or canonical company/work-order
-- boundaries do not agree across the persisted field records.
CREATE OR REPLACE FUNCTION validate_field_permit_work_order()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE wo_account_id UUID;
BEGIN
  SELECT account_id INTO wo_account_id FROM work_orders WHERE id=NEW.work_order_id;
  IF wo_account_id IS NULL OR NEW.account_id IS DISTINCT FROM wo_account_id THEN
    RAISE EXCEPTION 'field permit boundary must match work order' USING ERRCODE='P0001';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_field_permit_work_order ON field_permits;
CREATE TRIGGER trg_field_permit_work_order BEFORE INSERT OR UPDATE OF account_id,work_order_id
ON field_permits FOR EACH ROW EXECUTE FUNCTION validate_field_permit_work_order();

CREATE OR REPLACE FUNCTION validate_field_inspection_permit()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE p_company_id TEXT; p_account_id UUID; p_work_order_id UUID;
BEGIN
  SELECT company_id,account_id,work_order_id INTO p_company_id,p_account_id,p_work_order_id FROM field_permits WHERE id=NEW.permit_id;
  IF p_company_id IS NULL OR NEW.company_id IS DISTINCT FROM p_company_id OR NEW.account_id IS DISTINCT FROM p_account_id OR NEW.work_order_id IS DISTINCT FROM p_work_order_id THEN
    RAISE EXCEPTION 'field inspection boundary must match permit' USING ERRCODE='P0001';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_field_inspection_permit ON field_permit_inspections;
CREATE TRIGGER trg_field_inspection_permit BEFORE INSERT OR UPDATE OF company_id,account_id,permit_id,work_order_id
ON field_permit_inspections FOR EACH ROW EXECUTE FUNCTION validate_field_inspection_permit();

CREATE OR REPLACE FUNCTION validate_field_defect_work_order()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE wo_account_id UUID;
BEGIN
  SELECT account_id INTO wo_account_id FROM work_orders WHERE id=NEW.work_order_id;
  IF wo_account_id IS NULL OR NEW.account_id IS DISTINCT FROM wo_account_id THEN
    RAISE EXCEPTION 'field defect boundary must match work order' USING ERRCODE='P0001';
  END IF;
  IF NEW.state='verified' AND (NULLIF(trim(COALESCE(NEW.verified_by_ref,'')),'') IS NULL OR NEW.verified_date IS NULL) THEN
    RAISE EXCEPTION 'verified defect requires verifier and date' USING ERRCODE='P0001';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_field_defect_work_order ON field_defects;
CREATE TRIGGER trg_field_defect_work_order BEFORE INSERT OR UPDATE OF account_id,work_order_id,state,verified_by_ref,verified_date
ON field_defects FOR EACH ROW EXECUTE FUNCTION validate_field_defect_work_order();
