# WORKFLOW_RETRIES.md — ResQAI V2 Enterprise Workflow Layer

> Generated: 2026-06-30 | Phase: B.6 Enterprise Workflow Layer Integration

---

## Current State

### Workflows WITH Retry Policies

| Workflow | Scope | max_retries | initial_delay_ms | backoff_multiplier | max_delay_ms | retryable_errors |
|----------|-------|------------|-----------------|-------------------|-------------|-----------------|
| appointment-assignment | Workflow | 3 | 2000 | 2x | 30000 | timeout, transient, workload_error |
| appointment-assignment | Node: suggest_technician | 3 | 2000 | 2x | 30000 | timeout, transient, workload_error |
| appointment-assignment | Node: assign_technician | 3 | 2000 | 2x | 30000 | timeout, transient, workload_error |
| customer-satisfaction-monitor | Workflow | 3 | 2000 | 2x | 30000 | timeout, transient, workload_error |
| customer-satisfaction-monitor | Node: collect_tickets | 3 | 2000 | 2x | 30000 | timeout, transient, workload_error |
| customer-satisfaction-monitor | Node: coordinate_review | 3 | 2000 | 2x | 30000 | timeout, transient, workload_error |
| customer-satisfaction-monitor | Node: analyze_resolution | 3 | 2000 | 2x | 30000 | timeout, transient, workload_error |
| customer-satisfaction-monitor | Node: finalize | 3 | 2000 | 2x | 30000 | timeout, transient, workload_error |
| followup-slippage-detector | Workflow | 3 | 2000 | 2x | 30000 | timeout, transient, workload_error |
| followup-slippage-detector | Node: flag_followups | 3 | 2000 | 2x | 30000 | timeout, transient, workload_error |
| followup-slippage-detector | Node: coordinate_review | 3 | 2000 | 2x | 30000 | timeout, transient, workload_error |
| followup-slippage-detector | Node: finalize | 3 | 2000 | 2x | 30000 | timeout, transient, workload_error |
| support-escalation-manager | Workflow | 3 | 2000 | 2x | 30000 | timeout, transient, workload_error |
| urgent-dispatch | Workflow | 3 | 2000 | 2x | 30000 | timeout, transient, workload_error |

### Workflows WITHOUT Retry Policies

| Workflow | Risk |
|----------|------|
| account-health-monitoring | No retry — nightly failure = missed health check |
| account-health (draft) | No retry — draft |
| appointment-reminders (draft) | No retry — draft |
| daily-standup (draft) | No retry — draft |
| dispute-resolution | **No retry** — active workflow |
| followup-slippage (draft) | No retry — draft |
| ticket-intake | **No retry** — active workflow |

---

## Retry Policy Pattern (V2 Workflows)

All V2 workflows with retry share an identical pattern:
```
max_retries: 3
initial_delay_ms: 2000
backoff_multiplier: 2
max_delay_ms: 30000
retryable_errors: ["timeout", "transient", "workload_error"]
```

### Backoff Timeline
```
Attempt 1: 0s (immediate)
Attempt 2: 2s
Attempt 3: 4s
Attempt 4: 8s (or max 30s — not reached)
Total window: ~14s
```

---

## Gaps

| Gap | Severity | Recommendation |
|-----|----------|---------------|
| dispute-resolution has no retry policy | HIGH | Add workflow-level retry_policy matching existing pattern |
| ticket-intake (Active) has no retry policy | HIGH | Add workflow-level retry_policy matching existing pattern |
| account-health-monitoring has no retry policy | MEDIUM | Add workflow-level retry_policy matching existing pattern |
| No node-level retry on DECISION nodes | LOW | Not needed — decisions are pure evaluation |
| No node-level retry on FORM nodes | LOW | Forms wait for human — retry doesn't apply |

---

## Recommended Retry Categories

| Category | Transient Errors | max_retries | initial_delay | backoff |
|----------|-----------------|-------------|---------------|---------|
| **AGENT nodes** | LLM timeout, rate limit | 3 | 5s | 2x |
| **FUNCTION nodes (DB)** | Connection timeout, lock | 3 | 2s | 2x |
| **FUNCTION nodes (connector)** | API timeout, 429, 5xx | 3 | 10s | 3x |
| **SCHEDULED workflows** | Any transient | 2 | 10s | 2x |
| **DATASTORE_EVENT workflows** | Any transient | 3 | 2s | 2x |
