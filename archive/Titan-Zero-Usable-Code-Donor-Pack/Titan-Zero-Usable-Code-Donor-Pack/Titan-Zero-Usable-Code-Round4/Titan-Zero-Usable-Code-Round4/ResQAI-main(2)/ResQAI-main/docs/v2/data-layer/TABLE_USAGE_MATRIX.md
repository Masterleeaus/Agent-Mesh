# ResQAI V2 — Table Usage Matrix

> **Phase:** B.2 — Enterprise Data Layer Integration  
> **Date:** 2026-06-30  
> **Legend:** C=Create, R=Read, U=Update, D=Delete (Delete=soft delete)

---

## 1. Complete CRUD Matrix (41 Tables × 9 Applications)

| Table | admin-center_v2 | analytics-center_v2 | appointment-center_v2 | crm-center_v2 | customer-portal_v2 | operations-center_v2 | resolution-center_v2 | support-center_v2 | technician-portal_v2 |
|-------|:---------------:|:-------------------:|:---------------------:|:--------------:|:------------------:|:--------------------:|:--------------------:|:-----------------:|:--------------------:|
| reference_data_v2 | R | R | R | R | — | — | — | R | R |
| system_settings_v2 | CRUD | — | — | — | — | — | — | — | — |
| feature_flags_v2 | CRUD | — | — | — | — | — | — | — | — |
| connectors_v2 | CRUD | — | — | — | — | — | — | — | — |
| knowledge_categories_v2 | R | — | — | — | R | — | R | — | — |
| user_roles_v2 | CRUD | — | — | — | — | — | — | — | R |
| users_v2 | CRUD | — | — | — | RU | — | — | R | RU |
| user_sessions_v2 | RD | — | — | — | R | — | — | — | — |
| role_permissions_v2 | CRUD | — | — | — | R | — | — | — | R |
| customers_v2 | — | R | R | CRUD | CRUD | R | R | CRUD | R |
| customer_addresses_v2 | — | — | R | — | R | — | — | — | R |
| technicians_v2 | — | R | CRUD | — | — | CRUD | — | — | CRUD |
| technician_skills_v2 | — | — | R | — | — | — | — | — | R |
| accounts_v2 | — | R | — | CRUD | R | — | — | — | — |
| tickets_v2 | — | R | R | — | CRUD | R | R | CRUD | — |
| ticket_messages_v2 | — | — | — | — | R | — | — | CRUD | — |
| ticket_attachments_v2 | — | — | — | — | R | — | — | CRUD | — |
| appointments_v2 | — | R | CRUD | — | CRUD | R | — | — | R |
| appointment_reminders_v2 | — | — | CRUD | — | — | — | — | — | — |
| work_orders_v2 | — | — | — | — | R | CRUD | R | — | CRUD |
| work_order_stages_v2 | — | — | — | — | — | R | — | — | CRUD |
| dispatches_v2 | — | — | R | — | R | CRUD | — | — | R |
| disputes_v2 | — | R | — | — | R | — | CRUD | — | — |
| dispute_evidence_v2 | — | — | — | — | — | — | CRUD | — | — |
| tasks_v2 | — | R | — | CRUD | — | CRUD | — | — | — |
| task_assignments_v2 | — | — | — | R | — | R | — | — | — |
| followups_v2 | — | R | — | CRUD | R | — | — | — | — |
| followup_attempts_v2 | — | — | — | R | — | — | — | — | — |
| account_health_scans_v2 | — | — | — | CRUD | R | — | — | — | — |
| knowledge_articles_v2 | — | — | — | — | R | — | R | — | — |
| inventory_items_v2 | — | — | — | — | — | — | — | — | R |
| inventory_transactions_v2 | — | — | — | — | — | — | — | — | C |
| feedback_v2 | — | R | — | CRUD | CRUD | — | — | — | — |
| feedback_surveys_v2 | — | — | — | — | — | — | — | — | — |
| notifications_v2 | R | — | — | — | CRUD | — | — | — | CRUD |
| notification_templates_v2 | R | — | — | — | — | — | — | — | — |
| notification_channels_v2 | R | — | — | — | — | — | — | — | — |
| analytics_reports_v2 | — | CRUD | — | — | — | — | — | — | — |
| analytics_schedules_v2 | — | CRUD | — | — | — | — | — | — | — |
| audit_log_v2 | CRUD | R | — | — | — | — | — | — | — |
| events_v2 | R | — | — | — | — | — | — | — | — |

---

## 2. CRUD Summary

| Application | Create | Read | Update | Delete | Total Operations |
|-------------|:------:|:----:|:------:|:------:|:----------------:|
| admin-center_v2 | 7 | 14 | 7 | 7 | 35 |
| analytics-center_v2 | 2 | 11 | 2 | 2 | 17 |
| appointment-center_v2 | 4 | 10 | 4 | 0 | 18 |
| crm-center_v2 | 6 | 8 | 6 | 0 | 20 |
| customer-portal_v2 | 6 | 18 | 6 | 0 | 30 |
| operations-center_v2 | 3 | 9 | 3 | 0 | 15 |
| resolution-center_v2 | 2 | 6 | 2 | 0 | 10 |
| support-center_v2 | 3 | 5 | 3 | 0 | 11 |
| technician-portal_v2 | 6 | 14 | 6 | 0 | 26 |
| **Total** | **39** | **95** | **39** | **9** | **182** |

---

## 3. Tables by Usage Frequency

| Usage Level | Count | Tables |
|:-----------:|:-----:|--------|
| **High** (5+ apps) | 1 | customers_v2 |
| **Medium** (3-4 apps) | 6 | tickets_v2, appointments_v2, accounts_v2, technicians_v2, work_orders_v2, dispatches_v2 |
| **Low** (2 apps) | 14 | reference_data_v2, knowledge_categories_v2, user_roles_v2, users_v2, role_permissions_v2, customer_addresses_v2, technician_skills_v2, ticket_messages_v2, ticket_attachments_v2, work_order_stages_v2, disputes_v2, tasks_v2, followups_v2, knowledge_articles_v2, inventory_items_v2, feedback_v2, notifications_v2 |
| **Single App** | 11 | system_settings_v2, feature_flags_v2, connectors_v2, user_sessions_v2, appointment_reminders_v2, dispute_evidence_v2, task_assignments_v2, followup_attempts_v2, account_health_scans_v2, inventory_transactions_v2, analytics_reports_v2, analytics_schedules_v2, audit_log_v2, events_v2, notification_templates_v2, notification_channels_v2, feedback_surveys_v2 |
| **Unused** | 1 | feedback_surveys_v2 |

---

## 4. Data Domain Distribution

| Domain | Tables | Apps Connected |
|--------|:------:|:--------------:|
| Foundation | 6 | 6 |
| Identity | 3 | 5 |
| Core Business | 5 | 8 |
| Operational | 5 | 8 |
| Field Operations | 5 | 6 |
| Management | 5 | 5 |
| Knowledge & Inventory | 4 | 3 |
| Feedback | 2 | 3 |
| Infrastructure | 3 | 4 |
| Analytics & Audit | 4 | 2 |

---

> **End of TABLE_USAGE_MATRIX.md**
