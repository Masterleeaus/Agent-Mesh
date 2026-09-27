# Remaining Gaps

Prioritized after Pass 1 current-main runtime inspection.

## P0 — trace and close actual Zero ingress
Find the current Zero chat command path and verify it creates/uses a WorkItem and persistent `TitanAgentRuntime` rather than returning prose from a parallel model path.

## P0 — subscribe before dispatch
Ensure the Zero event consumer is attached before runtime/workforce dispatch so `run.started`, approval and early progress events cannot race past the UI.

## P0 — full correlation
Ensure projections/events retain `conversation_id`, `work_id`, `run_id`, worker/agent, `decision_id`, `execution_id`, `evidence_id` and verified outcome correlation.

## P0 — truthful live projection
Remove any remaining mocked operational cards/counts and derive attention, today's work, exceptions, workers, approvals, decisions, execution progress and verified outcomes from canonical company-scoped stores/services.

## P1 — workforce READY dispatch
Verify existing capability matching, lease, assignment, delegation, reassignment, escalation and recovery culminate in start/resume of persistent runtime for digital workers.

## P1 — approval UX
Wire bounded approve/reject controls to the same waiting run/work/decision and verify restart-safe continuation.

## P1 — memory and Personal Zero boundaries
Verify authorized scoped context is retrieved before reasoning while memory/preferences never become execution authority or canonical business state.

## P1 — cleaning operations scenarios
Exercise staffing absence, rescheduling, coverage search, attention summary, overdue invoice follow-up and service-quality complaint remediation as orchestrated work, not prose-only answers.

## Explicit non-goals
No new execution engine, authority engine, decision engine, workforce engine, persistence abstraction, memory system or generated-UI source of truth.