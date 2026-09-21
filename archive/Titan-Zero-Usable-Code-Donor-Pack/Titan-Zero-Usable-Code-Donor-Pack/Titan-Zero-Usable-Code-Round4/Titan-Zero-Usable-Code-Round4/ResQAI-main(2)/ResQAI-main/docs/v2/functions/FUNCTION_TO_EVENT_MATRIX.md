# ResQAI V2 — Function-to-Event Matrix

> **Version:** 2.0.0  
> **Generated:** 2026-06-30

**Legend:** ● = Produces | ○ = Consumes | — = None

| Function | Type | Published Events | Consumed Events | Event Role |
|----------|------|-----------------|-----------------|------------|
| validate-ticket-input (V2) | DETERMINISTIC | — | ticket:created | Validate input after creation |
| check-ticket-urgency | DETERMINISTIC | — | — | Called synchronously |
| update-ticket-record | WRITER | ticket:status.changed, ticket:updated | — | Emits on status/field change |
| classify-ticket-sla-tier (V2) | DETERMINISTIC | — | ticket:classified | Consumes classification signal |
| check-sla-deadline (V2) | READER | — | — | Called by batch-sla-check |
| batch-sla-check (V2) | AGGREGATOR | ticket:sla_breached | — | Emits per-breached ticket |
| collect-resolved-tickets | READER | — | — | Called by workflow/schedule |
| assign-appointment-technician | WRITER | appointment:assigned | appointment:created | Emits on assignment |
| fetch-upcoming-appointments | READER | — | — | Called by scheduler |
| schedule-appointment-reminders (V2) | WRITER | — | appointment:confirmed | Creates reminder records |
| check-reminder-window (V2) | DETERMINISTIC | — | — | Called by scheduler |
| finalize-dispatch | WRITER | dispatch:created | ticket:classified (urgent), appointment:created | Emits on dispatch finalization |
| calculate-dispatch-priority (V2) | DETERMINISTIC | — | — | Called synchronously |
| create-work-order | WRITER | work_order:created | appointment:completed | Emits on work order creation |
| update-work-order-stage (V2) | WRITER | work_order:stage.changed | — | Emits on stage transition |
| complete-work-order (V2) | WRITER | work_order:completed, work_order:followup_needed | — | Emits on completion |
| resolve-dispute | WRITER | dispute:resolved | dispute:approved, dispute:escalated | Emits on resolution |
| resolve-dispute-v2 | WRITER | dispute:resolved | — | Emits on V2 resolution |
| account-health-scan | AGGREGATOR | account:health.changed | — | Emits if category changed |
| update-account-health-status | WRITER | account:health.changed | account:health.scan.completed | Emits on status update |
| flag-slipping-followups | READER | — | — | Called by health scan |
| create-followup-tasks | WRITER | followup:created | appointment:completed, account:risk.signal.detected, dispute:resolved | Emits on followup task creation |
| finalize-slippage-review | WRITER | followup:slippage.detected, task:created | — | Emits on escalation |
| generate-account-score | AGGREGATOR | — | — | Called by account-health-scan |
| process-feedback-survey (V2) | WRITER | feedback:submitted | — | Emits on survey submission |
| analyze-feedback-sentiment (V2) | AGGREGATOR | feedback:response_needed | feedback:submitted | Emits if followup needed |
| extract-knowledge-gap (V2) | READER | — | — | Called by scheduler |
| search-knowledge-articles | READER | — | — | Called on-demand |
| suggest-knowledge-article | DETERMINISTIC | — | — | Called by agent |
| render-notification-template (V2) | TRANSFORMER | — | — | Called by dispatch-notifications |
| dispatch-notifications | ORCHESTRATOR | notification:send, notification:sent, notification:failed | notification:send | Central notification dispatch hub |
| process-notification-delivery (V2) | WRITER | notification:delivered, notification:failed | — | Processes provider callbacks |
| create-operations-tasks | WRITER | task:created | — | Emits on task creation |
| generate-standup-report (V2) | AGGREGATOR | — | — | Writes report to operations_log |
| generate-report-data (V2) | AGGREGATOR | report:generated | — | Emits on report generation |
| send-report (V2) | ORCHESTRATOR | — | report:generated | Consumes generated report |
| sync-events-analytics (V2) | AGGREGATOR | — | — | Scheduled sync, no events emitted |
| calculate-metric-trend (V2) | AGGREGATOR | — | — | Called by trend analysis |
| batch-metric-aggregation (V2) | AGGREGATOR | — | — | Scheduled batch computation |
| provision-user (V2) | ORCHESTRATOR | user:created | — | Emits on user provision |
| deactivate-user (V2) | WRITER | user:disabled | — | Emits on deactivation |
| validate-config-change (V2) | DETERMINISTIC | — | — | Called before apply |
| apply-config-change (V2) | WRITER | system:config.changed | — | Emits on config change |
| log-audit-event | WRITER | — | — | Writes audit log, emits none |
| check-inventory-level (V2) | READER | — | — | Called on-demand |
| reorder-inventory (V2) | WRITER | — | — | Creates reorder records |
| record-inventory-transaction (V2) | WRITER | — | — | Records inventory movement |
| validate-permissions (V2) | DETERMINISTIC | permission:granted, permission:denied | — | Emits auth decisions |
| generate-api-token (V2) | WRITER | token:generated | — | Emits on token generation |
| rotate-credentials (V2) | WRITER | — | — | Rotates stored credentials |
| verify-workflow-health (V2) | READER | workflow:recovery.initiated | — | Emits recovery signal |
| recover-workflow-instance (V2) | WRITER | workflow:recovery.initiated | — | Attempts recovery |
| reset-circuit-breaker (V2) | WRITER | — | — | Resets circuit state |
| evaluate-quality-score (V2) | AGGREGATOR | — | — | Computes quality metrics |
| flag-quality-violation (V2) | WRITER | — | — | Records quality violations |
| create-ticket | WRITER | ticket:created | — | Emits on ticket creation |
| update-ticket-v2 | WRITER | ticket:updated | — | Emits on field changes |
| assign-ticket | WRITER | ticket:assigned | — | Emits on assignment |
| close-ticket | WRITER | ticket:closed | — | Emits on closure |
| escalate-ticket | WRITER | ticket:escalated | — | Emits on escalation |
| search-tickets | READER | — | — | Read-only |
| create-appointment | WRITER | appointment:created | — | Emits on creation |
| assign-appointment-technician (V1) | WRITER | — | — | Updates appointment record |
| accept-appointment | WRITER | appointment:accepted | — | Emits on acceptance |
| complete-appointment | WRITER | appointment:completed | — | Emits on completion |
| cancel-appointment | WRITER | appointment:cancelled | — | Emits on cancellation |
| list-appointments | READER | — | — | Read-only |
| get-appointment | READER | — | — | Read-only |
| create-customer | WRITER | customer:created | — | Emits on customer creation |
| update-customer | WRITER | customer:updated | — | Emits on update |
| get-customer | READER | — | — | Read-only |
| search-customers | READER | — | — | Read-only |
| create-followup | WRITER | followup:created | — | Emits on followup creation |
| complete-followup | WRITER | followup:completed | — | Emits on completion |
| list-followups | READER | — | — | Read-only |
| update-account-health | WRITER | account:health.changed | — | Emits on health change |
| update-account-health-status (V1) | WRITER | — | — | Writes operations_log |
| list-disputes | READER | — | — | Read-only |
| create-work-order | WRITER | work_order:created | — | Emits on creation |
| get-work-order | READER | — | — | Read-only |
| list-work-orders | READER | — | — | Read-only |
| update-work-order | WRITER | work_order:updated | — | Emits on update |
| create-technician | WRITER | technician:created | — | Emits on creation |
| update-technician | WRITER | technician:updated | — | Emits on update |
| update-technician-skills | WRITER | technician:skills.updated | — | Emits on skill update |
| list-technicians | READER | — | — | Read-only |
| create-inventory-item | WRITER | inventory:item.created | — | Emits on item creation |
| update-inventory-item | WRITER | inventory:item.updated | — | Emits on update |
| list-inventory | READER | — | — | Read-only |
| dispatch-notification-v2 | ORCHESTRATOR | — | — | Uses connectors |
| send-bulk-notification | ORCHESTRATOR | — | — | Batch notification send |
| track-notification | READER | — | — | Read/update notification status |
| analytics-aggregation | READER | — | — | Read-only aggregation |
| dashboard-metrics | READER | — | — | Read-only metrics |
| create-report | WRITER | — | — | Creates report definition |
| schedule-report | WRITER | report:scheduled | — | Emits on schedule creation |
| execute-report | AGGREGATOR | — | — | Reads and computes report |
| create-user | WRITER | user:created | — | Emits on user creation |
| update-user | WRITER | user:updated | — | Emits on update |
| list-users | READER | — | — | Read-only |
| create-role | WRITER | role:created | — | Emits on role creation |
| assign-user-role | WRITER | user:role.changed | — | Emits on role assignment |
| manage-permission | WRITER | permission:granted, permission:revoked | — | Emits on permission changes |
| list-permissions | READER | — | — | Read-only |
| record-audit | WRITER | — | — | Writes audit record |
| query-audit-log | READER | — | — | Read-only |
| authenticate-user | WRITER | user:authenticated | — | Emits on authentication |
| validate-session | READER | session:expired | — | Emits on session expiry |
