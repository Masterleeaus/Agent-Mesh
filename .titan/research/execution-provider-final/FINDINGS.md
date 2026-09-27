# Findings

## Preserved systems
- `packages/tools/execution-gateway.mjs`: canonical ExecutionGateway.
- `packages/tools/mcp-provider-contract.mjs`: existing MCP-to-Titan capability adapter.
- `packages/tools/browser-node-contract.mjs`: existing Browser Node provider boundary.
- `packages/tools/TOOL-REGISTRY.json`: existing tool/capability registry; no parallel registry will be created.
- `packages/runtime/authority/`: existing authority evaluator/leases; no parallel authority engine will be created.
- `packages/provenance/`: existing provenance/evidence area; gateway evidence must converge here rather than create a second evidence architecture.

## Material gaps on current main
1. Execution lifecycle is under-modelled: only success/failure/denial/wait terminal states are exposed.
2. Consequential completion can currently rely on a provider's own `verified` boolean. That is acknowledgement, not independent business verification.
3. Idempotency cache is in-memory and lost on process/runtime recovery.
4. Evidence is missing required correlation fields including `decision_id` and `run_id` and does not retain a sanitised request/observed-result/final-outcome chain.
5. MCP adapter has discovery and stable mapping, but no explicit timeout/cancellation/retry/auth-wait normalization in the adapter contract.
6. Browser contract has navigation/action primitives, scopes, auth/MFA waits and untrusted-input marking, but concrete execution and provider-independent post-state verification need completion.
7. Communication execution/delivery verification requires tracing to existing communications providers/services before claiming completion.
8. Native schedule/job/customer/worker/payment-follow-up actions require mapping to canonical business services rather than direct datastore writes.

## Safety invariant
Provider availability, MCP discovery, browser authentication and provider acknowledgement never create authority and never imply verified outcome.
