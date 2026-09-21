# Agent Audit — ResQAI

Generated: 2026-06-28
Mode: Read-Only Audit

---

## Agent Inventory

| # | Name | ID | Runtime | Toolsets | Visibility |
|---|------|----|---------|----------|------------|
| 1 | account-health-monitor | 019efd33-... | null | POD | POD |
| 2 | operations-coordinator | 019efbc9-... | null | POD | POD |
| 3 | request-classifier | 019efbc9-... | null | POD | POD |
| 4 | resolution-advisor | 019efbc9-... | null | POD | POD |
| 5 | support-reply-drafter | (unknown) | null | POD | POD |

---

## Agent Completeness Check

All 5 agents have 8 files each:
| File | Purpose |
|------|---------|
| agent.json | Agent metadata (ID, name, toolsets, visibility, allowed_actions) |
| input-schema.json | JSON Schema for agent input |
| instruction.md | System prompt / agent behavior instructions |
| output-schema.json | JSON Schema for agent output |
| permissions.json | Table/function/connector grants |
| README.md | Agent summary documentation |
| tool-access.md | Detailed tool and table access documentation |
| workflow-role.md | Workflow integration contract |

**All agents are structurally complete.** ✅

---

## Agent: account-health-monitor

| Category | Status | Notes |
|----------|--------|-------|
| **Prompt** | ✅ | Instruction.md: 150+ lines of detailed behavior |
| **Runtime** | ⚠️ | `agent_runtime: null` in agent.json — no runtime specified |
| **Permissions** | ✅ | 10 grants: 6 tables read+write, 2 function execute, 1 connector use (Discord) |
| **Functions Used** | ✅ | flag_slipping_followups, account_health_scan — both exist |
| **Tables Read** | ✅ | customers, appointments, disputes, accounts, followups, tasks |
| **Tables Write** | ✅ | tasks, operations_log |
| **Connectors** | ✅ | Discord (critical account alerts) |
| **Workflow Role** | ✅ | Referenced by: account-health-monitoring(ACTIVE), account-health(DRAFT), followup-slippage(DRAFT) |

**Inconsistencies:**
- Input schema allows `days_ahead` (int) but instruction references it as part of function call only
- Output schema has `coordination_status` but instruction references `analysis_status` in one paragraph (likely outdated)

---

## Agent: operations-coordinator

| Category | Status | Notes |
|----------|--------|-------|
| **Prompt** | ✅ | Instruction.md: detailed behavior |
| **Runtime** | ⚠️ | `agent_runtime: null` |
| **Permissions** | ✅ | 7 grants: 5 tables, 1 connector (Discord) — notably has `datastore.record.write` on `appointments` |
| **Functions Used** | — | None |
| **Tables Read** | ✅ | tickets, appointments, technicians, customers, tasks, operations_log |
| **Tables Write** | ✅ | tasks, operations_log |
| **Connectors** | ✅ | Discord (daily standup, crisis alerts) |
| **Workflow Role** | ✅ | Referenced by: daily-standup(DRAFT), ticket-intake(ACTIVE) |

**Inconsistencies:**
- Has `datastore.record.write` on `appointments` but instruction explicitly says "DO NOT mutate appointments" → grant is too broad
- No `accounts` or `followups` table grants despite instruction referencing them in reasoning (indirectly)

---

## Agent: request-classifier

| Category | Status | Notes |
|----------|--------|-------|
| **Prompt** | ✅ | Instruction.md: detailed classification rules |
| **Runtime** | ⚠️ | `agent_runtime: null` |
| **Permissions** | ✅ | 4 grants: tickets(r+w), technicians(r), Facebook(connector), Instagram(connector) |
| **Functions Used** | — | None |
| **Tables Read** | ✅ | tickets, technicians |
| **Tables Write** | ✅ | tickets |
| **Connectors** | ✅ | Facebook, Instagram (read messages) |
| **Workflow Role** | ✅ | Referenced by: ticket-intake(ACTIVE) |

**Inconsistencies:**
- Instruction mentions Facebook/Instagram connectors for reading messages, but connector integration report notes "Facebook/Instagram inbound not yet integrated" → feature documented but likely not functional
- No `operations_log` write permission, even though instruction doesn't require it (consistent)

---

## Agent: resolution-advisor

| Category | Status | Notes |
|----------|--------|-------|
| **Prompt** | ✅ | Instruction.md: detailed resolution reasoning |
| **Runtime** | ⚠️ | `agent_runtime: null` |
| **Permissions** | ✅ | 6 grants: 5 tables, operations_log |
| **Functions Used** | ✅ | resolve_dispute — exists |
| **Tables Read** | ✅ | disputes, customers, appointments, tickets, operations_log |
| **Tables Write** | ✅ | disputes, operations_log |
| **Connectors** | — | None |
| **Workflow Role** | ✅ | Referenced by: dispute-resolution(ACTIVE), ticket-intake(ACTIVE) |

**Inconsistencies:**
- Input schema requires `dispute_id` but ticket-intake workflow maps `trigger.ticket_id` → may not be a valid dispute
- Agent handles `blocked` status gracefully, so this is a designed behavior

---

## Agent: support-reply-drafter

| Category | Status | Notes |
|----------|--------|-------|
| **Prompt** | ✅ | Instruction.md: drafting guidelines |
| **Runtime** | ⚠️ | `agent_runtime: null` |
| **Permissions** | ✅ | grants: tickets, customers, appointments, Gmail, Discord, Reddit |
| **Functions Used** | — | None |
| **Tables Read** | ✅ | tickets, customers, appointments |
| **Tables Write** | ✅ | tickets, operations_log |
| **Connectors** | ✅ | Gmail (send), Discord (notify), Reddit (monitor) |
| **Workflow Role** | ✅ | Referenced by: appointment-reminders(DRAFT) |

**Inconsistencies:**
- Only referenced by a DRAFT workflow → not used in any production path
- Connector integration report notes "Gmail outbound not yet integrated" → send feature may not work

---

## Summary

| Metric | Value |
|--------|-------|
| Total agents | 5 |
| Complete (all 8 files) | 5/5 (100%) |
| With null runtime | 5/5 (100%) — all missing runtime spec |
| With valid permissions | 5/5 (100%) |
| With broken references | 0/5 |
| Used by ACTIVE workflows | 3/5 (account-health-monitor, request-classifier, resolution-advisor) |
| Used by DRAFT workflows only | 2/5 (operations-coordinator also in ACTIVE; support-reply-drafter in DRAFT only) |
| With connector access | 4/5 (account-health-monitor, operations-coordinator, request-classifier, support-reply-drafter) |

## Recommendations

1. **Set agent_runtime** for all agents (currently null)
2. **Remove unnecessary appointments:write grant** from operations-coordinator (instruction prohibits direct mutation)
3. **Audit Facebook/Instagram connector integration** for request-classifier — documented but may not be functional
4. **Audit Gmail connector integration** for support-reply-drafter — documented but may not be functional
