-- Add the canonical visit-to-work-order-task relation to COMPANY_NATIVE_FSM.
-- Each visit-local checklist item reuses a work_order_tasks row; this migration
-- adds no second checklist/task/evidence store and makes both sides company- and
-- work-order-bound with composite foreign keys.

CREATE UNIQUE INDEX work_order_tasks_company_task_work_order
  ON work_order_tasks(company_id, id, work_order_id);

CREATE UNIQUE INDEX visits_company_visit_work_order
  ON visits(company_id, id, work_order_id);

CREATE TABLE visit_tasks (
  company_id TEXT NOT NULL,
  visit_id TEXT NOT NULL,
  work_order_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  item_key TEXT NOT NULL,
  section TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(company_id, visit_id, item_key),
  UNIQUE(company_id, visit_id, task_id),
  FOREIGN KEY(company_id, visit_id, work_order_id)
    REFERENCES visits(company_id, id, work_order_id) ON DELETE CASCADE,
  FOREIGN KEY(company_id, task_id, work_order_id)
    REFERENCES work_order_tasks(company_id, id, work_order_id) ON DELETE CASCADE
);

CREATE INDEX visit_tasks_company_task_lookup
  ON visit_tasks(company_id, visit_id, work_order_id, task_id);
