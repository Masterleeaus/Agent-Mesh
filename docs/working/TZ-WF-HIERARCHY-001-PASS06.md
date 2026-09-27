# TZ-WF-HIERARCHY-001 — Pass 06

Implemented the hierarchy-aware delegation envelope over the existing Manager → Supervisor → Agent → Worker runtime.

## Outcome
- Carries company, Manager, Supervisor, domain, Agent, Worker/task and Manager-objective ancestry.
- Carries idempotency, correlation/root/parent/source-event causality context.
- Carries an explicit authority ceiling that may contract but may never expand relative to the originating ceiling.
- Identity, hierarchy and delegation still confer no execution authority.
- Execution remains behind authority evaluation + capability resolution and existing Business Ops routes/domain services.
- Adds an adapter shape compatible with `titan.workforce.delegation-task-envelope.v1` without importing or editing the active delegation lane.
- Reuses the existing workflow/domain runtime as queue owner; no parallel queue or workflow engine introduced.

## Verification
- Focused hierarchy suite: 21/21 PASS.
- TypeScript emitted compilation: PASS.
- Cross-company worker ancestry: rejected.
- Authority-ceiling expansion: rejected.
- Delegation bridge compatibility shape: verified.
