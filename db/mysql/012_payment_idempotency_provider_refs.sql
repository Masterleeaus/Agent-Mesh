-- Agent 3 Pass 14: payment idempotency and provider reference hardening.
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128) NULL,
  ADD COLUMN IF NOT EXISTS external_order_id VARCHAR(128) NULL;

CREATE UNIQUE INDEX uq_payments_account_idempotency
  ON payments (account_id, idempotency_key);

CREATE UNIQUE INDEX uq_payments_account_provider_external
  ON payments (account_id, external_provider, external_payment_id);

CREATE INDEX ix_payments_account_provider_order
  ON payments (account_id, external_provider, external_order_id);
