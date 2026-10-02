# Web gate repair evidence — issue 1152

Partial, blocked; no merge or product-completion claim. Canonical branch: `agent/issue-1152`.
Current draft PR head: `f1d17d4143c1697beaa0fcb720e1fc31625bacb5`; latest source change is audit fix `865697a3aa6f4ce79f8bfa6f0b3b405b7367a1f5` (documentation-only commit follows). The tested source includes the prior `fc6bd2bb` merge; current-main sync remains pending upstream coordination.

## Provenance and integration

Claim created atomically from main `ee1a3ee3709b9201fc728fc162067d9a5ab78e45`, after reading issue/comments, live claims and PRs. `/workspace/.agents` was empty; no local `.agents/skills` existed. Root/apps/web AGENTS, operational invariants, canonical rules/Blueprint and relevant domain vocabulary were inspected.

Prerequisite #1179 commit `743e70789b85571fa0eafb1029630f0cbc6b7eb6` was merged with ancestry retained in `1a6b0804`. The sole conflict was main's Maps timestamp assertion versus the reviewed prerequisite's stronger ISO/offset equivalence assertion; the reviewed prerequisite version was retained. No platform implementation/export/compiler repair was recreated. Worker #1149/#1219 and session issuance #302/#1183 were not edited. Platform #1153 remains separately owned.

The latest published #1179 head is `444072f35eeaf4397da2e11cc6f23126f0c5f0aa`, with current `origin/main` `987728413bfdae855dba1a0796a686efb53e8805` as an ancestor. It retains the shared Nexus export/config repair and changes the migration-prefix guard so all nine historical duplicate-prefix pairs remain blocking until applied-history review. Exact-head run [36961285511](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/actions/runs/36961285511) passes the non-web convergence, Workforce, Browser, source-index, and SQLite smoke checks but fails the full web gate at108 named failures (105 failed tests plus3 suite-load failures). The active owner has not confirmed integrating this #1152 branch. Our draft head remains `f1d17d41`; exact-head run [36961630100](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/actions/runs/36961630100) fails the Agent Claim Gate because current `main` is not an ancestor. The same run's Titan CI stops before web tests on the malformed shared Nexus export/tsconfig from #1225; the VPS smoke also stops at that build error. Do not edit those shared platform files in this claim. Keep #1152 draft and non-closing pending coordinated sync and exact-head verification.

## Changes and reasons

- Capture queue: canonical company context from the authenticated page, encoded company/capture key in the existing IndexedDB store, scoped memory fallback and list/delete, no replay of retained unscoped historical items, server rejection of a queued payload belonging to another company. No database version bump, schema migration or deletion of historical items. Historical nonqueued capture clients remain compatible. IndexedDB recovery is tested with fake-indexeddb6.2.4, added only as a test dependency.
- Navigation: use existing vocabulary and shared standalone destination sanitizer/reachability owner. Canonical docs require Today/Desk; contradictory older presentation tests now assert those accepted labels while retaining routes, active states and role restrictions. External/unsafe/dead destinations remain rejected; malformed cookies cannot crash login. No session issuance changes.
- Harness/fixtures: Vitest-hoisted communications mocks; SQLite parameter tests run under Vitest with real node:sqlite; env assertions use the accepted SQLite default and retain runtime secret/empty URL rejection; approval tests verify application-generated IDs and actual company/job insert positions rather than obsolete RETURNING results.
- Change orders: generate parent/line IDs in application code, lock the company-bound estimate on the same write transaction, preserve money calculation/audit, verify rollback on failed line persistence. This is not certification of all storage dialects.
- Estimate send/transition: remove PostgreSQL count casts; explicitly normalize the count before pricing guardrails.
- Public response: lock before status validation, only sent may transition, conditional update includes company/token/status, reject unsuccessful writes, and guard PostgreSQL RLS context SQL. Audit uses `actor_id = NULL`, records only old/new status and `via: "portal"`, and must succeed before commit or approval artifacts. PostgreSQL/MySQL migrations make the existing actor column nullable without changing company scope, prior actors or other schema behavior. Real concurrent requests produce one200/one422 with the other company's estimate unchanged.

## Exact web result

Node `v22.23.3`, pnpm `9.12.0`; no baseline changes, test exclusions, production fake data or capability deletion.

Fresh prerequisite+main before repairs: **1943 passed /105 failed**, 38 failed files, **108 named failures** including three suite loads. The earlier reviewed109-name result differs only by the timezone-sensitive walkthrough test, which passes here under UTC; that implementation/test was not changed.

Before the approved audit repair, source head `fc6bd2bb` had **2002 passed /86 failed**, with 86 named failures and no suite-load failures. It had 22 removed names and one new/unallowed name: `lib/estimates/__tests__/public-acceptance.contract.test.ts > public estimate acceptance contract > records the public response in the audit trail`.

After the approved audit repair, the same branch working tree runs **2004 passed /85 failed**, 28 failed files, **85 named failures**, and no suite-load failures. The unchanged exact-name checker passes: zero new names, and the previously allowed deposit-invoice failure is absent. Compared with the pre-audit run, the public audit failure is also gone. No baseline was edited. See `failure-comparison.json` for complete current names and log hashes.

## Verification executed

- Frozen/offline `pnpm install --frozen-lockfile --offline --store-dir /tmp/titan1152-pnpm-store`: passed. Cache paths were redirected into `/tmp`; initial native dependency install failed on a read-only home cache, then succeeded without changing dependencies or suppressing build scripts.
- `pnpm --filter @titan-zero/web test` on Node22.23.3 / pnpm9.12.0: **2004 passed /85 failed**. `python3 .github/scripts/check-web-test-baseline.py --baseline .github/ci/web-test-baseline.json --log /tmp/titan1152-web-full.log --command-status 1`: passed exact-name comparison (85 current /86 allowed; zero new; one allowed failure removed).
- `pnpm --filter @titan-zero/web typecheck`: strict Next typegen + TypeScript passed after the final test source changes.
- `pnpm --filter @titan-zero/web lint`: passed with existing warnings; no new lint warning from the audit change.
- Broad targeted selection:186 passed/1 failed; the failure is the unchanged allowed `response endpoint does not require PostgreSQL RETURNING or set_config` test. Initial repaired harness/vocabulary/environment selection72/72; capture/session selection35/35; IndexedDB/change-order selection5/5. Final full suite includes all new unit tests.
- PostgreSQL16 disposable integration:4/4 passed on Node22.23.3 / pnpm9.12.0. It loads the committed audit table DDL plus trace migration, applies migration189, preserves an existing named actor, writes the anonymous portal audit, proves transaction rollback on audit failure, serializes concurrent responses to one200/one422, preserves the other company, and retains the account FK. MySQL8 disposable integration:1/1 passed on the same toolchain; it loads the committed `db/mysql/002_auth_clients_portable.sql` audit table definition, applies migration020, preserves `CHAR(36)`, existing actor, account FK and indexes, and accepts an anonymous row. Each test creates and drops an isolated test schema/database. No live company migration was run.
- `pnpm gate:fast` and `pnpm gate`: both stop at five existing worker no-unused-expressions lint errors, owned by #1149. Later full-matrix stages were not passed. No worker changes made.
- `NODE_OPTIONS=--max-old-space-size=1536 pnpm --filter @titan-zero/web build`: full production build passed after the route change, including strict types, route/page generation and build traces.
- `git diff --check`: passed.

## Critical correction and blocker

The anonymous actor migration and mandatory portal audit are now approved and implemented on this branch. Do not revert the nullability migrations after any truthful anonymous actor rows are written; reimposing `NOT NULL` would require a separately approved provenance-preserving plan. Reverting application behavior remains possible without deleting evidence.

The material unresolved blocker is the restricted-role token lookup. `POST /api/portal/estimates/[token]` selects/locks by `share_token` before setting `app.current_account_id`; the current estimate RLS policy returns no row to `ai_fsm_web`. The disposable route integration runs as the schema owner and does not certify restricted-role behavior. Canonical TASK-146 calls for bounded token-to-account resolution; #302 and #648/#809 have been asked for the existing identity/storage contract. This patch adds no resolver or bypass policy, and it does not certify the current global PostgreSQL pool as per-company physical storage. The email-response NULL-audit writer still catches and logs audit failure; its transactional correction is a separate coordinated path.

Other shared gate dependencies remain separately owned: current-main sync requires #1179 owner coordination; worker failures remain under #1149/#1219; identity/session issuance stays under #302/#1183. No live database migration, host/provider/device acceptance, merge, or mission-completion claim was made. Capture history and other company's rows remain preserved.
