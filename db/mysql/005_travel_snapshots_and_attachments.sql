-- Pass 7: MySQL/MariaDB parity for travel calculation snapshots and attachment pointers.

CREATE TABLE IF NOT EXISTS work_orders (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  client_id CHAR(36) NOT NULL,
  job_id CHAR(36) NULL,
  property_id CHAR(36) NULL,
  title TEXT NOT NULL,
  scope TEXT NULL,
  site_notes TEXT NULL,
  safety_notes TEXT NULL,
  rooms JSON NOT NULL,
  status ENUM('draft','scheduled','in_progress','completed','cancelled') NOT NULL DEFAULT 'draft',
  total_cents INT NOT NULL DEFAULT 0,
  notes TEXT NULL,
  source_visit_id CHAR(36) NULL,
  source_assessment_id CHAR(36) NULL,
  completed_at DATETIME(3) NULL,
  created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_work_orders_account_status (account_id,status),
  KEY idx_work_orders_property (property_id),
  CONSTRAINT fk_work_orders_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_work_orders_client FOREIGN KEY (client_id) REFERENCES clients(id),
  CONSTRAINT fk_work_orders_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
  CONSTRAINT fk_work_orders_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
  CONSTRAINT fk_work_orders_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS travel_calculation_snapshots (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  origin_address TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  one_way_miles DECIMAL(8,1) NOT NULL DEFAULT 0,
  round_trip_miles DECIMAL(8,1) NOT NULL DEFAULT 0,
  one_way_minutes INT NOT NULL DEFAULT 0,
  round_trip_minutes INT NOT NULL DEFAULT 0,
  total_miles DECIMAL(8,1) NOT NULL DEFAULT 0,
  total_minutes INT NOT NULL DEFAULT 0,
  included_miles DECIMAL(8,1) NOT NULL DEFAULT 0,
  billable_miles DECIMAL(8,1) NOT NULL DEFAULT 0,
  mileage_rate_cents INT NOT NULL DEFAULT 0,
  mileage_charge_cents INT NOT NULL DEFAULT 0,
  billable_travel_minutes INT NOT NULL DEFAULT 0,
  travel_time_rate_cents INT NOT NULL DEFAULT 0,
  travel_time_charge_cents INT NOT NULL DEFAULT 0,
  recommended_total_cents INT NOT NULL DEFAULT 0,
  total_travel_charge_cents INT NOT NULL DEFAULT 0,
  trip_count INT NOT NULL DEFAULT 1,
  trip_direction ENUM('round_trip','one_way') NOT NULL DEFAULT 'round_trip',
  trip_calculation_method ENUM('once_for_project','once_per_visit','once_per_workday','custom') NOT NULL DEFAULT 'once_for_project',
  policy_tier ENUM('local','extended','distant','long_distance') NOT NULL DEFAULT 'local',
  charge_mode ENUM('include_in_labor','separate_line','waive','custom') NOT NULL DEFAULT 'separate_line',
  calculation_source ENUM('map_provider','haversine_estimate','manual','mileage_log','carried_forward') NOT NULL DEFAULT 'manual',
  calculated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  manually_overridden BOOLEAN NOT NULL DEFAULT FALSE,
  override_reason TEXT NULL,
  client_rule VARCHAR(64) NULL,
  relationship_type VARCHAR(64) NULL,
  owner_review_required BOOLEAN NOT NULL DEFAULT FALSE,
  owner_review_approved BOOLEAN NOT NULL DEFAULT FALSE,
  warnings_json JSON NOT NULL,
  mileage_rate_id CHAR(36) NULL,
  estimate_id CHAR(36) NULL,
  invoice_id CHAR(36) NULL,
  work_order_id CHAR(36) NULL,
  visit_id CHAR(36) NULL,
  job_id CHAR(36) NULL,
  kind ENUM('estimate','actual','invoice') NOT NULL DEFAULT 'estimate',
  parent_snapshot_id CHAR(36) NULL,
  created_by CHAR(36) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_travel_snapshots_account (account_id),
  KEY idx_travel_snapshots_estimate (estimate_id),
  KEY idx_travel_snapshots_invoice (invoice_id),
  KEY idx_travel_snapshots_work_order (work_order_id),
  KEY idx_travel_snapshots_visit (visit_id),
  CONSTRAINT fk_travel_snapshots_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_travel_snapshots_rate FOREIGN KEY (mileage_rate_id) REFERENCES mileage_rates(id) ON DELETE SET NULL,
  CONSTRAINT fk_travel_snapshots_estimate FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE,
  CONSTRAINT fk_travel_snapshots_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  CONSTRAINT fk_travel_snapshots_work_order FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_travel_snapshots_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE,
  CONSTRAINT fk_travel_snapshots_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
  CONSTRAINT fk_travel_snapshots_parent FOREIGN KEY (parent_snapshot_id) REFERENCES travel_calculation_snapshots(id) ON DELETE SET NULL,
  CONSTRAINT fk_travel_snapshots_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

ALTER TABLE estimates
  ADD COLUMN IF NOT EXISTS travel_snapshot_id CHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS travel_charge_mode ENUM('include_in_labor','separate_line','waive','custom') NULL,
  ADD COLUMN IF NOT EXISTS travel_surcharge_cents INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS risk_adjustment_cents INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_cents INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS presentation_mode VARCHAR(32) NULL;

ALTER TABLE estimate_line_items
  ADD COLUMN IF NOT EXISTS option_id CHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS line_item_type VARCHAR(32) NULL,
  ADD COLUMN IF NOT EXISTS visible_to_customer BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS adjustment_type VARCHAR(64) NULL;

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS travel_snapshot_id CHAR(36) NULL,
  ADD COLUMN IF NOT EXISTS travel_billing_mode ENUM('estimated','actual','none','custom') NULL;

ALTER TABLE invoice_line_items
  ADD COLUMN IF NOT EXISTS line_item_type VARCHAR(32) NULL,
  ADD COLUMN IF NOT EXISTS visible_to_customer BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS travel_snapshot_id CHAR(36) NULL;
ALTER TABLE visits ADD COLUMN IF NOT EXISTS travel_snapshot_id CHAR(36) NULL;
