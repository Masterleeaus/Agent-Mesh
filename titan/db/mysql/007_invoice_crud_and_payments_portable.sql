-- Pass 9: MySQL/MariaDB parity for general invoice editing + payments.
-- Reuses the existing AI-FSM invoice/payment model while moving payment-state
-- synchronization into application code so MySQL does not depend on PG triggers.

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS deposit_paid_at DATETIME(3) NULL,
  ADD COLUMN IF NOT EXISTS deposit_type ENUM('none','percentage','fixed') NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS deposit_percentage DECIMAL(5,2) NULL,
  ADD COLUMN IF NOT EXISTS deposit_fixed_cents INT NULL,
  ADD COLUMN IF NOT EXISTS square_order_id VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS square_checkout_id VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS square_payment_link_url TEXT NULL;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS job_id CHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS customer_id CHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS status ENUM('pending','paid','failed','refunded','cancelled') NOT NULL DEFAULT 'paid',
  ADD COLUMN IF NOT EXISTS payment_type ENUM('deposit','progress','final','refund','adjustment') NOT NULL DEFAULT 'progress',
  ADD COLUMN IF NOT EXISTS external_provider VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS external_payment_id VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS external_checkout_url TEXT NULL,
  ADD COLUMN IF NOT EXISTS paid_at DATETIME(3) NULL;

CREATE INDEX IF NOT EXISTS idx_payments_job ON payments (job_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments (customer_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_external_id
  ON payments (external_provider, external_payment_id);

-- Backfill provider-era columns for legacy rows.
UPDATE payments p
JOIN invoices i ON i.id = p.invoice_id
SET p.paid_at = COALESCE(p.paid_at, p.received_at),
    p.customer_id = COALESCE(p.customer_id, i.client_id),
    p.job_id = COALESCE(p.job_id, i.job_id)
WHERE p.paid_at IS NULL
   OR p.customer_id IS NULL
   OR (p.job_id IS NULL AND i.job_id IS NOT NULL);

-- Keep balances coherent after adding the richer payment model.
UPDATE invoices
SET balance_cents = GREATEST(total_cents - paid_cents - deposit_cents, 0);
