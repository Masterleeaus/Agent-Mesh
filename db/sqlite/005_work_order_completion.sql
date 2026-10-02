-- Bounded SQLite support for the existing assigned work-order completion owner.
-- account_id is a read-only compatibility alias, never a second tenant boundary.
CREATE UNIQUE INDEX IF NOT EXISTS users_company_id ON users(company_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS clients_company_id ON clients(company_id,id);
CREATE UNIQUE INDEX IF NOT EXISTS jobs_company_id ON jobs(company_id,id);
CREATE TABLE work_orders (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
  account_id TEXT GENERATED ALWAYS AS (company_id) VIRTUAL,
  job_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','scheduled','in_progress','completed','cancelled')),
  assigned_user_id TEXT,
  created_by TEXT NOT NULL,
  completion_criteria TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(completion_criteria)),
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id,id),
  FOREIGN KEY(company_id,job_id) REFERENCES jobs(company_id,id),
  FOREIGN KEY(company_id,client_id) REFERENCES clients(company_id,id),
  FOREIGN KEY(company_id,assigned_user_id) REFERENCES users(company_id,id),
  FOREIGN KEY(company_id,created_by) REFERENCES users(company_id,id)
);
CREATE TABLE work_order_tasks (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id),
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
  FOREIGN KEY(company_id,work_order_id) REFERENCES work_orders(company_id,id)
);
CREATE INDEX work_order_tasks_company_work ON work_order_tasks(company_id,work_order_id);
ALTER TABLE visits ADD COLUMN work_order_id TEXT REFERENCES work_orders(id);
ALTER TABLE visits ADD COLUMN account_id TEXT GENERATED ALWAYS AS (company_id) VIRTUAL;
CREATE INDEX visits_company_work ON visits(company_id,work_order_id);
CREATE TRIGGER visits_work_company_insert BEFORE INSERT ON visits
WHEN NEW.work_order_id IS NOT NULL AND NOT EXISTS (
 SELECT 1 FROM work_orders WHERE id=NEW.work_order_id AND company_id=NEW.company_id AND job_id=NEW.job_id
) BEGIN SELECT RAISE(ABORT,'visit work-order company/job mismatch'); END;
CREATE TRIGGER visits_work_company_update BEFORE UPDATE OF company_id,job_id,work_order_id ON visits
WHEN NEW.work_order_id IS NOT NULL AND NOT EXISTS (
 SELECT 1 FROM work_orders WHERE id=NEW.work_order_id AND company_id=NEW.company_id AND job_id=NEW.job_id
) BEGIN SELECT RAISE(ABORT,'visit work-order company/job mismatch'); END;
