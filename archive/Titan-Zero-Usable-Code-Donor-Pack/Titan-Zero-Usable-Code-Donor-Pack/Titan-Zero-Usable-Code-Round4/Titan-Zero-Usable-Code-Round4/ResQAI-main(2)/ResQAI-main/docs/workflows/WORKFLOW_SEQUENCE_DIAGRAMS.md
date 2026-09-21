# WORKFLOW_SEQUENCE_DIAGRAMS.md — ResQAI V2 Enterprise Workflow Layer

> Generated: 2026-06-30 | Phase: B.6 Enterprise Workflow Layer Integration

---

## 1. account-health-monitoring (V2)

```
CRON 0 2 * * *
  │
  ▼
[run_health_monitor] AGENT: account_health_monitor
  │
  ▼
[route_by_health] DECISION
  │
  ├── ok / no_action_needed ──────────► [healthy_path] FUNCTION: update_account_health_status ──► [end_healthy]
  │
  ├── attention_needed ───────────────► [warning_path] FORM: Notify Operations ────────────────► [end_warning]
  │
  └── default (crisis) ──────────────► [human_approval] FORM: Human Approval
                                          │
                                          ▼
                                     [route_approval] DECISION
                                          │
                                     ┌────┴────┐
                                     ▼         ▼ (rejected — loops back)
                              [escalate_critical]     [human_approval]
                                   FORM: Manager
                                   Escalation
                                     │
                                     ▼
                              [finalize_critical]
                              FUNCTION: update_account_health_status
                                     │
                                     ▼
                              [end_critical]
```

## 2. appointment-assignment (V2)

```
DATASTORE EVENT: appointments INSERT
  │
  ▼
[suggest_technician] AGENT: tech-suggester
  │
  ▼
[check_suggestion] DECISION
  │
  ├── tech suggested ───────────────► [manager_approval] FORM: Manager Approve
  │                                      │
  │                                      ▼
  │                                 [approval_check] DECISION
  │                                      │
  │                                 ┌────┴────┐
  │                                 ▼         ▼ (rejected)
  │                          [assign_technician]   [end_rejected]
  │                          FUNCTION: assign_
  │                          appointment_technician
  │                                 │
  │                                 ▼
  │                          [end_assigned]
  │
  └── default (no tech) ───────────► [end_no_suggestion]
```

## 3. customer-satisfaction-monitor (V2)

```
CRON 0 8 * * *
  │
  ▼
[collect_tickets] FUNCTION: collect_resolved_tickets
  │
  ▼
[any_tickets] DECISION
  │
  ├── has tickets ──────────────────► [coordinate_review] AGENT: operations-coordinator
  │                                      │
  │                                      ▼
  │                                 [satisfaction_check] DECISION
  │                                      │
  │                                 ┌────┴────┐
  │                                 ▼         ▼ (dissatisfied — default)
  │                          [end_satisfied]  [manager_review] FORM: Support Mgr Review
  │                                                  │
  │                                                  ▼
  │                                             [approval_check] DECISION
  │                                                  │
  │                                             ┌────┴────┐
  │                                             ▼         ▼ (rejected)
  │                                      [analyze_resolution]  [end_rejected]
  │                                      AGENT: resolution-advisor
  │                                             │
  │                                             ▼
  │                                      [finalize]
  │                                      FUNCTION: update_ticket_record
  │                                             │
  │                                             ▼
  │                                      [end_complete]
  │
  └── default (no tickets) ──────────► [end_no_tickets]
```

## 4. dispute-resolution (V2)

```
DATASTORE EVENT: disputes INSERT/UPDATE
  │
  ▼
[analyze_dispute] AGENT: resolution-advisor
  │
  ▼
[route_analysis] DECISION
  │
  ├── ready_for_review ─────────────► [check_confidence] DECISION
  │                                      │
  │                                 ┌────┴────┐
  │                                 ▼         ▼ (confidence < 0.7)
  │                          [apply_resolution]  [human_approval] FORM: Human Review
  │                          FUNCTION: resolve_   │
  │                          dispute              ▼
  │                                 │        [route_approval] DECISION
  │                                 │             │
  │                                 │        ┌────┴────┐
  │                                 │        ▼         ▼ (rejected)
  │                                 │  [apply_res.]  [return_to_advisor]
  │                                 │               FUNCTION: resolve_dispute
  │                                 ▼                  (action: reject)
  │                            [end]               │
  │                                                 ▼
  ├── safety_escalation ────────────► [notify_ops_manager] FORM ──► [end]
  │
  ├── legal_escalation ─────────────► [notify_legal] FORM ──► [end]
  │
  ├── insufficient_evidence / blocked ► [human_escalation] FORM ──► [end]
  │
  └── default (already_analyzed) ───► [end]
```

## 5. followup-slippage-detector (V2)

```
CRON */30 * * * *
  │
  ▼
[flag_followups] FUNCTION: flag_slipping_followups
  │
  ▼
[check_slippage] DECISION
  │
  ├── slipping > 0 ────────────────► [coordinate_review] AGENT: operations-coordinator
  │                                      │
  │                                      ▼
  │                                 [human_review] FORM: Review Slipped Followups
  │                                      │
  │                                      ▼
  │                                 [check_approval] DECISION
  │                                      │
  │                                 ┌────┴────┐
  │                                 ▼         ▼ (rejected)
  │                          [finalize]        [end_rejected]
  │                          FUNCTION: finalize_slippage_review
  │                                 │
  │                                 ▼
  │                          [end_approved]
  │
  └── default (no slippage) ────────► [end_no_slippage]
```

## 6. support-escalation-manager (V2)

```
DATASTORE EVENT: tickets UPDATE
  │
  ▼
[classify_ticket] AGENT: request-classifier
  │
  ▼
[check_escalation] DECISION
  │
  ├── urgent/high/complaint/needs_human_review ──► [coordinate_escalation] AGENT: operations-coordinator
  │                                                     │
  │                                                     ▼
  │                                                [human_approval] FORM: Human Approval
  │                                                     │
  │                                                     ▼
  │                                                [route_approval] DECISION
  │                                                     │
  │                                                ┌────┴────┐
  │                                                ▼         ▼ (rejected)
  │                                         [resolve_escalation]   [end_rejected]
  │                                         AGENT: resolution-advisor
  │                                                │
  │                                                ▼
  │                                         [update_ticket]
  │                                         FUNCTION: update_ticket_record
  │                                                │
  │                                                ▼
  │                                         [end_approved]
  │
  └── default ──────────────────────► [end_no_escalation]
```

## 7. ticket-intake (V1 Active)

```
EVENT: ticket.created
  │
  ▼
[classify-ticket] AGENT: request-classifier
  │
  ├── classified ───────────────────► [check-urgency] FUNCTION: check_ticket_urgency
  │                                      │
  │                                 ┌────┴────┐
  │                                 ▼         ▼ (urgent/high)
  │                          [coordinate-ticket]   [human-approval]
  │                          AGENT: ops-coordinator    │
  │                                 │                  ▼
  │                                 ▼             [resolve-ticket]
  │                          [human-approval]    AGENT: resolution-advisor
  │                                 │                  │
  │                                 ▼                  ▼
  │                          (approved)          [update-ticket-record]
  │                                 │            FUNCTION: update_ticket_record
  │                                 ▼                  │
  │                          [resolve-ticket]───►[human-escalation]
  │
  ├── needs_human_review ───────────► [human-escalation]
  │
  └── unparseable ──────────────────► [human-escalation]
```

## 8. urgent-dispatch (V2)

```
DATASTORE EVENT: tickets INSERT/UPDATE
  │
  ▼
[classify_urgent] AGENT: request-classifier
  │
  ▼
[route_classification] DECISION
  │
  ├── classified ───────────────────► [check_urgency] FUNCTION: check_ticket_urgency
  │                                      │
  │                                      ▼
  │                                 [route_urgency] DECISION
  │                                      │
  │                                 ┌────┴────┐
  │                                 ▼         ▼ (default)
  │                          [suggest_tech]   [end]
  │                          AGENT: tech-suggester
  │                                 │
  │                                 ▼
  │                          [route_tech] DECISION
  │                                 │
  │                            ┌────┴────┐
  │                            ▼         ▼ (default)
  │                     [coordinate_dispatch] [manager_assignment] FORM
  │                     AGENT: ops-coordinator     │
  │                            │                   ▼
  │                            ▼              [coordinate_dispatch]
  │                     [route_after_coordinate]     │
  │                     DECISION                     ▼
  │                            │              [route_after_coordinate]
  │                       ┌────┴────┐               │
  │                       ▼         ▼          ┌────┴────┐
  │                [finalize_auto]  [finalize_  ▼         ▼
  │                FUNCTION:       manual] [finalize_auto] [finalize_manual]
  │                finalize_dispatch              │
  │                       │                      ▼
  │                       ▼                 [end]
  │                  [end]
  │
  └── unparseable/needs review ─────► [human_escalation] FORM
                                          │
                                          ▼
                                     [finalize_escalation]
                                     FUNCTION: finalize_dispatch
                                          │
                                          ▼
                                     [end]
```
