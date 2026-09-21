# RESQAI V2 — Entity Relationship Diagram

> Phase 1.2 — Design Only  
> Principal Database Architect  
> Date: 2026-06-28

---

## Table of Contents

1. [Complete ERD Diagram](#1-complete-erd-diagram)
2. [Table Definitions](#2-table-definitions)
3. [Relationship Summary](#3-relationship-summary)
4. [Lookup & Reference Tables](#4-lookup--reference-tables)
5. [History & Audit Tables](#5-history--audit-tables)
6. [Index Definitions](#6-index-definitions)

---

## 1. Complete ERD Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           RESQAI V2 — ENTITY RELATIONSHIP DIAGRAM               │
│                                                                                  │
│                                                                                  │
│  ┌─────────────────────────┐        ┌─────────────────────────┐                  │
│  │     customers_v2        │        │    technicians_v2        │                 │
│  ├─────────────────────────┤        ├─────────────────────────┤                  │
│  │ id (PK)                 │        │ id (PK)                 │                  │
│  │ name                    │        │ name                    │                  │
│  │ primary_phone           │        │ primary_phone           │                  │
│  │ primary_email           │        │ primary_email           │                  │
│  │ status                  │◄──┐    │ availability            │                  │
│  │ customer_type           │   │    │ status                  │                  │
│  │ notes                   │   │    │ rating                  │                  │
│  │ created_at              │   │    │ hire_date               │                  │
│  │ updated_at              │   │    │ certifications          │                  │
│  │ deleted_at              │   │    │ max_daily_jobs          │                  │
│  └────────────────────┬────┘   │    │ created_at              │                  │
│                       │        │    │ updated_at              │                  │
│                       │        │    │ deleted_at              │                  │
│                       │        │    └──────────┬──────────────┘                  │
│                       │        │               │                                │
│                       ▼        │               ▼                                │
│  ┌─────────────────────────┐   │  ┌─────────────────────────┐                   │
│  │  customer_addresses_v2  │   │  │  technician_skills_v2   │                   │
│  ├─────────────────────────┤   │  ├─────────────────────────┤                   │
│  │ id (PK)                 │   │  │ id (PK)                 │                   │
│  │ customer_id (FK) ───────┘   │  │ technician_id (FK) ─────┘                   │
│  │ address_type             │   │  │ skill                   │                   │
│  │ address_line1            │   │  │ proficiency             │                   │
│  │ address_line2            │   │  │ certification_ref       │                   │
│  │ city                     │   │  │ expires_at              │                   │
│  │ state                    │   │  └─────────────────────────┘                   │
│  │ postal_code              │                                                   │
│  │ is_primary               │                                                   │
│  │ created_at               │                                                   │
│  │ updated_at               │                                                   │
│  └──────────────────────────┘                                                   │
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────┐      │
│   │                         tickets_v2                                    │      │
│   ├──────────────────────────────────────────────────────────────────────┤      │
│   │ id (PK)                                                              │      │
│   │ customer_id (FK) ────────────────────────────────────────────────────────┐  │
│   │ customer_name (denormalized)                                        │   │  │
│   │ channel (FK → ref)                                                  │   │  │
│   │ subject                                                              │   │  │
│   │ message                                                              │   │  │
│   │ request_type (FK → ref)                                             │   │  │
│   │ urgency                                                              │   │  │
│   │ status                                                               │   │  │
│   │ assigned_to                                                          │   │  │
│   │ suggested_owner                                                      │   │  │
│   │ draft_reply                                                          │   │  │
│   │ approved_to_send                                                     │   │  │
│   │ escalated_at                                                         │   │  │
│   │ sla_deadline                                                         │   │  │
│   │ closed_at                                                            │   │  │
│   │ created_at / updated_at / deleted_at                                 │   │  │
│   └────────────────┬─────────────────────────────────────────────────────┘   │
│                    │                                                         │
│                    ▼                                                         │
│   ┌─────────────────────────┐    ┌─────────────────────────┐                 │
│   │  ticket_messages_v2     │    │  ticket_attachments_v2  │                 │
│   ├─────────────────────────┤    ├─────────────────────────┤                 │
│   │ id (PK)                 │    │ id (PK)                 │                 │
│   │ ticket_id (FK) ─────────┘    │ ticket_id (FK) ─────────┘                 │
│   │ author_type               │    │ file_name               │                 │
│   │ author_id                 │    │ file_type               │                 │
│   │ message_text              │    │ file_size               │                 │
│   │ is_internal               │    │ storage_path            │                 │
│   │ created_at                │    │ uploaded_by             │                 │
│   └──────────────────────────┘    │ created_at              │                 │
│                                   └──────────────────────────┘                 │
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────┐      │
│   │                        appointments_v2                                │      │
│   ├──────────────────────────────────────────────────────────────────────┤      │
│   │ id (PK)                                                              │      │
│   │ customer_id (FK) ────────────────────────────────────────────────────────┐  │
│   │ technician_id (FK) ───────────────────────────────────────────────────┐ │  │
│   │ service_type (FK → ref)                                              │ │  │
│   │ scheduled_date                                                       │ │  │
│   │ duration_minutes                                                     │ │  │
│   │ status                                                               │ │  │
│   │ arrival_window_start                                                 │ │  │
│   │ arrival_window_end                                                   │ │  │
│   │ notes                                                                │ │  │
│   │ completed_at                                                         │ │  │
│   │ created_at / updated_at / deleted_at                                 │ │  │
│   └──────┬───────────────────────────────────────────────────────────────┘ │  │
│          │                                                               │  │
│          ▼                                                               │  │
│   ┌─────────────────────────┐     ┌─────────────────────────┐            │  │
│   │ appointment_reminders_v2│     │    work_orders_v2       │            │  │
│   ├─────────────────────────┤     ├─────────────────────────┤            │  │
│   │ id (PK)                 │     │ id (PK)                 │            │  │
│   │ appointment_id (FK) ────┘     │ appointment_id (FK) ────┘            │  │
│   │ reminder_type             │     │ technician_id (FK) ───────────────────┘  │
│   │ scheduled_for             │     │ customer_id (FK) ───────────────────────┘
│   │ sent_at                   │     │ status                    │              │
│   │ channel                   │     │ service_description       │              │
│   │ status                    │     │ customer_notes            │              │
│   │ created_at                │     │ technician_notes          │              │
│   └──────────────────────────┘     │ started_at                │              │
│                                    │ completed_at              │              │
│   ┌─────────────────────────┐     │ parts_used (JSONB)        │              │
│   │  work_order_stages_v2   │     │ photos (JSONB)            │              │
│   ├─────────────────────────┤     │ signature_ref             │              │
│   │ id (PK)                 │     │ created_at / updated_at   │              │
│   │ work_order_id (FK) ─────┘     └───────────────────────────┘              │
│   │ stage_name               │                                               │
│   │ entered_at               │                                               │
│   │ exited_at                │                                               │
│   │ duration_seconds         │                                               │
│   │ geo_location             │                                               │
│   └──────────────────────────┘                                               │
│                                                                                │
│   ┌──────────────────────────────────────────────────────────────────────┐    │
│   │                        dispatches_v2                                 │    │
│   ├──────────────────────────────────────────────────────────────────────┤    │
│   │ id (PK)                                                              │    │
│   │ ticket_id (FK) ─────────────────────────────────────────────────────────┐│
│   │ appointment_id (FK) ───────────────────────────────────────────────────┐││
│   │ technician_id (FK) ──────────────────────────────────────────────────┐│││
│   │ initiated_by                                                          ││││
│   │ dispatch_type (urgent / scheduled / emergency)                       ││││
│   │ priority                                                              ││││
│   │ status                                                                ││││
│   │ notes                                                                 ││││
│   │ acknowledged_at                                                       ││││
│   │ arrived_at                                                            ││││
│   │ completed_at                                                          ││││
│   │ cancelled_at                                                          ││││
│   │ created_at / updated_at / deleted_at                                  ││││
│   └───┬───────────────────────────────────────────────────────────────────┘│││
│       │                                                                    │││
│       ▼                                                                    │││
│   ┌─────────────────────────┐                                              │││
│   │     disputes_v2         │                                              │││
│   ├─────────────────────────┤                                              │││
│   │ id (PK)                 │                                              │││
│   │ appointment_id (FK) ────┘                                              │││
│   │ customer_id (FK) ───────────────────────────────────────────────────────┘││
│   │ ticket_id (FK) ──────────────────────────────────────────────────────────┘│
│   │ customer_claim              │                                              │
│   │ provider_claim              │                                              │
│   │ evidence_summary            │                                              │
│   │ status                      │                                              │
│   │ recommended_resolution      │                                              │
│   │ resolution_reason           │                                              │
│   │ confidence                  │                                              │
│   │ resolved_by                 │                                              │
│   │ closed_at                   │                                              │
│   │ created_at / updated_at     │                                              │
│   └────────┬────────────────────┘                                              │
│            │                                                                   │
│            ▼                                                                   │
│   ┌─────────────────────────┐                                                  │
│   │  dispute_evidence_v2    │                                                  │
│   ├─────────────────────────┤                                                  │
│   │ id (PK)                 │                                                  │
│   │ dispute_id (FK) ────────┘                                                  │
│   │ evidence_type              │                                                │
│   │ description                │                                                │
│   │ file_path                  │                                                │
│   │ uploaded_by                │                                                │
│   │ created_at                 │                                                │
│   └────────────────────────────┘                                                │
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────┐      │
│   │                         accounts_v2                                   │      │
│   ├──────────────────────────────────────────────────────────────────────┤      │
│   │ id (PK)                                                              │      │
│   │ customer_id (FK) ────────────────────────────────────────────────────────┐  │
│   │ name                                                                 │   │  │
│   │ relationship_status                                                   │   │  │
│   │ health                                                                │   │  │
│   │ health_score                                                          │   │  │
│   │ primary_service_type                                                  │   │  │
│   │ lifetime_jobs                                                         │   │  │
│   │ lifetime_revenue_cents                                                │   │  │
│   │ open_disputes                                                         │   │  │
│   │ open_followups                                                        │   │  │
│   │ overdue_followups                                                     │   │  │
│   │ last_service_date                                                     │   │  │
│   │ last_contact_date                                                     │   │  │
│   │ account_owner                                                         │   │  │
│   │ notes                                                                 │   │  │
│   │ created_at / updated_at / deleted_at                                  │   │  │
│   └──────┬────────────────────────────────────────────────────────────────┘   │
│          │                                                                   │
│          ▼                                                                   │
│   ┌─────────────────────────┐    ┌─────────────────────────┐                 │
│   │ account_health_scans_v2 │    │      followups_v2       │                 │
│   ├─────────────────────────┤    ├─────────────────────────┤                 │
│   │ id (PK)                 │    │ id (PK)                 │                 │
│   │ account_id (FK) ────────┘    │ account_id (FK) ────────┘                 │
│   │ scan_date                 │    │ customer_id (FK) ──────────────────────────┐
│   │ health_before             │    │ type                      │             │
│   │ health_after              │    │ subject                   │             │
│   │ health_score_before       │    │ status                    │             │
│   │ health_score_after        │    │ priority                  │             │
│   │ risk_factors (JSONB)      │    │ due_date                  │             │
│   │ triggered_by              │    │ completed_at              │             │
│   │ created_at                │    │ assigned_to               │             │
│   └──────────────────────────┘    │ related_ticket_id (FK) ─────────────────────┐
│                                   │ related_appointment_id (FK) ──────────────┐│
│                                   │ related_dispute_id (FK) ──────────────────┐││
│                                   │ notes                                     ││││
│                                   │ created_at / updated_at / deleted_at      ││││
│                                   └────────┬──────────────────────────────────┘│││
│                                            │                                   │││
│                                            ▼                                   │││
│                                   ┌─────────────────────────┐                 │││
│                                   │  followup_attempts_v2   │                 │││
│                                   ├─────────────────────────┤                 │││
│                                   │ id (PK)                 │                 │││
│                                   │ followup_id (FK) ────────┘                 │││
│                                   │ attempted_at             │                 │││
│                                   │ channel                  │                 │││
│                                   │ outcome                  │                 │││
│                                   │ notes                    │                 │││
│                                   │ created_at               │                 │││
│                                   └──────────────────────────┘                 │││
│                                                                                  ││
│                                                                                  ││
│   ┌─────────────────────────┐                         ┌──────────────────────────────────────────────┐ ││
│   │       tasks_v2          │                         │              knowledge_articles_v2            │ ││
│   ├─────────────────────────┤                         ├──────────────────────────────────────────────┤ ││
│   │ id (PK)                 │                         │ id (PK)                                      │ ││
│   │ title                   │                         │ category_id (FK) ───────────────────────────┐ ││
│   │ description             │                         │ title                                        │ ││
│   │ status                  │                         │ content                                      │ ││
│   │ priority                │                         │ summary                                      │ ││
│   │ assigned_to             │                         │ tags (JSONB)                                 │ ││
│   │ created_by              │                         │ status                                       │ ││
│   │ due_date                │                         │ author                                       │ ││
│   │ completed_at            │                         │ view_count                                   │ ││
│   │ related_entity_type     │                         │ helpful_count                                │ ││
│   │ related_entity_id       │                         │ is_published                                 │ ││
│   │ created_at / updated_at │                         │ published_at                                  │ ││
│   │ deleted_at              │                         │ created_at / updated_at                      │ ││
│   └─────────────────────────┘                         │ deleted_at                                   │ ││
│                                                        └──────────────────────────────────────────────┘ ││
│   ┌─────────────────────────┐                                                                          ││
│   │ task_assignments_v2     │                                                                          ││
│   ├─────────────────────────┤                         ┌─────────────────────────┐                     ││
│   │ id (PK)                 │                         │ knowledge_categories_v2 │                     ││
│   │ task_id (FK) ───────────┘                         ├─────────────────────────┤                     ││
│   │ assigned_to             │                         │ id (PK)                 │                     ││
│   │ assigned_by             │                         │ name                    │                     ││
│   │ assigned_at             │                         │ description             │                     ││
│   │ status                  │                         │ parent_id (FK, self) ───┘                     ││
│   │ notes                   │                         │ sort_order               │                      │
│   └──────────────────────────┘                         └──────────────────────────┘                      │
│                                                                                                           │
│   ┌─────────────────────────┐       ┌─────────────────────────┐       ┌─────────────────────────┐         │
│   │    inventory_items_v2   │       │ inventory_transactions  │       │       feedback_v2        │         │
│   ├─────────────────────────┤       ├─────────────────────────┤       ├─────────────────────────┤         │
│   │ id (PK)                 │       │ id (PK)                 │       │ id (PK)                 │         │
│   │ name                    │       │ item_id (FK) ───────────┘       │ ticket_id (FK) ────────┐         │
│   │ sku                     │       │ transaction_type          │       │ appointment_id (FK) ────┐       │
│   │ description             │       │ quantity                  │       │ customer_id (FK) ────────┐     │
│   │ category                │       │ reference_type            │       │ rating                  │     │ │
│   │ unit_price_cents        │       │ reference_id              │       │ comment                 │     │ │
│   │ quantity_on_hand        │       │ technician_id             │       │ source                  │     │ │
│   │ reorder_threshold       │       │ notes                     │       │ response_requested      │     │ │
│   │ reorder_quantity        │       │ created_at                │       │ responded_at            │     │ │
│   │ supplier_info           │       └──────────────────────────┘       │ created_at              │     │ │
│   │ created_at / updated_at │                                          └──────────────────────────┘     │ │
│   │ deleted_at              │                                                                            │ │
│   └─────────────────────────┘                                                                            │ │
│                                                                                                          │ │
│   ┌─────────────────────────┐       ┌─────────────────────────┐                                          │ │
│   │   feedback_surveys_v2   │       │  notifications_v2       │                                          │ │
│   ├─────────────────────────┤       ├─────────────────────────┤                                          │ │
│   │ id (PK)                 │       │ id (PK)                 │                                          │ │
│   │ feedback_id (FK) ───────┘       │ recipient_type          │                                          │ │
│   │ question                 │       │ recipient_id            │                                          │ │
│   │ response                 │       │ notification_type       │                                          │ │
│   │ response_value           │       │ channel                 │                                          │ │
│   │ created_at               │       │ template_id (FK)        │                                          │ │
│   └──────────────────────────┘       │ status                  │                                          │ │
│                                       │ subject                 │                                          │ │
│                                       │ body                    │                                          │ │
│                                       │ sent_at                 │                                          │ │
│                                       │ delivered_at            │                                          │ │
│                                       │ failed_at               │                                          │ │
│                                       │ error_message           │                                          │ │
│                                       │ read_at                 │                                          │ │
│                                       │ created_at              │                                          │ │
│                                       └─────────────────────────┘                                          │
│                                                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│   │                                    users_v2                                                         │  │
│   ├─────────────────────────────────────────────────────────────────────────────────────────────────────┤  │
│   │ id (PK) | email | name | role_id (FK) | status | auth_provider | last_login_at | created_at / updated_at / deleted_at │
│   └────────────────────────┬────────────────────────────────────────────────────────────────────────────┘  │
│                            │                                                                                 │
│   ┌────────────────────────┴─────────────┐         ┌───────────────────────────────────────────────────┐    │
│   │          user_roles_v2               │         │              role_permissions_v2                  │    │
│   ├──────────────────────────────────────┤         ├───────────────────────────────────────────────────┤    │
│   │ id (PK) | name | description | is_system│       │ id (PK) | role_id (FK) | resource | action | scope│    │
│   └─────────────────────────────────────────┘       └───────────────────────────────────────────────────┘    │
│                                                                                                                │
│   ┌──────────────────────────────┐    ┌─────────────────────────────┐    ┌───────────────────────────┐         │
│   │    system_settings_v2        │    │     feature_flags_v2        │    │     connectors_v2          │         │
│   ├──────────────────────────────┤    ├─────────────────────────────┤    ├───────────────────────────┤         │
│   │ id (PK) | key | value | type │    │ id (PK) | app | feature_name│    │ id (PK) | connector_type  │         │
│   │ description | updated_by     │    │ | enabled | rollout_pct     │    │ | config (encrypted)      │         │
│   └──────────────────────────────┘    │ | created_by | updated_at   │    │ | enabled | status         │         │
│                                        └─────────────────────────────┘    │ | last_health_check       │         │
│                                                                           └───────────────────────────┘         │
│   ┌──────────────────────────────┐    ┌─────────────────────────────┐    ┌───────────────────────────┐         │
│   │     audit_log_v2             │    │        events_v2             │    │   user_sessions_v2        │         │
│   ├──────────────────────────────┤    ├─────────────────────────────┤    ├───────────────────────────┤         │
│   │ id (PK)                     │    │ id (PK)                     │    │ id (PK)                   │         │
│   │ entity_type / entity_id     │    │ event_name                  │    │ user_id (FK)              │         │
│   │ action                      │    │ producer_app                │    │ token_hash                │         │
│   │ actor_type / actor_id       │    │ producer_entity_type        │    │ ip_address                │         │
│   │ previous_state (JSONB)      │    │ producer_entity_id          │    │ user_agent                │         │
│   │ new_state (JSONB)           │    │ payload (JSONB)             │    │ expires_at                │         │
│   │ changed_fields (TEXT[])     │    │ correlation_id              │    │ last_activity_at          │         │
│   │ correlation_id              │    │ status                      │    │ is_active                 │         │
│   │ created_at                  │    │ created_at                  │    │ created_at                │         │
│   └──────────────────────────────┘    └─────────────────────────────┘    └───────────────────────────┘         │
│                                                                                                                │
│   ┌──────────────────────────────┐    ┌─────────────────────────────┐                                          │
│   │  analytics_reports_v2        │    │ analytics_schedules_v2       │                                          │
│   ├──────────────────────────────┤    ├─────────────────────────────┤                                          │
│   │ id (PK)                     │    │ id (PK)                     │                                          │
│   │ name                        │    │ report_id (FK) ─────────────┤                                          │
│   │ description                 │    │ frequency                   │                                          │
│   │ config (JSONB)              │    │ recipients (TEXT[])         │                                          │
│   │ created_by                  │    │ format                      │                                          │
│   │ is_public                   │    │ is_active                   │                                          │
│   │ created_at / updated_at     │    │ last_sent_at                │                                          │
│   └──────────────────────────────┘    │ next_scheduled_at          │                                          │
│                                        │ created_at / updated_at    │                                          │
│                                        └─────────────────────────────┘                                          │
│                                                                                                                │
│   ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐         │
│   │                                   reference_data_v2                                                │         │
│   ├──────────────────────────────────────────────────────────────────────────────────────────────────┤         │
│   │ A single table with type discriminator for all extensible enum values:                             │         │
│   │ id (PK) | type | code | label | description | sort_order | is_active | created_at                 │         │
│   │                                                                                                    │         │
│   │ Types: service_type, ticket_channel, ticket_request_type, dispute_resolution_type,                 │         │
│   │        followup_type, inventory_category, notification_type, work_order_stage,                     │         │
│   │        customer_type, skill_name, evidence_type, feedback_source, dispatch_type                    │         │
│   └──────────────────────────────────────────────────────────────────────────────────────────────────────┘         │
│                                                                                                                   │
│   ┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐       │
│   │                                 notification_templates_v2                                             │       │
│   ├──────────────────────────────────────────────────────────────────────────────────────────────────────┤       │
│   │ id (PK) | name | type | channel | subject_template | body_template | variables (TEXT[]) | category   │       │
│   │ | is_active | created_at | updated_at                                                                 │       │
│   └──────────────────────────────────────────────────────────────────────────────────────────────────────┘       │
│                                                                                                                   │
│   ┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐       │
│   │                             notification_channels_v2                                                 │       │
│   ├──────────────────────────────────────────────────────────────────────────────────────────────────────┤       │
│   │ id (PK) | channel_type | provider | config (encrypted) | is_enabled | rate_limit | last_health_check  │       │
│   │ | last_error | created_at | updated_at                                                                │       │
│   └──────────────────────────────────────────────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Table Definitions

### 2.1 customers_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| name | TEXT | NO | — | Customer full name |
| primary_phone | TEXT | YES | — | Primary contact number |
| primary_email | TEXT | YES | — | Primary email address |
| status | TEXT | NO | 'active' | `active`, `in_dispute`, `dormant`, `at_risk`, `service_due`, `churned` |
| customer_type | TEXT | YES | 'residential' | `residential`, `commercial`, `industrial`, `property_manager` |
| preferred_contact_channel | TEXT | YES | 'email' | `email`, `sms`, `phone`, `in_app` |
| notes | TEXT | YES | — | Free-text account notes |
| created_by | UUID | YES | — | FK → users_v2.id |
| updated_by | UUID | YES | — | FK → users_v2.id |
| created_at | TIMESTAMPTZ | NO | NOW() | — |
| updated_at | TIMESTAMPTZ | NO | NOW() | — |
| deleted_at | TIMESTAMPTZ | YES | — | Soft delete timestamp |

**Row Volume**: 5,000 (year 1) → 50,000 (year 3)  
**Update Frequency**: Daily (contact info, status changes)  
**Read Frequency**: 10,000+ reads/day (ticketing, scheduling, CRM)  
**Owner**: crm-center_v2, customer-portal_v2 (self-service)  
**Lifecycle**: Created on first contact → Updated throughout relationship → Soft-deleted on churn

### 2.2 customer_addresses_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| customer_id | UUID | NO | — | FK → customers_v2.id |
| address_type | TEXT | NO | 'service' | `service`, `billing`, `shipping`, `other` |
| address_line1 | TEXT | NO | — | Street address |
| address_line2 | TEXT | YES | — | Apt, suite, unit |
| city | TEXT | NO | — | City |
| state | TEXT | NO | — | State/province |
| postal_code | TEXT | NO | — | ZIP/postal code |
| country | TEXT | NO | 'US' | ISO country code |
| is_primary | BOOLEAN | NO | FALSE | Primary address flag |
| notes | TEXT | YES | — | Delivery instructions, gate codes |
| created_at | TIMESTAMPTZ | NO | NOW() | — |
| updated_at | TIMESTAMPTZ | NO | NOW() | — |

**Row Volume**: 7,500 (year 1) → 75,000 (year 3) — ~1.5 addresses per customer  
**Update Frequency**: Weekly  
**Owner**: crm-center_v2, customer-portal_v2

### 2.3 technicians_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| name | TEXT | NO | — | Technician full name |
| primary_phone | TEXT | NO | — | Contact number |
| primary_email | TEXT | YES | — | Email address |
| availability | TEXT | NO | 'available' | `available`, `busy`, `on_break`, `off_shift`, `on_leave` |
| status | TEXT | NO | 'active' | `active`, `inactive`, `suspended`, `terminated` |
| rating | DOUBLE PRECISION | YES | — | 0.0–5.0 aggregate rating |
| hire_date | DATE | YES | — | Date of hire |
| certifications | JSONB | YES | '[]' | Array of certification objects |
| max_daily_jobs | INTEGER | YES | 4 | Max jobs per day |
| preferred_territory | TEXT | YES | — | Geographic area |
| notes | TEXT | YES | — | Internal notes |
| created_by | UUID | YES | — | FK → users_v2.id |
| updated_by | UUID | YES | — | FK → users_v2.id |
| created_at | TIMESTAMPTZ | NO | NOW() | — |
| updated_at | TIMESTAMPTZ | NO | NOW() | — |
| deleted_at | TIMESTAMPTZ | YES | — | Soft delete |

**Row Volume**: 100 (year 1) → 500 (year 3)  
**Update Frequency**: Daily (availability, status)  
**Owner**: technician-portal_v2

### 2.4 technician_skills_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| technician_id | UUID | NO | — | FK → technicians_v2.id |
| skill | TEXT | NO | — | FK → reference_data_v2 (type='skill_name') |
| proficiency | TEXT | NO | 'intermediate' | `beginner`, `intermediate`, `advanced`, `expert` |
| certification_ref | TEXT | YES | — | Certification ID/number |
| certified_at | DATE | YES | — | Date certified |
| expires_at | DATE | YES | — | Certification expiry |
| created_at | TIMESTAMPTZ | NO | NOW() | — |

**Unique Constraint**: (technician_id, skill)  
**Row Volume**: 500 (year 1) → 2,500 (year 3) — ~5 skills per tech  
**Owner**: technician-portal_v2

### 2.5 tickets_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| customer_id | UUID | YES | — | FK → customers_v2.id |
| customer_name | TEXT | YES | — | Denormalized for quick display |
| channel | TEXT | NO | — | FK → reference_data_v2 (type='ticket_channel') |
| subject | TEXT | NO | — | Ticket subject |
| message | TEXT | NO | — | Initial customer message |
| request_type | TEXT | YES | — | FK → reference_data_v2 (type='ticket_request_type') |
| urgency | TEXT | YES | 'normal' | `low`, `normal`, `high`, `urgent` |
| status | TEXT | NO | 'new' | See state machine: new → classified → drafted → approved_to_send → sent → closed |
| assigned_to | TEXT | YES | — | Current assigned user/agent |
| suggested_owner | TEXT | YES | — | AI-suggested owner |
| draft_reply | TEXT | YES | — | AI-drafted or agent reply |
| approved_to_send | BOOLEAN | YES | FALSE | Approval flag |
| escalated_at | TIMESTAMPTZ | YES | — | When escalated |
| sla_deadline | TIMESTAMPTZ | YES | — | SLA response deadline |
| closed_at | TIMESTAMPTZ | YES | — | When closed |
| created_by | UUID | YES | — | FK → users_v2.id |
| updated_by | UUID | YES | — | FK → users_v2.id |
| created_at | TIMESTAMPTZ | NO | NOW() | — |
| updated_at | TIMESTAMPTZ | NO | NOW() | — |
| deleted_at | TIMESTAMPTZ | YES | — | Soft delete |

**Row Volume**: 50,000 (year 1) → 500,000 (year 3)  
**Update Frequency**: Multiple times per ticket lifecycle  
**Owner**: support-center_v2, customer-portal_v2 (create)

### 2.6 ticket_messages_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| ticket_id | UUID | NO | — | FK → tickets_v2.id |
| author_type | TEXT | NO | — | `customer`, `agent`, `system`, `agent` |
| author_id | TEXT | YES | — | ID of the author (customer_id, user_id, agent_name) |
| message_text | TEXT | NO | — | Message content |
| is_internal | BOOLEAN | NO | FALSE | Internal note (not visible to customer) |
| created_at | TIMESTAMPTZ | NO | NOW() | — |

**Row Volume**: 150,000 (year 1) → 1,500,000 (year 3) — ~3 messages per ticket  
**Owner**: support-center_v2

### 2.7 ticket_attachments_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| ticket_id | UUID | NO | — | FK → tickets_v2.id |
| message_id | UUID | YES | — | FK → ticket_messages_v2.id |
| file_name | TEXT | NO | — | Original filename |
| file_type | TEXT | NO | — | MIME type |
| file_size | INTEGER | NO | — | Size in bytes |
| storage_path | TEXT | NO | — | Storage location |
| uploaded_by | TEXT | NO | — | Who uploaded |
| created_at | TIMESTAMPTZ | NO | NOW() | — |

**Owner**: support-center_v2, customer-portal_v2

### 2.8 appointments_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| customer_id | UUID | NO | — | FK → customers_v2.id |
| technician_id | UUID | YES | — | FK → technicians_v2.id |
| service_type | TEXT | NO | — | FK → reference_data_v2 (type='service_type') |
| scheduled_date | TIMESTAMPTZ | NO | — | Appointment date/time |
| duration_minutes | INTEGER | YES | 60 | Duration in minutes |
| status | TEXT | NO | 'scheduled' | See state machine |
| arrival_window_start | TIMESTAMPTZ | YES | — | 2-hour arrival window start |
| arrival_window_end | TIMESTAMPTZ | YES | — | 2-hour arrival window end |
| notes | TEXT | YES | — | Job notes |
| completed_at | TIMESTAMPTZ | YES | — | When marked complete |
| cancelled_at | TIMESTAMPTZ | YES | — | When cancelled |
| cancel_reason | TEXT | YES | — | Reason for cancellation |
| created_by | UUID | YES | — | FK → users_v2.id |
| updated_by | UUID | YES | — | FK → users_v2.id |
| created_at | TIMESTAMPTZ | NO | NOW() | — |
| updated_at | TIMESTAMPTZ | NO | NOW() | — |
| deleted_at | TIMESTAMPTZ | YES | — | Soft delete |

**Row Volume**: 30,000 (year 1) → 300,000 (year 3)  
**Owner**: appointment-center_v2

### 2.9 appointment_reminders_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| appointment_id | UUID | NO | — | FK → appointments_v2.id |
| reminder_type | TEXT | NO | — | `24h_before`, `2h_before`, `morning_of` |
| scheduled_for | TIMESTAMPTZ | NO | — | When to send |
| sent_at | TIMESTAMPTZ | YES | — | When actually sent |
| channel | TEXT | YES | — | `email`, `sms`, `push`, `in_app` |
| status | TEXT | NO | 'pending' | `pending`, `sent`, `failed`, `cancelled` |
| error_message | TEXT | YES | — | Failure reason |
| created_at | TIMESTAMPTZ | NO | NOW() | — |

**Owner**: appointment-center_v2

### 2.10 work_orders_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| appointment_id | UUID | YES | — | FK → appointments_v2.id |
| technician_id | UUID | YES | — | FK → technicians_v2.id |
| customer_id | UUID | YES | — | FK → customers_v2.id |
| status | TEXT | NO | 'created' | See state machine |
| service_description | TEXT | NO | — | What service was performed |
| customer_notes | TEXT | YES | — | Customer-reported issue |
| technician_notes | TEXT | YES | — | Work performed notes |
| started_at | TIMESTAMPTZ | YES | — | When work started |
| completed_at | TIMESTAMPTZ | YES | — | When work completed |
| parts_used | JSONB | YES | '[]' | Array of {item_id, name, quantity, cost_cents} |
| photos | JSONB | YES | '[]' | Array of {url, caption, timestamp} |
| signature_ref | TEXT | YES | — | Customer signature image ref |
| created_by | UUID | YES | — | FK → users_v2.id |
| updated_by | UUID | YES | — | FK → users_v2.id |
| created_at | TIMESTAMPTZ | NO | NOW() | — |
| updated_at | TIMESTAMPTZ | NO | NOW() | — |
| deleted_at | TIMESTAMPTZ | YES | — | Soft delete |

**Row Volume**: 25,000 (year 1) → 250,000 (year 3)  
**Owner**: technician-portal_v2

### 2.11 work_order_stages_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| work_order_id | UUID | NO | — | FK → work_orders_v2.id |
| stage_name | TEXT | NO | — | `assigned`, `travelling`, `on_site`, `working`, `completed` |
| entered_at | TIMESTAMPTZ | NO | — | When stage was entered |
| exited_at | TIMESTAMPTZ | YES | — | When stage was exited |
| duration_seconds | INTEGER | YES | — | Time in stage (calculated) |
| geo_location | JSONB | YES | — | {lat, lng} at stage entry |
| created_at | TIMESTAMPTZ | NO | NOW() | — |

**Owner**: technician-portal_v2

### 2.12 dispatches_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| ticket_id | UUID | YES | — | FK → tickets_v2.id |
| appointment_id | UUID | YES | — | FK → appointments_v2.id |
| technician_id | UUID | YES | — | FK → technicians_v2.id |
| dispatch_type | TEXT | NO | 'urgent' | `urgent`, `scheduled`, `emergency` |
| priority | TEXT | NO | 'high' | `low`, `normal`, `high`, `critical` |
| status | TEXT | NO | 'pending' | See state machine |
| initiated_by | TEXT | NO | — | Who/what initiated |
| notes | TEXT | YES | — | Dispatch instructions |
| acknowledged_at | TIMESTAMPTZ | YES | — | Technician acknowledged |
| arrived_at | TIMESTAMPTZ | YES | — | Technician arrived on site |
| completed_at | TIMESTAMPTZ | YES | — | Dispatch resolved |
| cancelled_at | TIMESTAMPTZ | YES | — | Dispatch cancelled |
| cancel_reason | TEXT | YES | — | Why cancelled |
| created_by | UUID | YES | — | FK → users_v2.id |
| updated_by | UUID | YES | — | FK → users_v2.id |
| created_at | TIMESTAMPTZ | NO | NOW() | — |
| updated_at | TIMESTAMPTZ | NO | NOW() | — |
| deleted_at | TIMESTAMPTZ | YES | — | Soft delete |

**Row Volume**: 5,000 (year 1) → 50,000 (year 3)  
**Owner**: operations-center_v2

### 2.13 disputes_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| appointment_id | UUID | NO | — | FK → appointments_v2.id |
| customer_id | UUID | NO | — | FK → customers_v2.id |
| ticket_id | UUID | YES | — | FK → tickets_v2.id |
| customer_claim | TEXT | NO | — | Customer's statement |
| provider_claim | TEXT | NO | — | Provider/technician statement |
| evidence_summary | TEXT | NO | — | Summary of evidence |
| status | TEXT | NO | 'open' | See state machine |
| recommended_resolution | TEXT | YES | — | FK → reference_data_v2 (type='dispute_resolution_type') |
| resolution_reason | TEXT | YES | — | Why resolution was chosen |
| confidence | DOUBLE PRECISION | YES | — | AI confidence score (0.0–1.0) |
| resolved_by | TEXT | YES | — | Person who resolved |
| closed_at | TIMESTAMPTZ | YES | — | When closed |
| created_by | UUID | YES | — | FK → users_v2.id |
| updated_by | UUID | YES | — | FK → users_v2.id |
| created_at | TIMESTAMPTZ | NO | NOW() | — |
| updated_at | TIMESTAMPTZ | NO | NOW() | — |
| deleted_at | TIMESTAMPTZ | YES | — | Soft delete |

**Row Volume**: 2,000 (year 1) → 20,000 (year 3)  
**Owner**: resolution-center_v2

### 2.14 dispute_evidence_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| dispute_id | UUID | NO | — | FK → disputes_v2.id |
| evidence_type | TEXT | NO | — | `photo`, `document`, `receipt`, `screenshot`, `audio`, `video`, `statement` |
| description | TEXT | YES | — | Description of evidence |
| file_path | TEXT | YES | — | Storage path |
| uploaded_by | TEXT | NO | — | Who uploaded |
| created_at | TIMESTAMPTZ | NO | NOW() | — |

**Owner**: resolution-center_v2

### 2.15 tasks_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| title | TEXT | NO | — | Task title |
| description | TEXT | YES | — | Detailed description |
| status | TEXT | NO | 'open' | `open`, `in_progress`, `blocked`, `done`, `overdue`, `cancelled` |
| priority | TEXT | YES | 'normal' | `low`, `normal`, `high`, `urgent` |
| assigned_to | TEXT | YES | — | Assignee name or user ID |
| created_by | TEXT | YES | — | Creator name or user ID |
| due_date | DATE | YES | — | Due date |
| completed_at | TIMESTAMPTZ | YES | — | When completed |
| related_entity_type | TEXT | YES | — | `ticket`, `appointment`, `dispute`, `work_order`, `account` |
| related_entity_id | UUID | YES | — | FK to related entity |
| created_at | TIMESTAMPTZ | NO | NOW() | — |
| updated_at | TIMESTAMPTZ | NO | NOW() | — |
| deleted_at | TIMESTAMPTZ | YES | — | Soft delete |

**Row Volume**: 15,000 (year 1) → 150,000 (year 3)  
**Owner**: operations-center_v2

### 2.16 task_assignments_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| task_id | UUID | NO | — | FK → tasks_v2.id |
| assigned_to | TEXT | NO | — | Assignee |
| assigned_by | TEXT | NO | — | Who assigned |
| assigned_at | TIMESTAMPTZ | NO | NOW() | — |
| status | TEXT | NO | 'pending' | `pending`, `accepted`, `declined`, `reassigned` |
| notes | TEXT | YES | — | Assignment notes |
| created_at | TIMESTAMPTZ | NO | NOW() | — |

**Owner**: operations-center_v2

### 2.17 accounts_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| customer_id | UUID | YES | — | FK → customers_v2.id |
| name | TEXT | NO | — | Account name |
| relationship_status | TEXT | YES | 'active' | `new`, `active`, `watch`, `at_risk`, `in_dispute`, `dormant`, `won_back`, `churned` |
| health | TEXT | YES | 'healthy' | `healthy`, `watch`, `slipping`, `critical` |
| health_score | DOUBLE PRECISION | YES | 1.0 | Numeric score (0.0–1.0) |
| primary_service_type | TEXT | YES | — | FK → reference_data_v2 (type='service_type') |
| lifetime_jobs | INTEGER | YES | 0 | Total completed jobs |
| lifetime_revenue_cents | INTEGER | YES | 0 | Total revenue in cents |
| open_disputes | INTEGER | YES | 0 | Current open disputes |
| open_followups | INTEGER | YES | 0 | Current open followups |
| overdue_followups | INTEGER | YES | 0 | Overdue followups |
| last_service_date | DATE | YES | — | Most recent service date |
| last_contact_date | DATE | YES | — | Most recent contact date |
| next_follow_up_due | DATE | YES | — | Next followup due date |
| account_owner | TEXT | YES | — | Account manager owner |
| notes | TEXT | YES | — | Account notes |
| created_by | UUID | YES | — | FK → users_v2.id |
| updated_by | UUID | YES | — | FK → users_v2.id |
| created_at | TIMESTAMPTZ | NO | NOW() | — |
| updated_at | TIMESTAMPTZ | NO | NOW() | — |
| deleted_at | TIMESTAMPTZ | YES | — | Soft delete |

**Row Volume**: 5,000 (year 1) → 50,000 (year 3) — One-to-one with customers  
**Owner**: crm-center_v2

### 2.18 account_health_scans_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| account_id | UUID | NO | — | FK → accounts_v2.id |
| scan_date | TIMESTAMPTZ | NO | NOW() | When scan was run |
| health_before | TEXT | YES | — | Health before scan |
| health_after | TEXT | YES | — | Health after scan |
| health_score_before | DOUBLE PRECISION | YES | — | Score before |
| health_score_after | DOUBLE PRECISION | YES | — | Score after |
| risk_factors | JSONB | YES | '[]' | Array of risk factor objects |
| triggered_by | TEXT | NO | — | `scheduled`, `manual`, `event` |
| created_at | TIMESTAMPTZ | NO | NOW() | — |

**Owner**: crm-center_v2

### 2.19 followups_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| account_id | UUID | NO | — | FK → accounts_v2.id |
| customer_id | UUID | YES | — | FK → customers_v2.id |
| type | TEXT | NO | — | FK → reference_data_v2 (type='followup_type') |
| subject | TEXT | NO | — | Follow-up subject |
| status | TEXT | NO | 'pending' | `pending`, `in_progress`, `completed`, `missed`, `cancelled` |
| priority | TEXT | NO | 'normal' | `low`, `normal`, `high`, `urgent` |
| due_date | DATE | YES | — | Due date |
| completed_at | TIMESTAMPTZ | YES | — | When completed |
| assigned_to | TEXT | YES | — | Assigned owner |
| related_ticket_id | UUID | YES | — | FK → tickets_v2.id |
| related_appointment_id | UUID | YES | — | FK → appointments_v2.id |
| related_dispute_id | UUID | YES | — | FK → disputes_v2.id |
| notes | TEXT | YES | — | Notes |
| created_by | UUID | YES | — | FK → users_v2.id |
| updated_by | UUID | YES | — | FK → users_v2.id |
| created_at | TIMESTAMPTZ | NO | NOW() | — |
| updated_at | TIMESTAMPTZ | NO | NOW() | — |
| deleted_at | TIMESTAMPTZ | YES | — | Soft delete |

**Row Volume**: 20,000 (year 1) → 200,000 (year 3)  
**Owner**: crm-center_v2

### 2.20 followup_attempts_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| followup_id | UUID | NO | — | FK → followups_v2.id |
| attempted_at | TIMESTAMPTZ | NO | NOW() | When attempt was made |
| channel | TEXT | NO | — | `email`, `sms`, `phone`, `in_app` |
| outcome | TEXT | NO | — | `reached`, `left_message`, `no_answer`, `wrong_number`, `opted_out` |
| notes | TEXT | YES | — | Attempt notes |
| created_at | TIMESTAMPTZ | NO | NOW() | — |

**Owner**: crm-center_v2

### 2.21 knowledge_articles_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| category_id | UUID | YES | — | FK → knowledge_categories_v2.id |
| title | TEXT | NO | — | Article title |
| content | TEXT | NO | — | Full article content |
| summary | TEXT | YES | — | Short summary/abstract |
| tags | JSONB | YES | '[]' | Array of tag strings |
| status | TEXT | NO | 'draft' | `draft`, `published`, `archived` |
| author | TEXT | NO | — | Author name |
| view_count | INTEGER | NO | 0 | Number of views |
| helpful_count | INTEGER | NO | 0 | "Helpful" vote count |
| is_published | BOOLEAN | NO | FALSE | Published flag |
| published_at | TIMESTAMPTZ | YES | — | When published |
| created_by | UUID | YES | — | FK → users_v2.id |
| updated_by | UUID | YES | — | FK → users_v2.id |
| created_at | TIMESTAMPTZ | NO | NOW() | — |
| updated_at | TIMESTAMPTZ | NO | NOW() | — |
| deleted_at | TIMESTAMPTZ | YES | — | Soft delete |

**Row Volume**: 500 (year 1) → 5,000 (year 3)  
**Owner**: support-center_v2

### 2.22 knowledge_categories_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| name | TEXT | NO | — | Category name |
| description | TEXT | YES | — | Category description |
| parent_id | UUID | YES | — | Self-referencing FK for hierarchy |
| icon | TEXT | YES | — | Icon identifier |
| sort_order | INTEGER | YES | 0 | Display ordering |
| is_active | BOOLEAN | NO | TRUE | Active flag |
| created_at | TIMESTAMPTZ | NO | NOW() | — |
| updated_at | TIMESTAMPTZ | NO | NOW() | — |

**Owner**: support-center_v2

### 2.23 inventory_items_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| name | TEXT | NO | — | Item name |
| sku | TEXT | NO | — | Stock keeping unit |
| description | TEXT | YES | — | Item description |
| category | TEXT | YES | — | Inventory category |
| unit_price_cents | INTEGER | YES | 0 | Unit price in cents |
| quantity_on_hand | INTEGER | NO | 0 | Current stock level |
| reorder_threshold | INTEGER | YES | 10 | Low stock alert level |
| reorder_quantity | INTEGER | YES | 50 | Quantity to reorder |
| supplier_info | TEXT | YES | — | Supplier name/contact |
| is_active | BOOLEAN | NO | TRUE | Active item flag |
| created_by | UUID | YES | — | FK → users_v2.id |
| updated_by | UUID | YES | — | FK → users_v2.id |
| created_at | TIMESTAMPTZ | NO | NOW() | — |
| updated_at | TIMESTAMPTZ | NO | NOW() | — |
| deleted_at | TIMESTAMPTZ | YES | — | Soft delete |

**Unique Constraint**: (sku)  
**Row Volume**: 500 (year 1) → 2,000 (year 3)  
**Owner**: operations-center_v2

### 2.24 inventory_transactions_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| item_id | UUID | NO | — | FK → inventory_items_v2.id |
| transaction_type | TEXT | NO | — | `received`, `consumed`, `transferred`, `returned`, `adjusted`, `scrapped` |
| quantity | INTEGER | NO | — | Positive = in, negative = out |
| reference_type | TEXT | YES | — | `work_order`, `purchase_order`, `transfer` |
| reference_id | UUID | YES | — | FK to reference record |
| technician_id | UUID | YES | — | FK → technicians_v2.id |
| notes | TEXT | YES | — | Transaction notes |
| created_by | UUID | YES | — | FK → users_v2.id |
| created_at | TIMESTAMPTZ | NO | NOW() | — |

**Row Volume**: 50,000 (year 1) → 500,000 (year 3)  
**Owner**: operations-center_v2

### 2.25 feedback_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| ticket_id | UUID | YES | — | FK → tickets_v2.id |
| appointment_id | UUID | YES | — | FK → appointments_v2.id |
| customer_id | UUID | NO | — | FK → customers_v2.id |
| rating | INTEGER | NO | — | 1–5 star rating |
| comment | TEXT | YES | — | Customer comment |
| source | TEXT | NO | — | `survey`, `in_app`, `email`, `sms` |
| response_requested | BOOLEAN | NO | FALSE | Customer requested followup |
| responded_at | TIMESTAMPTZ | YES | — | Customer responded to followup |
| created_at | TIMESTAMPTZ | NO | NOW() | — |

**Row Volume**: 15,000 (year 1) → 150,000 (year 3)  
**Owner**: crm-center_v2

### 2.26 feedback_surveys_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| feedback_id | UUID | NO | — | FK → feedback_v2.id |
| question | TEXT | NO | — | Survey question text |
| response | TEXT | YES | — | Free-text response |
| response_value | INTEGER | YES | — | Numeric response (e.g., NPS score) |
| created_at | TIMESTAMPTZ | NO | NOW() | — |

**Owner**: crm-center_v2

### 2.27 users_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| email | TEXT | NO | — | Login email |
| name | TEXT | NO | — | Display name |
| role_id | UUID | YES | — | FK → user_roles_v2.id |
| status | TEXT | NO | 'active' | `active`, `inactive`, `suspended`, `invited` |
| auth_provider | TEXT | NO | 'lemma' | `lemma`, `google`, `microsoft`, `saml` |
| external_auth_id | TEXT | YES | — | External IDP user ID |
| last_login_at | TIMESTAMPTZ | YES | — | Last login timestamp |
| preferences_config | JSONB | YES | '{}' | User preferences |
| created_by | UUID | YES | — | FK → users_v2.id (self-ref) |
| created_at | TIMESTAMPTZ | NO | NOW() | — |
| updated_at | TIMESTAMPTZ | NO | NOW() | — |
| deleted_at | TIMESTAMPTZ | YES | — | Soft delete |

**Unique Constraint**: (email) WHERE deleted_at IS NULL  
**Row Volume**: 100 (year 1) → 1,000 (year 3)  
**Owner**: admin-center_v2

### 2.28 user_roles_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| name | TEXT | NO | — | Role name |
| description | TEXT | YES | — | Role description |
| is_system | BOOLEAN | NO | FALSE | System role (cannot delete) |
| created_at | TIMESTAMPTZ | NO | NOW() | — |
| updated_at | TIMESTAMPTZ | NO | NOW() | — |

**Seed Roles**: super_admin, admin, manager, agent, coordinator, technician, customer, auditor  
**Owner**: admin-center_v2

### 2.29 role_permissions_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| role_id | UUID | NO | — | FK → user_roles_v2.id |
| resource | TEXT | NO | — | `tickets_v2`, `appointments_v2`, `accounts_v2`, etc. |
| action | TEXT | NO | — | `create`, `read`, `update`, `delete`, `execute`, `approve` |
| scope | TEXT | NO | 'all' | `all`, `own`, `assigned`, `managed` |
| created_at | TIMESTAMPTZ | NO | NOW() | — |

**Unique Constraint**: (role_id, resource, action, scope)  
**Owner**: admin-center_v2

### 2.30 user_sessions_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| user_id | UUID | NO | — | FK → users_v2.id |
| token_hash | TEXT | NO | — | Hashed session token |
| ip_address | TEXT | YES | — | Client IP |
| user_agent | TEXT | YES | — | Browser/device info |
| expires_at | TIMESTAMPTZ | NO | — | Session expiry |
| last_activity_at | TIMESTAMPTZ | NO | NOW() | Last request time |
| is_active | BOOLEAN | NO | TRUE | Active session flag |
| created_at | TIMESTAMPTZ | NO | NOW() | — |

**Owner**: admin-center_v2

### 2.31 system_settings_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| key | TEXT | NO | — | Setting key |
| value | TEXT | NO | — | Setting value |
| type | TEXT | NO | 'string' | `string`, `number`, `boolean`, `json` |
| description | TEXT | YES | — | Setting description |
| updated_by | UUID | YES | — | FK → users_v2.id |
| created_at | TIMESTAMPTZ | NO | NOW() | — |
| updated_at | TIMESTAMPTZ | NO | NOW() | — |

**Unique Constraint**: (key)  
**Owner**: admin-center_v2

### 2.32 feature_flags_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| app | TEXT | NO | — | App identifier (e.g., 'support-center_v2') |
| feature_name | TEXT | NO | — | Feature identifier |
| enabled | BOOLEAN | NO | FALSE | Global toggle |
| rollout_percentage | INTEGER | YES | 100 | 0–100 percentage |
| created_by | UUID | YES | — | FK → users_v2.id |
| created_at | TIMESTAMPTZ | NO | NOW() | — |
| updated_at | TIMESTAMPTZ | NO | NOW() | — |

**Unique Constraint**: (app, feature_name)  
**Owner**: admin-center_v2

### 2.33 connectors_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| connector_type | TEXT | NO | — | `smtp`, `sms_twilio`, `discord_webhook`, `slack`, `gmail`, `reddit` |
| provider | TEXT | YES | — | Provider name |
| config | JSONB | NO | '{}' | Encrypted connection config |
| is_enabled | BOOLEAN | NO | TRUE | Enabled flag |
| status | TEXT | NO | 'unknown' | `unknown`, `connected`, `disconnected`, `error` |
| last_health_check | TIMESTAMPTZ | YES | — | Last health check timestamp |
| last_error | TEXT | YES | — | Last error message |
| created_by | UUID | YES | — | FK → users_v2.id |
| updated_by | UUID | YES | — | FK → users_v2.id |
| created_at | TIMESTAMPTZ | NO | NOW() | — |
| updated_at | TIMESTAMPTZ | NO | NOW() | — |

**Owner**: admin-center_v2

### 2.34 notifications_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| recipient_type | TEXT | NO | — | `customer`, `technician`, `user` |
| recipient_id | UUID | NO | — | FK to respective table |
| notification_type | TEXT | NO | — | e.g., 'ticket_status_changed', 'appointment_reminder' |
| channel | TEXT | NO | — | `in_app`, `email`, `sms`, `push`, `discord` |
| template_id | UUID | YES | — | FK → notification_templates_v2.id |
| status | TEXT | NO | 'pending' | `pending`, `sent`, `delivered`, `failed`, `read` |
| subject | TEXT | YES | — | Rendered subject |
| body | TEXT | YES | — | Rendered body |
| sent_at | TIMESTAMPTZ | YES | — | When sent |
| delivered_at | TIMESTAMPTZ | YES | — | Delivery confirmed |
| failed_at | TIMESTAMPTZ | YES | — | Delivery failed |
| error_message | TEXT | YES | — | Failure reason |
| read_at | TIMESTAMPTZ | YES | — | Recipient read timestamp |
| correlation_id | TEXT | YES | — | Links to source event |
| created_at | TIMESTAMPTZ | NO | NOW() | — |

**Row Volume**: 200,000 (year 1) → 2,000,000 (year 3)  
**Owner**: notification-center_v2

### 2.35 notification_templates_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| name | TEXT | NO | — | Template name |
| notification_type | TEXT | NO | — | Maps to notification_type |
| channel | TEXT | NO | — | `email`, `sms`, `push`, `in_app` |
| subject_template | TEXT | YES | — | Subject with {{variables}} |
| body_template | TEXT | NO | — | Body with {{variables}} |
| variables | TEXT[] | NO | '{}' | Array of expected variable names |
| category | TEXT | YES | — | Template category |
| is_active | BOOLEAN | NO | TRUE | Active flag |
| created_by | UUID | YES | — | FK → users_v2.id |
| updated_by | UUID | YES | — | FK → users_v2.id |
| created_at | TIMESTAMPTZ | NO | NOW() | — |
| updated_at | TIMESTAMPTZ | NO | NOW() | — |

**Owner**: notification-center_v2

### 2.36 notification_channels_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| channel_type | TEXT | NO | — | `smtp`, `sms_twilio`, `discord`, `slack`, `push` |
| provider | TEXT | YES | — | Provider name |
| config | JSONB | NO | '{}' | Encrypted config |
| is_enabled | BOOLEAN | NO | TRUE | Enabled flag |
| rate_limit_per_minute | INTEGER | YES | 60 | Rate limit |
| last_health_check | TIMESTAMPTZ | YES | — | Last health check |
| last_error | TEXT | YES | — | Last error |
| created_by | UUID | YES | — | FK → users_v2.id |
| created_at | TIMESTAMPTZ | NO | NOW() | — |
| updated_at | TIMESTAMPTZ | NO | NOW() | — |

**Owner**: notification-center_v2

### 2.37 analytics_reports_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| name | TEXT | NO | — | Report name |
| description | TEXT | YES | — | Report description |
| config | JSONB | NO | '{}' | Report configuration (metrics, dimensions, filters, chart_type) |
| created_by | UUID | YES | — | FK → users_v2.id |
| is_public | BOOLEAN | NO | FALSE | Shared with all users |
| created_at | TIMESTAMPTZ | NO | NOW() | — |
| updated_at | TIMESTAMPTZ | NO | NOW() | — |

**Owner**: analytics-center_v2

### 2.38 analytics_schedules_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| report_id | UUID | NO | — | FK → analytics_reports_v2.id |
| frequency | TEXT | NO | — | `daily`, `weekly`, `monthly`, `quarterly` |
| recipients | TEXT[] | NO | '{}' | Array of email recipients |
| format | TEXT | NO | 'pdf' | `pdf`, `csv`, `json`, `xlsx` |
| is_active | BOOLEAN | NO | TRUE | Active schedule |
| last_sent_at | TIMESTAMPTZ | YES | — | Last delivery |
| next_scheduled_at | TIMESTAMPTZ | YES | — | Next delivery |
| created_at | TIMESTAMPTZ | NO | NOW() | — |
| updated_at | TIMESTAMPTZ | NO | NOW() | — |

**Owner**: analytics-center_v2

### 2.39 audit_log_v2

(See DATABASE_ARCHITECTURE.md section 5.1 for full definition)

**Owner**: admin-center_v2

### 2.40 events_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| event_name | TEXT | NO | — | Fully qualified event name |
| producer_app | TEXT | NO | — | Source app identifier |
| producer_entity_type | TEXT | YES | — | Entity type that triggered the event |
| producer_entity_id | UUID | YES | — | Entity ID |
| payload | JSONB | YES | '{}' | Event payload |
| correlation_id | TEXT | YES | — | Links related events |
| status | TEXT | NO | 'emitted' | `emitted`, `delivered`, `failed`, `retrying` |
| created_at | TIMESTAMPTZ | NO | NOW() | — |

**Row Volume**: 500,000 (year 1) → 5,000,000 (year 3)  
**Owner**: admin-center_v2

### 2.41 reference_data_v2

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| type | TEXT | NO | — | Reference category |
| code | TEXT | NO | — | Machine-readable code |
| label | TEXT | NO | — | Human-readable label |
| description | TEXT | YES | — | Description |
| sort_order | INTEGER | YES | 0 | Display order |
| is_active | BOOLEAN | NO | TRUE | Active flag |
| created_at | TIMESTAMPTZ | NO | NOW() | — |

**Unique Constraint**: (type, code)  
**Owner**: admin-center_v2

**Reference Types**:

| Type | Values (code → label) |
|------|----------------------|
| `service_type` | `ac_repair` → "AC Repair", `ac_maintenance` → "AC Maintenance", `appliance_repair` → "Appliance Repair", `plumbing_repair` → "Plumbing Repair", `electrical_repair` → "Electrical Repair", `general_maintenance` → "General Maintenance", `installation` → "Installation" |
| `ticket_channel` | `email`, `chat`, `sms`, `phone`, `web`, `in_app` |
| `ticket_request_type` | `new_booking`, `reschedule`, `cancellation`, `complaint`, `follow_up`, `general_inquiry` |
| `dispute_resolution_type` | `full_refund`, `partial_refund`, `redo_service`, `discount_credit`, `no_action`, `escalate_legal` |
| `followup_type` | `post_service`, `maintenance_reminder`, `check_in`, `quote_followup`, `dispute_followup`, `win_back`, `renewal`, `nps_survey` |
| `inventory_category` | `parts`, `equipment`, `supplies`, `tools`, `safety` |
| `notification_type` | `ticket_created`, `ticket_status`, `appointment_reminder`, `dispatch_alert`, `health_alert`, `followup_due`, `report_ready` |
| `customer_type` | `residential`, `commercial`, `industrial`, `property_manager` |
| `skill_name` | `plumbing`, `hvac`, `electrical`, `appliance`, `general_maintenance`, `gas_fitting`, `refrigeration` |
| `evidence_type` | `photo`, `document`, `receipt`, `screenshot`, `audio`, `video`, `statement` |
| `feedback_source` | `survey`, `in_app`, `email`, `sms`, `phone` |
| `dispatch_type` | `urgent`, `scheduled`, `emergency` |
| `work_order_stage` | `assigned`, `travelling`, `on_site`, `working`, `completed` |
| `territory` | `north`, `south`, `east`, `west`, `central` |

---

## 3. Relationship Summary

### 3.1 One-to-One Relationships

| Left Table | Right Table | FK Direction | Description |
|------------|-------------|--------------|-------------|
| customers_v2 | accounts_v2 | accounts.customer_id | Each customer has exactly one account health record |

### 3.2 One-to-Many Relationships

| Parent | Child | FK | Description |
|--------|-------|-----|-------------|
| customers_v2 | customer_addresses_v2 | customer_id | Multiple addresses per customer |
| customers_v2 | tickets_v2 | customer_id | Multiple tickets per customer |
| customers_v2 | appointments_v2 | customer_id | Multiple appointments per customer |
| customers_v2 | accounts_v2 | customer_id | One account per customer |
| customers_v2 | feedback_v2 | customer_id | Multiple feedback entries per customer |
| technicians_v2 | technician_skills_v2 | technician_id | Multiple skills per technician |
| technicians_v2 | appointments_v2 | technician_id | Multiple appointments per technician |
| technicians_v2 | work_orders_v2 | technician_id | Multiple work orders per technician |
| technicians_v2 | dispatches_v2 | technician_id | Multiple dispatches per technician |
| tickets_v2 | ticket_messages_v2 | ticket_id | Thread of messages per ticket |
| tickets_v2 | ticket_attachments_v2 | ticket_id | Multiple attachments per ticket |
| tickets_v2 | dispatches_v2 | ticket_id | Multiple dispatches per ticket (rare) |
| appointments_v2 | appointment_reminders_v2 | appointment_id | Multiple reminders per appointment |
| appointments_v2 | work_orders_v2 | appointment_id | Work order per appointment |
| appointments_v2 | disputes_v2 | appointment_id | Disputes per appointment |
| work_orders_v2 | work_order_stages_v2 | work_order_id | Stage timeline per work order |
| disputes_v2 | dispute_evidence_v2 | dispute_id | Multiple evidence items per dispute |
| accounts_v2 | account_health_scans_v2 | account_id | Multiple scans per account |
| accounts_v2 | followups_v2 | account_id | Multiple followups per account |
| followups_v2 | followup_attempts_v2 | followup_id | Multiple attempts per followup |
| inventory_items_v2 | inventory_transactions_v2 | item_id | Multiple transactions per item |
| feedback_v2 | feedback_surveys_v2 | feedback_id | Multiple survey questions per feedback |
| tasks_v2 | task_assignments_v2 | task_id | Multiple assignment history entries |
| knowledge_categories_v2 | knowledge_categories_v2 | parent_id | Category hierarchy (self-referencing) |
| knowledge_categories_v2 | knowledge_articles_v2 | category_id | Multiple articles per category |
| users_v2 | user_sessions_v2 | user_id | Multiple sessions per user |
| user_roles_v2 | role_permissions_v2 | role_id | Multiple permissions per role |
| analytics_reports_v2 | analytics_schedules_v2 | report_id | Multiple schedules per report |
| notification_templates_v2 | notifications_v2 | template_id | Multiple notifications per template |

### 3.3 Many-to-Many Relationships
*(Resolved through join/link tables)*

| Left | Right | Junction | Description |
|------|-------|----------|-------------|
| technicians_v2 | skills | technician_skills_v2 | Technicians can have many skills |

### 3.4 Relationship Counts

| Table | Total FK Relationships | Parent FKs | Child FKs |
|-------|:---------------------:|:----------:|:---------:|
| customers_v2 | 9 | 0 | 9 |
| technicians_v2 | 5 | 0 | 5 |
| tickets_v2 | 3 | 1 (customer) | 4 |
| appointments_v2 | 5 | 2 (customer, technician) | 4 |
| work_orders_v2 | 5 | 3 (appointment, technician, customer) | 1 |
| dispatches_v2 | 5 | 3 (ticket, appointment, technician) | 0 |
| disputes_v2 | 5 | 3 (appointment, customer, ticket) | 1 |
| tasks_v2 | 1 | 0 | 1 |
| accounts_v2 | 2 | 1 (customer) | 3 |
| followups_v2 | 7 | 5 (account, customer, ticket, appointment, dispute) | 1 |
| notifications_v2 | 2 | 1 (template) | 0 |
| users_v2 | 2 | 1 (role) | 4 |

---

## 4. Lookup & Reference Tables

| Table | Type | Purpose |
|-------|------|---------|
| reference_data_v2 | **Lookup** | All extensible enum values (service types, ticket channels, etc.) |
| knowledge_categories_v2 | **Lookup** | Hierarchical article categories |
| technician_skills_v2 | **Join + Lookup** | Skill assignments with proficiency |
| customer_addresses_v2 | **Detail** | Customer address records |
| user_roles_v2 | **Lookup** | Role definitions |
| role_permissions_v2 | **Join** | Role-permission assignments |

---

## 5. History & Audit Tables

| Table | Type | Records | Retention |
|-------|------|---------|-----------|
| audit_log_v2 | **Audit** | All mutations | Permanent |
| events_v2 | **Event Log** | All domain events | 365 days |
| ticket_messages_v2 | **History** | Ticket message thread | Permanent |
| work_order_stages_v2 | **History** | Work order stage timeline | Permanent |
| account_health_scans_v2 | **History** | Health scan history | Permanent |
| followup_attempts_v2 | **History** | Followup contact attempts | Permanent |
| inventory_transactions_v2 | **History** | Inventory movement | Permanent |
| user_sessions_v2 | **History** | Active session tracking | 30 days post-expiry |

---

## 6. Index Definitions

### 6.1 customers_v2 Indexes

```sql
CREATE INDEX idx_customers_v2_status ON customers_v2(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_v2_email ON customers_v2(primary_email) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_v2_phone ON customers_v2(primary_phone) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_v2_name ON customers_v2(name);
CREATE INDEX idx_customers_v2_created_at ON customers_v2(created_at);
```

### 6.2 customer_addresses_v2 Indexes

```sql
CREATE INDEX idx_customer_addresses_v2_customer ON customer_addresses_v2(customer_id);
CREATE INDEX idx_customer_addresses_v2_primary ON customer_addresses_v2(customer_id, is_primary) WHERE is_primary = TRUE;
```

### 6.3 tickets_v2 Indexes

```sql
CREATE INDEX idx_tickets_v2_customer_id ON tickets_v2(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tickets_v2_status ON tickets_v2(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tickets_v2_assigned_to ON tickets_v2(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX idx_tickets_v2_urgency ON tickets_v2(urgency) WHERE deleted_at IS NULL;
CREATE INDEX idx_tickets_v2_status_created ON tickets_v2(status, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_tickets_v2_customer_status ON tickets_v2(customer_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tickets_v2_sla_deadline ON tickets_v2(sla_deadline) WHERE deleted_at IS NULL AND status NOT IN ('closed', 'sent');
CREATE INDEX idx_tickets_v2_channel ON tickets_v2(channel);
CREATE INDEX idx_tickets_v2_request_type ON tickets_v2(request_type);
CREATE INDEX idx_tickets_v2_created_at ON tickets_v2(created_at);
-- Full-text search index
CREATE INDEX idx_tickets_v2_search ON tickets_v2 USING gin(to_tsvector('english', subject || ' ' || message));
```

### 6.4 ticket_messages_v2 Indexes

```sql
CREATE INDEX idx_ticket_messages_v2_ticket ON ticket_messages_v2(ticket_id);
CREATE INDEX idx_ticket_messages_v2_created ON ticket_messages_v2(ticket_id, created_at ASC);
CREATE INDEX idx_ticket_messages_v2_author ON ticket_messages_v2(author_type, author_id);
```

### 6.5 appointments_v2 Indexes

```sql
CREATE INDEX idx_appointments_v2_customer ON appointments_v2(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_v2_technician ON appointments_v2(technician_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_v2_status ON appointments_v2(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_v2_date ON appointments_v2(scheduled_date);
CREATE INDEX idx_appointments_v2_status_date ON appointments_v2(status, scheduled_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_v2_technician_date ON appointments_v2(technician_id, scheduled_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_v2_service_type ON appointments_v2(service_type);
```

### 6.6 work_orders_v2 Indexes

```sql
CREATE INDEX idx_work_orders_v2_appointment ON work_orders_v2(appointment_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_work_orders_v2_technician ON work_orders_v2(technician_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_work_orders_v2_status ON work_orders_v2(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_work_orders_v2_technician_date ON work_orders_v2(technician_id, created_at) WHERE deleted_at IS NULL;
```

### 6.7 dispatches_v2 Indexes

```sql
CREATE INDEX idx_dispatches_v2_ticket ON dispatches_v2(ticket_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_dispatches_v2_technician ON dispatches_v2(technician_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_dispatches_v2_status ON dispatches_v2(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_dispatches_v2_created ON dispatches_v2(created_at DESC);
CREATE INDEX idx_dispatches_v2_active ON dispatches_v2(status, created_at DESC) WHERE status IN ('pending', 'acknowledged') AND deleted_at IS NULL;
```

### 6.8 disputes_v2 Indexes

```sql
CREATE INDEX idx_disputes_v2_appointment ON disputes_v2(appointment_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_disputes_v2_customer ON disputes_v2(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_disputes_v2_status ON disputes_v2(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_disputes_v2_confidence ON disputes_v2(confidence) WHERE status = 'recommendation_ready';
```

### 6.9 accounts_v2 Indexes

```sql
CREATE INDEX idx_accounts_v2_customer ON accounts_v2(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_accounts_v2_health ON accounts_v2(health) WHERE deleted_at IS NULL;
CREATE INDEX idx_accounts_v2_health_score ON accounts_v2(health_score) WHERE deleted_at IS NULL;
CREATE INDEX idx_accounts_v2_owner ON accounts_v2(account_owner) WHERE deleted_at IS NULL;
CREATE INDEX idx_accounts_v2_status ON accounts_v2(relationship_status) WHERE deleted_at IS NULL;
```

### 6.10 followups_v2 Indexes

```sql
CREATE INDEX idx_followups_v2_account ON followups_v2(account_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_followups_v2_customer ON followups_v2(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_followups_v2_status ON followups_v2(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_followups_v2_due_date ON followups_v2(due_date) WHERE deleted_at IS NULL AND status IN ('pending', 'in_progress');
CREATE INDEX idx_followups_v2_assigned ON followups_v2(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX idx_followups_v2_type ON followups_v2(type);
CREATE INDEX idx_followups_v2_overdue ON followups_v2(due_date, status) WHERE due_date < CURRENT_DATE AND status IN ('pending', 'in_progress') AND deleted_at IS NULL;
```

### 6.11 tasks_v2 Indexes

```sql
CREATE INDEX idx_tasks_v2_status ON tasks_v2(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_v2_assigned ON tasks_v2(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_v2_due_date ON tasks_v2(due_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_v2_priority ON tasks_v2(priority) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_v2_related ON tasks_v2(related_entity_type, related_entity_id);
```

### 6.12 notifications_v2 Indexes

```sql
CREATE INDEX idx_notifications_v2_recipient ON notifications_v2(recipient_type, recipient_id);
CREATE INDEX idx_notifications_v2_status ON notifications_v2(status);
CREATE INDEX idx_notifications_v2_created ON notifications_v2(created_at DESC);
CREATE INDEX idx_notifications_v2_type ON notifications_v2(notification_type);
CREATE INDEX idx_notifications_v2_pending ON notifications_v2(status, created_at ASC) WHERE status = 'pending';
```

### 6.13 Users & Admin Indexes

```sql
CREATE UNIQUE INDEX uniq_users_v2_email ON users_v2(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_v2_role ON users_v2(role_id);
CREATE INDEX idx_users_v2_status ON users_v2(status);
CREATE UNIQUE INDEX uniq_system_settings_v2_key ON system_settings_v2(key);
CREATE UNIQUE INDEX uniq_feature_flags_v2_app_feature ON feature_flags_v2(app, feature_name);
CREATE UNIQUE INDEX uniq_reference_data_v2_type_code ON reference_data_v2(type, code);
CREATE INDEX idx_reference_data_v2_type ON reference_data_v2(type);
CREATE INDEX idx_role_permissions_v2_role ON role_permissions_v2(role_id);
CREATE INDEX idx_user_sessions_v2_user ON user_sessions_v2(user_id);
CREATE INDEX idx_user_sessions_v2_active ON user_sessions_v2(is_active, expires_at);
```

### 6.14 Audit & Events Indexes

```sql
CREATE INDEX idx_audit_log_v2_entity ON audit_log_v2(entity_type, entity_id);
CREATE INDEX idx_audit_log_v2_entity_type ON audit_log_v2(entity_type, created_at DESC);
CREATE INDEX idx_audit_log_v2_actor ON audit_log_v2(actor_type, actor_id);
CREATE INDEX idx_audit_log_v2_action ON audit_log_v2(action);
CREATE INDEX idx_audit_log_v2_created_at ON audit_log_v2(created_at);
CREATE INDEX idx_events_v2_name ON events_v2(event_name, created_at DESC);
CREATE INDEX idx_events_v2_producer ON events_v2(producer_app);
CREATE INDEX idx_events_v2_correlation ON events_v2(correlation_id);
CREATE INDEX idx_events_v2_created ON events_v2(created_at);
CREATE INDEX idx_events_v2_status ON events_v2(status);
```

### 6.15 inventory_v2 Indexes

```sql
CREATE UNIQUE INDEX uniq_inventory_items_v2_sku ON inventory_items_v2(sku) WHERE deleted_at IS NULL;
CREATE INDEX idx_inventory_items_v2_category ON inventory_items_v2(category);
CREATE INDEX idx_inventory_items_v2_low_stock ON inventory_items_v2(quantity_on_hand) WHERE quantity_on_hand <= reorder_threshold AND deleted_at IS NULL;
CREATE INDEX idx_inventory_transactions_v2_item ON inventory_transactions_v2(item_id);
CREATE INDEX idx_inventory_transactions_v2_type ON inventory_transactions_v2(transaction_type);
CREATE INDEX idx_inventory_transactions_v2_ref ON inventory_transactions_v2(reference_type, reference_id);
```

### 6.16 knowledge_v2 Indexes

```sql
CREATE INDEX idx_knowledge_articles_v2_category ON knowledge_articles_v2(category_id);
CREATE INDEX idx_knowledge_articles_v2_status ON knowledge_articles_v2(status);
CREATE INDEX idx_knowledge_articles_v2_search ON knowledge_articles_v2 USING gin(to_tsvector('english', title || ' ' || summary || ' ' || content));
CREATE INDEX idx_knowledge_articles_v2_views ON knowledge_articles_v2(view_count DESC);
CREATE INDEX idx_knowledge_categories_v2_parent ON knowledge_categories_v2(parent_id);
```

### 6.17 feedback_v2 Indexes

```sql
CREATE INDEX idx_feedback_v2_customer ON feedback_v2(customer_id);
CREATE INDEX idx_feedback_v2_ticket ON feedback_v2(ticket_id);
CREATE INDEX idx_feedback_v2_rating ON feedback_v2(rating);
CREATE INDEX idx_feedback_v2_created ON feedback_v2(created_at DESC);
```

---

> **End of ENTITY_RELATIONSHIP_DIAGRAM.md**  
> Next document: STATE_MACHINE.md
