-- TASK-124: durable field vehicle assignment history.
-- Workforce identity remains users/business_memberships; vehicle identity remains vehicles.
CREATE TABLE IF NOT EXISTS technician_vehicle_assignments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id    uuid NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  assigned_at   timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  unassigned_at timestamptz,
  assigned_by   uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  note          text,
  created_at    timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT technician_vehicle_assignment_window_chk CHECK (
    unassigned_at IS NULL OR unassigned_at >= assigned_at
  )
);

CREATE INDEX IF NOT EXISTS idx_technician_vehicle_assignments_user
  ON technician_vehicle_assignments (account_id, user_id, assigned_at DESC);
CREATE INDEX IF NOT EXISTS idx_technician_vehicle_assignments_vehicle
  ON technician_vehicle_assignments (account_id, vehicle_id, assigned_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_technician_vehicle_assignments_one_current
  ON technician_vehicle_assignments (account_id, user_id)
  WHERE unassigned_at IS NULL;

ALTER TABLE technician_vehicle_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE technician_vehicle_assignments FORCE ROW LEVEL SECURITY;

CREATE POLICY technician_vehicle_assignments_select ON technician_vehicle_assignments
  FOR SELECT USING (account_id = app_account_id());
CREATE POLICY technician_vehicle_assignments_write ON technician_vehicle_assignments
  FOR ALL USING (account_id = app_account_id() AND is_owner_or_admin())
  WITH CHECK (account_id = app_account_id() AND is_owner_or_admin());
