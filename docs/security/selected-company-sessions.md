# Selected-company session enforcement (#302 slice)

## Current contract

`apps/web/lib/auth/session.ts` verifies the signed `fsm_session` cookie, validates its opaque user/company compatibility IDs and role, then re-reads the current identity context on every request. Tokens issued by `createSession` have HS256, issued-at and expiry claims; verification requires those claims and that algorithm. A JWT role is never a substitute for the current stored role.

- PostgreSQL/MySQL compatibility lookup requires an **active** `business_memberships` row for the exact token user and selected account. There is no fallback to `users.account_id` or `users.role`.
- Revoked, suspended, invited, missing or deleted memberships deny access, including a removed last/default membership. The returned user/account must exactly match the token context.
- SQLite preserves its existing explicit `users.company_id AS account_id` mapping with user and company predicates. This schema has no membership-status model; it does not acquire one in this patch.
- `SessionPayload.accountId` remains a compatibility field. This patch does not establish a new global principal schema, canonical company mapping or physical storage resolver.
- Identity and company context do not grant consequential business execution authority. Existing governed execution checks remain required.

## Compatibility and deployment hold

Migration `db/migrations/179_business_memberships.sql` creates unique `(account_id,user_id)` memberships, backfills existing users as active and uses `ON CONFLICT ... DO NOTHING`. The MySQL compatibility migration `db/mysql/002_auth_clients_portable.sql` also backfills memberships with `INSERT IGNORE`. Neither migration should be rerun as a recovery mechanism: doing so could reconstruct intentionally deleted memberships.

The existing PostgreSQL-only `POST /api/v1/users` route previously created only a user row after migration 179. It now inserts the default active membership inside the same transaction. Membership insertion failure rolls the new user back. The existing PostgreSQL `PATCH /api/v1/users/[id]` synchronizes role changes to only the matching company membership in that same transaction, without changing status or recreating absent memberships. This does not make these routes MySQL/SQLite portable.

Existing legitimate PostgreSQL/MySQL users created after backfill without a membership will be denied by this change. They cannot safely be distinguished from users whose last membership was deliberately deleted. **Independent review and an explicit deployment recovery decision are required before merge/promotion.** Determine intended memberships from authoritative administrative evidence; do not broadly recreate missing memberships from `users.account_id`. This patch performs no backfill, migration or production data edit.

Rollback is a source revert, but reverting the session join restores the context-fallback defect. Do not use fallback as a silent compatibility escape hatch.

## Verification boundary

The dedicated tests cover signed JWT verification, company A/B roles, missing/inactive/deleted memberships, revoked default membership, deleted principals, changed stored roles, malformed/expired/tampered tokens, SQLite match/mismatch and company reassignment, a real protected clients route, and PostgreSQL creation -> real login -> real session plus rollback, role downgrade with an old cookie, inactive-status preservation, wrong-company denial and unchanged unrelated memberships.

The SQL adapter in these tests executes production lookup statements against in-memory SQLite with numbered binding conversion. Framework cookie transport and DB connections are test boundaries; `getSession`, auth middleware, route handlers and JWT cryptography are real. Running the non-SQLite branch for `postgres` and `mysql` proves the shared statement's lookup semantics, **not** live PostgreSQL/MySQL wire-protocol, RLS or deployment certification. The SQLite fixture reflects the columns required by the existing schema; it is not a complete migration test.

A replayed cookie is denied after its selected membership is revoked/deleted, or (SQLite) the user company mapping changes. Merely switching the browser cookie from still-valid company A to still-valid company B does not invalidate a previously issued A cookie: this legacy session contract has no server-side session generation/revocation record. Global switch invalidation, logout/password-reset invalidation, replay/device lifecycle, identity-control-plane migration, physical storage isolation and supply-chain/credential controls remain open under #302 and their canonical owners. No deployed exploit or complete security mission is claimed.

## Local evidence (2026-10-01; base b9b2d86)

Pinned pnpm 9.12.0, Node 24.19.0. Main frozen dependency installation is blocked by existing manifest/lock drift; dependencies were installed with `pnpm install --no-frozen-lockfile --store-dir .auth-cache/store`, then the lockfile was restored. No dependency/lockfile change belongs to this slice.

- TDD: original session/creation tests produced 38 failures; role synchronization tests produced 4 failures before the PATCH fix.
- `pnpm --filter @titan-zero/web exec vitest run lib/auth/__tests__/session-context.test.ts lib/auth/__tests__/user-creation-session.test.ts`: **63 passed**; independent read-only reviewer reran the same 63 successfully.
- `pnpm --filter @titan-zero/web exec next lint --file lib/auth/session.ts --file app/api/v1/users/route.ts --file 'app/api/v1/users/[id]/route.ts' --file lib/auth/__tests__/session-context.test.ts --file lib/auth/__tests__/user-creation-session.test.ts`: passed, no warnings/errors (Next reports command deprecation).
- `pnpm --filter @titan-zero/web typecheck`: failed, 68 existing diagnostics; none name the changed paths. #1084 owns baseline repair.
- `pnpm --filter @titan-zero/web test`: **106 failed, 1976 passed**, 39 failed/224 passed files. Sorted failure names exactly match the separately executed main baseline; this slice adds 63 passing tests.
- `pnpm gate:fast` and `pnpm gate`: both failed in worker lint at five existing `no-unused-expressions` errors; later phases were not reached. No aggregate gate pass.
- `pnpm test`: stopped at workforce `tsx` IPC listen `EPERM`. Running the same workforce tests with `node --import tsx --test src/*.test.ts` from `services/workforce` avoids the CLI IPC and passes **19/19**; this is not a complete recursive-workspace test pass.
- `pnpm --filter @titan-zero/titan-platform exec tsc -p tsconfig.json --noEmit false --outDir .test-dist --module NodeNext --moduleResolution NodeNext --isolatedModules false` followed by `node --test packages/titan-platform/tests/security-boundary.test.mjs`: compiled and **2/2 passed**. An initial direct test invocation before compilation failed for missing `.test-dist`; that setup issue was corrected.
- `pnpm --filter @titan-zero/web test:integration`: **1 passed, 126 skipped** without TEST_BASE_URL/TEST_DATABASE_URL. Auth HTTP, DB/RLS and recovery suites did not execute. No Docker/PostgreSQL/MySQL server is installed here.
- `git diff --check`: passed. Main advanced repository-governance files during this work; refreshed onto b4113e0 and reran focused tests/lint/web tests/typecheck. A subsequent portfolio-document-only change advanced main to b9b2d86; incorporated without conflicts and reran focused tests.

### Existing web failure inventory

The full suite reports these files (106 failed tests plus 3 failed-suite collection entries); these are preserved as failing evidence, not waived:

- `app/api/booking/__tests__/booking.unit.test.ts`
- `app/api/v1/booking-requests/__tests__/booking-requests.unit.test.ts`
- `app/api/v1/intake/__tests__/intake.unit.test.ts`
- `app/api/v1/visits/[id]/sub-status/__tests__/sub-status.unit.test.ts`
- `app/api/v1/visits/__tests__/visits.unit.test.ts`
- `app/api/webhooks/square/__tests__/square-webhook.unit.test.ts`
- `app/app/capture/pending-queue.unit.test.ts`
- `lib/__tests__/env.unit.test.ts`
- `lib/__tests__/status-history.unit.test.ts`
- `lib/__tests__/vocabulary.unit.test.ts`
- `lib/auth/__tests__/post-login-destination.unit.test.ts`
- `lib/change-orders/__tests__/lifecycle-portability.contract.test.ts`
- `lib/communications/__tests__/communications-log.unit.test.ts`
- `lib/communications/__tests__/outbound-orchestrator.unit.test.ts`
- `lib/db/sqlite-params.test.ts`
- `lib/estimates/__tests__/approval-artifacts.unit.test.ts`
- `lib/estimates/__tests__/deposit-policy.unit.test.ts`
- `lib/estimates/__tests__/lifecycle-mysql-portability.contract.test.ts`
- `lib/estimates/__tests__/mysql-portability.contract.test.ts`
- `lib/estimates/__tests__/public-acceptance.contract.test.ts`
- `lib/estimates/__tests__/revision-lineage.contract.test.ts`
- `lib/estimates/__tests__/walkthrough-prefill.unit.test.ts`
- `lib/expenses/__tests__/attribution-portability.contract.test.ts`
- `lib/invoices/__tests__/crud-portability.contract.test.ts`
- `lib/invoices/__tests__/final-invoice.unit.test.ts`
- `lib/invoices/__tests__/job-expenses-portability.contract.test.ts`
- `lib/invoices/__tests__/lifecycle-consistency.contract.test.ts`
- `lib/invoices/__tests__/line-items.unit.test.ts`
- `lib/invoices/__tests__/payment-idempotency.contract.test.ts`
- `lib/invoices/__tests__/square-reconciliation.contract.test.ts`
- `lib/invoices/__tests__/totals-consistency.contract.test.ts`
- `lib/jobs/__tests__/materials-portability.contract.test.ts`
- `lib/pricing/__tests__/cleaning-pricing.unit.test.ts`
- `lib/pricing/__tests__/price-book-repository.unit.test.ts`
- `lib/reports/__tests__/invoice-aging-portability.contract.test.ts`
- `lib/reports/__tests__/month-end-portability.contract.test.ts`
- `lib/reports/__tests__/profitability-consistency.unit.test.ts`
- `lib/reports/__tests__/reports-sql-portability.contract.test.ts`
- `lib/vehicles/__tests__/capture.unit.test.ts`
