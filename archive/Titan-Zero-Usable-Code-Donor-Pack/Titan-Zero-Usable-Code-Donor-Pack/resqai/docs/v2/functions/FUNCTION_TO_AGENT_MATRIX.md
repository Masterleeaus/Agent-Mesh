# ResQAI V2 — Function-to-Agent Matrix

> **Version:** 2.0.0  
> **Generated:** 2026-06-30

| Function | Agent (V1) | Agent (V2) | Department |
|----------|-----------|------------|------------|
| validate-ticket-input (V2) | — | support-request-classifier_v2 | Support |
| check-ticket-urgency | request-classifier | support-manager_v2, support-request-classifier_v2 | Support |
| update-ticket-record | support-reply-drafter | support-manager_v2, support-reply-drafter_v2, support-escalation-manager_v2 | Support |
| classify-ticket-sla-tier (V2) | — | support-sla-monitor_v2 | Support |
| check-sla-deadline (V2) | — | support-sla-monitor_v2 | Support |
| batch-sla-check (V2) | — | — | — |
| collect-resolved-tickets | — | — | — |
| assign-appointment-technician | — | scheduling-manager_v2, scheduling-appointment-scheduler_v2, scheduling-technician-suggester_v2 | Scheduling |
| fetch-upcoming-appointments | — | appointment-manager_v2, appointment-reminder-coordinator_v2 | Appointment |
| schedule-appointment-reminders (V2) | — | appointment-reminder-coordinator_v2 | Appointment |
| check-reminder-window (V2) | — | appointment-reminder-coordinator_v2 | Appointment |
| finalize-dispatch | — | dispatch-manager_v2, dispatch-coordinator_v2, dispatch-technician-dispatcher_v2 | Dispatch |
| calculate-dispatch-priority (V2) | — | dispatch-coordinator_v2 | Dispatch |
| create-work-order | — | operations-work-order-manager_v2 | Operations |
| update-work-order-stage (V2) | — | operations-work-order-manager_v2 | Operations |
| complete-work-order (V2) | — | operations-work-order-manager_v2 | Operations |
| resolve-dispute | resolution-advisor | — | Resolution |
| resolve-dispute-v2 | — | — | Resolution |
| account-health-scan | account-health-monitor | crm-account-health-monitor_v2 | CRM |
| update-account-health-status | account-health-monitor | crm-manager_v2, crm-account-health-monitor_v2 | CRM |
| flag-slipping-followups | account-health-monitor | crm-account-health-monitor_v2 | CRM |
| create-followup-tasks | — | crm-followup-manager_v2 | CRM |
| finalize-slippage-review | — | — | CRM |
| generate-account-score | — | crm-account-health-monitor_v2 | CRM |
| process-feedback-survey (V2) | — | cx-satisfaction-survey_v2 | CX |
| analyze-feedback-sentiment (V2) | — | cx-feedback-analyzer_v2 | CX |
| extract-knowledge-gap (V2) | — | knowledge-manager_v2, knowledge-curator_v2 | Knowledge |
| search-knowledge-articles | — | knowledge-article-suggester_v2 | Knowledge |
| suggest-knowledge-article | — | support-request-classifier_v2, knowledge-article-suggester_v2 | Knowledge |
| render-notification-template (V2) | — | notification-template-manager_v2 | Notification |
| dispatch-notifications | — | notification-manager_v2, notification-channel-optimizer_v2, appointment-reminder-coordinator_v2, appointment-no-show-handler_v2, dispatch-manager_v2, dispatch-coordinator_v2, dispatch-technician-dispatcher_v2, dispatch-emergency-response_v2, reporting-distributor_v2 | All |
| process-notification-delivery (V2) | — | notification-manager_v2 | Notification |
| create-operations-tasks | operations-coordinator | operations-manager_v2, operations-coordinator_v2 | Operations |
| generate-standup-report (V2) | — | operations-coordinator_v2 | Operations |
| generate-report-data (V2) | — | reporting-generator_v2 | Reporting |
| send-report (V2) | — | reporting-distributor_v2 | Reporting |
| sync-events-analytics (V2) | — | — | Analytics |
| calculate-metric-trend (V2) | — | analytics-trend-analyzer_v2 | Analytics |
| batch-metric-aggregation (V2) | — | — | Analytics |
| provision-user (V2) | — | admin-manager_v2 | Admin |
| deactivate-user (V2) | — | admin-manager_v2 | Admin |
| validate-config-change (V2) | — | admin-system-config_v2 | Admin |
| apply-config-change (V2) | — | admin-system-config_v2 | Admin |
| log-audit-event | — | ALL agents (via functions) | All |
| check-inventory-level (V2) | — | — | Inventory |
| reorder-inventory (V2) | — | — | Inventory |
| record-inventory-transaction (V2) | — | operations-work-order-manager_v2 | Operations/Inventory |
| validate-permissions (V2) | — | ALL agents | All |
| generate-api-token (V2) | — | — | Security |
| rotate-credentials (V2) | — | — | Security |
| verify-workflow-health (V2) | — | automation-manager_v2, automation-workflow-orchestrator_v2 | Automation |
| recover-workflow-instance (V2) | — | automation-workflow-orchestrator_v2 | Automation |
| reset-circuit-breaker (V2) | — | automation-workflow-orchestrator_v2 | Automation |
| evaluate-quality-score (V2) | — | qa-manager_v2, qa-response-quality-monitor_v2 | QA |
| flag-quality-violation (V2) | — | qa-compliance-monitor_v2 | QA |
| create-ticket | — | — | — |
| update-ticket-v2 | support-reply-drafter | — | Support |
| assign-ticket | request-classifier | — | Support |
| close-ticket | — | — | Support |
| escalate-ticket | — | — | Support |
| search-tickets | request-classifier | — | Support |
| create-appointment | — | — | — |
| accept-appointment | — | — | — |
| complete-appointment | — | — | — |
| cancel-appointment | — | — | — |
| list-appointments | operations-coordinator | — | Operations |
| get-appointment | — | — | — |
| create-technician | — | — | — |
| update-technician | — | — | — |
| list-technicians | request-classifier, operations-coordinator | — | Support/Ops |
| update-technician-skills | — | — | — |
| create-customer | — | — | — |
| update-customer | — | — | — |
| get-customer | support-reply-drafter, resolution-advisor | — | Support/Resolution |
| search-customers | — | — | — |
| create-followup | — | — | CRM |
| complete-followup | — | — | CRM |
| list-followups | account-health-monitor | — | CRM |
| update-account-health | — | — | CRM |
| list-disputes | resolution-advisor | — | Resolution |
| get-work-order | — | — | — |
| list-work-orders | — | — | — |
| update-work-order | — | — | — |
| create-inventory-item | — | — | — |
| update-inventory-item | — | — | — |
| list-inventory | — | — | — |
| dispatch-notification-v2 | — | — | — |
| send-bulk-notification | — | — | — |
| track-notification | — | — | — |
| analytics-aggregation | — | — | — |
| dashboard-metrics | — | — | — |
| create-report | — | — | — |
| schedule-report | — | — | — |
| execute-report | — | — | — |
| create-user | — | — | — |
| update-user | — | — | — |
| list-users | — | — | — |
| create-role | — | — | — |
| assign-user-role | — | — | — |
| manage-permission | — | — | — |
| list-permissions | — | — | — |
| record-audit | — | — | — |
| query-audit-log | — | — | — |
| authenticate-user | — | — | — |
| validate-session | — | — | — |
