-- Titan convergence pass 1: harden the existing workflow_events table into a
-- leased/retryable outbox without replacing existing producers or consumers.
-- The processed/processed_at columns remain for backward compatibility.

ALTER TABLE workflow_events
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS lease_id UUID,
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS dead_lettered_at TIMESTAMPTZ;

ALTER TABLE workflow_events
  DROP CONSTRAINT IF EXISTS workflow_events_status_check;

ALTER TABLE workflow_events
  ADD CONSTRAINT workflow_events_status_check
  CHECK (status IN ('pending', 'processing', 'completed', 'dead_letter'));

-- Forward-port existing completion state into the new outbox state.
UPDATE workflow_events
SET status = 'completed'
WHERE processed = true AND status <> 'completed';

CREATE INDEX IF NOT EXISTS idx_workflow_events_delivery_ready
  ON workflow_events (status, next_attempt_at, locked_until, created_at)
  WHERE processed = false;

CREATE INDEX IF NOT EXISTS idx_workflow_events_account_delivery
  ON workflow_events (account_id, status, created_at DESC);
