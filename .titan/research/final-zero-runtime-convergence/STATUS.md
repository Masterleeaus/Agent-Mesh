# Final Zero Runtime Convergence — Status

## Pass 1 — current-main archaeology + first runtime fix

Status: **IN PROGRESS**

This workspace is grounded from CURRENT `main`, not prior agent reports.

### Confirmed on current main
- `packages/runtime/agent-runtime/` contains the canonical `TitanAgentRuntime` and durable SQLite RunStore.
- `services/workforce/` contains WorkItem/workforce state plus `SqliteWorkforceStore` and an existing workforce→runtime adapter.
- `packages/tools/execution-gateway.mjs` is the canonical bounded-provider execution gateway and explicitly refuses to infer authority from provider/tool availability.
- Browser Node and MCP provider contracts already exist under `packages/tools/`; no parallel registry/provider architecture is required.
- Runtime canonicalizes legacy tenant ingress to `company_id` and scopes run lookup/save by `company_id`.
- Runtime context is loaded through an injected context provider; capability requests are mediated by the authority gateway rather than directly invoking MCP/browser/native providers.

### Pass 1 implementation
Commit `2642339575e214fe204e5e3ae0130851234fdb4b` fixes a real runtime/execution state propagation gap:

1. Added explicit persistent runtime states `WAITING_USER_AUTH` and `WAITING_MFA`.
2. Canonical ExecutionGateway wait results (`WAITING_APPROVAL`, `WAITING_USER_AUTH`, `WAITING_MFA`, `WAITING_EXTERNAL`) now pause the runtime rather than being treated as completed tools.
3. `DENIED` execution results are returned to the model as denied, not success.
4. `FAILED` execution results fail the run rather than becoming false tool completion.
5. Gateway evidence IDs propagate into `tool.completed` runtime events.
6. Execution calls retain `company_id`, `work_id`, `agent_id`, and `run_id` correlation.
7. Recoverable run metadata now exposes work/conversation/agent correlation needed for restart convergence.

### Critical gaps for next pass
- `services/workforce/src/runtime-adapter.ts` currently calls `runtime.start()` every time READY work wakes a digital worker. It must locate/resume the correlated persistent run where one exists instead of creating duplicate runs.
- Approval resume semantics still need to be traced end-to-end: stored pending call → fresh authority validation → execution → evidence → model continuation.
- Zero route/API/projection wiring still needs current-main tracing; historical `/app/zero` is not assumed to be a literal path.

### Verification
No test-pass claim is made. This session's GitHub connector supports source inspection and commits but not shell execution. Tests will be added/updated, and actual runner evidence is required before TEST-RESULTS can mark them passing.
