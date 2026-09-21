-- Pass 6: MySQL/MariaDB parity for pricing, travel, mileage-rate and location settings.

CREATE TABLE IF NOT EXISTS business_pricing_settings (
  account_id CHAR(36) PRIMARY KEY,
  labor_cost_cents_per_hour INT NOT NULL DEFAULT 5000,
  labor_billing_cents_per_hour INT NOT NULL DEFAULT 11500,
  margin_floor_pct DECIMAL(5,4) NOT NULL DEFAULT 0.3000,
  ma_labor_rate_delta DECIMAL(5,4) NOT NULL DEFAULT 0.1500,
  minimum_service_fee_cents INT NOT NULL DEFAULT 18500,
  half_day_rate_cents INT NOT NULL DEFAULT 51500,
  full_day_rate_cents INT NOT NULL DEFAULT 98000,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_business_pricing_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS business_travel_settings (
  account_id CHAR(36) PRIMARY KEY,
  origin_address VARCHAR(500) NOT NULL DEFAULT '85 Rockingham Road',
  origin_city VARCHAR(100) NOT NULL DEFAULT 'Derry',
  origin_state VARCHAR(50) NOT NULL DEFAULT 'NH',
  origin_zip VARCHAR(20) NOT NULL DEFAULT '03038',
  origin_latitude DOUBLE NULL,
  origin_longitude DOUBLE NULL,
  included_one_way_miles DECIMAL(6,1) NOT NULL DEFAULT 20,
  mileage_only_cutoff_miles DECIMAL(6,1) NOT NULL DEFAULT 20,
  travel_time_cutoff_miles DECIMAL(6,1) NOT NULL DEFAULT 35,
  long_distance_review_miles DECIMAL(6,1) NOT NULL DEFAULT 60,
  minimum_project_value_low_cents INT NOT NULL DEFAULT 75000,
  minimum_project_value_high_cents INT NOT NULL DEFAULT 100000,
  default_mileage_rate_cents INT NOT NULL DEFAULT 70,
  default_travel_time_rate_cents INT NOT NULL DEFAULT 8500,
  travel_time_rate_mode ENUM('standard_labor','custom','none') NOT NULL DEFAULT 'standard_labor',
  travel_time_rounding ENUM('exact','nearest_15','nearest_30') NOT NULL DEFAULT 'nearest_15',
  default_trip_calculation_method ENUM('once_for_project','once_per_visit','once_per_workday','custom') NOT NULL DEFAULT 'once_for_project',
  default_trip_direction ENUM('round_trip','one_way') NOT NULL DEFAULT 'round_trip',
  customer_facing_line_title VARCHAR(200) NOT NULL DEFAULT 'Travel and Service-Area Adjustment',
  customer_facing_description TEXT NOT NULL,
  show_formulas_to_customer BOOLEAN NOT NULL DEFAULT FALSE,
  high_travel_ratio_threshold DECIMAL(4,3) NOT NULL DEFAULT 0.250,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_business_travel_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS mileage_rates (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  rate_cents INT NOT NULL,
  effective_date DATE NOT NULL,
  source ENUM('irs','custom','business') NOT NULL DEFAULT 'custom',
  description TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by CHAR(36) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_mileage_rates_account_active (account_id,is_active,effective_date),
  CONSTRAINT fk_mileage_rates_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_mileage_rates_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS latitude DOUBLE NULL,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE NULL;

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS location_tracking_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS location_paused_until DATETIME(3) NULL,
  ADD COLUMN IF NOT EXISTS location_retention_days INT NOT NULL DEFAULT 90,
  ADD COLUMN IF NOT EXISTS day_review_cutoff_time TIME NOT NULL DEFAULT '17:00:00',
  ADD COLUMN IF NOT EXISTS min_stop_dwell_minutes INT NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS visit_confidence_threshold INT NOT NULL DEFAULT 70,
  ADD COLUMN IF NOT EXISTS suppress_weekend_start_prompt BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS close_day_followup_hours INT NULL,
  ADD COLUMN IF NOT EXISTS tracking_start_time TIME NULL,
  ADD COLUMN IF NOT EXISTS tracking_end_time TIME NULL;

INSERT IGNORE INTO business_pricing_settings (account_id) SELECT id FROM accounts;
INSERT IGNORE INTO business_travel_settings (account_id, customer_facing_description)
SELECT id, 'Includes mileage and travel time associated with service outside the standard local service area.' FROM accounts;
