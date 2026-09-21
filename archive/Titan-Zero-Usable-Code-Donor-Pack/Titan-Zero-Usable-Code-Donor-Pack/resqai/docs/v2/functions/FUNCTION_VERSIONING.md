# ResQAI V2 — Function Versioning Strategy

> **Version:** 2.0.0  
> **Status:** FINAL  
> **Date:** 2026-06-30

---

## Table of Contents

1. [Version Scheme](#1-version-scheme)
2. [Function Lifecycle States](#2-function-lifecycle-states)
3. [Version Compatibility Matrix](#3-version-compatibility-matrix)
4. [Versioning Rules](#4-versioning-rules)
5. [Function Naming Convention](#5-function-naming-convention)
6. [Backward Compatibility Guarantees](#6-backward-compatibility-guarantees)

---

## 1. Version Scheme

### Semantic Versioning: `MAJOR.MINOR.PATCH`

| Component | Increment When | Example |
|-----------|---------------|---------|
| **MAJOR** | Breaking contract changes (input/output schema incompatibility, removed fields, changed behavior) | `2.0.0 → 3.0.0` |
| **MINOR** | Additive changes (new optional fields, new functions, backward-compatible additions) | `2.0.0 → 2.1.0` |
| **PATCH** | Bug fixes, performance improvements, documentation updates (no contract change) | `2.0.0 → 2.0.1` |

### Version Manifestation

The function version is declared in two places:

1. **Function definition metadata** (`function.json`):
   ```json
   {
     "version": "2.0.0",
     "api_version": "v2",
     "min_compatible_version": "2.0.0"
   }
   ```

2. **Workflow/App/Agent contract** (caller specifies required version range):
   ```json
   {
     "function": "update-ticket-record",
     "version_range": ">=2.0.0 <3.0.0"
   }
   ```

---

## 2. Function Lifecycle States

### State Transition Diagram

```
draft ──→ active ──→ deprecated ──→ retired
  ↑          │
  └──────────┘ (re-draft for iteration)
```

### 2.1 Draft State

| Property | Value |
|----------|-------|
| **Definition** | Function defined in catalog, not yet deployed or callable |
| **Duration** | Unlimited (pre-development) |
| **Callable** | No |
| **Discoverable** | Yes (in catalog) |
| **Testable** | Via unit tests only |
| **Trigger** | Draft → Active when function is deployed to production |

### 2.2 Active State

| Property | Value |
|----------|-------|
| **Definition** | Function deployed, tested, and callable by all authorized consumers |
| **Duration** | Indefinite (until deprecated) |
| **Callable** | Yes |
| **Discoverable** | Yes |
| **Version guarantees** | All versioning guarantees apply |
| **Trigger** | Active → Deprecated when a MAJOR version supersedes it |

### 2.3 Deprecated State

| Property | Value |
|----------|-------|
| **Definition** | Function superseded by newer version; existing callers warned |
| **Duration** | 6 months minimum after V2 GA |
| **Callable** | Yes (backward compatible) |
| **Discoverable** | Yes (marked with deprecated flag) |
| **Logging** | Every invocation logs deprecation warning |
| **Migration** | Callers notified to migrate to successor function |
| **Trigger** | Deprecated → Retired after deprecation period expires |

Deprecation warning emitted in logs:
```
[DEPRECATION] Function 'update_ticket_record' (v1) is deprecated.
Use 'update-ticket-record' (v2) instead. This function will be retired on {date}.
```

### 2.4 Retired State

| Property | Value |
|----------|-------|
| **Definition** | Function removed from platform; callers receive NOT_FOUND |
| **Duration** | Permanent |
| **Callable** | No |
| **Discoverable** | No |
| **Response** | `{ "status": "not_found", "error": { "code": "FUNCTION_RETIRED", "message": "..." } }` |
| **Trigger** | Final removal after deprecation period |

---

## 3. Version Compatibility Matrix

### 3.1 V1 → V2 Function Mapping

| Function (V1) | V1 Status | Function (V2) | V2 Status | Breaking Changes |
|---------------|:---------:|---------------|:---------:|------------------|
| create_ticket | ACTIVE | create-ticket | PLANNED | V2 uses tickets_v2; V1 uses tickets |
| update_ticket_v2 | ACTIVE | update-ticket | PLANNED | V2 uses tickets_v2; endpoint renamed |
| assign_ticket | ACTIVE | assign-ticket | PLANNED | V2 uses tickets_v2; adds skill-based routing |
| close_ticket | ACTIVE | close-ticket | PLANNED | V2 uses tickets_v2; notification via dispatch-notifications |
| escalate_ticket | ACTIVE | escalate-ticket | PLANNED | V2 uses tickets_v2; Discord alert via notification workflow |
| search_tickets | ACTIVE | search-tickets | PLANNED | V2 uses tickets_v2; adds full-text search |
| update_ticket_record | ACTIVE | update-ticket-record | PLANNED | V2 uses tickets_v2; schema aligned |
| check_ticket_urgency | ACTIVE | check-ticket-urgency | PLANNED | None (compatible) |
| collect_resolved_tickets | ACTIVE | collect-resolved-tickets | PLANNED | V2 uses tickets_v2; output enriched with SLA data |
| create_appointment | ACTIVE | create-appointment | PLANNED | V2 uses appointments_v2; schema aligned |
| assign_appointment_technician | ACTIVE | assign-appointment-technician | PLANNED | V2 uses appointments_v2; skill-match enforced |
| accept_appointment | ACTIVE | accept-appointment | PLANNED | V2 uses appointments_v2; adds GPS tracking |
| complete_appointment | ACTIVE | complete-appointment | PLANNED | V2 uses appointments_v2; adds parts tracking |
| cancel_appointment | ACTIVE | cancel-appointment | PLANNED | V2 uses appointments_v2; adds reason taxonomy |
| list_appointments | ACTIVE | list-appointments | PLANNED | V2 uses appointments_v2; pagination improvements |
| get_appointment | ACTIVE | get-appointment | PLANNED | V2 uses appointments_v2; includes full history |
| fetch_upcoming_appointments | ACTIVE | fetch-upcoming-appointments | PLANNED | V2 uses appointments_v2; adds timezone support |
| create_technician | ACTIVE | create-technician | PLANNED | V2 uses technicians_v2; schema enriched |
| update_technician | ACTIVE | update-technician | PLANNED | V2 uses technicians_v2; adds location tracking |
| list_technicians | ACTIVE | list-technicians | PLANNED | V2 uses technicians_v2; adds specialty filtering |
| update_technician_skills | ACTIVE | update-technician-skills | PLANNED | V2 uses technician_skills_v2; junction table |
| create_customer | ACTIVE | create-customer | PLANNED | V2 uses customers_v2; schema enriched |
| update_customer | ACTIVE | update-customer | PLANNED | V2 uses customers_v2; adds C360 fields |
| get_customer | ACTIVE | get-customer | PLANNED | V2 uses customers_v2; includes full profile |
| search_customers | ACTIVE | search-customers | PLANNED | V2 uses customers_v2; adds advanced search |
| create_followup | ACTIVE | create-followup | PLANNED | V2 uses followups_v2; adds attempt tracking |
| complete_followup | ACTIVE | complete-followup | PLANNED | V2 uses followups_v2; outcome tracking |
| list_followups | ACTIVE | list-followups | PLANNED | V2 uses followups_v2; pagination |
| update_account_health | ACTIVE | update-account-health | PLANNED | V2 uses accounts_v2; adds scan factors |
| update_account_health_status | ACTIVE | update-account-health-status | PLANNED | V2 uses accounts_v2; adds automation context |
| account_health_scan | ACTIVE | account-health-scan | PLANNED | V2 uses accounts_v2; output enriched |
| resolve_dispute | ACTIVE | resolve-dispute | PLANNED | V2 uses disputes_v2; adds resolution types |
| resolve_dispute_v2 | ACTIVE | resolve-dispute-v2 | ACTIVE | Stable; V2 table already |
| list_disputes | ACTIVE | list-disputes | PLANNED | V2 uses disputes_v2 |
| finalize_dispatch | ACTIVE | finalize-dispatch | PLANNED | V2 uses dispatches_v2; full dispatch lifecycle |
| create_work_order | ACTIVE | create-work-order | PLANNED | V2 uses work_orders_v2 |
| update_work_order | ACTIVE | update-work-order | PLANNED | V2 uses work_orders_v2; stage tracking |
| get_work_order | ACTIVE | get-work-order | PLANNED | V2 uses work_orders_v2 |
| list_work_orders | ACTIVE | list-work-orders | PLANNED | V2 uses work_orders_v2 |
| create_inventory_item | ACTIVE | create-inventory-item | PLANNED | V2 uses inventory_items_v2 |
| update_inventory_item | ACTIVE | update-inventory-item | PLANNED | V2 uses inventory_items_v2 |
| list_inventory | ACTIVE | list-inventory | PLANNED | V2 uses inventory_items_v2 |
| create_followup_tasks | ACTIVE | create-followup-tasks | PLANNED | V2 uses tasks_v2 |
| create_operations_tasks | ACTIVE | create-operations-tasks | PLANNED | V2 uses tasks_v2; enriched |
| finalize_slippage_review | ACTIVE | finalize-slippage-review | PLANNED | V2 uses followups_v2; structured |
| flag_slipping_followups | ACTIVE | flag-slipping-followups | PLANNED | V2 uses followups_v2 |
| dispatch_notifications | ACTIVE | dispatch-notifications | PLANNED | V2 uses notifications_v2; template-driven |
| dispatch_notification_v2 | ACTIVE | dispatch-notification-v2 | PLANNED | V2 uses notifications_v2 |
| send_bulk_notification | ACTIVE | send-bulk-notification | PLANNED | V2 uses notifications_v2 |
| track_notification | ACTIVE | track-notification | PLANNED | V2 uses notifications_v2 |
| analytics_aggregation | ACTIVE | analytics-aggregation | PLANNED | V2 uses events_v2 for source data |
| dashboard_metrics | ACTIVE | dashboard-metrics | PLANNED | V2 uses materialized views |
| create_report | ACTIVE | create-report | PLANNED | V2 uses analytics_reports_v2 |
| schedule_report | ACTIVE | schedule-report | PLANNED | V2 uses analytics_schedules_v2 |
| execute_report | ACTIVE | execute-report | PLANNED | V2 uses analytics_reports_v2 |
| create_user | ACTIVE | create-user | PLANNED | V2 uses users_v2; auth linking |
| update_user | ACTIVE | update-user | PLANNED | V2 uses users_v2 |
| list_users | ACTIVE | list-users | PLANNED | V2 uses users_v2 |
| create_role | ACTIVE | create-role | PLANNED | V2 uses user_roles_v2 |
| assign_user_role | ACTIVE | assign-user-role | PLANNED | V2 uses user_roles_v2 |
| manage_permission | ACTIVE | manage-permission | PLANNED | V2 uses role_permissions_v2 |
| list_permissions | ACTIVE | list-permissions | PLANNED | V2 uses role_permissions_v2 |
| record_audit | ACTIVE | record-audit | PLANNED | V2 uses audit_log_v2 |
| query_audit_log | ACTIVE | query-audit-log | PLANNED | V2 uses audit_log_v2 |
| authenticate_user | ACTIVE | authenticate-user | PLANNED | V2 uses user_sessions_v2 |
| validate_session | ACTIVE | validate-session | PLANNED | V2 uses user_sessions_v2 |

### 3.2 V2-Only Functions (New in V2 Catalog)

| Function | V2 Status | First Appears In |
|----------|:---------:|-----------------|
| validate-ticket-input | PLANNED | V2 catalog |
| classify-ticket-sla-tier | PLANNED | V2 catalog |
| check-sla-deadline | PLANNED | V2 catalog |
| batch-sla-check | PLANNED | V2 catalog |
| schedule-appointment-reminders | PLANNED | V2 catalog |
| check-reminder-window | PLANNED | V2 catalog |
| calculate-dispatch-priority | PLANNED | V2 catalog |
| update-work-order-stage | PLANNED | V2 catalog |
| complete-work-order | PLANNED | V2 catalog |
| generate-account-score | PLANNED | V2 catalog |
| process-feedback-survey | PLANNED | V2 catalog |
| analyze-feedback-sentiment | PLANNED | V2 catalog |
| extract-knowledge-gap | PLANNED | V2 catalog |
| search-knowledge-articles | PLANNED | V2 catalog |
| suggest-knowledge-article | PLANNED | V2 catalog |
| render-notification-template | PLANNED | V2 catalog |
| process-notification-delivery | PLANNED | V2 catalog |
| generate-standup-report | PLANNED | V2 catalog |
| generate-report-data | PLANNED | V2 catalog |
| send-report | PLANNED | V2 catalog |
| sync-events-analytics | PLANNED | V2 catalog |
| calculate-metric-trend | PLANNED | V2 catalog |
| batch-metric-aggregation | PLANNED | V2 catalog |
| provision-user | PLANNED | V2 catalog |
| deactivate-user | PLANNED | V2 catalog |
| validate-config-change | PLANNED | V2 catalog |
| apply-config-change | PLANNED | V2 catalog |
| log-audit-event | PLANNED | V2 catalog |
| check-inventory-level | PLANNED | V2 catalog |
| reorder-inventory | PLANNED | V2 catalog |
| record-inventory-transaction | PLANNED | V2 catalog |
| validate-permissions | PLANNED | V2 catalog |
| generate-api-token | PLANNED | V2 catalog |
| rotate-credentials | PLANNED | V2 catalog |
| verify-workflow-health | PLANNED | V2 catalog |
| recover-workflow-instance | PLANNED | V2 catalog |
| reset-circuit-breaker | PLANNED | V2 catalog |
| evaluate-quality-score | PLANNED | V2 catalog |
| flag-quality-violation | PLANNED | V2 catalog |

---

## 4. Versioning Rules

### 4.1 Functions with `_v2` Suffix Are the Target

- V2 deployed functions (e.g., `resolve_dispute_v2`, `update_ticket_v2`, `dispatch_notification_v2`) use the `_v2` suffix on the V1 tables
- These V2 functions will be renamed to kebab-case (`resolve-dispute-v2`, `update-ticket-v2`, `dispatch-notification-v2`) in the final V2 catalog
- During transition, both naming conventions are supported

### 4.2 V1 Functions Remain Active During Transition

- All 66 deployed V1 functions continue operating unchanged
- V1 functions continue reading/writing V1 tables (`tickets`, `appointments`, etc.)
- V2 functions read/write V2 tables (`tickets_v2`, `appointments_v2`, etc.)
- Migration scripts handle data synchronization between V1 and V2 tables

### 4.3 All New Development Targets V2

| Development Type | Target |
|-----------------|--------|
| New functions | V2 kebab-case naming, V2 tables |
| Bug fixes on V1 | Apply to V1 function, port fix to V2 counterpart |
| Performance improvements | V2 functions with V2 tables |
| Schema changes | V2 tables only (V1 schema frozen) |

### 4.4 V1 Deprecation Timeline

| Milestone | Timeline | Action |
|-----------|:--------:|--------|
| V2 GA | Month 0 | All V2 functions ready for production |
| V1 → V2 Migration | Month 0-6 | Workflows/apps/agents migrate to V2 |
| V1 Deprecation Notice | Month 6 | V1 functions marked deprecated; warnings logged |
| V1 Final Retirement | Month 12 | V1 functions retired; NOT_FOUND returned |

---

## 5. Function Naming Convention

### 5.1 Convention Table

| Version | Convention | Example | Used In |
|---------|-----------|---------|---------|
| **V1 (deployed)** | `snake_case` | `create_ticket`, `update_ticket_record` | Python handler files, deployed function names |
| **V2 (catalog)** | `kebab-case` | `create-ticket`, `update-ticket-record` | V2 catalog, workflow definitions, event contracts |

### 5.2 Rationale

- **snake_case** matches Python naming conventions (the implementation language)
- **kebab-case** aligns with Lemma platform naming for workflows and events
- V2 functions use kebab-case to ensure consistency across all Lemma resource types
- V1 functions retain snake_case for backward compatibility

### 5.3 File Structure

```
V1 (snake_case):                   V2 (kebab-case):
functions/                         functions/
  create_ticket/                     create-ticket/
    src/handler.py                     src/handler.py
    function.json                      function.json
```

### 5.4 Cross-Reference

```yaml
# V2 catalog entry
- name: update-ticket-record
  v1_name: update_ticket_record
  status: planned
  migration: v2 uses tickets_v2; v1 uses tickets
```

---

## 6. Backward Compatibility Guarantees

### 6.1 V1 Endpoint Availability

- All V1 endpoints remain available at their existing URLs
- No V1 endpoint will be removed before the retirement date
- V1 endpoints continue to use V1 tables; V1 data integrity is maintained

### 6.2 Input/Output Schema Stability

| Guarantee | Within Major Version |
|-----------|:-------------------:|
| Required input fields remain required | Yes |
| Optional input fields remain optional | Yes |
| Output field names remain unchanged | Yes |
| New optional fields may be added | Yes (MINOR) |
| New output fields may be added | Yes (MINOR) |
| Field types remain unchanged | Yes |
| Error codes remain unchanged | Yes |
| **Breaking schema changes** | **MAJOR version only** |

### 6.3 Deprecation Warning Mechanism

Deprecated functions emit warnings at three levels:

1. **Application Log** (each invocation):
   ```
   [DEPRECATION] Function 'update_ticket_record' is deprecated
   ```

2. **Response Header**:
   ```
   X-Deprecation: true
   X-Deprecation-Replacement: update-ticket-record
   X-Deprecation-Retirement-Date: 2027-06-30
   ```

3. **Response Body** (when `X-Debug: true` header present):
   ```json
   {
     "status": "success",
     "data": { ... },
     "_deprecation": {
       "function": "update_ticket_record",
       "replacement": "update-ticket-record",
       "retirement_date": "2027-06-30",
       "migration_url": "/docs/v2/migration/update-ticket-record"
     }
   }
   ```

### 6.4 CHANGELOG Documentation

All breaking changes are documented in `CHANGELOG.md`:

```markdown
## [2.0.0] - 2026-06-30

### Breaking Changes
- `update_ticket_record` (v1) → `update-ticket-record` (v2)
  - Input: `ticket_id` → `id` (renamed)
  - Input: Removed `approved_to_send` (moved to `status` enum)
  - Output: Added `audit_id` field
  - Tables: V1 `tickets` → V2 `tickets_v2`

### Migration
- Update caller contracts to reference `update-ticket-record`
- Rename `ticket_id` to `id` in input payloads
- See migration guide at `/docs/v2/migration/update-ticket-record.md`
```

---

> **Document Maintainers:** Architecture Team  
> **Review Cycle:** Quarterly  
> **Last Updated:** June 2026
