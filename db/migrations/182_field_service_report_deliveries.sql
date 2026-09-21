CREATE TABLE IF NOT EXISTS field_service_report_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  access_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  recipient_email TEXT,
  delivery_count INT NOT NULL DEFAULT 0,
  last_queued_at TIMESTAMPTZ,
  last_queued_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (visit_id)
);

CREATE INDEX IF NOT EXISTS field_service_report_delivery_account
  ON field_service_report_deliveries(account_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS field_service_report_delivery_token
  ON field_service_report_deliveries(access_token);

ALTER TABLE field_service_report_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY field_service_report_delivery_account_policy ON field_service_report_deliveries
  USING (account_id = current_setting('app.current_account_id', true)::uuid)
  WITH CHECK (account_id = current_setting('app.current_account_id', true)::uuid);
