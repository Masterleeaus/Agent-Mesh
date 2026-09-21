# ResQAI V2 — Data Validation Rules

> **Phase:** B.2 — Enterprise Data Layer Integration  
> **Date:** 2026-06-30  
> **Purpose:** Define validation rules for every enterprise table field across all applications

---

## 1. Field-Level Validation Rules

### 1.1 Foundation Tables

**reference_data_v2**
| Field | Rule | App Source |
|-------|:-----|:-----------|
| category | Required, max 100 chars | All apps |
| value | Required, max 100 chars, unique per category | All apps |
| label | Required, max 200 chars | All apps |
| is_active | Boolean, default true | All apps |

**system_settings_v2**
| Field | Rule | App Source |
|-------|:-----|:-----------|
| setting_key | Required, max 200 chars, unique | admin-center_v2 |
| setting_value | Required, valid JSON for type | admin-center_v2 |
| setting_type | Must be: string, number, boolean, json, array | admin-center_v2 |

**feature_flags_v2**
| Field | Rule | App Source |
|-------|:-----|:-----------|
| flag_name | Required, max 200 chars, unique | admin-center_v2 |
| is_enabled | Boolean | admin-center_v2 |
| rollout_percentage | 0-100 integer | admin-center_v2 |

### 1.2 Identity Tables

**users_v2**
| Field | Rule | App Source |
|-------|:-----|:-----------|
| email | Required, valid email format, max 320 chars, unique (active) | admin-center_v2, customer-portal_v2 |
| password_hash | Required, Argon2id, min 60 chars | admin-center_v2 |
| first_name | Required, max 100 chars | admin-center_v2, customer-portal_v2 |
| last_name | Required, max 100 chars | admin-center_v2, customer-portal_v2 |
| role_id | Required, must exist in user_roles_v2 | admin-center_v2 |
| user_status | Must be: active, inactive, suspended, locked | admin-center_v2 |
| phone | Optional, E.164 format if provided | admin-center_v2, customer-portal_v2 |

**user_sessions_v2**
| Field | Rule | App Source |
|-------|:-----|:-----------|
| user_id | Required, must exist in users_v2 | admin-center_v2 |
| session_token | Required, unique, hashed | admin-center_v2 |
| is_active | Boolean | admin-center_v2 |

### 1.3 Core Business Tables

**customers_v2**
| Field | Rule | App Source |
|-------|:-----|:-----------|
| first_name | Required, max 100 chars | crm-center_v2, customer-portal_v2 |
| last_name | Required, max 100 chars | crm-center_v2, customer-portal_v2 |
| email | Required, valid email, max 320 chars, unique (active) | crm-center_v2, customer-portal_v2 |
| phone | Optional, E.164 format if provided | crm-center_v2, customer-portal_v2 |
| customer_status | Must be: active, inactive, at_risk, dormant, churned | crm-center_v2 |
| relationship_status | Must be: new, active, in_dispute, at_risk, service_due, dormant, churned, won_back | crm-center_v2 |
| customer_tier | Must be: standard, premium, enterprise | crm-center_v2 |

**customer_addresses_v2**
| Field | Rule | App Source |
|-------|:-----|:-----------|
| customer_id | Required, must exist in customers_v2 | appointment-center_v2, customer-portal_v2 |
| address_type | Must be: billing, service, shipping | appointment-center_v2 |
| address_line1 | Required, max 255 chars | appointment-center_v2 |
| city | Required, max 100 chars | appointment-center_v2 |
| state_province | Required, max 100 chars | appointment-center_v2 |
| postal_code | Required, max 20 chars | appointment-center_v2 |
| is_primary | Boolean, one primary per customer | appointment-center_v2 |

**technicians_v2**
| Field | Rule | App Source |
|-------|:-----|:-----------|
| first_name | Required, max 100 chars | appointment-center_v2, technician-portal_v2 |
| last_name | Required, max 100 chars | appointment-center_v2, technician-portal_v2 |
| email | Required, valid email, unique | appointment-center_v2 |
| technician_availability | Must be: available, busy, on_break, off_shift, on_leave | appointment-center_v2, operations-center_v2 |
| max_daily_jobs | 1-20 integer | appointment-center_v2 |
| is_active | Boolean | appointment-center_v2 |

**accounts_v2**
| Field | Rule | App Source |
|-------|:-----|:-----------|
| account_name | Required, max 255 chars | crm-center_v2 |
| account_number | Required, unique | crm-center_v2 |
| account_health | Must be: healthy, watch, slipping, critical | crm-center_v2 |
| subscription_tier | Must be: standard, premium, enterprise | crm-center_v2 |
| mrr_cents | Non-negative integer | crm-center_v2 |
| contract_end | Must be after contract_start if provided | crm-center_v2 |

### 1.4 Operational Tables

**tickets_v2**
| Field | Rule | App Source |
|-------|:-----|:-----------|
| ticket_number | Required, unique, auto-generated (TKT-########) | support-center_v2 |
| customer_id | Required, must exist in customers_v2 | support-center_v2 |
| subject | Required, max 500 chars | support-center_v2, customer-portal_v2 |
| ticket_status | Must follow lifecycle: new→classified→drafted→approved_to_send→sent→closed (or escalated) | support-center_v2 |
| channel | Must be: email, chat, sms, phone, web, portal | support-center_v2 |
| request_type | Must be: new_booking, reschedule, cancellation, complaint, follow_up, general_inquiry, billing | support-center_v2 |
| urgency | Must be: low, normal, high, urgent | support-center_v2 |
| priority | Must be: low, normal, high, urgent, critical | support-center_v2 |
| assigned_to | Must exist in users_v2 if set | support-center_v2 |

**ticket_messages_v2**
| Field | Rule | App Source |
|-------|:-----|:-----------|
| ticket_id | Required, must exist in tickets_v2 | support-center_v2 |
| message_body | Required, max 50000 chars | support-center_v2 |
| sender_type | Must be: agent, customer, system, webhook | support-center_v2 |
| message_type | Must be: public, internal_note, system_note | support-center_v2 |
| is_internal | Boolean | support-center_v2 |

**appointments_v2**
| Field | Rule | App Source |
|-------|:-----|:-----------|
| customer_id | Required, must exist in customers_v2 | appointment-center_v2 |
| technician_id | Must exist in technicians_v2 if set | appointment-center_v2 |
| appointment_status | Must follow lifecycle: scheduled→confirmed→in_progress→completed (or cancelled) | appointment-center_v2 |
| scheduled_start | Required, must be in future for new | appointment-center_v2 |
| scheduled_end | Required, must be after scheduled_start | appointment-center_v2 |
| duration_minutes | Positive integer, max 1440 | appointment-center_v2 |

### 1.5 Field Operations Tables

**work_orders_v2**
| Field | Rule | App Source |
|-------|:-----|:-----------|
| order_number | Required, unique, auto-generated (WO-########) | operations-center_v2 |
| work_order_status | Must follow lifecycle: created→assigned→travelling→on_site→working→completed (or needs_followup/cancelled) | operations-center_v2, technician-portal_v2 |
| labor_hours | Non-negative decimal | technician-portal_v2 |
| cost_cents | Non-negative integer | technician-portal_v2 |

**work_order_stages_v2**
| Field | Rule | App Source |
|-------|:-----|:-----------|
| work_order_id | Required, must exist in work_orders_v2 | operations-center_v2, technician-portal_v2 |
| stage_name | Required, unique per work_order | technician-portal_v2 |
| entered_at | Required, timestamp | technician-portal_v2 |
| duration_seconds | Non-negative integer (computed) | technician-portal_v2 |

**dispatches_v2**
| Field | Rule | App Source |
|-------|:-----|:-----------|
| technician_id | Required, must exist in technicians_v2 | operations-center_v2 |
| dispatch_status | Must follow lifecycle: pending→sent→acknowledged→en_route→on_site→completed (or declined/cancelled) | operations-center_v2 |
| dispatch_type | Must be: urgent, scheduled, emergency | operations-center_v2 |

**disputes_v2**
| Field | Rule | App Source |
|-------|:-----|:-----------|
| dispute_number | Required, unique, auto-generated (DSP-########) | resolution-center_v2 |
| dispute_status | Must follow lifecycle: open→analyzing→recommendation_ready→escalated→approved→rejected→closed | resolution-center_v2 |
| dispute_reason | Required, max 5000 chars | resolution-center_v2 |
| amount_cents | Non-negative integer if provided | resolution-center_v2 |

### 1.6 Management Tables

**tasks_v2**
| Field | Rule | App Source |
|-------|:-----|:-----------|
| title | Required, max 500 chars | crm-center_v2, operations-center_v2 |
| task_status | Must be: open, in_progress, blocked, done, overdue, cancelled | crm-center_v2 |
| priority | Must be: low, normal, high, urgent, critical | crm-center_v2 |
| due_at | Must be in future for new tasks | crm-center_v2 |

**followups_v2**
| Field | Rule | App Source |
|-------|:-----|:-----------|
| assigned_to | Required, must exist in users_v2 | crm-center_v2 |
| followup_status | Must be: pending, in_progress, completed, missed, cancelled | crm-center_v2 |
| followup_type | Must be: call, email, site_visit, review | crm-center_v2 |
| scheduled_at | Required, must be in future | crm-center_v2 |
| max_attempts | 1-10 integer, default 3 | crm-center_v2 |

**account_health_scans_v2**
| Field | Rule | App Source |
|-------|:-----|:-----------|
| account_id | Required, must exist in accounts_v2 | crm-center_v2 |
| scan_score | 0-100 integer | crm-center_v2 |
| previous_score | 0-100 integer if provided | crm-center_v2 |
| account_health | Must be: healthy, watch, slipping, critical | crm-center_v2 |

### 1.7 Feedback Tables

**feedback_v2**
| Field | Rule | App Source |
|-------|:-----|:-----------|
| customer_id | Required, must exist in customers_v2 | customer-portal_v2, crm-center_v2 |
| feedback_source | Must be: post_service, followup, survey, portal, email | customer-portal_v2 |
| rating | 1-5 integer if provided | customer-portal_v2 |

### 1.8 Infrastructure Tables

**notifications_v2**
| Field | Rule | App Source |
|-------|:-----|:-----------|
| user_id | Must exist in users_v2 if set | customer-portal_v2, technician-portal_v2 |
| channel | Must be: email, sms, push, in_app | customer-portal_v2, technician-portal_v2 |
| notification_status | Must be: pending, sent, delivered, failed, read | customer-portal_v2, technician-portal_v2 |
| retry_count | 0 to max_retries | customer-portal_v2, technician-portal_v2 |

---

## 2. Cross-Field Validation Rules

| Rule | Affected Table | Condition | Error |
|:-----|:---------------|:----------|:-------|
| Appointment time conflict | appointments_v2 | technician_id + scheduled_start overlap | "Technician already scheduled" |
| Ticket status lifecycle | tickets_v2 | Must progress in order | "Invalid status transition" |
| Work order status lifecycle | work_orders_v2 | Must progress in order | "Invalid status transition" |
| Dispatch status lifecycle | dispatches_v2 | Must progress in order | "Invalid status transition" |
| Dispute status lifecycle | disputes_v2 | Must progress in order | "Invalid status transition" |
| SLA deadline | tickets_v2 | sla_due_at > created_at | "SLA deadline must be in future" |
| Followup max attempts | followups_v2 | attempt_count ≤ max_attempts | "Max attempts reached" |
| Contract date range | accounts_v2 | contract_end > contract_start | "End must be after start" |
| Primary address uniqueness | customer_addresses_v2 | One primary per customer | "Customer already has primary address" |
| Ticket parent reference | tickets_v2 | parent_ticket_id != id | "Cannot reference self" |

---

## 3. Data Integrity Rules

| Rule | Applies To | Enforcement |
|:-----|:-----------|:------------|
| Soft delete filter | All entity tables | WHERE deleted_at IS NULL on all queries |
| Optimistic locking | tickets_v2, work_orders_v2, disputes_v2, accounts_v2 | version column check on update |
| Unique active email | users_v2, customers_v2, technicians_v2 | Partial unique index WHERE deleted_at IS NULL |
| Unique number | tickets_v2(ticket_number), work_orders_v2(order_number), disputes_v2(dispute_number) | Unique constraint |
| No circular parent | knowledge_categories_v2(parent_id), tickets_v2(parent_ticket_id) | Application-level check |

---

> **End of DATA_VALIDATION.md**
