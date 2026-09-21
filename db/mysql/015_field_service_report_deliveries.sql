CREATE TABLE IF NOT EXISTS field_service_report_deliveries (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  visit_id CHAR(36) NOT NULL,
  client_id CHAR(36) NULL,
  access_token CHAR(36) NOT NULL,
  recipient_email VARCHAR(320) NULL,
  delivery_count INT NOT NULL DEFAULT 0,
  last_queued_at DATETIME(3) NULL,
  last_queued_by CHAR(36) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_field_service_report_delivery_visit (visit_id),
  UNIQUE KEY uq_field_service_report_delivery_token (access_token),
  KEY idx_field_service_report_delivery_account (account_id, updated_at),
  CONSTRAINT fk_field_service_report_delivery_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_field_service_report_delivery_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE,
  CONSTRAINT fk_field_service_report_delivery_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  CONSTRAINT fk_field_service_report_delivery_user FOREIGN KEY (last_queued_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Match PostgreSQL's communications_log external-id idempotency for portable callers.
ALTER TABLE communications_log
  ADD UNIQUE KEY uq_comms_account_external_id (account_id, external_id);
