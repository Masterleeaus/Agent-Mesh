-- Pass 04: MySQL/MariaDB schema parity for auth/memberships/customers.
-- Extends the existing AI-FSM domain rather than introducing replacement entities.

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS nickname VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS company_name VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(500) NULL,
  ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(500) NULL,
  ADD COLUMN IF NOT EXISTS city VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS state VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS zip VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS relationship_type VARCHAR(64) NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS travel_rule VARCHAR(64) NOT NULL DEFAULT 'standard_policy',
  ADD COLUMN IF NOT EXISTS custom_included_one_way_miles DECIMAL(10,2) NULL,
  ADD COLUMN IF NOT EXISTS custom_mileage_rate_cents INT NULL,
  ADD COLUMN IF NOT EXISTS custom_travel_time_rate_cents INT NULL,
  ADD COLUMN IF NOT EXISTS minimum_project_value_exempt BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS birthday DATE NULL,
  ADD COLUMN IF NOT EXISTS square_customer_id VARCHAR(128) NULL,
  ADD COLUMN IF NOT EXISTS creation_source VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS first_visit_at DATE NULL,
  ADD COLUMN IF NOT EXISTS last_visit_at DATE NULL,
  ADD COLUMN IF NOT EXISTS transaction_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lifetime_spend_cents BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS email_subscription_status VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS instant_profile BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_clients_square_customer ON clients(account_id, square_customer_id);

CREATE TABLE IF NOT EXISTS business_memberships (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  role ENUM('owner','admin','tech') NOT NULL,
  status ENUM('active','invited','suspended','revoked') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_business_membership (account_id, user_id),
  KEY idx_business_memberships_user_status (user_id, status),
  CONSTRAINT fk_business_memberships_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_business_memberships_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT IGNORE INTO business_memberships (id, account_id, user_id, role, status)
SELECT UUID(), account_id, id, role, 'active' FROM users;

CREATE TABLE IF NOT EXISTS audit_log (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  account_id CHAR(36) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id CHAR(36) NOT NULL,
  action VARCHAR(50) NOT NULL,
  actor_id CHAR(36) NOT NULL,
  trace_id VARCHAR(100) NULL,
  old_value JSON NULL,
  new_value JSON NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_audit_account_created (account_id, created_at),
  KEY idx_audit_entity (account_id, entity_type, entity_id),
  CONSTRAINT fk_audit_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB;
