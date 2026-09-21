-- Agent 4 Local Pass 02: portable customer request / lead funnel.
-- Reuses booking_requests and status_history; no parallel CRM opportunity model.

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS preferred_contact VARCHAR(16) NOT NULL DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS contact_notes TEXT NULL,
  ADD COLUMN IF NOT EXISTS sms_consent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sms_consent_at DATETIME(3) NULL,
  ADD COLUMN IF NOT EXISTS sms_consent_source VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS sms_consent_text TEXT NULL;

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_type VARCHAR(64) NULL;

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
  service_category VARCHAR(100) NOT NULL,
  service_description TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time_slot VARCHAR(64) NULL,
  address TEXT NOT NULL,
  city VARCHAR(255) NULL,
  state VARCHAR(128) NULL,
  zip VARCHAR(32) NULL,
  access_notes TEXT NULL,
  status ENUM('pending','needs_info','duplicate','reviewed','assessment_booked','estimated','converted','lost','cancelled') NOT NULL DEFAULT 'pending',
  reviewed_by CHAR(36) NULL,
  reviewed_at DATETIME(3) NULL,
  review_notes TEXT NULL,
  sms_consent BOOLEAN NOT NULL DEFAULT FALSE,
  sms_consent_at DATETIME(3) NULL,
  sms_consent_source VARCHAR(100) NULL,
  preferred_contact ENUM('sms','email','phone') NOT NULL DEFAULT 'email',
  duplicate_candidate_ids JSON NULL,
  routing_path ENUM('site_visit','remote_estimate','book_work','pending') NOT NULL DEFAULT 'pending',
  walkthrough_score SMALLINT NULL,
  referral_source ENUM('online','friend_neighbor','realtor','repeat','other') NULL,
  referral_name VARCHAR(255) NULL,
  brokerage_name VARCHAR(255) NULL,
  intake_metadata JSON NULL,
  pricing_mode ENUM('flat_rate','hourly_internal') NULL,
  closed_reason ENUM('estimate_declined','customer_declined','stale','other','spam') NULL,
  closed_at DATETIME(3) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_booking_requests_account (account_id),
  KEY idx_booking_requests_account_status (account_id,status),
  KEY idx_booking_requests_preferred_date (preferred_date),
  KEY idx_booking_requests_open_updated (account_id,status,updated_at),
  CONSTRAINT fk_booking_requests_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_booking_requests_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
  CONSTRAINT fk_booking_requests_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
  CONSTRAINT fk_booking_requests_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
  CONSTRAINT fk_booking_requests_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE SET NULL,
  CONSTRAINT fk_booking_requests_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_booking_walkthrough_score CHECK (walkthrough_score IS NULL OR walkthrough_score BETWEEN 0 AND 100)
 ) ENGINE=InnoDB;

-- Earlier standalone-dashboard portability work may already have created a
-- smaller booking_requests table. Bring that existing table up to the full
-- customer-request funnel contract without replacing it.
ALTER TABLE booking_requests
  ADD COLUMN IF NOT EXISTS review_notes TEXT NULL,
  ADD COLUMN IF NOT EXISTS sms_consent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS sms_consent_at DATETIME(3) NULL,
  ADD COLUMN IF NOT EXISTS sms_consent_source VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS preferred_contact VARCHAR(16) NOT NULL DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS duplicate_candidate_ids JSON NULL,
  ADD COLUMN IF NOT EXISTS routing_path VARCHAR(32) NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS walkthrough_score SMALLINT NULL,
  ADD COLUMN IF NOT EXISTS referral_source VARCHAR(32) NULL,
  ADD COLUMN IF NOT EXISTS referral_name VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS brokerage_name VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS intake_metadata JSON NULL,
  ADD COLUMN IF NOT EXISTS pricing_mode VARCHAR(32) NULL,
  ADD COLUMN IF NOT EXISTS closed_reason VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS closed_at DATETIME(3) NULL;

CREATE TABLE IF NOT EXISTS status_history (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  entity_type ENUM('job','visit','estimate','invoice','booking_request') NOT NULL,
  entity_id CHAR(36) NOT NULL,
  from_status VARCHAR(64) NULL,
  to_status VARCHAR(64) NOT NULL,
  changed_by CHAR(36) NULL,
  note TEXT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_status_history_entity (entity_type,entity_id),
  KEY idx_status_history_account_created (account_id,created_at),
  CONSTRAINT fk_status_history_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_status_history_changed_by FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

ALTER TABLE estimates ADD COLUMN IF NOT EXISTS booking_request_id CHAR(36) NULL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS booking_request_id CHAR(36) NULL;
ALTER TABLE estimates ADD INDEX idx_estimates_booking_request_id (booking_request_id);
ALTER TABLE jobs ADD INDEX idx_jobs_booking_request_id (booking_request_id);
