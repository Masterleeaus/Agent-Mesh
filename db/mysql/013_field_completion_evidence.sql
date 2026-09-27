CREATE TABLE IF NOT EXISTS visit_media (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  visit_id CHAR(36) NOT NULL,
  category VARCHAR(32) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(128) NOT NULL,
  size_bytes INT NOT NULL,
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_visit_media_visit (visit_id),
  INDEX idx_visit_media_account (account_id),
  CONSTRAINT fk_visit_media_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS completion_packets (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  visit_id CHAR(36) NOT NULL,
  photo_urls JSON NOT NULL,
  signature_url TEXT NULL,
  signature_waiver BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT NULL,
  photos_waived BOOLEAN NOT NULL DEFAULT FALSE,
  photos_waiver_reason VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by CHAR(36) NULL,
  UNIQUE KEY uq_completion_packets_visit (visit_id),
  INDEX idx_completion_packets_account (account_id),
  CONSTRAINT fk_completion_packets_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
) ENGINE=InnoDB;
