-- Agent 2 Pass 11 MySQL/MariaDB parity for first-class field tasks and reusable checklist templates.
CREATE TABLE IF NOT EXISTS work_order_tasks (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  work_order_id CHAR(36) NOT NULL,
  label TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT TRUE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at DATETIME(3) NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'open',
  note TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  source VARCHAR(16) NOT NULL DEFAULT 'manual',
  parent_task_id CHAR(36) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_work_order_tasks_wo (work_order_id),
  INDEX idx_work_order_tasks_account_completed (account_id, completed),
  INDEX idx_work_order_tasks_parent (parent_task_id),
  CONSTRAINT fk_work_order_tasks_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_work_order_tasks_wo FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_work_order_tasks_parent FOREIGN KEY (parent_task_id) REFERENCES work_order_tasks(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS visit_tasks (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  visit_id CHAR(36) NOT NULL,
  task_id CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_visit_tasks_visit_task (visit_id, task_id),
  INDEX idx_visit_tasks_visit (visit_id),
  INDEX idx_visit_tasks_task (task_id),
  INDEX idx_visit_tasks_account (account_id),
  CONSTRAINT fk_visit_tasks_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_visit_tasks_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE,
  CONSTRAINT fk_visit_tasks_task FOREIGN KEY (task_id) REFERENCES work_order_tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS field_job_templates (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT NULL,
  category VARCHAR(80) NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_field_job_templates_account_name (account_id, name),
  INDEX idx_field_job_templates_account_active (account_id, active),
  CONSTRAINT fk_field_job_templates_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS field_job_template_tasks (
  id CHAR(36) PRIMARY KEY,
  account_id CHAR(36) NOT NULL,
  template_id CHAR(36) NOT NULL,
  label VARCHAR(300) NOT NULL,
  required BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX idx_field_job_template_tasks_template (account_id, template_id, sort_order),
  CONSTRAINT fk_field_job_template_tasks_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_field_job_template_tasks_template FOREIGN KEY (template_id) REFERENCES field_job_templates(id) ON DELETE CASCADE
) ENGINE=InnoDB;
