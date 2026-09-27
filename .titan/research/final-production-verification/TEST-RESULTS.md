# Final Production Verification — Test Results

## Pass 4 — focused cross-system proof

Focused workflow: `Agent 4 Final Production Verification`, run `36301314908`.

The run used the Agent 4 acceptance harness together with the exact relevant Agent 1 draft fixes from PR #801 staged temporarily on the verifier branch. These copies are verification inputs, not Agent 4 ownership and must not remain as competing implementation changes.

### Passed

- Canonical cleaning-business convergence acceptance: **1 passed, 0 failed**.
  - Scenario: `Emma is sick tomorrow. Sort it out.`
  - Exercises SQLite business state, canonical workforce, persistent Agent Runtime, governed execution, canonical visit reassignment, evidence, company isolation, and close/reopen recovery.
- `services/workforce`: **3 passed, 0 failed**.
  - Includes company-scoped lifecycle, authority-required approval wait, delegation without authority grant, and cycle rejection.
- legacy/duplicate `packages/workforce`: **14 passed, 0 failed** after preserving native SQLite `?` parameter binding in `StorageClient`.
- persistent Agent Runtime + SQLite RunStore: **14 passed, 0 failed**.
  - Includes file reopen recovery for `WAITING_APPROVAL` / `WAITING_EXTERNAL`, terminal exclusion, company isolation, authority denial, cancellation, provider/tool failure, and fail-closed unverified outcomes.
- ExecutionGateway contract suite on current main contract: **5 passed, 0 failed**.
  - Includes authority gating, evidence + duplicate suppression, credential rejection, Browser Node company/domain boundaries, and MCP discovery neutrality.

### Defects proven during this pass

1. Current-main runtime continuation did not return to `RUNNING` after a verified tool execution. Agent 1 PR #801 contains the matching fix and the final E2E passes with it staged.
2. Canonical workforce did not permit `READY -> WAITING_APPROVAL` when authority was unsatisfied. Agent 1 PR #801 contains the matching fix and the workforce suite passes with it staged.
3. The original SQLite RunStore test adapter incorrectly bound numbered placeholders. Agent 1 PR #801 contains the corrected adapter plus real file-reopen coverage; runtime suite passes 14/14 with it staged.
4. Canonical `packages/storage/src/index.ts` dropped all bound parameters when SQL already used native SQLite `?` placeholders. This caused the older `packages/workforce` implementation to fail 14/14. A verifier patch preserving native positional parameters makes all 14 tests pass.
5. Two workspace packages are currently named `@titan-zero/workforce`: `services/workforce` and `packages/workforce`. Both now execute under `pnpm --filter @titan-zero/workforce test`. This duplication must be explicitly converged rather than treated as two canonical workforce implementations.
6. Root `pnpm-lock.yaml` remains stale relative to the root `better-sqlite3` declaration, so normal frozen-lockfile CI remains a release blocker. The focused verifier intentionally uses `--no-frozen-lockfile` so architecture tests can execute.

## Pass 5 — Agent 2 independent-verification convergence

Focused workflow: `Agent 4 Final Production Verification`, run `36301767065`.

This run combined the exact relevant Agent 1 PR #801 runtime/workforce recovery changes with the exact Agent 2 PR #799 ExecutionGateway, MCP and Browser Node changes. The Agent 4 cleaning harness was corrected so native execution returns an acknowledgement only and a separate verifier independently re-reads canonical visit state.

### Passed

- Cleaning-business E2E with independent canonical post-action verification: **1/1 passed**.
- `services/workforce`: **4/4 passed**.
- duplicate/older `packages/workforce`: **14/14 passed**.
- persistent Agent Runtime + SQLite RunStore: **14/14 passed**.
- hardened Agent 2 ExecutionGateway/MCP/Browser contract suite: **8/8 passed**.

### Agent 2 invariants proven

- A provider acknowledgement cannot verify itself; failed independent verification records `OUTCOME_UNVERIFIED` evidence.
- MCP acknowledgement without a separate resource verifier fails closed.
- MCP discovery remains descriptive and does not grant authority.
- Browser Node remains company/domain scoped and external page content remains untrusted.
- Concurrent identical execution requests invoke the provider once; same idempotency key with a conflicting payload fails closed.
- Execution evidence now carries `run_id`, `decision_id`, a request digest and verifier output.

### Important boundary

This pass certifies PR #799's contract semantics when composed with the current converged SQLite/runtime/workforce path. It does **not** certify durable atomic idempotency across process crashes, live MCP/Browser/native production providers, or restart in the middle of an already-effected provider mutation; PR #799 explicitly leaves those as remaining gaps.

### Not yet production-certified

- Agent 1 PR #801 remains a separate draft until merged.
- Agent 2 PR #799 remains a separate draft until merged.
- Exactly one canonical workforce implementation still needs to be selected/converged.
- Zero chat -> persistent runtime production composition is still being completed separately.
- Live native/MCP/Browser Node provider bindings, durable cross-process idempotency, restart during consequential execution, frozen-lockfile repair, and full SQLite-only application boot remain release gates.
