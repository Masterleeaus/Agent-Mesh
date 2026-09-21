-- Agent 2 Pass 09: field-workforce extensions keyed to the existing shared identity.
-- These tables do not replace users/business_memberships; they add schedulable
-- capabilities and availability to active business members.

CREATE TABLE IF NOT EXISTS workforce_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, name)
);
CREATE INDEX IF NOT EXISTS idx_workforce_skills_account_active ON workforce_skills(account_id, active);

CREATE TABLE IF NOT EXISTS technician_skills (
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES workforce_skills(id) ON DELETE CASCADE,
  proficiency smallint NULL CHECK (proficiency BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, user_id, skill_id)
);
CREATE INDEX IF NOT EXISTS idx_technician_skills_user ON technician_skills(account_id, user_id);

CREATE TABLE IF NOT EXISTS technician_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weekday smallint NULL CHECK (weekday BETWEEN 0 AND 6),
  specific_date date NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  availability_kind text NOT NULL DEFAULT 'available' CHECK (availability_kind IN ('available','unavailable')),
  note text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT technician_availability_selector_chk CHECK ((weekday IS NULL) <> (specific_date IS NULL)),
  CONSTRAINT technician_availability_window_chk CHECK (end_time > start_time)
);
CREATE INDEX IF NOT EXISTS idx_technician_availability_user_weekday ON technician_availability(account_id, user_id, weekday);
CREATE INDEX IF NOT EXISTS idx_technician_availability_user_date ON technician_availability(account_id, user_id, specific_date);
