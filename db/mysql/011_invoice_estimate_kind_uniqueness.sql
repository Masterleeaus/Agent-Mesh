-- Agent 3 Pass 08: enforce one live commercial invoice role per estimate.
-- Generated nullable keys allow many standard invoices while making deposit/final
-- idempotency enforceable on MySQL/MariaDB.
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS deposit_estimate_key CHAR(36)
    GENERATED ALWAYS AS (CASE WHEN invoice_kind = 'deposit' THEN estimate_id ELSE NULL END) STORED,
  ADD COLUMN IF NOT EXISTS final_estimate_key CHAR(36)
    GENERATED ALWAYS AS (CASE WHEN invoice_kind = 'final' THEN estimate_id ELSE NULL END) STORED;

CREATE UNIQUE INDEX uq_invoices_one_deposit_per_estimate ON invoices (deposit_estimate_key);
CREATE UNIQUE INDEX uq_invoices_one_final_per_estimate ON invoices (final_estimate_key);
