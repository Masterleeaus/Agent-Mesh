# Ticket Intake workflow — Implementation Report

## workflow Graph

```
[ticket.created] ──► [classify-ticket] ──► [check-urgency]
                    AGENT:request-classifier  FUNCTION:check_ticket_urgency
                                                      │
                                          ┌───────────┴───────────┐
                                          │ routing=high/urgent   │ routing=normal/low
                                          ▼                       ▼
                                    [human-approval]      [coordinate-ticket]
                                    FORM                   AGENT:operations-coordinator
                                          │                       │
                                          │ ◄─────────────────────┘
                                          │
                                    ┌─────┴─────┐
                                    │ approved  │ rejected/needs_revision
                                    ▼           └──► back to human-approval
                              [resolve-ticket]          or coordinate-ticket
                              AGENT:resolution-advisor
                                    │
                              ┌─────┴──────────┬──────────────┐
                              │                │              │
                     ready/already/blocked    insufficient   safety/legal
                              │             [human-escalation]
                              ▼
                    [update-ticket-record]
                    FUNCTION:update_ticket_record
                              │
                              ▼
                            [END]


  [human-escalation] ◄── classify failed (needs_human_review/unparseable)
        │
        ▼
      [END]
```

## Trigger

| Property | Value |
|----------|-------|
| Type | Event: `ticket.created` |
| Mechanism | DATASTORE_EVENT on `tickets` table — INSERT operation |
| Payload | `ticket_id` (UUID), `today` (ISO date), full row fields |
| Filter | Only fires when a new ticket row is created (`status = 'new'`) |

The workflow starts automatically when a support ticket is created through any channel (app, API, connector).

## Every Step

### 1. `classify-ticket` — Classify Request
- **Type**: `agent`
- **Resource**: `request-classifier` (existing)
- **Input**: `ticket_id` from trigger
- **what it does**: Reads the ticket row, classifies request_type/urgency, matches a suggested technician by skill, writes classification data back to the ticket (status → `classified`)
- **Output fields**: `classification_status`, `urgency`, `request_type`, `suggested_owner`, `recommended_next_action`, `reasoning`
- **Routing**:
  - `classified` → proceed to check-urgency
  - `needs_human_review` → human-escalation
  - `unparseable` → human-escalation

### 2. `check-urgency` — Check Ticket Urgency
- **Type**: `function`
- **Resource**: `check_ticket_urgency` (NEw — function stub provided)
- **Input**: `ticket_id`, `urgency`, `classification_status`
- **what it does**: Deterministically maps urgency to a routing signal. If urgency is `high` or `urgent`, returns routing signal `urgent`/`high` to bypass ops coordination.
- **Output fields**: `routing`, `ticket_id`, `is_urgent` (boolean)
- **Routing**:
  - `urgent` / `high` → skip coordination → human-approval
  - `normal` / `low` → coordinate-ticket (default edge)

### 3. `coordinate-ticket` — Coordinate Operations (Normal Path)
- **Type**: `agent`
- **Resource**: `operations-coordinator` (existing)
- **Input**: `scope=daily`, `max_actions=5`, `create_tasks=true`
- **what it does**: Reads the full operational board, creates prioritized tasks for this ticket, generates recommendations for the human reviewer
- **Output fields**: `coordination_status`, `recommendations`, `summary`, `tasks_created`
- **Routing**: Always → human-approval

### 4. `human-approval` — Human Approval
- **Type**: `human_decision` (FORM)
- **Input**: Full ticket context — urgency, request_type, suggested_owner, recommended_next_action, coordination recommendations
- **what it does**: Presents a review form to a pod member. The operator reviews the classification, coordination output, and decides whether to approve assignment, reject, or request revision.
- **Output fields**: `approved`, `assigned_to`, `notes`, `decision`
- **Routing**:
  - `approved` → resolve-ticket
  - `rejected` → loop back to human-approval (revise and resubmit)
  - `needs_revision` → loop back to coordinate-ticket (re-run coordination)

### 5. `resolve-ticket` — Resolution Advisory
- **Type**: `agent`
- **Resource**: `resolution-advisor` (existing)
- **Input**: `dispute_id` ← mapped from `trigger.ticket_id`
- **what it does**: Reads the ticket record (has tickets:read grant) and provides a recommended resolution. If a dispute record exists with the same UUID, analyzes it. Otherwise returns `analysis_status: "blocked"` as a safety check.
- **Output fields**: `analysis_status`, `recommended_resolution`, `confidence`, `reasoning`, `resolution_reason`, `requires_human_call`, `next_steps`
- **Routing**:
  - `ready_for_review` / `already_analyzed` / `blocked` → update-ticket-record (continue)
  - `insufficient_evidence` / `safety_escalation` / `legal_escalation` → human-escalation

### 6. `update-ticket-record` — Update Ticket Record
- **Type**: `function`
- **Resource**: `update_ticket_record` (NEw — function stub provided)
- **Input**: ticket_id, status→`approved_to_send`, approval data, resolution data
- **what it does**: Reads the ticket record, stamps it with status `approved_to_send`, sets the assigned owner, writes human notes and resolution summary, appends an operations_log entry
- **Output fields**: `update_status`, `updated_ticket_id`
- **Routing**: Always → END

### 7. `human-escalation` — Human Escalation (Error/Exception Path)
- **Type**: `human_decision` (FORM)
- **Input**: Ticket context plus error detail from whichever node escalated
- **what it does**: Catch-all for tickets that the automated pipeline can't handle — unparseable classifications, needs human review, insufficient evidence, safety/legal escalations
- **Output fields**: `resolved`, `action_taken`, `resolution_notes`
- **Routing**: Always → END

## Existing Resources Used

| Resource | Type | Usage in workflow | Grants Required |
|----------|------|-------------------|-----------------|
| `request-classifier` | Agent | Step 1: Classify inbound tickets | tickets:read/write, technicians:read ✅ |
| `operations-coordinator` | Agent | Step 3: Coordinate normal-priority tickets | tickets:read, appointments:read/write, technicians:read, customers:read, tasks:read/write, operations_log:read/write ✅ |
| `resolution-advisor` | Agent | Step 5: Resolution recommendation | disputes:read/write, customers:read, appointments:read, tickets:read, operations_log:read/write ✅ |
| `tickets` | Table | Read/written by classifiers, final update | schema: see database.md |
| `operations_log` | Table | Audit trail from agents and final update | schema: see database.md |

## Decision Nodes

| Node | Type | Condition | True Branch | False Branch |
|------|------|-----------|-------------|--------------|
| `classify-ticket` | Agent (next.conditions) | `classification_status == "classified"` | continue to check-urgency | human-escalation |
| `check-urgency` | Function (next.conditions) | `routing == "urgent"` or `"high"` | skip ops-coordination → human-approval | run ops-coordination → coordinate-ticket |
| `human-approval` | FORM (next.conditions) | `decision == "approved"` | resolve-ticket | `rejected`→retry, `needs_revision`→re-coordinate |
| `resolve-ticket` | Agent (next.conditions) | `analysis_status ∈ {ready,already,blocked}` | update-ticket-record | escalation for safety/legal/insufficient |

## Human Approval Points

| Node | Type | what Human Reviews | Assignee |
|------|------|-------------------|----------|
| `human-approval` | FORM | Ticket classification, urgency, suggested owner, coordination recommendations | Any pod member (configurable to a specific member or role) |
| `human-escalation` | FORM | Unparseable tickets, safety escalations, legal escalations | Ops manager / legal counsel |

The FORM `human-approval` presents: ticket context, AI classification results, operations recommendations, and lets the operator:
- **Approve** → assign the ticket and proceed to resolution
- **Reject** → provide notes and re-review
- **Request revision** → re-run coordination with updated context

## Retry Strategy

| Node | Strategy | Max Retries | Backoff |
|------|----------|-------------|---------|
| `classify-ticket` (agent) | Platform-level retry on LLM timeout / transient error | 3 | Exponential (2s, 4s, 8s) |
| `check-urgency` (function) | Platform-level retry on 5xx | 3 | Immediate |
| `coordinate-ticket` (agent) | Platform-level retry on LLM timeout / transient error | 3 | Exponential (2s, 4s, 8s) |
| `human-approval` (form) | N/A — human decision, no retry needed | — | — |
| `resolve-ticket` (agent) | Platform-level retry on LLM timeout / transient error | 3 | Exponential (2s, 4s, 8s) |
| `update-ticket-record` (function) | Platform-level retry on 5xx / network error | 3 | Immediate |

**Idempotency guarantees:**
- `request-classifier`: Safe to re-run — overwrites classification fields on the same ticket; no duplicate side effects
- `check-ticket-urgency`: Deterministic; no side effects; idempotent by definition
- `operations-coordinator`: Checks for existing open tasks with same title+target_id before creating duplicates
- `resolution-advisor`: Returns `already_analyzed` if dispute already processed; refuses to re-analyze finalized disputes
- `update-ticket-record`: Overwrites ticket fields idempotently; operations_log entry per run is expected

## Error Handling

| Failure Mode | Detection | Handling |
|-------------|-----------|----------|
| `classification_status == "unparseable"` | classify-ticket next.conditions | Routes to human-escalation with ticket context |
| `classification_status == "needs_human_review"` | classify-ticket next.conditions | Routes to human-escalation for manual classification |
| Agent LLM timeout | Platform-level failure | Retry up to 3 times; if persistent, workflow FAILS |
| Function 5xx / network error | Platform-level failure | Retry up to 3 times; if persistent, workflow FAILS |
| `analysis_status == "blocked"` | resolve-ticket next.conditions | Gracefully continues to update-ticket-record (blocked is expected when no dispute exists for the ticket_id) |
| `analysis_status == "insufficient_evidence"` | resolve-ticket next.conditions | Routes to human-escalation for manual investigation |
| `analysis_status ∈ {"safety_escalation", "legal_escalation"}` | resolve-ticket next.conditions | Routes to human-escalation for immediate manager/legal attention |
| Human rejects approval | human-approval next.conditions | Loops back to human-approval for revised decision |
| Human requests revision | human-approval next.conditions | Loops back to coordinate-ticket for re-coordination |
| Missing ticket_id in trigger | Node execution | Platform fails the node with MISSING_PATH error |
| Function MISSING_wORKLOAD_RESOURCE_GRANT | Platform validation | workflow fails at deployment; grant tickets:write to the function |

## Final Validation

### Pre-Deployment Checklist
- [ ] `request-classifier` agent exists and has tickets:read/write + technicians:read grants
- [ ] `operations-coordinator` agent exists and has all table grants
- [ ] `resolution-advisor` agent exists and has tickets:read grant (minimal for this workflow)
- [ ] `check_ticket_urgency` function is deployed and has no table grants needed (pure logic)
- [ ] `update_ticket_record` function is deployed and has tickets:read/write + operations_log:read/write grants
- [ ] workflow JSON has `status: "active"` and `enabled: true`
- [ ] Trigger `ticket.created` is registered in the pod's event system

### Verification Runbook

1. **Create a test ticket** with urgency "normal":
   ```bash
   lemma records create tickets --data '{"customer_name":"Test User","channel":"web","subject":"Test ticket","message":"This is a test","urgency":"normal","status":"new"}'
   ```
2. **Verify workflow triggered**: `lemma workflows runs list ticket-intake`
3. **Inspect step history**: `lemma workflows runs get <run-id>` — expect classify → check-urgency → coordinate → human-approval (wAITING)
4. **Submit human approval**: `lemma workflows runs submit-form <run-id> --data '{"approved":true,"assigned_to":"tech-lead","notes":"Approved"}'`
5. **Verify completion**: Run should reach END with all steps in step_history
6. **Check ticket updated**: `lemma records get tickets <ticket-id>` — status should be `approved_to_send`

7. **Test urgent path**: Create ticket with urgency "urgent" — should skip coordinate-ticket
8. **Test escalation path**: Create ticket with minimal message — should route to human-escalation

### Required New Functions

| Function | Purpose | Status |
|----------|---------|--------|
| `check_ticket_urgency` | Maps urgency to routing signal (deterministic, pure logic) | ✅ Stub created at `functions/check-ticket-urgency/` |
| `update_ticket_record` | Finalizes ticket with status, owner, resolution data | ✅ Stub created at `functions/update-ticket-record/` |

Both function stubs follow the existing project patterns (`function.json`, schemas, `src/handler.py`, `src/models.py`, tests).

### Agents Used (Unchanged)
- `request-classifier` — classifies and writes back to ticket ✅
- `operations-coordinator` — coordinates only normal-priority tickets ✅
- `resolution-advisor` — provides resolution advisory (reads ticket, outputs recommendation) ✅
