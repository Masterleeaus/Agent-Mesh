# Governed execution recovery

`packages/tools/execution-gateway.mjs` remains Titan's only authority, provider
execution, verification, and evidence-emission boundary. The recovery contract
adds lifecycle persistence around that gateway; it does not execute business
state directly or create a second Rewind engine.

## Lifecycle

`STARTED → RESUMED → RUNNING → COMPLETED` is persisted as an append-only
lifecycle history. `FAILED` remains retryable, while `VERIFIED` and `DENIED`
are terminal. A restart loads the company-scoped record and resumes through the
same gateway, so authority and provider verification are re-evaluated at the
time of the attempt.

## Recovery invariants

- Every lifecycle record is keyed by `company_id + execution_id`.
- Cross-company lookup and recovery fail closed.
- Retry is a new governed attempt and must retain a distinct idempotency key when
  the caller is retrying a provider operation.
- Authority, approval, and revocation failures return the lifecycle to `READY`
  without recording a false business failure; the caller must obtain fresh
  authority before trying again.
- Compensation requires a new execution ID and capability, links to the
  original execution with `compensation_of`, and traverses the gateway again.
- Provider acknowledgement remains intermediate; only the gateway's verified
  result can make the lifecycle `VERIFIED`.

`InMemoryExecutionLifecycleStore` is a reference contract for tests and local
runtime use. Production deployments should supply a durable store implementing
the same `get`, `find`, `put`, `append`, and `history` methods.

