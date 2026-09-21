# ResQAI V2 — Enterprise Data Layer Map

> **Phase:** B.2 — Enterprise Data Layer Integration  
> **Date:** 2026-06-30  
> **Status:** Complete  
> **Total Tables:** 41  
> **Total Applications:** 9  
> **Total Pages:** 192  

---

## 1. Table-to-Application Mapping

### 1.1 Foundation Tables

| Table | Phase | admin-center_v2 | analytics-center_v2 | appointment-center_v2 | crm-center_v2 | customer-portal_v2 | operations-center_v2 | resolution-center_v2 | support-center_v2 | technician-portal_v2 |
|-------|:-----:|:---------------:|:-------------------:|:---------------------:|:--------------:|:------------------:|:--------------------:|:--------------------:|:-----------------:|:--------------------:|
| reference_data_v2 | 1 | R | R | R | R | — | — | — | R | R |
| system_settings_v2 | 1 | CRUD | — | — | — | — | — | — | — | — |
| feature_flags_v2 | 1 | CRUD | — | — | — | — | — | — | — | — |
| connectors_v2 | 1 | CRUD | — | — | — | — | — | — | — | — |
| knowledge_categories_v2 | 1 | R | — | — | — | R | — | R | — | — |
| user_roles_v2 | 1 | CRUD | — | — | — | — | — | — | — | R |

### 1.2 Identity Tables

| Table | Phase | admin-center_v2 | analytics-center_v2 | appointment-center_v2 | crm-center_v2 | customer-portal_v2 | operations-center_v2 | resolution-center_v2 | support-center_v2 | technician-portal_v2 |
|-------|:-----:|:---------------:|:-------------------:|:---------------------:|:--------------:|:------------------:|:--------------------:|:--------------------:|:-----------------:|:--------------------:|
| users_v2 | 2 | CRUD | — | — | — | RU | — | — | R | RU |
| user_sessions_v2 | 2 | RD | — | — | — | R | — | — | — | — |
| role_permissions_v2 | 2 | CRUD | — | — | — | R | — | — | — | R |

### 1.3 Core Business Tables

| Table | Phase | admin-center_v2 | analytics-center_v2 | appointment-center_v2 | crm-center_v2 | customer-portal_v2 | operations-center_v2 | resolution-center_v2 | support-center_v2 | technician-portal_v2 |
|-------|:-----:|:---------------:|:-------------------:|:---------------------:|:--------------:|:------------------:|:--------------------:|:--------------------:|:-----------------:|:--------------------:|
| customers_v2 | 3 | — | R | R | CRUD | CRUD | R | R | CRUD | R |
| customer_addresses_v2 | 3 | — | — | R | — | R | — | — | — | R |
| technicians_v2 | 3 | — | R | CRUD | — | — | CRUD | — | — | CRUD |
| technician_skills_v2 | 3 | — | — | R | — | — | — | — | — | R |
| accounts_v2 | 3 | — | R | — | CRUD | R | — | — | — | — |

### 1.4 Operational Tables

| Table | Phase | admin-center_v2 | analytics-center_v2 | appointment-center_v2 | crm-center_v2 | customer-portal_v2 | operations-center_v2 | resolution-center_v2 | support-center_v2 | technician-portal_v2 |
|-------|:-----:|:---------------:|:-------------------:|:---------------------:|:--------------:|:------------------:|:--------------------:|:--------------------:|:-----------------:|:--------------------:|
| tickets_v2 | 4 | — | R | R | — | CRUD | R | R | CRUD | — |
| ticket_messages_v2 | 4 | — | — | — | — | R | — | — | CRUD | — |
| ticket_attachments_v2 | 4 | — | — | — | — | R | — | — | CRUD | — |
| appointments_v2 | 4 | — | R | CRUD | — | CRUD | R | — | — | R |
| appointment_reminders_v2 | 4 | — | — | R | — | — | — | — | — | — |

### 1.5 Field Operations Tables

| Table | Phase | admin-center_v2 | analytics-center_v2 | appointment-center_v2 | crm-center_v2 | customer-portal_v2 | operations-center_v2 | resolution-center_v2 | support-center_v2 | technician-portal_v2 |
|-------|:-----:|:---------------:|:-------------------:|:---------------------:|:--------------:|:------------------:|:--------------------:|:--------------------:|:-----------------:|:--------------------:|
| work_orders_v2 | 5 | — | — | — | — | R | CRUD | R | — | CRUD |
| work_order_stages_v2 | 5 | — | — | — | — | — | R | — | — | R |
| dispatches_v2 | 5 | — | — | R | — | R | CRUD | — | — | R |
| disputes_v2 | 5 | — | R | — | — | R | — | CRUD | — | — |
| dispute_evidence_v2 | 5 | — | — | — | — | — | — | CRUD | — | — |

### 1.6 Management Tables

| Table | Phase | admin-center_v2 | analytics-center_v2 | appointment-center_v2 | crm-center_v2 | customer-portal_v2 | operations-center_v2 | resolution-center_v2 | support-center_v2 | technician-portal_v2 |
|-------|:-----:|:---------------:|:-------------------:|:---------------------:|:--------------:|:------------------:|:--------------------:|:--------------------:|:-----------------:|:--------------------:|
| tasks_v2 | 6 | — | R | — | CRUD | — | CRUD | — | — | — |
| task_assignments_v2 | 6 | — | — | — | R | — | R | — | — | — |
| followups_v2 | 6 | — | R | — | CRUD | R | — | — | — | — |
| followup_attempts_v2 | 6 | — | — | — | R | — | — | — | — | — |
| account_health_scans_v2 | 6 | — | — | — | CRUD | R | — | — | — | — |

### 1.7 Knowledge & Inventory Tables

| Table | Phase | admin-center_v2 | analytics-center_v2 | appointment-center_v2 | crm-center_v2 | customer-portal_v2 | operations-center_v2 | resolution-center_v2 | support-center_v2 | technician-portal_v2 |
|-------|:-----:|:---------------:|:-------------------:|:---------------------:|:--------------:|:------------------:|:--------------------:|:--------------------:|:-----------------:|:--------------------:|
| knowledge_articles_v2 | 7 | — | — | — | — | R | — | R | — | — |
| knowledge_categories_v2 | 7 | — | — | — | — | R | — | R | — | — |
| inventory_items_v2 | 7 | — | — | — | — | — | — | — | — | R |
| inventory_transactions_v2 | 7 | — | — | — | — | — | — | — | — | R |

### 1.8 Feedback Tables

| Table | Phase | admin-center_v2 | analytics-center_v2 | appointment-center_v2 | crm-center_v2 | customer-portal_v2 | operations-center_v2 | resolution-center_v2 | support-center_v2 | technician-portal_v2 |
|-------|:-----:|:---------------:|:-------------------:|:---------------------:|:--------------:|:------------------:|:--------------------:|:--------------------:|:-----------------:|:--------------------:|
| feedback_v2 | 8 | — | R | — | CRUD | CRUD | — | — | — | — |
| feedback_surveys_v2 | 8 | — | — | — | — | — | — | — | — | — |

### 1.9 Infrastructure Tables

| Table | Phase | admin-center_v2 | analytics-center_v2 | appointment-center_v2 | crm-center_v2 | customer-portal_v2 | operations-center_v2 | resolution-center_v2 | support-center_v2 | technician-portal_v2 |
|-------|:-----:|:---------------:|:-------------------:|:---------------------:|:--------------:|:------------------:|:--------------------:|:--------------------:|:-----------------:|:--------------------:|
| notifications_v2 | 9 | R | — | — | — | CRUD | — | — | — | R |
| notification_templates_v2 | 9 | R | — | — | — | — | — | — | — | — |
| notification_channels_v2 | 9 | R | — | — | — | — | — | — | — | — |

### 1.10 Analytics & Audit Tables

| Table | Phase | admin-center_v2 | analytics-center_v2 | appointment-center_v2 | crm-center_v2 | customer-portal_v2 | operations-center_v2 | resolution-center_v2 | support-center_v2 | technician-portal_v2 |
|-------|:-----:|:---------------:|:-------------------:|:---------------------:|:--------------:|:------------------:|:--------------------:|:--------------------:|:-----------------:|:--------------------:|
| analytics_reports_v2 | 10 | — | CRUD | — | — | — | — | — | — | — |
| analytics_schedules_v2 | 10 | — | CRUD | — | — | — | — | — | — | — |
| audit_log_v2 | 10 | CRUD | R | — | — | — | — | — | — | — |
| events_v2 | 10 | R | — | — | — | — | — | — | — | — |

---

## 2. Application Data Profiles

### 2.1 admin-center_v2
| Aspect | Detail |
|--------|--------|
| **Tables Read** | reference_data_v2, system_settings_v2, feature_flags_v2, connectors_v2, knowledge_categories_v2, user_roles_v2, users_v2, user_sessions_v2, role_permissions_v2, notifications_v2, notification_templates_v2, notification_channels_v2, audit_log_v2, events_v2 |
| **Tables Written** | system_settings_v2, feature_flags_v2, connectors_v2, user_roles_v2, users_v2, role_permissions_v2, audit_log_v2 |
| **Tables Updated** | Same as written |
| **Reference Tables** | reference_data_v2, user_roles_v2 |
| **Lookup Tables** | knowledge_categories_v2 |
| **History Tables** | audit_log_v2, events_v2, user_sessions_v2 |
| **Audit Tables** | audit_log_v2 |

### 2.2 analytics-center_v2
| Aspect | Detail |
|--------|--------|
| **Tables Read** | reference_data_v2, customers_v2, technicians_v2, accounts_v2, tickets_v2, appointments_v2, disputes_v2, tasks_v2, followups_v2, feedback_v2, audit_log_v2 |
| **Tables Written** | analytics_reports_v2, analytics_schedules_v2 |
| **Tables Updated** | analytics_reports_v2, analytics_schedules_v2 |
| **Reference Tables** | reference_data_v2 |
| **Lookup Tables** | — |
| **History Tables** | analytics_reports_v2, analytics_schedules_v2 |
| **Audit Tables** | audit_log_v2 |

### 2.3 appointment-center_v2
| Aspect | Detail |
|--------|--------|
| **Tables Read** | reference_data_v2, customers_v2, customer_addresses_v2, technicians_v2, technician_skills_v2, tickets_v2, appointments_v2, appointment_reminders_v2, dispatches_v2 |
| **Tables Written** | appointments_v2, appointment_reminders_v2 |
| **Tables Updated** | appointments_v2 |
| **Reference Tables** | reference_data_v2, technicians_v2 |
| **Lookup Tables** | customer_addresses_v2 |
| **History Tables** | appointment_reminders_v2 |
| **Audit Tables** | audit_log_v2 |

### 2.4 crm-center_v2
| Aspect | Detail |
|--------|--------|
| **Tables Read** | reference_data_v2, customers_v2, accounts_v2, tasks_v2, task_assignments_v2, followups_v2, followup_attempts_v2, account_health_scans_v2, feedback_v2 |
| **Tables Written** | customers_v2, accounts_v2, tasks_v2, followups_v2, account_health_scans_v2, feedback_v2 |
| **Tables Updated** | customers_v2, accounts_v2, tasks_v2, followups_v2 |
| **Reference Tables** | reference_data_v2 |
| **Lookup Tables** | — |
| **History Tables** | followup_attempts_v2, account_health_scans_v2 |
| **Audit Tables** | audit_log_v2 |

### 2.5 customer-portal_v2
| Aspect | Detail |
|--------|--------|
| **Tables Read** | customers_v2, customer_addresses_v2, accounts_v2, tickets_v2, ticket_messages_v2, ticket_attachments_v2, appointments_v2, work_orders_v2, dispatches_v2, disputes_v2, followups_v2, account_health_scans_v2, knowledge_articles_v2, knowledge_categories_v2, feedback_v2, notifications_v2, users_v2, role_permissions_v2 |
| **Tables Written** | customers_v2, tickets_v2, appointments_v2, disputes_v2, feedback_v2, notifications_v2 |
| **Tables Updated** | customers_v2, tickets_v2, appointments_v2 |
| **Reference Tables** | knowledge_categories_v2 |
| **Lookup Tables** | customer_addresses_v2 |
| **History Tables** | — |
| **Audit Tables** | audit_log_v2 |

### 2.6 operations-center_v2
| Aspect | Detail |
|--------|--------|
| **Tables Read** | technicians_v2, tickets_v2, appointments_v2, work_orders_v2, work_order_stages_v2, dispatches_v2, tasks_v2, task_assignments_v2 |
| **Tables Written** | work_orders_v2, dispatches_v2, tasks_v2 |
| **Tables Updated** | work_orders_v2, dispatches_v2 |
| **Reference Tables** | technicians_v2 |
| **Lookup Tables** | — |
| **History Tables** | work_order_stages_v2 |
| **Audit Tables** | audit_log_v2 |

### 2.7 resolution-center_v2
| Aspect | Detail |
|--------|--------|
| **Tables Read** | customers_v2, tickets_v2, work_orders_v2, disputes_v2, dispute_evidence_v2, knowledge_articles_v2, knowledge_categories_v2 |
| **Tables Written** | disputes_v2, dispute_evidence_v2 |
| **Tables Updated** | disputes_v2 |
| **Reference Tables** | knowledge_categories_v2 |
| **Lookup Tables** | knowledge_articles_v2 |
| **History Tables** | dispute_evidence_v2 |
| **Audit Tables** | audit_log_v2 |

### 2.8 support-center_v2
| Aspect | Detail |
|--------|--------|
| **Tables Read** | reference_data_v2, customers_v2, tickets_v2, ticket_messages_v2, ticket_attachments_v2, users_v2 |
| **Tables Written** | tickets_v2, ticket_messages_v2, ticket_attachments_v2 |
| **Tables Updated** | tickets_v2 |
| **Reference Tables** | reference_data_v2, users_v2 |
| **Lookup Tables** | customers_v2 |
| **History Tables** | ticket_messages_v2 |
| **Audit Tables** | audit_log_v2 |

### 2.9 technician-portal_v2
| Aspect | Detail |
|--------|--------|
| **Tables Read** | reference_data_v2, user_roles_v2, role_permissions_v2, users_v2, customers_v2, customer_addresses_v2, technicians_v2, technician_skills_v2, appointments_v2, work_orders_v2, work_order_stages_v2, dispatches_v2, inventory_items_v2, inventory_transactions_v2, notifications_v2 |
| **Tables Written** | work_orders_v2, work_order_stages_v2, dispatches_v2, inventory_transactions_v2, notifications_v2 |
| **Tables Updated** | work_orders_v2, technicians_v2 |
| **Reference Tables** | reference_data_v2, user_roles_v2, role_permissions_v2 |
| **Lookup Tables** | customers_v2, customer_addresses_v2, inventory_items_v2 |
| **History Tables** | work_order_stages_v2, inventory_transactions_v2 |
| **Audit Tables** | audit_log_v2 |

---

> **End of DATA_LAYER_MAP.md**
