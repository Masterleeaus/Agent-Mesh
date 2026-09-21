-- Pass 10: MySQL/MariaDB parity for invoice collection + Square lifecycle.
-- Reuses existing AI-FSM collection behavior without PostgreSQL RLS/triggers.

CREATE TABLE IF NOT EXISTS integration_settings (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  account_id CHAR(36) NOT NULL,
  provider VARCHAR(64) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  environment ENUM('sandbox','production') NOT NULL DEFAULT 'sandbox',
  config JSON NOT NULL,
  secrets LONGBLOB NULL,
  status ENUM('disconnected','connected','error') NOT NULL DEFAULT 'disconnected',
  status_detail TEXT NULL,
  last_checked_at DATETIME(3) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_integration_settings_account_provider (account_id, provider),
  KEY idx_integration_settings_provider (provider),
  CONSTRAINT fk_integration_settings_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS status_history (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  account_id CHAR(36) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id CHAR(36) NOT NULL,
  from_status VARCHAR(64) NULL,
  to_status VARCHAR(64) NOT NULL,
  changed_by CHAR(36) NULL,
  note TEXT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_status_history_entity (entity_type, entity_id),
  KEY idx_status_history_account (account_id, created_at),
  CONSTRAINT fk_status_history_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS workflow_events (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  account_id CHAR(36) NOT NULL,
  event_type VARCHAR(128) NOT NULL,
  entity_type VARCHAR(128) NOT NULL,
  entity_id CHAR(36) NOT NULL,
  payload JSON NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at DATETIME(3) NULL,
  status ENUM('pending','processing','completed','dead_letter') NOT NULL DEFAULT 'pending',
  attempts INT NOT NULL DEFAULT 0,
  next_attempt_at DATETIME(3) NULL,
  lease_id CHAR(36) NULL,
  locked_at DATETIME(3) NULL,
  locked_until DATETIME(3) NULL,
  last_error TEXT NULL,
  dead_lettered_at DATETIME(3) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_workflow_events_pending (status, next_attempt_at, created_at),
  KEY idx_workflow_events_entity (entity_type, entity_id, event_type, created_at),
  CONSTRAINT fk_workflow_events_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS automations (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  account_id CHAR(36) NOT NULL,
  type VARCHAR(96) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  config JSON NOT NULL,
  next_run_at DATETIME(3) NOT NULL,
  last_run_at DATETIME(3) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_automations_due (enabled, next_run_at),
  KEY idx_automations_account_type (account_id, type),
  CONSTRAINT fk_automations_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Provider idempotency is enforced by Pass 9's uq_payments_external_id.
-- Existing Square invoice columns are also added by Pass 9.
