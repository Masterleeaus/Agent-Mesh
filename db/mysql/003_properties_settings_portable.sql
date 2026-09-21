-- Pass 5: preserve existing AI-FSM property intelligence used by service-location screens.
-- MySQL/MariaDB application-level tenant enforcement is via account_id on every query.

CREATE TABLE IF NOT EXISTS property_issues (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  property_id CHAR(36) NOT NULL,
  area VARCHAR(255) NOT NULL,
  item_key VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  first_noted_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_noted_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  occurrence_count INT NOT NULL DEFAULT 1,
  status ENUM('open','monitoring','resolved','referred') NOT NULL DEFAULT 'open',
  resolved_at DATETIME(3),
  resolved_note TEXT,
  linked_job_ids LONGTEXT NOT NULL DEFAULT '[]',
  linked_estimate_id CHAR(36),
  severity ENUM('minor','moderate','major','critical') NOT NULL DEFAULT 'minor',
  auto_detected BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_property_issues_property (account_id, property_id, status),
  KEY idx_property_issues_last_noted (account_id, last_noted_at),
  CONSTRAINT fk_property_issues_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_property_issues_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  CONSTRAINT fk_property_issues_estimate FOREIGN KEY (linked_estimate_id) REFERENCES estimates(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- PostgreSQL used a partial unique index for open/monitoring issues. MySQL/MariaDB
-- cannot express that index portably, so duplicate prevention remains in the
-- property-issue command path until the route itself is converged in a later pass.
