-- Pass 04 compatibility layer: preserve users.account_id while introducing
-- reusable business memberships for future multi-business identity.
CREATE TABLE IF NOT EXISTS business_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','admin','tech')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','invited','suspended','revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_business_memberships_user_status ON business_memberships(user_id, status);
INSERT INTO business_memberships (account_id, user_id, role, status)
SELECT account_id, id, role, 'active' FROM users
ON CONFLICT (account_id, user_id) DO NOTHING;
