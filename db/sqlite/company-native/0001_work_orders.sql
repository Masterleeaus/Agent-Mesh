-- Fresh-only COMPANY_NATIVE_FSM profile: native-work-orders-v1.
-- Derived from exact bytes of db/sqlite/001_canonical.sql and
-- db/sqlite/005_work_order_completion.sql. Hashes are pinned in the profile
-- manifest. This is a new migration and does not claim either legacy file was
-- applied. Scope is company profile anchor + clients/properties/jobs/visits
-- and work orders/tasks. No users, auth, authority, evidence, runtime, or
-- compatibility-ledger tables are created here.

CREATE TABLE companies (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  settings TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clients (
  id TEXT PRIMARY KEY NOT NULL,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, id),
  FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE
);
CREATE INDEX idx_clients_company ON clients(company_id);

CREATE TABLE properties (
  id TEXT PRIMARY KEY NOT NULL,
  company_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  name TEXT,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, id),
  FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY(company_id, client_id) REFERENCES clients(company_id, id) ON DELETE RESTRICT
);

CREATE TABLE jobs (
  id TEXT PRIMARY KEY NOT NULL,
  company_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  property_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  priority INTEGER NOT NULL DEFAULT 0,
  scheduled_start TEXT,
  scheduled_end TEXT,
  -- Opaque actor reference from a fresh verified session, no local users or credentials.
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, id),
  FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY(company_id, client_id) REFERENCES clients(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY(company_id, property_id) REFERENCES properties(company_id, id) ON DELETE RESTRICT
);
CREATE INDEX idx_jobs_company_status ON jobs(company_id, status);

CREATE TABLE work_orders (
  id TEXT PRIMARY KEY NOT NULL,
  company_id TEXT NOT NULL,
  account_id TEXT GENERATED ALWAYS AS (company_id) VIRTUAL,
  job_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','scheduled','in_progress','completed','cancelled')),
  -- Opaque canonical actor reference, never a local login or authority record.
  assigned_user_id TEXT,
  created_by TEXT NOT NULL,
  completion_criteria TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(completion_criteria)),
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, id),
  UNIQUE(company_id, id, job_id),
  FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY(company_id, job_id) REFERENCES jobs(company_id, id) ON DELETE RESTRICT,
  FOREIGN KEY(company_id, client_id) REFERENCES clients(company_id, id) ON DELETE RESTRICT
);
CREATE INDEX work_orders_company_status ON work_orders(company_id, status);

CREATE TABLE work_order_tasks (
  id TEXT PRIMARY KEY NOT NULL,
  company_id TEXT NOT NULL,
  account_id TEXT GENERATED ALWAYS AS (company_id) VIRTUAL,
  work_order_id TEXT NOT NULL,
  label TEXT NOT NULL,
  required INTEGER NOT NULL DEFAULT 1 CHECK(required IN (0,1)),
  completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0,1)),
  completed_at TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','done','blocked','partial')),
  note TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(company_id, work_order_id) REFERENCES work_orders(company_id, id) ON DELETE CASCADE
);
CREATE INDEX work_order_tasks_company_work ON work_order_tasks(company_id, work_order_id);

CREATE TABLE visits (
  id TEXT PRIMARY KEY NOT NULL,
  company_id TEXT NOT NULL,
  job_id TEXT NOT NULL,
  -- Opaque canonical actor reference, never a local login or authority record.
  assigned_user_id TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  scheduled_start TEXT NOT NULL,
  scheduled_end TEXT NOT NULL,
  arrived_at TEXT,
  completed_at TEXT,
  tech_notes TEXT,
  work_order_id TEXT,
  account_id TEXT GENERATED ALWAYS AS (company_id) VIRTUAL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, id),
  FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY(company_id, job_id) REFERENCES jobs(company_id, id) ON DELETE CASCADE,
  FOREIGN KEY(company_id, work_order_id, job_id) REFERENCES work_orders(company_id, id, job_id) ON DELETE RESTRICT
);
CREATE INDEX idx_visits_company_start ON visits(company_id, scheduled_start);
CREATE INDEX visits_company_work ON visits(company_id, work_order_id);
