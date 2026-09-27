# Workforce / Task Convergence — Status

Issue: #783  
Claim: `agent/workforce-task-convergence`  
Base: `173a8b7f0298b61bf061f25efd8cc72652f4054e`

## Scope

Agent 3 owns workforce, internal work items, delegation, dependencies, manager decomposition, claiming, dispatcher/wake contracts, recurrence and escalation. Storage remains Agent 1 authority; reasoning/runtime remains Agent 2 authority; memory Agent 4; Browser/MCP Agent 5; Zero Agent 6; authority audit Agent 7.

## Implemented

- Canonical company-scoped internal `WorkItem` lifecycle in `@titan-zero/workforce`.
- Persistent workers, work, dependencies, events and recurring occurrence records through `@titan-zero/storage`.
- Explicit human/digital worker distinction.
- Dependency gating and circular-dependency rejection.
- Safe claim transition using a conditional SQLite update inside an immediate transaction.
- Delegation/decomposition without authority inheritance.
- Waiting/resume, escalation, capability routing and event-driven dispatcher entry point.
- Agent Runtime adapter boundary; no second LLM loop.
- Structured workforce events and evidence/context references.

## Invariant

`Intelligence != Recommendation != Decision != Delegation != Authority != Execution`.

Assignment, claim, registration, activation and delegation never mutate or grant an authority envelope. `authorityRequirement` is declarative metadata for the canonical authority/decision layer to satisfy before consequential execution.
