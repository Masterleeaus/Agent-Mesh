# ResQAI V2 — Function Dependencies

> Version: 2.0.0
> Generated: 2026-06-29

## Dependency Graph

### Table Dependencies

| Function | Reads From | Writes To |
|----------|-----------|-----------|
| accept_appointment | appointments | appointments, operations_log |
| account_health_scan | accounts, customers, followups, disputes, appointments | (pure calculation, no record writes) |
| analytics_aggregation | tickets, appointments, customers, users | (none — returns computed metrics) |
| assign_appointment_technician | appointments | appointments, operations_log |
| assign_ticket | tickets | tickets, operations_log, events |
| assign_user_role | users, user_roles | users, operations_log |
| authenticate_user | users | users, user_sessions, operations_log |
| cancel_appointment | appointments | appointments, operations_log |
| check_ticket_urgency | (none — pure logic) | (none — pure logic) |
| close_ticket | tickets, customers | tickets, operations_log, events |
| collect_resolved_tickets | tickets | (none — reads only, Discord side-effect) |
| complete_appointment | appointments | appointments, inventory_transactions, operations_log |
| complete_followup | followups, accounts | followups, accounts, operations_log |
| create_appointment | customers | appointments, operations_log |
| create_customer | (none) | customers, accounts, operations_log |
| create_followup | accounts | followups, accounts, operations_log |
| create_followup_tasks | (none) | followups, operations_log |
| create_inventory_item | inventory (for SKU check) | inventory, operations_log |
| create_operations_tasks | (none) | operations_tasks, operations_log |
| create_report | (none) | analytics_reports, operations_log |
| create_role | user_roles (for duplicate check) | user_roles, operations_log |
| create_technician | (none) | technicians, operations_log |
| create_ticket | (none) | tickets, operations_log, events |
| create_user | users (for duplicate check) | users, operations_log |
| create_work_order | appointments | work_orders, operations_log |
| dashboard_metrics | tickets, appointments, customers, users, account_health, followups, work_orders | (none — returns computed metrics) |
| dispatch_notification_v2 | (none) | notifications, operations_log |
| dispatch_notifications | (none) | operations_log |
| escalate_ticket | tickets | tickets, operations_log, events |
| execute_report | analytics_reports, (dynamic tables from config) | operations_log |
| fetch_upcoming_appointments | appointments | (none — reads only) |
| finalize_dispatch | tickets | tickets, operations_log, events |
| finalize_slippage_review | (none) | operations_log |
| flag_slipping_followups | followups (via fixtures), accounts, customers | (none — pure calculation) |
| get_appointment | appointments | (none — reads only) |
| get_customer | customers, accounts | (none — reads only) |
| get_work_order | work_orders | (none — reads only) |
| list_appointments | appointments | (none — reads only) |
| list_disputes | disputes | (none — reads only) |
| list_followups | followups | (none — reads only) |
| list_inventory | inventory | (none — reads only) |
| list_permissions | role_permissions, user_roles | (none — reads only) |
| list_technicians | technicians | (none — reads only) |
| list_users | users | (none — reads only) |
| list_work_orders | work_orders | (none — reads only) |
| manage_permission | role_permissions (for duplicate check) | role_permissions, operations_log |
| query_audit_log | audit_log | (none — reads only) |
| record_audit | (none) | audit_log |
| resolve_dispute | disputes, tickets | disputes, tickets, operations_log |
| resolve_dispute_v2 | disputes, tickets | disputes, tickets, operations_log, events |
| schedule_report | analytics_reports | report_schedules, operations_log |
| search_customers | customers | (none — reads only) |
| search_tickets | tickets | (none — reads only) |
| send_bulk_notification | (none) | notifications, operations_log |
| track_notification | notifications | notifications |
| update_account_health | accounts | accounts, account_health_scans, operations_log |
| update_account_health_status | (none) | operations_log |
| update_customer | customers | customers, operations_log |
| update_inventory_item | inventory | inventory, inventory_transactions, operations_log |
| update_technician | technicians | technicians, operations_log |
| update_technician_skills | technicians | technicians, operations_log |
| update_ticket_record | tickets, customers | tickets, operations_log |
| update_ticket_v2 | tickets | tickets, operations_log, events |
| update_user | users | users, operations_log |
| update_work_order | work_orders | work_orders, operations_log |
| validate_session | user_sessions | (none — reads only) |

### Key Tables Summary

| Table | Read By | Written By |
|-------|---------|-----------|
| tickets | 17 functions | 10 functions |
| appointments | 9 functions | 5 functions |
| customers | 5 functions | 2 functions |
| users | 5 functions | 3 functions |
| work_orders | 3 functions | 1 function |
| accounts | 4 functions | 4 functions |
| followups | 4 functions | 2 functions |
| disputes | 3 functions | 2 functions |
| inventory | 3 functions | 2 functions |
| user_sessions | 1 function | 1 function |
| notifications | 3 functions | 2 functions |
| user_roles | 3 functions | 2 functions |
| operations_log | 0 functions | 47 functions |
| events | 0 functions | 7 functions |

## Cross-Function Dependencies

### Functions called by workflows

| Function | Called By Workflow(s) |
|----------|----------------------|
| check_ticket_urgency | ticket-intake, urgent-dispatch |
| update_ticket_record | ticket-intake, support-escalation-manager |
| fetch_upcoming_appointments | appointment-reminders |
| dispatch_notifications | appointment-reminders |
| finalize_dispatch | urgent-dispatch |
| assign_appointment_technician | appointment-assignment |
| resolve_dispute | dispute-resolution |
| collect_resolved_tickets | customer-satisfaction-monitor |
| flag_slipping_followups | followup-slippage-detector, account-health |
| finalize_slippage_review | followup-slippage-detector |
| create_operations_tasks | daily-standup |
| create_followup_tasks | account-health |
| account_health_scan | account-health |
| update_account_health_status | account-health-monitoring |

### Functions NOT called by any workflow (standalone/API)

These functions are exposed as individual API endpoints or agent tools:

accept_appointment, analytics_aggregation, assign_ticket, assign_user_role, authenticate_user, cancel_appointment, close_ticket, complete_appointment, complete_followup, create_appointment, create_customer, create_followup, create_inventory_item, create_report, create_role, create_technician, create_ticket, create_user, create_work_order, dashboard_metrics, dispatch_notification_v2, escalate_ticket, execute_report, get_appointment, get_customer, get_work_order, list_appointments, list_disputes, list_followups, list_inventory, list_permissions, list_technicians, list_users, list_work_orders, manage_permission, query_audit_log, record_audit, resolve_dispute_v2, schedule_report, search_customers, search_tickets, send_bulk_notification, track_notification, update_account_health, update_customer, update_inventory_item, update_technician, update_technician_skills, update_ticket_v2, update_user, update_work_order, validate_session

## External Dependencies

| Dependency | Version | Used By |
|------------|---------|---------|
| lemma-sdk | >= 0.5.2 | All handler functions (Pod, FunctionContext) |
| pydantic | >= 2.0 | All function input/output models |

### Connector Dependencies

| Connector | Used By Functions |
|-----------|------------------|
| resqai-discord | escalate_ticket, collect_resolved_tickets, finalize_dispatch, finalize_slippage_review, resolve_dispute, resolve_dispute_v2, update_account_health_status |
| resqai-gmail | dispatch_notifications, dispatch_notification_v2, close_ticket, update_ticket_record |
| resqai-twilio | dispatch_notifications, dispatch_notification_v2 |

## Workflow Integration Map

| Workflow | Functions Used | Trigger |
|----------|---------------|---------|
| ticket-intake | check_ticket_urgency, update_ticket_record | Event: ticket.created |
| appointment-reminders | fetch_upcoming_appointments, dispatch_notifications | Schedule: 0 7 * * * |
| urgent-dispatch | check_ticket_urgency, finalize_dispatch | Event: tickets INSERT/UPDATE |
| appointment-assignment | assign_appointment_technician | Event: appointments INSERT |
| followup-slippage-detector | flag_slipping_followups, finalize_slippage_review | Schedule: */30 * * * * |
| dispute-resolution | resolve_dispute | Event: disputes INSERT/UPDATE |
| customer-satisfaction-monitor | collect_resolved_tickets, update_ticket_record | Schedule: 0 8 * * * |
| account-health-monitoring | update_account_health_status | Schedule: 0 2 * * * |
| support-escalation-manager | update_ticket_record | Event: tickets UPDATE |
| account-health | flag_slipping_followups, account_health_scan, create_followup_tasks | Schedule: 0 2 * * * |
| daily-standup | create_operations_tasks | Schedule: 0 8 * * 1-5 |
