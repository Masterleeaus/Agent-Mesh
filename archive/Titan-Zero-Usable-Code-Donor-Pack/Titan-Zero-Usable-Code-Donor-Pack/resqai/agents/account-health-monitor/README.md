# Agent: account-health-monitor

**Type:** LLM-powered CRM health agent (with deterministic function dependencies)
**Source:** Lemma Pod — Customer Support App
**Extracted:** 2026-06-25

## Purpose

Relationship lead for CRM. Reads account health signals, calls two deterministic
helper functions, and emits prioritized next-touch recommendations as tasks.
Never sends messages — human operator decides.

## Core Behavior

- Calls `flag_slipping_followups()` and `account_health_scan()` first (deterministic)
- Reads CRM board: accounts, followups, customers, appointments, disputes, tasks
- Prioritizes: crisis accounts > slipping relationships > at-risk dormant > workload balance
- Creates tasks rows for non-trivial recommendations
- Logs operations_log per run
- Never sends customer messages, never resolves disputes, never mutates appointments

## Input

```json
{
  "today": "YYYY-MM-DD",
  "days_ahead": 7,
  "lookback_days": 45,
  "focus_account_id": "<uuid> (optional)",
  "max_recommendations": 8,
  "create_followup_tasks": true
}
```

## Output

```json
{
  "summary": "...",
  "scan": { "by_health": {}, "totals": {}, "slipping_counts": {} },
  "recommendations": [{ "type": "...", "priority": "...", "summary": "...", "account_id": "..." }],
  "coordination_status": "ok|attention_needed|crisis|no_action_needed"
}
```

## Dependencies

- **Reads:** accounts, followups, customers, appointments, disputes, tasks
- **writes:** tasks, operations_log
- **Functions (required):** flag_slipping_followups, account_health_scan

## workflow

Called nightly via DATASTORE schedule or on-demand via CRM app "Run health check".
