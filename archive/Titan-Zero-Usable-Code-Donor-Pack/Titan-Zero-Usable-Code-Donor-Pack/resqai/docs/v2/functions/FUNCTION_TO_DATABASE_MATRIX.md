# ResQAI V2 — Function-to-Database Matrix

> **Version:** 2.0.0  
> **Generated:** 2026-06-30

| Function | Tables Read | Tables Written | Read Tables (V2) | Write Tables (V2) |
|----------|------------|---------------|------------------|-------------------|
| validate-ticket-input (V2) | None | None | — | — |
| check-ticket-urgency | None | None | — | — |
| update-ticket-record | tickets_v2, customers_v2 | tickets_v2, audit_log_v2 | tickets_v2, customers_v2 | tickets_v2, audit_log_v2 |
| classify-ticket-sla-tier (V2) | system_settings_v2 | None | system_settings_v2 | — |
| check-sla-deadline (V2) | tickets_v2, system_settings_v2 | None | tickets_v2, system_settings_v2 | — |
| batch-sla-check (V2) | tickets_v2, system_settings_v2 | None | tickets_v2, system_settings_v2 | — |
| collect-resolved-tickets | tickets_v2 | None | tickets_v2 | — |
| assign-appointment-technician | appointments_v2, technicians_v2, technician_skills_v2 | appointments_v2 | appointments_v2, technicians_v2, technician_skills_v2 | appointments_v2 |
| fetch-upcoming-appointments | appointments_v2 | None | appointments_v2 | — |
| schedule-appointment-reminders (V2) | appointments_v2, notification_templates_v2 | appointment_reminders_v2 | appointments_v2, notification_templates_v2 | appointment_reminders_v2 |
| check-reminder-window (V2) | None | None | — | — |
| finalize-dispatch | dispatches_v2, technicians_v2, tickets_v2 | dispatches_v2 | dispatches_v2, technicians_v2, tickets_v2 | dispatches_v2 |
| calculate-dispatch-priority (V2) | None | None | — | — |
| create-work-order | appointments_v2, technicians_v2 | work_orders_v2 | appointments_v2, technicians_v2 | work_orders_v2 |
| update-work-order-stage (V2) | work_orders_v2, work_order_stages_v2 | work_orders_v2, work_order_stages_v2 | work_orders_v2, work_order_stages_v2 | work_orders_v2, work_order_stages_v2 |
| complete-work-order (V2) | work_orders_v2, work_order_stages_v2 | work_orders_v2, work_order_stages_v2 | work_orders_v2, work_order_stages_v2 | work_orders_v2, work_order_stages_v2 |
| resolve-dispute | disputes_v2, appointments_v2, customers_v2 | disputes_v2 | disputes_v2, appointments_v2, customers_v2 | disputes_v2 |
| resolve-dispute-v2 | disputes_v2, tickets_v2 | disputes_v2, tickets_v2 | disputes_v2, tickets_v2 | disputes_v2, tickets_v2 |
| account-health-scan | accounts_v2, disputes_v2, followups_v2, feedback_v2, tickets_v2, appointments_v2, customers | account_health_scans_v2, accounts | accounts_v2, disputes_v2, followups_v2, feedback_v2, tickets_v2, appointments_v2 | account_health_scans_v2 |
| update-account-health-status | accounts_v2, account_health_scans_v2 | accounts_v2, audit_log_v2 | accounts_v2, account_health_scans_v2 | accounts_v2, audit_log_v2 |
| flag-slipping-followups | followups_v2, accounts, customers | None | followups_v2 | — |
| create-followup-tasks | accounts_v2, customers_v2 | followups_v2, tasks_v2 | accounts_v2, customers_v2 | followups_v2, tasks_v2 |
| finalize-slippage-review | followups_v2 | followups_v2, tasks_v2 | followups_v2 | followups_v2, tasks_v2 |
| generate-account-score | None | None | — | — |
| process-feedback-survey (V2) | feedback_surveys_v2 | feedback_v2 | feedback_surveys_v2 | feedback_v2 |
| analyze-feedback-sentiment (V2) | feedback_v2 | feedback_v2 | feedback_v2 | feedback_v2 |
| extract-knowledge-gap (V2) | tickets_v2, ticket_messages_v2, knowledge_articles_v2, knowledge_categories_v2 | None | tickets_v2, ticket_messages_v2, knowledge_articles_v2, knowledge_categories_v2 | — |
| search-knowledge-articles | knowledge_articles_v2, knowledge_categories_v2 | None | knowledge_articles_v2, knowledge_categories_v2 | — |
| suggest-knowledge-article | None | None | — | — |
| render-notification-template (V2) | notification_templates_v2 | None | notification_templates_v2 | — |
| dispatch-notifications | notification_templates_v2, notification_channels_v2, notifications_v2 | notifications_v2, audit_log_v2 | notification_templates_v2, notification_channels_v2, notifications_v2 | notifications_v2, audit_log_v2 |
| process-notification-delivery (V2) | notifications_v2 | notifications_v2 | notifications_v2 | notifications_v2 |
| create-operations-tasks | tasks_v2, technicians_v2 | tasks_v2, task_assignments_v2 | tasks_v2, technicians_v2 | tasks_v2, task_assignments_v2 |
| generate-standup-report (V2) | tickets_v2, appointments_v2, dispatches_v2, tasks_v2, work_orders_v2, accounts_v2, followups_v2, feedback_v2 | audit_log_v2 | tickets_v2, appointments_v2, dispatches_v2, tasks_v2, work_orders_v2, accounts_v2, followups_v2, feedback_v2 | audit_log_v2 |
| generate-report-data (V2) | analytics_reports_v2, analytics_schedules_v2, events_v2, ALL domain tables (dynamic) | None | analytics_reports_v2, analytics_schedules_v2, events_v2 | — |
| send-report (V2) | analytics_reports_v2, analytics_schedules_v2, users_v2 | None | analytics_reports_v2, analytics_schedules_v2, users_v2 | — |
| sync-events-analytics (V2) | events_v2 | analytics_reports_v2 | events_v2 | analytics_reports_v2 |
| calculate-metric-trend (V2) | events_v2, analytics_reports_v2 | None | events_v2, analytics_reports_v2 | — |
| batch-metric-aggregation (V2) | events_v2, analytics_reports_v2, ALL domain tables | analytics_reports_v2 | events_v2, analytics_reports_v2 | analytics_reports_v2 |
| provision-user (V2) | users_v2, user_roles_v2, role_permissions_v2 | users_v2, user_roles_v2 | users_v2, user_roles_v2, role_permissions_v2 | users_v2, user_roles_v2 |
| deactivate-user (V2) | users_v2, user_roles_v2, user_sessions_v2 | users_v2, user_sessions_v2 | users_v2, user_roles_v2, user_sessions_v2 | users_v2, user_sessions_v2 |
| validate-config-change (V2) | system_settings_v2, feature_flags_v2 | None | system_settings_v2, feature_flags_v2 | — |
| apply-config-change (V2) | system_settings_v2, feature_flags_v2 | system_settings_v2, feature_flags_v2 | system_settings_v2, feature_flags_v2 | system_settings_v2, feature_flags_v2 |
| log-audit-event | None | audit_log_v2 | — | audit_log_v2 |
| check-inventory-level (V2) | inventory_items_v2, inventory_transactions_v2 | None | inventory_items_v2, inventory_transactions_v2 | — |
| reorder-inventory (V2) | inventory_items_v2 | inventory_items_v2, inventory_transactions_v2 | inventory_items_v2 | inventory_items_v2, inventory_transactions_v2 |
| record-inventory-transaction (V2) | inventory_items_v2 | inventory_items_v2, inventory_transactions_v2 | inventory_items_v2 | inventory_items_v2, inventory_transactions_v2 |
| validate-permissions (V2) | role_permissions_v2, user_roles_v2 | None | role_permissions_v2, user_roles_v2 | — |
| generate-api-token (V2) | users_v2 | audit_log_v2 | users_v2 | audit_log_v2 |
| rotate-credentials (V2) | connectors_v2, system_settings_v2 | connectors_v2, system_settings_v2 | connectors_v2, system_settings_v2 | connectors_v2, system_settings_v2 |
| verify-workflow-health (V2) | events_v2 | audit_log_v2 | events_v2 | audit_log_v2 |
| recover-workflow-instance (V2) | events_v2 | audit_log_v2 | events_v2 | audit_log_v2 |
| reset-circuit-breaker (V2) | system_settings_v2 | system_settings_v2 | system_settings_v2 | system_settings_v2 |
| evaluate-quality-score (V2) | tickets_v2, ticket_messages_v2 | feedback_v2 | tickets_v2, ticket_messages_v2 | feedback_v2 |
| flag-quality-violation (V2) | disputes_v2, audit_log_v2 | audit_log_v2 | disputes_v2, audit_log_v2 | audit_log_v2 |
| create-ticket | — | tickets, operations_log, events | — | — |
| update-ticket-v2 | tickets | tickets, operations_log, events | — | — |
| assign-ticket | tickets | tickets, operations_log, events | — | — |
| close-ticket | tickets, customers | tickets, operations_log, events | — | — |
| escalate-ticket | tickets | tickets, operations_log, events | — | — |
| search-tickets | tickets | None | — | — |
| create-appointment | customers | appointments, operations_log | — | — |
| accept-appointment | appointments | appointments, operations_log | — | — |
| complete-appointment | appointments | appointments, inventory_transactions, operations_log | — | — |
| cancel-appointment | appointments | appointments, operations_log | — | — |
| list-appointments | appointments | None | — | — |
| get-appointment | appointments | None | — | — |
| create-technician | — | technicians, operations_log | — | — |
| update-technician | technicians | technicians, operations_log | — | — |
| list-technicians | technicians | None | — | — |
| update-technician-skills | technicians | technicians, operations_log | — | — |
| create-customer | — | customers, accounts, operations_log | — | — |
| update-customer | customers | customers, operations_log | — | — |
| get-customer | customers, accounts | None | — | — |
| search-customers | customers | None | — | — |
| create-followup | accounts | followups, accounts, operations_log | — | — |
| complete-followup | followups, accounts | followups, accounts, operations_log | — | — |
| list-followups | followups | None | — | — |
| update-account-health | accounts | accounts, account_health_scans, operations_log | — | — |
| update-account-health-status (V1) | None | operations_log | — | — |
| list-disputes | disputes | None | — | — |
| create-work-order (V1) | appointments | work_orders, operations_log | — | — |
| get-work-order | work_orders | None | — | — |
| list-work-orders | work_orders | None | — | — |
| update-work-order | work_orders | work_orders, operations_log | — | — |
| create-inventory-item | inventory_items | inventory_items, operations_log | — | — |
| update-inventory-item | inventory_items | inventory_items, inventory_transactions, operations_log | — | — |
| list-inventory | inventory_items | None | — | — |
| dispatch-notification-v2 | None | notifications, audit_log_v2 | — | notifications_v2, audit_log_v2 |
| send-bulk-notification | None | notifications | — | notifications_v2 |
| track-notification | notifications | notifications | — | notifications_v2 |
| analytics-aggregation | tickets, appointments, customers, users | None | — | — |
| dashboard-metrics | tickets, appointments, customers, users, account_health, followups, work_orders | None | — | — |
| create-report | None | analytics_reports | — | analytics_reports_v2 |
| schedule-report | analytics_reports | analytics_schedules, operations_log | — | analytics_schedules_v2 |
| execute-report | analytics_reports, dynamic tables | operations_log | analytics_reports_v2 | audit_log_v2 |
| create-user | users | users, operations_log | — | — |
| update-user | users | users, operations_log | — | — |
| list-users | users | None | — | — |
| create-role | user_roles | user_roles, operations_log | — | — |
| assign-user-role | users, user_roles | users, operations_log | — | — |
| manage-permission | role_permissions | role_permissions, operations_log | — | — |
| list-permissions | role_permissions, user_roles | None | — | — |
| record-audit | None | audit_log | — | — |
| query-audit-log | audit_log | None | — | — |
| authenticate-user | users | users, user_sessions, operations_log | — | — |
| validate-session | user_sessions | None | — | — |
