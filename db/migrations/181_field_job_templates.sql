-- Agent 2 Pass 11: reusable field task/checklist templates, scoped to the existing account identity.
CREATE TABLE IF NOT EXISTS field_job_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NULL,
  category text NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, name)
);
CREATE INDEX IF NOT EXISTS idx_field_job_templates_account_active ON field_job_templates(account_id, active);

CREATE TABLE IF NOT EXISTS field_job_template_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES field_job_templates(id) ON DELETE CASCADE,
  label text NOT NULL,
  required boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_field_job_template_tasks_template ON field_job_template_tasks(account_id, template_id, sort_order);
