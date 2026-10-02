# Worker contract repair — issue 1149

This is a non-closing implementation slice for [#1149](https://github.com/Masterleeaus/Titan-Zero-Field-Service-Workforce/issues/1149). It repairs the worker regression suite and bounded notification delivery, without changing regression baselines, migrations, web/platform code, or production data.

## Scope and provenance

- Canonical claim: `agent/issue-1149`, initially based on `ecfa91b558672c87a279012461237fbdf6af3a80`; synchronized to `45bcd75caa256e05433ea372f4b3239b6811b4ab`, then to `8a889c101ec749ba6e86879ed96d30ca1261bdc5` before publication. The final worker suite, typecheck and lint were rerun after synchronization.
- Existing owners retained: `DatabaseClient`, the worker database adapters, `notification_queue`, `notification_delivery_attempts`, automation producers, notification governor, and SMTP transport.
- PRs #1150/#1151 were inspected, not merged. Their proposed notification claim contained an unbound `$6` and unsafe retry/recovery behavior.
- No real email was sent. Tests use a mocked SMTP provider and disposable local databases.
- `account_id` remains the existing compatibility boundary in this legacy worker. This patch does not claim global identity or per-company physical-storage convergence, which remain with the canonical security/runtime owners.

## Behavior repaired

1. Correct stale test doubles to return the actual database row contract. Preserve portable timestamp windows and parsed JSON cadence matching; test actual SQLite cadence, default/custom reminder windows and company isolation.
2. Claim bounded batches in short transactions before provider I/O. Bind every lease/outcome mutation to notification ID, company and lease.
3. Preserve attempt counts on governor delay and safe requeue. Record numbered attempts and provider message references atomically with queue disposition, cooldown and communication history.
4. Recover only explicit pre-provider claims. Quarantine expired legacy/in-flight claims and ambiguous SMTP outcomes instead of blindly resending.
5. Prevent stale enqueue reads from reopening quarantined work or replenishing retry budgets. Preserve PostgreSQL array bindings and use MySQL-specific guarded upsert syntax; reread MySQL state because FOUND_ROWS can report a no-op as affected.
6. Coalesce overlapping polls for the entire shared worker connection, and direct dispatcher calls per client. This prevents one poll's rollback from undoing another poll's already-sent marker.
7. Replace five unused conditional counter expressions with equivalent if/else statements.

The legacy attempt status `delivered` and queue status `sent` mean SMTP transport acknowledgement here. They do not prove recipient delivery, a verified business outcome, or acceptance by the Business Evidence Ledger.

## Executed verification

Final environment: official Node.js **22.23.3**, matching CI's Node 22 major; pnpm **9.12.0**; Vitest **3.2.4**; existing worker better-sqlite3 **11.10.0**, rebuilt for that runtime.

The isolated runtime was downloaded from the official Node.js distribution and verified against its published SHA-256: `df450af89261115ef9f9e3830c3eeb2cc9213b63c720b1af623cb5dcbe2e02de` for `node-v22.23.3-linux-x64.tar.xz`.

| Command/check | Result |
|---|---|
| Untouched worker source at initial claim base, normal package working directory, same Node 22 runtime | **35 failed / 46 passed**, reproducing the issue |
| `pnpm --filter @titan-zero/worker test` | **116/116 passed, 17 files**, three consecutive full runs |
| `pnpm --filter @titan-zero/worker typecheck` | Passed |
| `pnpm --filter @titan-zero/worker lint` | Passed |
| `pnpm --filter @titan-zero/worker build` | Passed |
| `python3 .github/scripts/check-worker-test-baseline.py --baseline .github/ci/worker-test-baseline.json --log <final worker log> --command-status 0` | Passed: **current=0, baseline=24**; baseline file unchanged |
| `git diff --check` | Passed |

Red-to-green evidence includes all 15 original new SQLite delivery cases, the enqueue/quarantine interleaving, retained retry budget, wrong-company enqueue, shared-client dispatch overlap, actual timer poll overlap, SMTP outcome classification, and MySQL no-op reporting. Independent review identified the two enqueue/poll duplicate-send races; both gained regressions and were fixed before publication. Additional independent SQLite stale-lease/company/late-acknowledgement probes passed.

The SQLite delivery tests execute the real worker adapter against a **fixture schema derived from existing queue contracts**. They are not an execution of a canonical SQLite notification migration. Real PostgreSQL/MySQL server execution and fresh deployment remain unrun.

## Failed or blocked verification

- Initial Node 24.19.0 runs included clean 100/105/111-test stages, but later repeated runs intermittently aborted in better-sqlite3 11.10.0 `Statement::~Statement` / `RemoveEnvironmentCleanupHook`. **Node 24 compatibility is not certified.** The final repeated green result is specifically Node 22.
- `pnpm test` was attempted and blocked by the inherited Workforce tsx IPC `listen EPERM` in this sandbox. It is not claimed green.
- Both `pnpm gate:fast` and `pnpm gate` now get past worker lint, then fail at existing duplicate migration prefixes **151, 152, 177, 178, 179, 180, 181, 182, 183**. Later gate stages were not reached. No potentially applied migration was renumbered.
- Dependencies were installed in the isolated checkout using `--no-frozen-lockfile --ignore-scripts`; the generated lockfile was restored unchanged. This is not a fresh frozen-install certification. Native SQLite was rebuilt using the existing package sources.
- No Docker, live PostgreSQL/MySQL server, commissioned host, actual SMTP server, production migration, or deployed company data was used.
- Trusted current-head GitHub CI is still required. General web/platform/Workforce, release and migration blockers remain with their existing owners.

## Compatibility and rollback

No schema migration is introduced. PostgreSQL/MySQL deployment requires their existing queue/lease/attempt schemas; missing schemas fail before provider work. SQLite migration parity remains a separate unmet prerequisite.

Unknown delivery outcomes intentionally remain dead-lettered for explicit reconciliation. Reverting code would restore known duplicate-send and retry-budget risks; do not clear quarantine or reset attempt history to make a deployment appear healthy. No automatic recovery of ambiguous SMTP acceptance is claimed.

Keep #1149 open until required integration and current-head CI evidence are complete. A green worker suite alone is not whole-repository or deployment readiness.
