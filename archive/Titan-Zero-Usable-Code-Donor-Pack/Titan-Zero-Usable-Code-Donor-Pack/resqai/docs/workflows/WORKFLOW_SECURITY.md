# WORKFLOW_SECURITY.md — ResQAI V2 Enterprise Workflow Layer

> Generated: 2026-06-30 | Phase: B.6 Enterprise Workflow Layer Integration

---

## Permission Model

ResQAI uses Lemma's zero-access-by-default permission model. Every function and agent must have explicit grants to access resources.

### Current Grant Coverage

| Workflow | Function/Agent | Grants Defined | Missing Grants |
|----------|---------------|---------------|---------------|
| account-health-monitoring | account_health_monitor (agent) | YES — 10 grants: customers, ops_log, tasks, appointments, disputes, accounts, followups, flag_slipping_followups (func), account_health_scan (func), discord | None identified |
| account-health-monitoring | update_account_health_status (function) | YES — 4 grants: accounts, ops_log, tasks, discord | None identified |
| appointment-assignment | tech-suggester (agent) | **NO agent.json exists** | All grants missing |
| appointment-assignment | assign_appointment_technician (function) | YES — 2 grants: appointments, ops_log | None identified |
| appointment-reminders | support-reply-drafter (agent) | YES — 5 grants: customers, technicians, tickets, gmail, reddit | None identified |
| appointment-reminders | fetch_upcoming_appointments (function) | YES — 1 grant: appointments | None identified |
| appointment-reminders | dispatch_notifications (function) | YES — 3 grants: resqai-gmail (conn), resqai-twilio (conn), ops_log | None identified |
| customer-satisfaction-monitor | operations-coordinator (agent) | YES — 7 grants: customers, ops_log, tasks, technicians, tickets, appointments, discord | None identified |
| customer-satisfaction-monitor | resolution-advisor (agent) | YES — 6 grants: customers, ops_log, tickets, appointments, disputes, reddit | None identified |
| customer-satisfaction-monitor | collect_resolved_tickets (function) | YES — 2 grants: tickets, discord | None identified |
| customer-satisfaction-monitor | update_ticket_record (function) | YES — 3 grants: tickets, ops_log, gmail | None identified |
| daily-standup | operations-coordinator (agent) | YES — 7 grants | None identified |
| daily-standup | create_operations_tasks (function) | YES — 2 grants: tasks, ops_log | None identified |
| dispute-resolution | resolution-advisor (agent) | YES — 6 grants | None identified |
| dispute-resolution | resolve_dispute (function) | YES — 5 grants: disputes, tickets, ops_log, discord, gmail | None identified |
| followup-slippage-detector | operations-coordinator (agent) | YES — 7 grants | None identified |
| followup-slippage-detector | flag_slipping_followups (function) | YES — 3 grants: customers, accounts, followups | None identified |
| followup-slippage-detector | finalize_slippage_review (function) | YES — 2 grants: ops_log, discord | None identified |
| support-escalation-manager | request-classifier (agent) | YES — 4 grants: technicians, tickets, facebook, instagram | None identified |
| support-escalation-manager | operations-coordinator (agent) | YES — 7 grants | None identified |
| support-escalation-manager | resolution-advisor (agent) | YES — 6 grants | None identified |
| support-escalation-manager | update_ticket_record (function) | YES — 3 grants | None identified |
| ticket-intake | request-classifier (agent) | YES — 4 grants | None identified |
| ticket-intake | check_ticket_urgency (function) | YES — 0 grants (pure routing function) | None identified |
| ticket-intake | operations-coordinator (agent) | YES — 7 grants | None identified |
| ticket-intake | resolution-advisor (agent) | YES — 6 grants | None identified |
| ticket-intake | update_ticket_record (function) | YES — 3 grants | None identified |
| urgent-dispatch | request-classifier (agent) | YES — 4 grants | None identified |
| urgent-dispatch | check_ticket_urgency (function) | YES — 0 grants | None identified |
| urgent-dispatch | tech-suggester (agent) | **NO agent.json** | ALL grants missing |
| urgent-dispatch | operations-coordinator (agent) | YES — 7 grants | None identified |
| urgent-dispatch | finalize_dispatch (function) | YES — 3 grants: tickets, ops_log, discord | None identified |

---

## Security Findings

| ID | Severity | Finding | Affected Resource |
|----|----------|---------|-------------------|
| S-001 | **CRITICAL** | `tech-suggester` has no `agent.json` and therefore no permissions defined. Used by appointment-assignment and urgent-dispatch workflows. Will fail at runtime with `MISSING_WORKLOAD_RESOURCE_GRANT` | agents/tech-suggester |
| S-002 | HIGH | `check_ticket_urgency` has zero grants but reads tickets — if it reads DB state, it will fail | functions/check-ticket-urgency |
| S-003 | MEDIUM | `facebook` connector granted to `request-classifier` but not listed in connectors/ directory | agents/request-classifier |
| S-004 | MEDIUM | `instagram` connector granted to `request-classifier` but not listed in connectors/ directory | agents/request-classifier |
| S-005 | MEDIUM | `discord` connector used by 5 functions/agents but not defined in connectors/ | Multiple |
| S-006 | MEDIUM | `gmail` connector used by 3 functions/agents but not defined in connectors/ | Multiple |
| S-007 | MEDIUM | `reddit` connector granted to `resolution-advisor` and `support-reply-drafter` but not defined in connectors/ | Multiple |
| S-008 | LOW | `resqai-gmail` connector name (function grant) vs `gmail` (agent grant) — naming inconsistency | dispatch_notifications vs others |
| S-009 | LOW | `resqai-twilio` connector referenced only by `dispatch_notifications` | functions/dispatch-notifications |

---

## Visibility Analysis

| Workflow | visibility | Access Level |
|----------|-----------|-------------|
| account-health-monitoring | POD | Pod-scoped |
| appointment-assignment | POD | Pod-scoped |
| customer-satisfaction-monitor | POD | Pod-scoped |
| followup-slippage-detector | POD | Pod-scoped |
| support-escalation-manager | POD | Pod-scoped |
| urgent-dispatch | POD | Pod-scoped |
| dispute-resolution | **NOT SET** | Public (default) |
| ticket-intake | **NOT SET** | Public (default) |
| account-health | **NOT SET** | Public (default) |
| appointment-reminders | **NOT SET** | Public (default) |
| daily-standup | **NOT SET** | Public (default) |
| followup-slippage | **NOT SET** | Public (default) |

---

## Data Access Summary

### Tables Accessed by Workflows (via agents/functions)

| Table | Read | Write | Create | Workflows |
|-------|------|-------|--------|-----------|
| tickets | 7 agents | 3 functions, 1 agent | — | ticket-intake, support-escalation, urgent-dispatch, customer-satisfaction |
| appointments | 4 agents, 2 functions | 1 function | — | appointment-assignment, appointment-reminders |
| customers | 4 agents, 1 function | — | — | account-health, appointment-reminders |
| accounts | 2 agents, 1 function | 2 functions | — | account-health-monitoring |
| followups | 2 agents, 1 function | 1 agent | — | followup-slippage-detector, account-health |
| disputes | 2 agents | 2 functions, 1 agent | — | dispute-resolution |
| tasks | 2 agents | 2 agents | 2 functions | daily-standup, account-health, followup-slippage |
| technicians | 3 agents | — | — | appointment-assignment, ticket-intake |
| operations_log | 4 agents, 3 functions | 4 agents, 5 functions | 3 functions | All |
