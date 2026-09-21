# ResQAI V2 — Complete CRUD Matrix

> **Phase:** B.2 — Enterprise Data Layer Integration  
> **Date:** 2026-06-30  
> **Legend:** ●=Full CRUD, ◎=Read+Write, ◐=Read+Update, ○=Read-Only, —=No Access

---

## 1. Foundation Tables

| Table | admin-center_v2 | analytics-center_v2 | appointment-center_v2 | crm-center_v2 | customer-portal_v2 | operations-center_v2 | resolution-center_v2 | support-center_v2 | technician-portal_v2 |
|-------|:---------------:|:-------------------:|:---------------------:|:--------------:|:------------------:|:--------------------:|:--------------------:|:-----------------:|:--------------------:|
| **reference_data_v2** | ○ | ○ | ○ | ○ | — | — | — | ○ | ○ |
| **system_settings_v2** | ● | — | — | — | — | — | — | — | — |
| **feature_flags_v2** | ● | — | — | — | — | — | — | — | — |
| **connectors_v2** | ● | — | — | — | — | — | — | — | — |
| **knowledge_categories_v2** | ○ | — | — | — | ○ | — | ○ | — | — |
| **user_roles_v2** | ● | — | — | — | — | — | — | — | ○ |

## 2. Identity Tables

| Table | admin-center_v2 | analytics-center_v2 | appointment-center_v2 | crm-center_v2 | customer-portal_v2 | operations-center_v2 | resolution-center_v2 | support-center_v2 | technician-portal_v2 |
|-------|:---------------:|:-------------------:|:---------------------:|:--------------:|:------------------:|:--------------------:|:--------------------:|:-----------------:|:--------------------:|
| **users_v2** | ● | — | — | — | ◐ | — | — | ○ | ◐ |
| **user_sessions_v2** | ◐ | — | — | — | ○ | — | — | — | — |
| **role_permissions_v2** | ● | — | — | — | ○ | — | — | — | ○ |

## 3. Core Business Tables

| Table | admin-center_v2 | analytics-center_v2 | appointment-center_v2 | crm-center_v2 | customer-portal_v2 | operations-center_v2 | resolution-center_v2 | support-center_v2 | technician-portal_v2 |
|-------|:---------------:|:-------------------:|:---------------------:|:--------------:|:------------------:|:--------------------:|:--------------------:|:-----------------:|:--------------------:|
| **customers_v2** | — | ○ | ○ | ● | ◎ | ○ | ○ | ◎ | ○ |
| **customer_addresses_v2** | — | — | ○ | — | ○ | — | — | — | ○ |
| **technicians_v2** | — | ○ | ◎ | — | — | ◎ | — | — | ◎ |
| **technician_skills_v2** | — | — | ○ | — | — | — | — | — | ○ |
| **accounts_v2** | — | ○ | — | ● | ○ | — | — | — | — |

## 4. Operational Tables

| Table | admin-center_v2 | analytics-center_v2 | appointment-center_v2 | crm-center_v2 | customer-portal_v2 | operations-center_v2 | resolution-center_v2 | support-center_v2 | technician-portal_v2 |
|-------|:---------------:|:-------------------:|:---------------------:|:--------------:|:------------------:|:--------------------:|:--------------------:|:-----------------:|:--------------------:|
| **tickets_v2** | — | ○ | ○ | — | ◎ | ○ | ○ | ● | — |
| **ticket_messages_v2** | — | — | — | — | ○ | — | — | ◎ | — |
| **ticket_attachments_v2** | — | — | — | — | ○ | — | — | ◎ | — |
| **appointments_v2** | — | ○ | ● | — | ◎ | ○ | — | — | ○ |
| **appointment_reminders_v2** | — | — | ◎ | — | — | — | — | — | — |

## 5. Field Operations Tables

| Table | admin-center_v2 | analytics-center_v2 | appointment-center_v2 | crm-center_v2 | customer-portal_v2 | operations-center_v2 | resolution-center_v2 | support-center_v2 | technician-portal_v2 |
|-------|:---------------:|:-------------------:|:---------------------:|:--------------:|:------------------:|:--------------------:|:--------------------:|:-----------------:|:--------------------:|
| **work_orders_v2** | — | — | — | — | ○ | ● | ○ | — | ● |
| **work_order_stages_v2** | — | — | — | — | — | ○ | — | — | ◎ |
| **dispatches_v2** | — | — | ○ | — | ○ | ● | — | — | ◐ |
| **disputes_v2** | — | ○ | — | — | ○ | — | ● | — | — |
| **dispute_evidence_v2** | — | — | — | — | — | — | ◎ | — | — |

## 6. Management Tables

| Table | admin-center_v2 | analytics-center_v2 | appointment-center_v2 | crm-center_v2 | customer-portal_v2 | operations-center_v2 | resolution-center_v2 | support-center_v2 | technician-portal_v2 |
|-------|:---------------:|:-------------------:|:---------------------:|:--------------:|:------------------:|:--------------------:|:--------------------:|:-----------------:|:--------------------:|
| **tasks_v2** | — | ○ | — | ● | — | ◎ | — | — | — |
| **task_assignments_v2** | — | — | — | ○ | — | ○ | — | — | — |
| **followups_v2** | — | ○ | — | ● | ○ | — | — | — | — |
| **followup_attempts_v2** | — | — | — | ○ | — | — | — | — | — |
| **account_health_scans_v2** | — | — | — | ● | ○ | — | — | — | — |

## 7. Knowledge & Inventory Tables

| Table | admin-center_v2 | analytics-center_v2 | appointment-center_v2 | crm-center_v2 | customer-portal_v2 | operations-center_v2 | resolution-center_v2 | support-center_v2 | technician-portal_v2 |
|-------|:---------------:|:-------------------:|:---------------------:|:--------------:|:------------------:|:--------------------:|:--------------------:|:-----------------:|:--------------------:|
| **knowledge_articles_v2** | — | — | — | — | ○ | — | ○ | — | — |
| **inventory_items_v2** | — | — | — | — | — | — | — | — | ○ |
| **inventory_transactions_v2** | — | — | — | — | — | — | — | — | ○ |

## 8. Feedback Tables

| Table | admin-center_v2 | analytics-center_v2 | appointment-center_v2 | crm-center_v2 | customer-portal_v2 | operations-center_v2 | resolution-center_v2 | support-center_v2 | technician-portal_v2 |
|-------|:---------------:|:-------------------:|:---------------------:|:--------------:|:------------------:|:--------------------:|:--------------------:|:-----------------:|:--------------------:|
| **feedback_v2** | — | ○ | — | ◎ | ◎ | — | — | — | — |
| **feedback_surveys_v2** | — | — | — | — | — | — | — | — | — |

## 9. Infrastructure Tables

| Table | admin-center_v2 | analytics-center_v2 | appointment-center_v2 | crm-center_v2 | customer-portal_v2 | operations-center_v2 | resolution-center_v2 | support-center_v2 | technician-portal_v2 |
|-------|:---------------:|:-------------------:|:---------------------:|:--------------:|:------------------:|:--------------------:|:--------------------:|:-----------------:|:--------------------:|
| **notifications_v2** | ○ | — | — | — | ● | — | — | — | ◎ |
| **notification_templates_v2** | ○ | — | — | — | — | — | — | — | — |
| **notification_channels_v2** | ○ | — | — | — | — | — | — | — | — |

## 10. Analytics & Audit Tables

| Table | admin-center_v2 | analytics-center_v2 | appointment-center_v2 | crm-center_v2 | customer-portal_v2 | operations-center_v2 | resolution-center_v2 | support-center_v2 | technician-portal_v2 |
|-------|:---------------:|:-------------------:|:---------------------:|:--------------:|:------------------:|:--------------------:|:--------------------:|:-----------------:|:--------------------:|
| **analytics_reports_v2** | — | ● | — | — | — | — | — | — | — |
| **analytics_schedules_v2** | — | ● | — | — | — | — | — | — | — |
| **audit_log_v2** | ● | ○ | — | — | — | — | — | — | — |
| **events_v2** | ○ | — | — | — | — | — | — | — | — |

---

## 11. CRUD Coverage Summary

| CRUD Type | Total Operations | Tables Covered | Coverage % |
|:---------:|:----------------:|:--------------:|:----------:|
| **Create** | 39 | 39/41 | 95.1% |
| **Read** | 95 | 41/41 | 100% |
| **Update** | 39 | 39/41 | 95.1% |
| **Delete (Soft)** | 9 | 19/41 | 46.3% |
| **Full CRUD** | 4 apps | 6 tables | — |

| Application | C | R | U | D | Score |
|:-----------:|:-:|:-:|:-:|:-:|:-----:|
| admin-center_v2 | 7 | 14 | 7 | 7 | 35/164 |
| analytics-center_v2 | 2 | 11 | 2 | 2 | 17/164 |
| appointment-center_v2 | 4 | 10 | 4 | 0 | 18/164 |
| crm-center_v2 | 6 | 8 | 6 | 0 | 20/164 |
| customer-portal_v2 | 6 | 18 | 6 | 0 | 30/164 |
| operations-center_v2 | 3 | 9 | 3 | 0 | 15/164 |
| resolution-center_v2 | 2 | 6 | 2 | 0 | 10/164 |
| support-center_v2 | 3 | 5 | 3 | 0 | 11/164 |
| technician-portal_v2 | 6 | 14 | 6 | 0 | 26/164 |
| **Total** | **39** | **95** | **39** | **9** | **182** |

---

> **End of CRUD_MATRIX.md**
