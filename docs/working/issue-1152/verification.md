# Web gate repair evidence — issue 1152

Partial, blocked; no merge or product-completion claim. Canonical branch: `agent/issue-1152`.

## Provenance and integration

Claim created atomically from main `ee1a3ee3709b9201fc728fc162067d9a5ab78e45`, after reading issue/comments, live claims and PRs. `/workspace/.agents` was empty; no local `.agents/skills` existed. Root/apps/web AGENTS, operational invariants, canonical rules/Blueprint and relevant domain vocabulary were inspected.

Prerequisite #1179 commit `743e70789b85571fa0eafb1029630f0cbc6b7eb6` was merged with ancestry retained in `1a6b0804`. The sole conflict was main's Maps timestamp assertion versus the reviewed prerequisite's stronger ISO/offset equivalence assertion; the reviewed prerequisite version was retained. No platform implementation/export/compiler repair was recreated. Worker #1149/#1219 and session issuance #302/#1183 were not edited. Platform #1153 remains separately owned.

For #1179, consume repair commits `6ff55060242ff9928224754a229d69c713a8e059` and `d756d2ad` in order, plus the evidence-only follow-up. Do not cherry-pick the prerequisite merge. Recheck current main and run the same gates after integration; the draft remains partial.

## Changes and reasons

- Capture queue: canonical company context from the authenticated page, encoded company/capture key in the existing IndexedDB store, scoped memory fallback and list/delete, no replay of retained unscoped historical items, server rejection of a queued payload belonging to another company. No database version bump, schema migration or deletion of historical items. Historical nonqueued capture clients remain compatible. IndexedDB recovery is tested with fake-indexeddb6.2.4, added only as a test dependency.
- Navigation: use existing vocabulary and shared standalone destination sanitizer/reachability owner. Canonical docs require Today/Desk; contradictory older presentation tests now assert those accepted labels while retaining routes, active states and role restrictions. External/unsafe/dead destinations remain rejected; malformed cookies cannot crash login. No session issuance changes.
- Harness/fixtures: Vitest-hoisted communications mocks; SQLite parameter tests run under Vitest with real node:sqlite; env assertions use the accepted SQLite default and retain runtime secret/empty URL rejection; approval tests verify application-generated IDs and actual company/job insert positions rather than obsolete RETURNING results.
- Change orders: generate parent/line IDs in application code, lock the company-bound estimate on the same write transaction, preserve money calculation/audit, verify rollback on failed line persistence. This is not certification of all storage dialects.
- Estimate send/transition: remove PostgreSQL count casts; explicitly normalize the count before pricing guardrails.
- Public response: lock before status validation, only sent may transition, conditional update includes company/token/status, reject unsuccessful writes, and guard PostgreSQL RLS context SQL. Existing artifact behavior remains. Real concurrent requests produce one200/one422 with the other company's estimate unchanged.

## Exact web result

Node `v22.23.3`, pnpm `9.12.0`; no baseline changes, test exclusions, production fake data or capability deletion.

Fresh prerequisite+main before repairs: **1943 passed /105 failed**, 38 failed files, **108 named failures** including three suite loads. The earlier reviewed109-name result differs only by the timezone-sensitive walkthrough test, which passes here under UTC; that implementation/test was not changed.

Final source head `d756d2ad`: **2002 passed /86 failed**, 29 failed files, **86 named failures**, no suite-load failures. Exact comparison: **22 removed, zero added**. See `failure-comparison.json` for complete names and log hashes.

The unchanged baseline checker **FAILS** despite86 matching the allowed total86: it compares names. The sole unallowed name is:

`lib/estimates/__tests__/public-acceptance.contract.test.ts > public estimate acceptance contract > records the public response in the audit trail`

One formerly allowed deposit-invoice failure is fixed, so a count-only comparison would incorrectly hide the audit defect. The other85 failures remain existing baseline debt; no all-green test claim.

## Verification executed

- Frozen/offline `pnpm install --frozen-lockfile --offline --store-dir /tmp/titan1152-pnpm-store`: passed. Cache paths were redirected into `/tmp`; initial native dependency install failed on a read-only home cache, then succeeded without changing dependencies or suppressing build scripts.
- `pnpm --filter @titan-zero/web test`: complete result above; exact-name checker fails solely on the audit requirement.
- `pnpm --filter @titan-zero/web typecheck`: strict Next typegen + TypeScript passed on final public-response source.
- `pnpm --filter @titan-zero/web lint`: passed with existing warnings; newly introduced capture dependency warnings were fixed.
- Broad targeted selection:186 passed/1 failed; the failure is the unchanged allowed `response endpoint does not require PostgreSQL RETURNING or set_config` test. Initial repaired harness/vocabulary/environment selection72/72; capture/session selection35/35; IndexedDB/change-order selection5/5. Final full suite includes all new unit tests.
- PostgreSQL16 disposable integration:2/2 passed. First proves real concurrent response locking and cross-company preservation; second reads the committed core audit DDL and trace migration and proves null actors are rejected with23502. Docker Hub was rate limited; the official image mirror `public.ecr.aws/docker/library/postgres:16-alpine` succeeded (digest `sha256:721873c34ceb9f8d8fc265984940dc982404c105f19ad51be9fdc5970a6080ea`). Only an isolated test schema was created/dropped. This is not live company migration or full RLS/provider certification.
- `pnpm gate:fast` and `pnpm gate`: both stop at five existing worker no-unused-expressions lint errors, owned by #1149. Later full-matrix stages were not passed. No worker changes made.
- `NODE_OPTIONS=--max-old-space-size=1536 pnpm --filter @titan-zero/web build`: full production build passed on final source d756d2ad, including strict types, route/page generation and build traces.
- `git diff --check`: passed.

## Critical correction and blocker

A provisional audit change and85-failure result were withdrawn before publication: the TypeScript helper allowed null actors, but the committed PostgreSQL/MySQL schemas forbid them. An initial simplified disposable fixture incorrectly allowed null. The corrected integration loads the committed audit DDL and reproduces the real failure. No unapproved null-audit implementation or permissive production schema is in this branch.

The current public route still lacks its required audit record. Adding null would break valid approvals; assigning the owner would fabricate provenance; swallowing failure would hide missing evidence. The concrete proposed repair and rollback limits are in `anonymous-audit-plan.md`. User/parent approval is required before new migrations, per the delegated instruction. This issue stays open and the PR stays draft/non-closing.

Physical public-token→canonical-company→registered operational storage convergence remains with #648/#809/#302 as applicable. Existing global PostgreSQL compatibility paths are not certified as physical company storage by this patch. No shared SQLite fallback, new resolver, authority engine or session issuance was added.

Rollback: revert the two repair commits in reverse order; preserve prerequisite ancestry. Capture records newly saved under encoded keys remain in the same IndexedDB store; do not reattribute or delete unscoped historical records. No production database migration was executed. No live host/provider/device acceptance was performed.
