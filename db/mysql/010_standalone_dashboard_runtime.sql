-- Pass 15: standalone owner-dashboard runtime parity for MySQL/MariaDB.
-- Ports existing AI-FSM operational tables used by the authenticated shell and
-- dashboard. This is schema adaptation only; domain behaviour remains in the
-- existing TypeScript modules.

ALTER TABLE visits
  ADD COLUMN IF NOT EXISTS sub_status VARCHAR(64) NULL;

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS first_viewed_at DATETIME(3) NULL;

CREATE TABLE IF NOT EXISTS business_days (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  business_date DATE NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
  opened_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  closed_at DATETIME(3) NULL,
  review_prompted_at DATETIME(3) NULL,
  reopened_reason TEXT,
  notes TEXT,
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_business_days_user_date (account_id, user_id, business_date),
  KEY idx_business_days_account_status (account_id, status),
  CONSTRAINT fk_business_days_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_business_days_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_business_days_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS booking_requests (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  client_id CHAR(36) NULL,
  property_id CHAR(36) NULL,
  job_id CHAR(36) NULL,
  visit_id CHAR(36) NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(320) NULL,
  phone VARCHAR(64) NULL,
  service_category VARCHAR(128) NOT NULL,
  service_description TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time_slot VARCHAR(64) NULL,
  address TEXT NOT NULL,
  city VARCHAR(255) NULL,
  state VARCHAR(128) NULL,
  zip VARCHAR(32) NULL,
  access_notes TEXT,
  status VARCHAR(64) NOT NULL DEFAULT 'pending',
  reviewed_by CHAR(36) NULL,
  reviewed_at DATETIME(3) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_booking_requests_account_status (account_id, status),
  KEY idx_booking_requests_preferred_date (preferred_date),
  CONSTRAINT fk_booking_requests_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_booking_requests_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  CONSTRAINT fk_booking_requests_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
  CONSTRAINT fk_booking_requests_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
  CONSTRAINT fk_booking_requests_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE SET NULL,
  CONSTRAINT fk_booking_requests_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vehicles (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  nickname VARCHAR(255) NOT NULL,
  make VARCHAR(128) NULL,
  model VARCHAR(128) NULL,
  year SMALLINT NULL,
  plate VARCHAR(64) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_vehicles_account_active (account_id, is_active),
  CONSTRAINT fk_vehicles_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vehicle_sessions (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  vehicle_id CHAR(36) NULL,
  session_date DATE NOT NULL,
  start_odometer INT NULL,
  end_odometer INT NULL,
  miles DECIMAL(8,2) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'closed',
  started_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  notes TEXT,
  created_by CHAR(36) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_vehicle_sessions_account_date (account_id, session_date),
  KEY idx_vehicle_sessions_vehicle (vehicle_id),
  CONSTRAINT fk_vehicle_sessions_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_vehicle_sessions_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
  CONSTRAINT fk_vehicle_sessions_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS activity_entries (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  user_id CHAR(36) NULL,
  session_date DATE NOT NULL,
  activity_type VARCHAR(64) NOT NULL,
  category VARCHAR(32) NOT NULL,
  started_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ended_at DATETIME(3) NULL,
  entity_type VARCHAR(64) NULL,
  entity_id CHAR(36) NULL,
  assignment_kind VARCHAR(32) NULL,
  labor_bucket VARCHAR(32) NULL,
  source VARCHAR(64) NOT NULL DEFAULT 'manual',
  note TEXT,
  voided_at DATETIME(3) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_activity_account_date (account_id, session_date),
  KEY idx_activity_entity (entity_type, entity_id),
  CONSTRAINT fk_activity_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_activity_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS time_clock_sessions (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  business_day_id CHAR(36) NULL,
  clock_in_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  clock_out_at DATETIME(3) NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'open',
  pay_type VARCHAR(32) NOT NULL DEFAULT 'hourly',
  hourly_rate_snapshot_cents INT NULL,
  break_policy TEXT,
  notes TEXT,
  voided_at DATETIME(3) NULL,
  correction_reason TEXT,
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_time_clock_user_in (account_id, user_id, clock_in_at),
  KEY idx_time_clock_business_day (business_day_id),
  CONSTRAINT fk_time_clock_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_time_clock_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_time_clock_business_day FOREIGN KEY (business_day_id) REFERENCES business_days(id) ON DELETE SET NULL,
  CONSTRAINT fk_time_clock_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS location_segments (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  segment_date DATE NOT NULL,
  kind VARCHAR(16) NOT NULL,
  started_at DATETIME(3) NOT NULL,
  ended_at DATETIME(3) NULL,
  place_label TEXT,
  zone VARCHAR(255) NULL,
  latitude DOUBLE NULL,
  longitude DOUBLE NULL,
  suggested_activity_type VARCHAR(64) NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'provisional',
  activity_entry_id CHAR(36) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_location_segments_account_date (account_id, segment_date),
  CONSTRAINT fk_location_segments_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_location_segments_activity FOREIGN KEY (activity_entry_id) REFERENCES activity_entries(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS expenses (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  job_id CHAR(36) NULL,
  client_id CHAR(36) NULL,
  property_id CHAR(36) NULL,
  vendor_name VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  amount_cents INT NOT NULL,
  expense_date DATE NOT NULL,
  notes TEXT,
  receipt_url TEXT,
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_expenses_account_date (account_id, expense_date),
  KEY idx_expenses_job (job_id),
  CONSTRAINT fk_expenses_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_expenses_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
  CONSTRAINT fk_expenses_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  CONSTRAINT fk_expenses_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
  CONSTRAINT fk_expenses_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS action_items (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id CHAR(36) NOT NULL,
  action_type VARCHAR(128) NOT NULL,
  title TEXT NOT NULL,
  due_at DATETIME(3) NULL,
  resolved_at DATETIME(3) NULL,
  resolved_by CHAR(36) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_action_items_account_open (account_id, resolved_at, created_at),
  KEY idx_action_items_entity (entity_id, action_type),
  CONSTRAINT fk_action_items_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_action_items_resolver FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS attention_events (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  type VARCHAR(128) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id CHAR(36) NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  href TEXT NOT NULL,
  dedupe_key VARCHAR(255) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  read_at DATETIME(3) NULL,
  UNIQUE KEY uq_attention_events_account_dedupe (account_id, dedupe_key),
  KEY idx_attention_events_account_created (account_id, created_at),
  KEY idx_attention_events_account_read (account_id, read_at, created_at),
  CONSTRAINT fk_attention_events_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB;
