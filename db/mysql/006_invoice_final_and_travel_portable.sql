-- Pass 8: MySQL/MariaDB parity for final invoices and travel itemization.

ALTER TABLE invoices
  MODIFY COLUMN status ENUM('draft','sent','partial','paid','overdue','void','cancelled') NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS invoice_kind ENUM('standard','deposit','final') NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS deposit_cents INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_cents INT NOT NULL DEFAULT 0;

ALTER TABLE invoice_line_items
  ADD COLUMN IF NOT EXISTS line_item_type VARCHAR(32) NULL,
  ADD COLUMN IF NOT EXISTS visible_to_customer BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_invoices_job_kind ON invoices (job_id, invoice_kind);
CREATE INDEX IF NOT EXISTS idx_invoices_estimate_kind ON invoices (estimate_id, invoice_kind);
