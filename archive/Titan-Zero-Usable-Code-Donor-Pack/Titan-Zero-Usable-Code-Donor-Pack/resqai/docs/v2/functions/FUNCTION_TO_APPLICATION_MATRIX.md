# ResQAI V2 — Function-to-Application Matrix

> **Version:** 2.0.0  
> **Generated:** 2026-06-30

**Legend:** X = Direct call | (W) = Workflow-triggered | (A) = Agent-triggered

| Function | support-center_v2 | operations-center_v2 | appointment-center_v2 | crm-center_v2 | customer-portal_v2 | technician-portal_v2 | resolution-center_v2 | analytics-center_v2 | admin-center_v2 | notification-center_v2 |
|----------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| validate-ticket-input (V2) | X | — | — | — | X | — | — | — | — | — |
| check-ticket-urgency | (W) | (W) | — | — | — | — | — | — | — | — |
| update-ticket-record | X, (W) | — | — | — | — | — | — | — | — | — |
| classify-ticket-sla-tier (V2) | (W) | — | — | — | — | — | — | — | — | — |
| check-sla-deadline (V2) | X | — | — | — | — | — | — | — | — | — |
| batch-sla-check (V2) | — | — | — | — | — | — | — | — | — | — |
| collect-resolved-tickets | X | — | — | — | — | — | — | X | — | — |
| assign-appointment-technician | — | — | X, (W) | — | — | — | — | — | — | — |
| fetch-upcoming-appointments | — | — | (W) | — | — | — | — | — | — | — |
| schedule-appointment-reminders (V2) | — | — | (W) | — | — | — | — | — | — | — |
| check-reminder-window (V2) | — | — | (W) | — | — | — | — | — | — | — |
| finalize-dispatch | — | X, (W) | — | — | — | — | — | — | — | — |
| calculate-dispatch-priority (V2) | — | (W) | — | — | — | — | — | — | — | — |
| create-work-order | — | X, (W) | — | — | — | X | — | — | — | — |
| update-work-order-stage (V2) | — | — | — | — | — | X | — | — | — | — |
| complete-work-order (V2) | — | — | — | — | — | X | — | — | — | — |
| resolve-dispute | — | — | — | — | — | — | X, (W) | — | — | — |
| resolve-dispute-v2 | — | — | — | — | — | — | X, (W) | — | — | — |
| account-health-scan | — | — | — | X, (W) | — | — | — | — | — | — |
| update-account-health-status | — | — | — | X, (W) | — | — | — | — | — | — |
| flag-slipping-followups | — | — | — | X | — | — | — | — | — | — |
| create-followup-tasks | — | — | — | (W) | — | — | — | — | — | — |
| finalize-slippage-review | — | — | — | (W) | — | — | — | — | — | — |
| generate-account-score | — | — | — | (A) | — | — | — | — | — | — |
| process-feedback-survey (V2) | — | — | — | — | X | — | — | — | — | X |
| analyze-feedback-sentiment (V2) | — | — | — | X | — | — | — | — | — | — |
| extract-knowledge-gap (V2) | X | — | — | — | — | — | — | — | — | — |
| search-knowledge-articles | X | — | — | — | X | — | — | — | — | — |
| suggest-knowledge-article | (A) | — | — | — | — | — | — | — | — | — |
| render-notification-template (V2) | — | — | — | — | — | — | — | — | — | X |
| dispatch-notifications | — | — | (W) | — | — | — | — | — | — | X, (W) |
| process-notification-delivery (V2) | — | — | — | — | — | — | — | — | — | X |
| create-operations-tasks | — | X, (W) | — | — | — | — | — | — | — | — |
| generate-standup-report (V2) | — | (W) | — | — | — | — | — | — | — | — |
| generate-report-data (V2) | — | — | — | — | — | — | — | X, (W) | — | — |
| send-report (V2) | — | — | — | — | — | — | — | X, (W) | — | — |
| sync-events-analytics (V2) | — | — | — | — | — | — | — | (W) | — | — |
| calculate-metric-trend (V2) | — | — | — | — | — | — | — | X | — | — |
| batch-metric-aggregation (V2) | — | — | — | — | — | — | — | (W) | — | — |
| provision-user (V2) | — | — | — | — | — | — | — | — | X, (W) | — |
| deactivate-user (V2) | — | — | — | — | — | — | — | — | X, (W) | — |
| validate-config-change (V2) | — | — | — | — | — | — | — | — | X | — |
| apply-config-change (V2) | — | — | — | — | — | — | — | — | X, (W) | — |
| log-audit-event | X | X | X | X | X | X | X | X | X | X |
| check-inventory-level (V2) | — | X | — | — | — | — | — | — | — | — |
| reorder-inventory (V2) | — | (W) | — | — | — | — | — | — | — | — |
| record-inventory-transaction (V2) | — | X | — | — | — | X | — | — | — | — |
| validate-permissions (V2) | X | X | X | X | X | X | X | X | X | X |
| generate-api-token (V2) | — | — | — | — | — | — | — | — | X | — |
| rotate-credentials (V2) | — | — | — | — | — | — | — | — | X | — |
| verify-workflow-health (V2) | — | — | — | — | — | — | — | — | (W) | — |
| recover-workflow-instance (V2) | — | — | — | — | — | — | — | — | (W) | — |
| reset-circuit-breaker (V2) | — | — | — | — | — | — | — | — | (W) | — |
| evaluate-quality-score (V2) | — | — | — | — | — | — | — | — | — | — |
| flag-quality-violation (V2) | — | — | — | — | — | — | — | — | — | — |
| create-ticket | — | — | — | — | X | — | — | — | — | — |
| update-ticket-v2 | X | — | — | — | — | — | — | — | — | — |
| assign-ticket | X | — | — | — | — | — | — | — | — | — |
| close-ticket | X | — | — | — | — | — | — | — | — | — |
| escalate-ticket | X | — | — | — | — | — | — | — | — | — |
| search-tickets | X | — | — | — | — | — | — | — | — | — |
| create-appointment | — | — | X | — | — | — | — | — | — | — |
| accept-appointment | — | — | — | — | — | X | — | — | — | — |
| complete-appointment | — | — | — | — | — | X | — | — | — | — |
| cancel-appointment | — | — | X | — | — | — | — | — | — | — |
| list-appointments | — | — | X | — | — | — | — | — | — | — |
| get-appointment | — | — | X | — | — | — | — | — | — | — |
| create-technician | — | X | — | — | — | — | — | — | — | — |
| update-technician | — | X | — | — | — | — | — | — | — | — |
| list-technicians | — | X | — | — | — | — | — | — | — | — |
| update-technician-skills | — | X | — | — | — | — | — | — | — | — |
| create-customer | — | — | — | X | — | — | — | — | — | — |
| update-customer | — | — | — | X | — | — | — | — | — | — |
| get-customer | — | — | — | X | — | — | — | — | — | — |
| search-customers | — | — | — | X | — | — | — | — | — | — |
| create-followup | — | — | — | X | — | — | — | — | — | — |
| complete-followup | — | — | — | X | — | — | — | — | — | — |
| list-followups | — | — | — | X | — | — | — | — | — | — |
| update-account-health | — | — | — | X | — | — | — | — | — | — |
| list-disputes | — | — | — | — | — | — | X | — | — | — |
| get-work-order | — | — | — | — | — | X | — | — | — | — |
| list-work-orders | — | — | — | — | — | X | — | — | — | — |
| update-work-order | — | — | — | — | — | X | — | — | — | — |
| create-inventory-item | — | X | — | — | — | — | — | — | — | — |
| update-inventory-item | — | X | — | — | — | — | — | — | — | — |
| list-inventory | — | X | — | — | — | — | — | — | — | — |
| dispatch-notification-v2 | — | — | — | — | — | — | — | — | — | X |
| send-bulk-notification | — | — | — | — | — | — | — | — | — | X |
| track-notification | — | — | — | — | — | — | — | — | — | X |
| analytics-aggregation | — | — | — | — | — | — | — | X | — | — |
| dashboard-metrics | — | X | — | — | — | — | — | X | — | — |
| create-report | — | — | — | — | — | — | — | X | — | — |
| schedule-report | — | — | — | — | — | — | — | X | — | — |
| execute-report | — | — | — | — | — | — | — | X | — | — |
| create-user | — | — | — | — | — | — | — | — | X | — |
| update-user | — | — | — | — | — | — | — | — | X | — |
| list-users | — | — | — | — | — | — | — | — | X | — |
| create-role | — | — | — | — | — | — | — | — | X | — |
| assign-user-role | — | — | — | — | — | — | — | — | X | — |
| manage-permission | — | — | — | — | — | — | — | — | X | — |
| list-permissions | — | — | — | — | — | — | — | — | X | — |
| record-audit | — | — | — | — | — | — | — | — | X | — |
| query-audit-log | — | — | — | — | — | — | — | — | X | — |
| authenticate-user | — | — | — | — | X | — | — | — | — | — |
| validate-session | X | X | X | X | X | X | X | X | X | X |
