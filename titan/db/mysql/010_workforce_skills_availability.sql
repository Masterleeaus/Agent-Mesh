-- Agent 2 Pass 09: MySQL/MariaDB workforce extensions keyed to shared users/memberships.
CREATE TABLE IF NOT EXISTS workforce_skills (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  name VARCHAR(160) NOT NULL,
  category VARCHAR(120) NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_workforce_skill_name (account_id, name),
  KEY idx_workforce_skills_account_active (account_id, active),
  CONSTRAINT fk_workforce_skills_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS technician_skills (
  account_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  skill_id CHAR(36) NOT NULL,
  proficiency SMALLINT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (account_id, user_id, skill_id),
  KEY idx_technician_skills_user (account_id, user_id),
  CONSTRAINT fk_technician_skills_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_technician_skills_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_technician_skills_skill FOREIGN KEY (skill_id) REFERENCES workforce_skills(id) ON DELETE CASCADE,
  CONSTRAINT chk_technician_skill_proficiency CHECK (proficiency IS NULL OR proficiency BETWEEN 1 AND 5)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS technician_availability (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  weekday SMALLINT NULL,
  specific_date DATE NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  availability_kind ENUM('available','unavailable') NOT NULL DEFAULT 'available',
  note VARCHAR(500) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_technician_availability_user_weekday (account_id, user_id, weekday),
  KEY idx_technician_availability_user_date (account_id, user_id, specific_date),
  CONSTRAINT fk_technician_availability_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_technician_availability_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_technician_availability_weekday CHECK (weekday IS NULL OR weekday BETWEEN 0 AND 6),
  CONSTRAINT chk_technician_availability_selector CHECK ((weekday IS NULL AND specific_date IS NOT NULL) OR (weekday IS NOT NULL AND specific_date IS NULL)),
  CONSTRAINT chk_technician_availability_window CHECK (end_time > start_time)
) ENGINE=InnoDB;
