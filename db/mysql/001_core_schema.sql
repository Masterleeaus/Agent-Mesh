-- Titan Business Ops MySQL/MariaDB convergence baseline.
-- Port of the existing AI-FSM 001_core_schema domain, not a new greenfield model.
-- Target: MySQL 8.0+ / MariaDB with JSON support. UUIDs remain application-generated CHAR(36).

CREATE TABLE IF NOT EXISTS accounts (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  settings JSON NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  email VARCHAR(320) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(64),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('owner','admin','tech') NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_users_account_email (account_id, email),
  KEY idx_users_account (account_id),
  CONSTRAINT fk_users_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS clients (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(320),
  phone VARCHAR(64),
  notes TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_clients_account (account_id),
  CONSTRAINT fk_clients_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS properties (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  client_id CHAR(36) NOT NULL,
  name VARCHAR(255),
  address TEXT NOT NULL,
  city VARCHAR(255), state VARCHAR(128), zip VARCHAR(32), notes TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_properties_account (account_id), KEY idx_properties_client (client_id),
  CONSTRAINT fk_properties_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_properties_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS jobs (
  id CHAR(36) PRIMARY KEY, account_id CHAR(36) NOT NULL, client_id CHAR(36) NOT NULL,
  property_id CHAR(36), title VARCHAR(255) NOT NULL, description TEXT,
  status ENUM('draft','quoted','scheduled','in_progress','completed','invoiced','cancelled') NOT NULL DEFAULT 'draft',
  priority INT NOT NULL DEFAULT 0, scheduled_start DATETIME(3), scheduled_end DATETIME(3),
  created_by CHAR(36) NOT NULL, created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_jobs_account_status (account_id,status), KEY idx_jobs_account_scheduled (account_id,scheduled_start), KEY idx_jobs_client (client_id),
  CONSTRAINT fk_jobs_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_jobs_client FOREIGN KEY (client_id) REFERENCES clients(id),
  CONSTRAINT fk_jobs_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
  CONSTRAINT fk_jobs_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS visits (
  id CHAR(36) PRIMARY KEY, account_id CHAR(36) NOT NULL, job_id CHAR(36) NOT NULL, assigned_user_id CHAR(36),
  status ENUM('scheduled','arrived','in_progress','completed','cancelled') NOT NULL DEFAULT 'scheduled',
  scheduled_start DATETIME(3) NOT NULL, scheduled_end DATETIME(3) NOT NULL, arrived_at DATETIME(3), completed_at DATETIME(3), tech_notes TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_visits_account_status (account_id,status), KEY idx_visits_account_start (account_id,scheduled_start), KEY idx_visits_job (job_id),
  CONSTRAINT fk_visits_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_visits_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  CONSTRAINT fk_visits_assignee FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS estimates (
  id CHAR(36) PRIMARY KEY, account_id CHAR(36) NOT NULL, client_id CHAR(36) NOT NULL, job_id CHAR(36), property_id CHAR(36),
  status ENUM('draft','sent','approved','declined','expired') NOT NULL DEFAULT 'draft',
  subtotal_cents INT NOT NULL DEFAULT 0, tax_cents INT NOT NULL DEFAULT 0, total_cents INT NOT NULL DEFAULT 0,
  notes TEXT, internal_notes TEXT, sent_at DATETIME(3), expires_at DATETIME(3), created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY idx_estimates_account_status (account_id,status), KEY idx_estimates_client (client_id), KEY idx_estimates_job (job_id),
  CONSTRAINT fk_estimates_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_estimates_client FOREIGN KEY (client_id) REFERENCES clients(id),
  CONSTRAINT fk_estimates_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
  CONSTRAINT fk_estimates_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
  CONSTRAINT fk_estimates_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS estimate_line_items (
  id CHAR(36) PRIMARY KEY, estimate_id CHAR(36) NOT NULL, description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL, unit_price_cents INT NOT NULL, total_cents INT NOT NULL, sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), KEY idx_estimate_lines_estimate (estimate_id),
  CONSTRAINT fk_estimate_lines_estimate FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS invoices (
  id CHAR(36) PRIMARY KEY, account_id CHAR(36) NOT NULL, client_id CHAR(36) NOT NULL, job_id CHAR(36), estimate_id CHAR(36), property_id CHAR(36),
  status ENUM('draft','sent','partial','paid','overdue','void') NOT NULL DEFAULT 'draft', invoice_number VARCHAR(128) NOT NULL,
  subtotal_cents INT NOT NULL DEFAULT 0, tax_cents INT NOT NULL DEFAULT 0, total_cents INT NOT NULL DEFAULT 0, paid_cents INT NOT NULL DEFAULT 0,
  notes TEXT, due_date DATETIME(3), sent_at DATETIME(3), paid_at DATETIME(3), created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_invoices_account_number (account_id,invoice_number), KEY idx_invoices_account_status (account_id,status), KEY idx_invoices_client (client_id), KEY idx_invoices_job (job_id),
  CONSTRAINT fk_invoices_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_invoices_client FOREIGN KEY (client_id) REFERENCES clients(id),
  CONSTRAINT fk_invoices_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL,
  CONSTRAINT fk_invoices_estimate FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE SET NULL,
  CONSTRAINT fk_invoices_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
  CONSTRAINT fk_invoices_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id CHAR(36) PRIMARY KEY, invoice_id CHAR(36) NOT NULL, estimate_line_item_id CHAR(36), description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL, unit_price_cents INT NOT NULL, total_cents INT NOT NULL, sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), KEY idx_invoice_lines_invoice (invoice_id),
  CONSTRAINT fk_invoice_lines_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  CONSTRAINT fk_invoice_lines_estimate_line FOREIGN KEY (estimate_line_item_id) REFERENCES estimate_line_items(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
  id CHAR(36) PRIMARY KEY, account_id CHAR(36) NOT NULL, invoice_id CHAR(36) NOT NULL, amount_cents INT NOT NULL,
  method VARCHAR(64) NOT NULL, received_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), notes TEXT, created_by CHAR(36) NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), KEY idx_payments_account (account_id), KEY idx_payments_invoice (invoice_id),
  CONSTRAINT fk_payments_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_payments_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  CONSTRAINT fk_payments_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;
