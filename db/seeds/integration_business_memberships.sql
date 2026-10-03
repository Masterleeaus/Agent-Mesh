-- Disposable integration fixtures only. Keep in sync with the canonical
-- business_memberships schema and the transactional setup used by
-- apps/web/app/api/v1/users/route.ts.
BEGIN;

DO $seed$
DECLARE
  mismatched_users integer;
BEGIN
  IF current_database() <> 'ai_fsm_test' OR current_user <> 'ai_fsm_test' THEN
    RAISE EXCEPTION 'integration membership fixtures require local ai_fsm_test database/user';
  END IF;

  IF (SELECT count(*) FROM users WHERE email IN (
        'owner@test.com', 'admin@test.com', 'tech@test.com', 'owner-b@test.com'
      )) <> 4 THEN
    RAISE EXCEPTION 'expected the four seeded integration users before adding memberships';
  END IF;

  SELECT count(*) INTO mismatched_users
  FROM (VALUES
    ('owner@test.com',   '11111111-1111-1111-1111-111111111111'::uuid, 'owner'),
    ('admin@test.com',   '11111111-1111-1111-1111-111111111111'::uuid, 'admin'),
    ('tech@test.com',    '11111111-1111-1111-1111-111111111111'::uuid, 'tech'),
    ('owner-b@test.com', '22222222-2222-2222-2222-222222222222'::uuid, 'owner')
  ) AS expected(email, account_id, role)
  LEFT JOIN users u ON lower(u.email) = expected.email
  WHERE u.id IS NULL
     OR u.account_id <> expected.account_id
     OR u.role <> expected.role;

  IF mismatched_users <> 0 THEN
    RAISE EXCEPTION 'seeded integration user company/role does not match fixture contract';
  END IF;
END
$seed$;

-- These four addresses are development-only seed identities. Clear any stale
-- cross-company fixture memberships, then upsert only the expected active
-- owner/admin/tech rows. No application or production users are selected.
DELETE FROM business_memberships bm
USING users u,
      (VALUES
        ('owner@test.com',   '11111111-1111-1111-1111-111111111111'::uuid),
        ('admin@test.com',   '11111111-1111-1111-1111-111111111111'::uuid),
        ('tech@test.com',    '11111111-1111-1111-1111-111111111111'::uuid),
        ('owner-b@test.com', '22222222-2222-2222-2222-222222222222'::uuid)
      ) AS expected(email, account_id)
WHERE u.id = bm.user_id
  AND lower(u.email) = expected.email
  AND bm.account_id <> expected.account_id;

INSERT INTO business_memberships (account_id, user_id, role, status)
SELECT expected.account_id, u.id, expected.role, 'active'
FROM (VALUES
  ('owner@test.com',   '11111111-1111-1111-1111-111111111111'::uuid, 'owner'),
  ('admin@test.com',   '11111111-1111-1111-1111-111111111111'::uuid, 'admin'),
  ('tech@test.com',    '11111111-1111-1111-1111-111111111111'::uuid, 'tech'),
  ('owner-b@test.com', '22222222-2222-2222-2222-222222222222'::uuid, 'owner')
) AS expected(email, account_id, role)
JOIN users u
  ON lower(u.email) = expected.email
 AND u.account_id = expected.account_id
 AND u.role = expected.role
ON CONFLICT (account_id, user_id) DO UPDATE
SET role = EXCLUDED.role,
    status = EXCLUDED.status,
    updated_at = now();

COMMIT;
