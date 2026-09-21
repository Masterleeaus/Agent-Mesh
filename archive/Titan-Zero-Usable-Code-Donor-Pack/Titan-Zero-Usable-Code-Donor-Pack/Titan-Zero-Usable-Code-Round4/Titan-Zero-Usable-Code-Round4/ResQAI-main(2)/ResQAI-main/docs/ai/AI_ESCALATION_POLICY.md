# ResQAI V2 — AI Escalation Policy

## Escalation Architecture

Escalation determines when agent outputs require human intervention. Every agent has defined escalation paths based on confidence, safety rules, and business logic.

```
Agent Output
    │
    ├── Confidence < threshold ──────► Human review
    ├── Safety rule triggered ───────► Immediate escalation
    ├── Business rule triggered ─────► Workflow branch
    └── Success ─────────────────────► Next step
```

## Escalation Levels

| Level | Name | Response Time | Notify |
|---|---|---|---|
| L1 | Standard review | Next business day | Assigned operator |
| L2 | Priority review | Within 4 hours | Operations manager |
| L3 | Immediate escalation | Within 30 minutes | Operations manager + on-call |
| L4 | Emergency | Immediate | All stakeholders + legal if needed |

## Agent Escalation Strategies

### request-classifier

| Trigger | Level | Action | Target |
|---|---|---|---|
| `classification_status: "needs_human_review"` | L2 | Pause workflow, notify reviewer | Support operator |
| `classification_status: "unparseable"` | L2 | Escalate to intake form | Support operator |
| Urgent complaint with weak signal | L2 | Route to reviewer with flags | Support operator |
| Safety keywords detected (urgent) | L3 | Bypass queue, notify immediately | Operations manager |
| Retry exhausted (3 failures) | L2 | Fallback to manual classification | Support operator |

### support-reply-drafter

| Trigger | Level | Action | Target |
|---|---|---|---|
| `draft_status: "needs_human_call"` | L2 | Pause, notify ops manager | Operations manager |
| `draft_status: "needs_rewrite"` | L1 | Re-trigger request-classifier | Workflow auto-action |
| `draft_status: "blocked"` | L2 | Escalate to human | Support operator |
| Confidence < 0.70 | L1 | Flag for human to draft from scratch | Support operator |
| Connector failure (Gmail, Reddit) | L2 | Draft without connector context | Support operator |

### operations-coordinator

| Trigger | Level | Action | Target |
|---|---|---|---|
| `coordination_status: "crisis"` | L3 | Discord alert + red banner + notify ops | Operations manager |
| `coordination_status: "attention_needed"` | L1 | Display warning banner | Operations team |
| `coordination_status: "unavailable_data"` | L2 | Error state, retry, notify admin | System administrator |
| Urgent_count > 0 | L2 | Top of queue, alert in dashboard | Operations team |

### resolution-advisor

| Trigger | Level | Action | Target |
|---|---|---|---|
| `analysis_status: "insufficient_evidence"` | L2 | Pause, ask investigator for context | Resolution specialist |
| `analysis_status: "safety_escalation"` | L4 | Immediate notify ops manager | Operations manager |
| `analysis_status: "legal_escalation"` | L4 | Notify legal counsel | Legal team |
| `analysis_status: "blocked"` | L2 | Escalate to human | Resolution specialist |
| `requires_human_call: true` | L2 | Schedule follow-up task before approval | Resolution specialist |
| Confidence < 0.60 | L2 | Require human call | Resolution specialist |
| Dispute > $5,000 | L3 | Legal review required | Legal team |

### account-health-monitor

| Trigger | Level | Action | Target |
|---|---|---|---|
| `coordination_status: "crisis"` | L3 | Discord critical alert + red banner | Operations manager |
| Critical account detected | L3 | Immediate ops manager notification | Operations manager |
| Slipping acceleration (>5, WoW increasing) | L2 | Discord summary alert | CRM team |
| Focus account in critical state | L2 | Route to account owner | Account owner |
| Overdue_count > threshold | L1 | Flag in daily summary | CRM team |

### tech-suggester

| Trigger | Level | Action | Target |
|---|---|---|---|
| `requires_human_review: true` | L2 | Pause for human decision | Dispatch operator |
| `suggestion_status: "no_match"` | L2 | Notify ops about coverage gap | Operations manager |
| `suggestion_status: "blocked"` | L2 | Escalate to human | Support operator |
| Confidence < 0.60 | L2 | Flag for human review | Dispatch operator |
| Urgent + no highly-rated tech available | L2 | Pause for dispatch decision | Dispatch operator |

## Human Escalation Routing

| Role | Responsible For | Escalation Sources |
|---|---|---|
| **Support operator** | Ticket classification review, draft editing | request-classifier, support-reply-drafter |
| **Operations manager** | Crisis response, urgent dispatch, coverage gaps | operations-coordinator, tech-suggester |
| **CRM specialist** | Account health follow-ups, win-back | account-health-monitor |
| **Resolution specialist** | Dispute analysis, evidence gathering | resolution-advisor |
| **Legal counsel** | Legal escalations, misconduct allegations | resolution-advisor |
| **System administrator** | Data unavailability, agent failures | All agents (via operations_log) |
| **Account owner** | Critical account recovery | account-health-monitor |

## Escalation SLA Matrix

| Escalation Level | First Response | Resolution Target | Escalation Path |
|---|---|---|---|
| L1 — Standard | Within 4 business hours | 1 business day | Assigned operator → Team lead |
| L2 — Priority | Within 1 hour | 4 hours | Operator → Ops manager |
| L3 — Immediate | Within 15 minutes | 1 hour | Ops manager → Director |
| L4 — Emergency | Immediate | 30 minutes | Director + Legal + Stakeholders |

## Escalation Safety Rules

| Rule | Description | Enforcement |
|---|---|---|
| Safety always escalates | Any safety keyword bypasses all confidence thresholds | Hard-coded in instruction.md |
| Legal always escalates | >$5k or misconduct → legal notification | Hard-coded in instruction.md |
| No silent failure | Agent failure must emit event | Agent harness |
| Escalation receipt | Escalated items must be acknowledged | Human acknowledgment required |
| Escalation timeout | Unacknowledged L3/L4 escalations auto-rotate | 15 min → next on-call |
| Duplicate suppression | Same entity not re-escalated within 1 hour | Event deduplication |
