-- Titan Business Ops convergence pass 02
-- Upgrade the existing notification_queue in place with durable delivery leases
-- and attempt history. This intentionally preserves the existing queue and all
-- current producers rather than introducing a parallel integration queue.

ALTER TABLE notification_queue
  ADD COLUMN IF NOT EXISTS lease_id UUID,
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS provider_message_id TEXT;

ALTER TABLE notification_queue
  DROP CONSTRAINT IF EXISTS notification_queue_status_check;

ALTER TABLE notification_queue
  ADD CONSTRAINT notification_queue_status_check
  CHECK (status IN ('pending','processing','sent','failed','dead_letter','cancelled','skipped'));

CREATE INDEX IF NOT EXISTS idx_nq_claimable
  ON notification_queue (priority, next_attempt_at, locked_until)
  WHERE status IN ('pending','processing');

CREATE INDEX IF NOT EXISTS idx_nq_processing_lease
  ON notification_queue (locked_until)
  WHERE status = 'processing';

CREATE TABLE IF NOT EXISTS notification_delivery_attempts (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id     UUID        NOT NULL REFERENCES notification_queue(id) ON DELETE CASCADE,
  account_id           UUID        NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  attempt_number       INT         NOT NULL,
  status               TEXT        NOT NULL
                                  CHECK (status IN ('delivered','failed','dead_letter')),
  provider             TEXT        NOT NULL DEFAULT 'smtp',
  provider_message_id  TEXT,
  error                 TEXT,
  started_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (notification_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_nda_notification_started
  ON notification_delivery_attempts (notification_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_nda_account_started
  ON notification_delivery_attempts (account_id, started_at DESC);

ALTER TABLE notification_delivery_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notification_delivery_attempts_account ON notification_delivery_attempts;
CREATE POLICY notification_delivery_attempts_account ON notification_delivery_attempts
  USING (account_id = current_setting('app.current_account_id', true)::uuid)
  WITH CHECK (account_id = current_setting('app.current_account_id', true)::uuid);
