CREATE TABLE IF NOT EXISTS field_service_report_acknowledgements (
  id CHAR(36) NOT NULL PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  visit_id CHAR(36) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(320) NULL,
  acknowledgement_notes TEXT NULL,
  acknowledged_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  captured_by CHAR(36) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_field_service_report_ack_visit (visit_id),
  INDEX idx_field_service_report_ack_account (account_id, acknowledged_at),
  CONSTRAINT fk_field_service_report_ack_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
);
