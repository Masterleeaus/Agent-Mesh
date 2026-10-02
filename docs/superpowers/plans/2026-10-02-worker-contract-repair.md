# Worker contract repair implementation plan

> For agentic workers: use superpowers:executing-plans to execute this bounded plan and obtain an independent whole-change review before publication.

Goal: repair the existing worker regression suite and notification delivery lease contract without increasing baselines or changing web/platform ownership.

Architecture: preserve DatabaseClient, existing notification_queue and notification_delivery_attempts, and existing automation producers. Claim work durably before fake-provider I/O, bind every mutation to account and lease, and quarantine ambiguous delivery rather than replaying a possibly sent email. Provider acknowledgement remains transport evidence only.

Tech stack: TypeScript, Vitest, existing SQLite/PostgreSQL/MySQL adapters.

Spec: GitHub mission #1149 and root/services AGENTS.md. Existing PRs #1150/#1151 are overlapping historical proposals, not approved implementations to copy.

## Global constraints
- Only services/worker and this work's evidence; no web/platform/lockfile/baseline changes.
- No real email, production database, credentials, or host mutations.
- Local branch agent/issue-1149 started from ecfa91b558672c87a279012461237fbdf6af3a80.
- Claim comment and publication approval confirmed; canonical issue claim: https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/issues/1149#issuecomment-5943597864

## Review focus
- Lease expires before versus after a provider may have accepted the message.
- Two workers, stale lease ownership, and wrong-account update attempts.
- Missing SQL parameters, dialect-specific syntax, and real SQLite execution.
- Governor delay must not consume or refund a provider attempt.
- Provider acknowledgement followed by a database failure must not trigger duplicate delivery.

## Task 1: reproduce and repair test-contract drift
Files: services/worker/src/{visit-reminder,invoice-followup}.test.ts and automations/lifecycle.test.ts; new real-database tests where needed.
- Run the unchanged worker suite and record failure names.
- Add deterministic clock assertions and real SQLite cadence/idempotency/tenant checks before altering production behavior.
- Preserve portable timestamp parameters and JSON-value cadence checks; correct mocks to the actual DatabaseClient row contract rather than making production accept malformed results.
- Run the complete worker suite and document remaining notification failures.

## Task 2: durable notification delivery
Files: services/worker/src/notification/{dispatch,enqueue,governor}.ts and tests; mailer.ts and tests; existing index.ts plus a process-local single-flight guard and poll-isolation test.
- Write failing tests for committed claims, exact SQL binds, lease ownership, expiry, no duplicate send after ambiguity, retry limits, provider receipts, governor delay, and company-bound persistence.
- Execute real disposable SQLite tests with a mocked provider, then implement the smallest portable queries using existing queue columns.
- Maintain bounded claim batches, no database transaction across provider I/O, atomic outcome/attempt persistence, and explicit failure reporting.
- Run complete worker tests and typecheck; do not treat mocks as PostgreSQL/MySQL deployment certification.

## Task 3: lint and verification
Files: five existing counter-expression locations in booking-confirmed.ts, client-reactivation.ts, estimate-followup.ts, invoice-followup.ts and review-request.ts.
- Replace unused conditional expressions with equivalent if/else statements.
- Run worker lint, typecheck, build and full tests. Attempt applicable repository gates; identify inherited failures separately.
- Re-read current main and review the complete bounded diff. Preserve parent-owned fixes and no baseline changes.

## Task 4: independent review and handoff
- Request an independent review with actual test evidence and unrun dialect/host limits.
- Fix any consequential findings with failing regression tests first.
- Prepare a non-closing draft and mission evidence. Publish only after the explicit publication approval is resolved.
