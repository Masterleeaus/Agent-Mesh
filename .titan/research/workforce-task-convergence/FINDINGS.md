# Workforce / Task Convergence — Findings

## Titan scan

Repository authority was read before modification. `AGENTS.md` requires issue claim + `agent/<issue>` isolation and preserves the authority invariant. `.titan/HEAD.json` currently identifies the repository as `Titan-Zero-Field-Service-Workforce` and the active head lineage.

The current default-branch code search did not reveal one implemented canonical internal AI-work item service with validated lifecycle, dependency graph, claiming and wake semantics. Existing repository concepts remain architectural inputs: company-scoped workforce, Nexus/orchestration, capability architecture, Signal/events, Decision/authority and field-service business jobs. This convergence therefore adds a narrow canonical workforce service rather than replacing the business job domain or creating a new reasoning runtime.

## OpenAcme donor scan

OpenAcme implements a concrete task package (`packages/tasks`). Its useful mechanisms include typed task status, assignee/creator/team fields, parent tasks, dependencies, comments/events, recurring metadata, assignment/claiming concepts and a task store. These mechanisms exist to let agents coordinate asynchronously around persisted work rather than keeping work only in a chat turn.

OpenAcme is MIT licensed (copyright 2026 sandydasari). This implementation is an adaptation of behaviours/contracts rather than a wholesale source copy. No OpenAcme database or runtime is imported.

## Critical boundary

Internal AI workforce work is **not** a field-service customer job. Human cleaners remain business-domain people. Digital workers are runtime-addressable intelligence workers. Delegation/assignment never changes authority.

`Intelligence != Recommendation != Decision != Delegation != Authority != Execution`.
