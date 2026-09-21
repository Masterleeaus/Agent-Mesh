# TZ-WF-HIERARCHY-001 — Pass 5

Implemented native Worker/Specialist runtime contracts beneath standalone Workforce Agents.

## Outcome
- Reused the existing 62 atomic-worker binding semantics as donor evidence rather than replacing that registry.
- Added company-scoped Worker runtime parented to an existing Agent binding.
- Added bounded Worker task contracts with explicit objective, operation, tool allowlist, context references, expected outcome, priority, approval and idempotency state.
- Enforced least-authority tool access: a task cannot request any tool not present in its Worker binding.
- Workers cannot delegate, self-promote or self-hire.
- Worker identity, hierarchy parentage, task assignment and tool binding confer no execution authority.
- Protected work is blocked until declared approval/idempotency requirements are present.
- A ready task only reaches `READY_FOR_AUTHORITY_GATE`; execution remains false until the existing authority and capability layers permit it.

## Ownership
No `workforce-native/**`, delegation-lane, authority-runtime donor, or command-gateway implementation was modified.
