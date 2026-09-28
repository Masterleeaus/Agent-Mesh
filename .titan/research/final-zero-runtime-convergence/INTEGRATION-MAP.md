# Final Zero Runtime Convergence — Integration Map

## Canonical path

ONE → ZERO → Interaction Engine → Context / Memory → Workforce → WorkItem → TitanAgentRuntime → Decision / Risk / Authority → ExecutionGateway → Native / MCP / Browser Node → Verification → Evidence / Outcome → ZERO

## Implemented seams in this convergence branch

### Zero projection
- `/app/zero` loads authenticated company/account-scoped state.
- `apps/web/lib/zero/pulse.ts` reads jobs and canonical `workforce_work_items` state.
- The projection is read-only and does not create authority or operational state.

### Workforce → runtime
- `WorkforceRuntimeAdapter` resolves an existing non-terminal runtime by canonical `(company_id, work_id)` before starting another run.
- Existing correlated work resumes its persistent run.
- A new work-bound run is created only when no recoverable run exists.
- Worker/agent conflicts are rejected rather than silently reassigned.

### Runtime persistence
- `SqliteRunStore` persists `company_id`, `conversation_id`, `agent_id`, `work_id`, state and payload.
- A company/work recovery index supports restart and workforce wake correlation.

### Authority / execution
- Runtime capability calls continue through the existing authority gateway.
- Approval and external wait states remain resumable runtime states.
- Execution acknowledgements are not treated as verified business outcomes.

## Canonical workforce schema confirmed

`workforce_work_items` columns used by Zero:
- `company_id`
- `work_id`
- `state`
- `assignee`
- `updated_at`

Active work is `IN_PROGRESS`. Waiting states include `WAITING`, `WAITING_APPROVAL`, `WAITING_EXTERNAL`, and `BLOCKED` for attention projection purposes.
