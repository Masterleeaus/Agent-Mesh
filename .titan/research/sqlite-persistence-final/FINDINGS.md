# Findings

## Pass 1

1. `packages/storage/src/index.ts` already establishes SQLite as the canonical local storage implementation, but file-backed startup could fail when the default parent directory did not exist. Fixed.
2. `services/worker/src/db-runtime.ts` already defaults to SQLite and does not require `DATABASE_URL` in that mode. Its default `./data/titan-zero.sqlite` had the same missing-parent-directory bootstrap risk. Fixed.
3. `packages/runtime/agent-runtime/sqlite-run-store.mjs` persists `company_id`, `run_id`, state, `conversation_id`, `agent_id`, `work_id`, the full runtime payload, and `updated_at`.
4. Runtime recovery currently permits an unscoped `recoverable()` query when no company is supplied. This is a tenancy-audit target; changing it requires checking all production recovery callers first.
5. `services/workforce/src/sqlite-store.ts` uses composite `(company_id, work_id)` and `(company_id, worker_id)` keys and company-scoped queries.
6. PostgreSQL/MySQL compatibility still exists in the worker database runtime. Compatibility is not currently the SQLite default, but PostgreSQL-specific SQL remains in dialect branches and requires a broader behaviour-preserving audit.

## Pass 2

7. The existing SQLite run-store test's positional SQL adapter was invalid (`?1` with positional spread) and failed even before restart assertions. Corrected the test adapter and added a file backed reopen test.
8. The in-memory reference RunStore passed `structuredClone` to `Array.map`, causing recovery to throw on Node 24.
9. After a verified tool result, the runtime did not transition from `WAITING_TOOL` to `RUNNING`, ending a multi-turn run without a result. An unverified execution outcome escaped the failure transition because a nested promise was returned without awaiting it. Both paths are fixed and covered by existing runtime tests.
10. Repository search found declarations of `SqliteRunStore` and `SqliteWorkforceStore` but no non-test callers; production wiring remains unproven.

## Pass 3

11. `WorkforceService.claim` attempted `READY -> WAITING_APPROVAL` after an unsatisfied authority check, but its transition table rejected that path. Added the transition; authority remains mandatory.
12. Reopening a SQLite workforce file preserves worker registration, blocked dependency, context/evidence references and an expired claimed lease; recovery returns the item to READY without executing it.

## Pass 4

13. `apps/web/lib/db/sqlite.ts` previously replaced each `$n` with `?` but passed the original parameter array. Repeated or out-of-order parameters bound incorrectly or raised a parameter-count error. The existing client now expands values in SQL occurrence order and rejects unbound indices.
14. Web legacy `lib/db.ts` and `lib/push/send.ts` still instantiate PostgreSQL pools, and many routes import the legacy layer. This remains a whole-stack SQLite-only startup gap; converting these paths requires endpoint-level SQL and behavioural review.
