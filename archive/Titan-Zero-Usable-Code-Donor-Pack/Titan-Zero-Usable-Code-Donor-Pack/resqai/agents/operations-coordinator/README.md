# Agent: operations-coordinator

**Type:** LLM-powered operational orchestration agent
**Source:** Lemma Pod — Customer Support App
**Extracted:** 2026-06-25

## Purpose

Chief of staff for operations. Reads the full operational board and produces a
prioritized list of recommended actions for human review. Never takes final action.

## Core Behavior

- Reads board: tickets, appointments, technicians, customers, tasks, operations_log
- Prioritizes: urgent safety > stuck customers > imminent appointments > slipping relationships > overdue tasks > capacity balancing
- Creates tasks rows for non-trivial recommendations
- writes operations_log breadcrumb per run
- Does NOT mutate appointments, close tickets, or resolve disputes
- Does NOT send customer messages

## Input

```json
{ "scope": "daily|weekly|urgent_only", "today": "YYYY-MM-DD", "max_actions": 8, "create_tasks": true }
```

## Output

```json
{
  "summary": "...",
  "recommendations": [{ "type": "...", "summary": "...", "priority": "...", "rationale": "..." }],
  "coordination_status": "ok|attention_needed|crisis|unavailable_data"
}
```

## Dependencies

- **Reads:** tickets, appointments, technicians, customers, tasks, operations_log
- **writes:** tasks, operations_log

## workflow

Called daily at 8am via DATASTORE schedule, on urgent ticket trigger, or on-demand
via the ops dashboard.
