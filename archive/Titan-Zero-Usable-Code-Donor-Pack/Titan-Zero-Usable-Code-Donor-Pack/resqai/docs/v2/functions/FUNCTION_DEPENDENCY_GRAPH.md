# ResQAI V2 — Function Dependency Graph

> **Version:** 2.0.0  
> **Generated:** 2026-06-30

---

## Summary

| Metric | Value |
|--------|:-----:|
| Total Functions | ~96 |
| Total Table Dependencies | 41 V2 tables + 9 V1 legacy tables |
| Total Connector Dependencies | resqai-discord, resqai-gmail, resqai-twilio |

---

## A. Function-to-Function Call Graph

| Caller Function | Callee Function | Invocation Context |
|----------------|----------------|-------------------|
| complete-appointment | create-work-order | Post-completion — generates work order from completed appointment |
| update-ticket-record (if approved_to_send) | Gmail connector | Conditional email dispatch after draft approval |
| escalate-ticket | Discord connector | Post alert to support-alerts channel |
| resolve-dispute-v2 | Discord connector, Gmail connector | Notify customer and Discord on resolution |
| update-account-health-status | Discord connector | Post critical health alerts |
| dispatch-notifications | Gmail, Twilio connectors | Batch send reminders via email/SMS |
| dispatch-notification-v2 | Gmail, Twilio connectors | Single notification via email/SMS |
| send-bulk-notification | Gmail, Twilio connectors | Bulk notification dispatch |
| close-ticket | Gmail connector | Send closure notification to customer |
| provision-user (V2) | dispatch-notifications | Send welcome notification after provisioning |
| deactivate-user (V2) | dispatch-notifications | Send deactivation notice |
| finalize-dispatch | Discord connector | Post dispatch alert |
| collect-resolved-tickets | Discord connector | Post daily resolved summary |
| send-report (V2) | dispatch-notifications | Route report through notification system |
| generate-report-data (V2) | ALL domain tables | Query across all domain tables for report generation |
| finalize-slippage-review | Discord connector | Post slippage alert |
| resolve-dispute | Discord connector | Post resolution to Discord |
| complete-work-order (V2) | inventory (record-inventory-transaction) | Record parts used as inventory transactions |
| dispatch-notifications | render-notification-template | Render template before dispatching |
| send-report (V2) | generate-report-data | Retrieve data before sending |
| report-distribution_v2 | dispatch-notifications | Deliver reports via notification system |

---

## B. Workflow-to-Function Dependency Map

| Workflow | Functions Used |
|----------|---------------|
| ticket-intake_v2 | check-ticket-urgency, update-ticket-record, validate-ticket-input (V2), classify-ticket-sla-tier (V2), search-knowledge-articles, suggest-knowledge-article |
| urgent-dispatch_v2 | check-ticket-urgency, finalize-dispatch, calculate-dispatch-priority (V2) |
| appointment-assignment_v2 | assign-appointment-technician |
| appointment-reminders_v2 | fetch-upcoming-appointments, dispatch-notifications, schedule-appointment-reminders (V2), check-reminder-window (V2) |
| dispute-resolution_v2 | resolve-dispute, resolve-dispute-v2 |
| support-escalation-manager_v2 | update-ticket-record, escalate-ticket |
| account-health-monitoring_v2 | update-account-health-status, account-health-scan |
| account-health-scan_v2 | flag-slipping-followups, account-health-scan, create-followup-tasks, generate-account-score |
| followup-slippage-detector_v2 | flag-slipping-followups, finalize-slippage-review |
| customer-satisfaction-monitor_v2 | collect-resolved-tickets, update-ticket-record |
| daily-standup_v2 | create-operations-tasks, dashboard-metrics, generate-standup-report (V2) |
| work-order-fulfillment_v2 | create-work-order, update-work-order-stage (V2), complete-work-order (V2), record-inventory-transaction |
| user-provisioning_v2 | provision-user (V2), deactivate-user (V2), dispatch-notifications |
| system-config-management_v2 | validate-config-change (V2), apply-config-change (V2) |
| notification-delivery_v2 | render-notification-template (V2), dispatch-notifications, process-notification-delivery (V2) |
| report-generation_v2 | generate-report-data (V2), send-report (V2) |
| report-distribution_v2 | send-report (V2), dispatch-notifications |
| sla-enforcement_v2 | check-sla-deadline (V2), batch-sla-check (V2) |
| feedback-analysis_v2 | process-feedback-survey (V2), analyze-feedback-sentiment (V2) |
| quality-review_v2 | evaluate-quality-score (V2), flag-quality-violation (V2) |
| workflow-health-monitor_v2 | verify-workflow-health (V2), recover-workflow-instance (V2), reset-circuit-breaker (V2) |
| trend-analysis_v2 | sync-events-analytics (V2), calculate-metric-trend (V2), batch-metric-aggregation (V2) |
| anomaly-detection_v2 | batch-metric-aggregation (V2), calculate-metric-trend (V2) |
| knowledge-gap-detection_v2 | extract-knowledge-gap (V2) |
| inventory-reorder_v2 | check-inventory-level (V2), reorder-inventory (V2), record-inventory-transaction (V2) |
| customer-satisfaction_v2 | process-feedback-survey (V2), collect-resolved-tickets |
| appointment-booking_v2 | assign-appointment-technician |
| ticket-auto-response_v2 | check-ticket-urgency |
| dispute-escalation_v2 | resolve-dispute, resolve-dispute-v2 |
| followup-management_v2 | create-followup-tasks, create-followup |
| retention-campaign_v2 | create-followup-tasks |
| operations-coordination_v2 | create-operations-tasks, generate-standup-report (V2) |
| standard-dispatch_v2 | finalize-dispatch, calculate-dispatch-priority (V2) |

---

## C. Circular Dependency Detection

| Chain | Status | Notes |
|-------|--------|-------|
| NONE DETECTED | ✅ GREEN | All dependencies are acyclic. Design rules enforce: events flow downhill through tiers, analytics is read-only, notifications are terminal. |

---

## D. Table Read/Write Heatmap

### V2 Tables

| Table | Read By (count) | Write By (count) | Read Functions | Write Functions |
|-------|:---------------:|:----------------:|----------------|-----------------|
| tickets_v2 | 17 | 8 | check-sla-deadline, batch-sla-check, collect-resolved-tickets, account-health-scan, extract-knowledge-gap, search-tickets, update-ticket-record, close-ticket, escalate-ticket, assign-ticket, update-ticket-v2, finalize-dispatch, resolve-dispute, resolve-dispute-v2, generate-standup-report, dashboard-metrics, analytics_aggregation | update-ticket-record, close-ticket, escalate-ticket, assign-ticket, update-ticket-v2, finalize-dispatch, resolve-dispute, resolve-dispute-v2 |
| appointments_v2 | 12 | 4 | assign-appointment-technician, fetch-upcoming-appointments, schedule-appointment-reminders, account-health-scan, complete-appointment, create-work-order, cancel-appointment, accept-appointment, resolve-dispute, generate-standup-report, dashboard-metrics, analytics_aggregation | assign-appointment-technician, schedule-appointment-reminders, create-appointment, complete-appointment, cancel-appointment, accept-appointment |
| accounts_v2 | 6 | 3 | account-health-scan, update-account-health-status, flag-slipping-followups, create-followup-tasks, generate-standup-report, dashboard-metrics | update-account-health, update-account-health-status, account-health-scan |
| customers_v2 | 7 | 1 | update-ticket-record, close-ticket, account-health-scan, create-followup-tasks, resolve-dispute, dashboard-metrics, analytics_aggregation | create-customer |
| users_v2 | 6 | 2 | provision-user (V2), deactivate-user (V2), send-report, create-user, assign-user-role, update-user | provision-user (V2), deactivate-user (V2), create-user, update-user, assign-user-role |
| technicians_v2 | 6 | 2 | assign-appointment-technician, finalize-dispatch, create-work-order, create-technician, update-technician, update-technician-skills | create-technician, update-technician, update-technician-skills |
| followups_v2 | 5 | 3 | flag-slipping-followups, finalize-slippage-review, account-health-scan, complete-followup, dashboard-metrics | finalize-slippage-review, create-followup, complete-followup, create-followup-tasks |
| disputes_v2 | 4 | 2 | resolve-dispute, resolve-dispute-v2, account-health-scan, list-disputes | resolve-dispute, resolve-dispute-v2 |
| work_orders_v2 | 5 | 3 | update-work-order-stage, complete-work-order, create-work-order, get-work-order, list-work-orders | update-work-order-stage, complete-work-order, create-work-order |
| dispatches_v2 | 1 | 1 | finalize-dispatch | finalize-dispatch |
| notifications_v2 | 3 | 3 | dispatch-notifications, process-notification-delivery, track-notification | dispatch-notifications, process-notification-delivery, dispatch-notification-v2, send-bulk-notification |
| system_settings_v2 | 4 | 1 | classify-ticket-sla-tier, check-sla-deadline, batch-sla-check, validate-config-change | apply-config-change |
| feature_flags_v2 | 1 | 1 | validate-config-change | apply-config-change |
| knowledge_articles_v2 | 3 | 0 | extract-knowledge-gap, search-knowledge-articles, suggest-knowledge-article | None |
| knowledge_categories_v2 | 2 | 0 | extract-knowledge-gap, search-knowledge-articles | None |
| audit_log_v2 | 1 | 1 | query-audit-log | log-audit-event |
| account_health_scans_v2 | 1 | 2 | update-account-health-status | account-health-scan, update-account-health |
| appointment_reminders_v2 | 1 | 1 | schedule-appointment-reminders | schedule-appointment-reminders |
| work_order_stages_v2 | 2 | 2 | update-work-order-stage, complete-work-order | update-work-order-stage, complete-work-order |
| events_v2 | 2 | 1 | sync-events-analytics, calculate-metric-trend | sync-events-analytics (write), create-ticket (write), update-ticket-v2 (write), escalate-ticket (write), assign-ticket (write) |
| analytics_reports_v2 | 5 | 3 | generate-report-data, send-report, sync-events-analytics, calculate-metric-trend, batch-metric-aggregation | sync-events-analytics, batch-metric-aggregation, create-report, execute-report |
| analytics_schedules_v2 | 2 | 1 | generate-report-data, send-report | schedule-report |
| feedback_v2 | 2 | 2 | account-health-scan, analyze-feedback-sentiment | process-feedback-survey, analyze-feedback-sentiment |
| feedback_surveys_v2 | 2 | 0 | process-feedback-survey, analyze-feedback-sentiment | None |
| ticket_messages_v2 | 1 | 0 | extract-knowledge-gap | None |
| ticket_attachments_v2 | 0 | 0 | None | None |
| customer_addresses_v2 | 0 | 0 | None | None |
| technician_skills_v2 | 2 | 0 | assign-appointment-technician, update-technician-skills | None |
| dispute_evidence_v2 | 0 | 0 | None | None |
| tasks_v2 | 2 | 3 | create-operations-tasks, generate-standup-report, dashboard-metrics | create-operations-tasks, create-followup-tasks, finalize-slippage-review |
| task_assignments_v2 | 1 | 1 | create-operations-tasks | create-operations-tasks |
| followup_attempts_v2 | 0 | 0 | None | None |
| inventory_items_v2 | 3 | 3 | check-inventory-level, reorder-inventory, record-inventory-transaction | reorder-inventory, record-inventory-transaction, update-inventory-item |
| inventory_transactions_v2 | 1 | 3 | check-inventory-level | reorder-inventory, record-inventory-transaction, update-inventory-item |
| connectors_v2 | 0 | 0 | None | None |
| notification_templates_v2 | 3 | 0 | render-notification-template, dispatch-notifications, schedule-appointment-reminders | None |
| notification_channels_v2 | 1 | 0 | dispatch-notifications | None |
| user_roles_v2 | 3 | 2 | provision-user (V2), deactivate-user (V2), validate-permissions | provision-user (V2), create-role, assign-user-role |
| user_sessions_v2 | 2 | 1 | deactivate-user (V2), validate-session | deactivate-user (V2) |
| role_permissions_v2 | 2 | 1 | provision-user (V2), validate-permissions | manage-permission |
| reference_data_v2 | 0 | 0 | None | None |

### V1 Legacy Tables

| Table | Read By | Written By |
|-------|---------|-----------|
| customers | flag_slipping_followups, account_health_scan | create_customer |
| technicians | create_work_order, list_technicians | create_technician, update_technician, update_technician_skills |
| tickets | search_tickets, close_ticket, escalate_ticket, assign_ticket, update_ticket_v2, collect_resolved_tickets | close_ticket, escalate_ticket, assign_ticket, update_ticket_v2 |
| appointments | get_appointment, list_appointments, fetch_upcoming_appointments, complete_appointment, cancel_appointment, accept_appointment | create_appointment, complete_appointment, cancel_appointment, accept_appointment |
| disputes | list_disputes | resolve_dispute, resolve_dispute_v2 |
| tasks | dashboard_metrics | create_operations_tasks, create_followup_tasks |
| operations_log | generate_standup_report | ALL writer functions |
| accounts | flag_slipping_followups, account_health_scan, get_customer | create_customer, update_account_health, complete_followup |
| followups | flag_slipping_followups, list_followups, complete_followup | create_followup, complete_followup |
