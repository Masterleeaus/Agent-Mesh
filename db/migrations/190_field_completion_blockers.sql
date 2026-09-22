-- Issue #724: governed field completion blockers.
-- Bounded permit/inspection and defect verification projections feed the
-- canonical work-order completion gate. They do not own work-order lifecycle.
-- NOTE: the web schema still uses account_id; company_id is stored as the
-- canonical boundary and must be supplied after boundary normalization.

CREATE TABLE IF NOT EXISTS field_completion_blockers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT NOT NULL,
  account_id UUID NOT NULL,
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('permit', 'inspection', 'defect')),
  source_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  blocking BOOLEAN NOT NULL DEFAULT TRUE,
  resolved_at TIMESTAMPTZ,
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT field_completion_blockers_company_required CHECK (length(trim(company_id)) > 0),
  CONSTRAINT field_completion_blockers_source_required CHECK (length(trim(source_id)) > 0 AND length(trim(reason)) > 0),
  CONSTRAINT field_completion_blockers_unique_reason UNIQUE (company_id, work_order_id, source_type, source_id, reason)
);

CREATE INDEX IF NOT EXISTS idx_field_completion_blockers_open
  ON field_completion_blockers (company_id, work_order_id)
  WHERE blocking = TRUE AND resolved_at IS NULL;

CREATE OR REPLACE FUNCTION validate_field_completion_blocker_work_order()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  wo_account_id UUID;
BEGIN
  SELECT account_id INTO wo_account_id FROM work_orders WHERE id = NEW.work_order_id;
  IF wo_account_id IS NULL THEN
    RAISE EXCEPTION 'work_order % not found', NEW.work_order_id USING ERRCODE = 'P0001';
  END IF;
  IF NEW.account_id IS DISTINCT FROM wo_account_id THEN
    RAISE EXCEPTION 'completion blocker account boundary must match work order' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_field_completion_blocker_work_order ON field_completion_blockers;
CREATE TRIGGER trg_field_completion_blocker_work_order
  BEFORE INSERT OR UPDATE OF account_id, work_order_id ON field_completion_blockers
  FOR EACH ROW EXECUTE FUNCTION validate_field_completion_blocker_work_order();
