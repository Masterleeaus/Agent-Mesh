CREATE TABLE field_service_report_acknowledgements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  visit_id uuid NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_email text,
  acknowledgement_notes text,
  acknowledged_at timestamptz NOT NULL DEFAULT now(),
  captured_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX field_service_report_ack_visit ON field_service_report_acknowledgements(visit_id);
CREATE INDEX field_service_report_ack_account ON field_service_report_acknowledgements(account_id, acknowledged_at DESC);
ALTER TABLE field_service_report_acknowledgements ENABLE ROW LEVEL SECURITY;
CREATE POLICY field_service_report_ack_account_policy ON field_service_report_acknowledgements
  USING (account_id = current_setting('app.account_id', true)::uuid)
  WITH CHECK (account_id = current_setting('app.account_id', true)::uuid);
