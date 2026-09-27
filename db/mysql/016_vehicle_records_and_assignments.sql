-- TASK-124: MySQL/MariaDB parity for vehicle records and field assignments.

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS kind VARCHAR(16) NOT NULL DEFAULT 'truck',
  ADD COLUMN IF NOT EXISTS vin VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS purchase_date DATE NULL,
  ADD COLUMN IF NOT EXISTS purchase_price_cents INT NULL,
  ADD COLUMN IF NOT EXISTS bluetooth_id VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS vehicle_id CHAR(36) NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_vehicle_date ON expenses (vehicle_id, expense_date);

CREATE TABLE IF NOT EXISTS vehicle_fuel_logs (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  vehicle_id CHAR(36) NOT NULL,
  filled_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  odometer INT NULL,
  gallons DECIMAL(10,3) NOT NULL,
  is_full_tank BOOLEAN NOT NULL DEFAULT TRUE,
  odometer_suspect BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT NULL,
  expense_id CHAR(36) NULL,
  created_by CHAR(36) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_vehicle_fuel_logs_vehicle (account_id, vehicle_id, filled_at),
  CONSTRAINT fk_vehicle_fuel_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_vehicle_fuel_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
  CONSTRAINT fk_vehicle_fuel_expense FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE SET NULL,
  CONSTRAINT fk_vehicle_fuel_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_vehicle_fuel_odometer CHECK (odometer IS NULL OR odometer >= 0),
  CONSTRAINT chk_vehicle_fuel_gallons CHECK (gallons > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vehicle_service_records (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  vehicle_id CHAR(36) NOT NULL,
  serviced_at DATE NOT NULL,
  odometer INT NULL,
  odometer_suspect BOOLEAN NOT NULL DEFAULT FALSE,
  service_types JSON NOT NULL,
  vendor_name VARCHAR(255) NULL,
  notes TEXT NULL,
  expense_id CHAR(36) NULL,
  created_by CHAR(36) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_vehicle_service_records_vehicle (account_id, vehicle_id, serviced_at),
  CONSTRAINT fk_vehicle_service_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_vehicle_service_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
  CONSTRAINT fk_vehicle_service_expense FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE SET NULL,
  CONSTRAINT fk_vehicle_service_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_vehicle_service_odometer CHECK (odometer IS NULL OR odometer >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vehicle_service_schedules (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  vehicle_id CHAR(36) NOT NULL,
  service_type VARCHAR(128) NOT NULL,
  interval_miles INT NULL,
  interval_months INT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_vehicle_service_schedule (account_id, vehicle_id, is_active),
  CONSTRAINT fk_vehicle_schedule_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_vehicle_schedule_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
  CONSTRAINT chk_vehicle_schedule_interval CHECK (interval_miles IS NOT NULL OR interval_months IS NOT NULL)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vehicle_loans (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  vehicle_id CHAR(36) NOT NULL,
  lender VARCHAR(255) NOT NULL,
  original_principal_cents INT NOT NULL,
  apr DECIMAL(6,3) NULL,
  monthly_payment_cents INT NOT NULL,
  start_date DATE NOT NULL,
  term_months INT NULL,
  current_balance_cents INT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_vehicle_loans_vehicle (account_id, vehicle_id, is_active),
  CONSTRAINT fk_vehicle_loan_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_vehicle_loan_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vehicle_renewals (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  vehicle_id CHAR(36) NOT NULL,
  renewal_type VARCHAR(32) NOT NULL,
  provider VARCHAR(255) NULL,
  interval_months INT NOT NULL DEFAULT 12,
  current_due_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_vehicle_renewals_due (account_id, current_due_date, is_active),
  CONSTRAINT fk_vehicle_renewal_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_vehicle_renewal_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vehicle_renewal_records (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  vehicle_id CHAR(36) NOT NULL,
  renewal_type VARCHAR(32) NOT NULL,
  renewed_at DATE NOT NULL,
  expense_id CHAR(36) NULL,
  created_by CHAR(36) NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_vehicle_renewal_records_vehicle (account_id, vehicle_id, renewed_at),
  CONSTRAINT fk_vehicle_renewal_record_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_vehicle_renewal_record_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
  CONSTRAINT fk_vehicle_renewal_record_expense FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE SET NULL,
  CONSTRAINT fk_vehicle_renewal_record_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS technician_vehicle_assignments (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  vehicle_id CHAR(36) NOT NULL,
  assigned_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  unassigned_at DATETIME(3) NULL,
  assigned_by CHAR(36) NOT NULL,
  note TEXT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY idx_tech_vehicle_user (account_id, user_id, assigned_at),
  KEY idx_tech_vehicle_vehicle (account_id, vehicle_id, assigned_at),
  CONSTRAINT fk_tech_vehicle_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_tech_vehicle_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_tech_vehicle_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
  CONSTRAINT fk_tech_vehicle_assigner FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT chk_tech_vehicle_window CHECK (unassigned_at IS NULL OR unassigned_at >= assigned_at)
) ENGINE=InnoDB;
