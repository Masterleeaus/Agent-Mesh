# Findings

## Current runtime is already materially converged
`TitanAgentRuntime` is not a stub. It has a durable state machine, company isolation, context loading, capability resolution, authority gating, resumable execution waits, evidence-aware completion and recovery.

## Important verified behavior
1. `company_id` is canonical inside runtime. Legacy `tenant_company_id` / `tenant_id` are accepted only by normalization and conflicts fail closed.
2. Context is loaded with company, actor, agent, conversation and work identity before model reasoning.
3. Runtime never directly invokes a consequential capability after model selection; it requests authorization then delegates execution through `authorityGateway.execute`.
4. Approval is represented as `WAITING_APPROVAL`; pending tool call + decision are persisted in `run.wait`.
5. Resume can use `authorityGateway.resume` for an existing execution, avoiding duplicate provider actions.
6. A provider acknowledgement without verification is rejected as an unverified outcome.
7. Existing tests cover approval resume, external waits, MFA resume, cross-company rejection, denied authority, cancellation and unverified outcome failure.

## Gaps to close in following passes
- Runtime event envelope currently needs audit for complete `work_id → decision_id → execution_id → evidence_id` projection to Zero.
- Zero must subscribe before dispatch so `run.started` / early progress cannot be lost.
- Zero live-state projection must be checked for mocks/placeholders and canonical company scoping.
- Workforce READY digital-worker dispatch must be traced to this runtime rather than inferred.
- Approval UI must resume the same run/work and must survive restart through the existing persistent store.
- Personal Zero influence must be limited to presentation/default/context and never be treated as authority.

## Coordination boundaries
Do not replace SQLite/recovery (Agent 1), execution providers (Agent 2), or final cross-system certification (Agent 4).