-- Pass 11: worker runtime + notification delivery parity for MySQL/MariaDB.
-- Minimum target: MySQL 8.0+ or MariaDB 10.6+ (FOR UPDATE SKIP LOCKED).

CREATE TABLE IF NOT EXISTS automation_settings (
  account_id CHAR(36) PRIMARY KEY,
  cooldown_hours INT NOT NULL DEFAULT 4,
  max_per_day INT NOT NULL DEFAULT 2,
  working_hours_start INT NOT NULL DEFAULT 8,
  working_hours_end INT NOT NULL DEFAULT 19,
  working_hours_tz VARCHAR(128) NOT NULL DEFAULT 'America/New_York',
  suppress_on_open_invoice BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_automation_settings_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT IGNORE INTO automation_settings (account_id)
SELECT id FROM accounts;

CREATE TABLE IF NOT EXISTS notification_cooldowns (
  account_id CHAR(36) NOT NULL,
  client_id CHAR(36) NOT NULL,
  last_sent_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (account_id, client_id),
  CONSTRAINT fk_notification_cooldown_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_notification_cooldown_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notification_queue (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  account_id CHAR(36) NOT NULL,
  client_id CHAR(36) NULL,
  automation_type VARCHAR(96) NOT NULL,
  priority INT NOT NULL DEFAULT 50,
  channel VARCHAR(24) NOT NULL DEFAULT 'email',
  to_address VARCHAR(320) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  html_body LONGTEXT NOT NULL,
  idempotency_key VARCHAR(255) NOT NULL,
  status ENUM('pending','processing','sent','failed','dead_letter','cancelled','skipped') NOT NULL DEFAULT 'pending',
  attempt_count INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  next_attempt_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  sent_at DATETIME(3) NULL,
  failed_at DATETIME(3) NULL,
  failure_reason TEXT NULL,
  entity_type VARCHAR(96) NULL,
  entity_id CHAR(36) NULL,
  cancel_on_events JSON NOT NULL,
  metadata JSON NOT NULL,
  lease_id CHAR(36) NULL,
  locked_at DATETIME(3) NULL,
  locked_until DATETIME(3) NULL,
  provider_message_id VARCHAR(255) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_notification_idempotency (idempotency_key),
  KEY idx_notification_claim (status, priority, next_attempt_at, locked_until),
  KEY idx_notification_entity (entity_type, entity_id, status),
  KEY idx_notification_client_day (account_id, client_id, sent_at),
  CONSTRAINT fk_notification_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_notification_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notification_delivery_attempts (
  id CHAR(36) PRIMARY KEY,
  notification_id CHAR(36) NOT NULL,
  account_id CHAR(36) NOT NULL,
  attempt_number INT NOT NULL,
  status ENUM('delivered','failed','dead_letter') NOT NULL,
  provider VARCHAR(64) NOT NULL DEFAULT 'smtp',
  provider_message_id VARCHAR(255) NULL,
  error TEXT NULL,
  started_at DATETIME(3) NOT NULL,
  finished_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_notification_attempt (notification_id, attempt_number),
  KEY idx_notification_attempt_account (account_id, started_at),
  CONSTRAINT fk_notification_attempt_queue FOREIGN KEY (notification_id) REFERENCES notification_queue(id) ON DELETE CASCADE,
  CONSTRAINT fk_notification_attempt_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS communications_log (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  account_id CHAR(36) NOT NULL,
  client_id CHAR(36) NULL,
  booking_request_id CHAR(36) NULL,
  job_id CHAR(36) NULL,
  visit_id CHAR(36) NULL,
  channel VARCHAR(24) NOT NULL,
  direction VARCHAR(24) NOT NULL,
  outcome VARCHAR(32) NOT NULL,
  body_preview TEXT NULL,
  initiated_by CHAR(36) NULL,
  external_id VARCHAR(255) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_comms_client (client_id, created_at),
  KEY idx_comms_account (account_id, created_at),
  CONSTRAINT fk_comms_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_comms_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
) ENGINE=InnoDB;
