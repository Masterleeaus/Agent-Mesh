# Final Production Verification — Test Results

## Pass 3 — first executable cleaning convergence harness

PR: #797 (`agent4/final-production-verification`)
Scenario: `Emma is sick tomorrow. Sort it out.`

### Focused workflow run 36300098080

Result: **blocked before tests**.

`pnpm install --frozen-lockfile` failed because root `package.json` contains `better-sqlite3` while the committed `pnpm-lock.yaml` root specifiers do not. This is a genuine production-readiness/build-reproducibility defect, not an Agent 4 test failure.

The focused Agent 4 workflow was changed to use `--no-frozen-lockfile` temporarily so the acceptance harness can execute. This does not waive the lockfile defect for final certification.

### Focused workflow run 36300257580

Dependency installation: **PASS** using `pnpm install --no-frozen-lockfile`.

Cross-system acceptance test: **FAIL**.

Failure:

`TypeError: Cannot read properties of undefined (reading 'state')`

at the assertion checking the return from `TitanAgentRuntime.start()` after a verified `visit.reassign` execution.

The failure is real cross-system evidence. The test had already composed canonical SQLite data, persistent WorkItem storage, persistent RunStore, governed execution and independent canonical visit re-read verification.

### Root cause ownership

Concurrent Agent 1 PR #801 independently identifies the same runtime defect:

- after a verified tool result, runtime remained in `WAITING_TOOL` instead of transitioning back to `RUNNING` for the next model turn;
- Agent 1 has a bounded repair and focused runtime regression coverage.

Agent 4 will not duplicate that core runtime change. PR #797 remains based on `main` and will be rerun after the Agent 1 fix converges.

### Certification state

NOT READY.

What is proven:
- the focused CI can install and execute the new acceptance harness;
- the harness catches a genuine runtime integration defect instead of accepting a provider acknowledgement as success;
- current `main` cannot yet complete the canonical cleaning scenario through persistent runtime execution.

What remains:
- rerun #797 after Agent 1 runtime fix merges;
- then exercise workforce, runtime and ExecutionGateway regression suites in the same focused workflow;
- expand to approval/resume, failure/idempotency and cross-company attack scenarios;
- later include Zero/Interaction/Memory/communications as Agents 2/3 converge those production seams.
