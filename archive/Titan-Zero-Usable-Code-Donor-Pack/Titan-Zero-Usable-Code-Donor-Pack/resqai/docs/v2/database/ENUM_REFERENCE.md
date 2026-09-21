# ResQAI V2 — Enum & Lookup Value Reference

> **Version:** 2.0  
> **Enum Types Documented:** 26  
> **Storage Approaches:** TEXT with CHECK constraints, reference_data_v2 lookup table  
> **Last Updated:** June 2026

---

## 1. Philosophy on Enum Storage

ResQAI V2 uses a **dual approach** for enum-like data:

### Approach A: TEXT with CHECK Constraints (Fixed Enums)

Used when the set of values is **small, stable, and unlikely to change** without a code deployment.

```sql
ticket_status TEXT NOT NULL DEFAULT 'new'
CHECK (ticket_status IN (
    'new', 'classified', 'drafted', 'approved_to_send', 'sent', 'escalated', 'closed'
))
```

**Pros:** Enforced at the database level, no JOINs, no indirection.  
**Cons:** Requires migration to add/remove values.

**Used for:** Status lifecycles, priority levels, channels, types — where the domain definition is stable.

### Approach B: `reference_data_v2` Lookup Table (Extensible Enums)

Used when the set of values is **large, user-extensible, or expected to grow** without code changes.

```sql
-- Lookup
SELECT value, label FROM reference_data_v2 WHERE category = 'skill' AND is_active = true;
```

**Pros:** No migration needed for new values; metadata (sort_order, description) built in.  
**Cons:** Requires JOIN; no database-level constraint (application enforces validity). This is mitigated by the fact that `reference_data_v2` uses a `(category, value)` unique constraint, so only valid values can be inserted.

**Used for:** Skills, industries, tags, regions, custom categories — where admin users add options dynamically.

---

## 2. Complete Enum Types

---

### `ticket_status`

**Storage:** TEXT with CHECK constraint  
**Default:** `'new'`  
**Used by:** `tickets_v2`

| Value | Description | Progression |
|-------|-------------|-------------|
| `new` | Ticket created, not yet reviewed | Initial state |
| `classified` | Categorized and tagged, pending draft response | After triage |
| `drafted` | Response drafted, pending approval | After agent drafts |
| `approved_to_send` | Draft approved, ready to send to customer | After manager approval |
| `sent` | Response sent, awaiting customer reply | Active communication |
| `escalated` | Escalated to senior agent or manager | Exception handling |
| `closed` | Ticket resolved and closed | Terminal state |

**Lifecycle:**
```
new → classified → drafted → approved_to_send → sent → closed
                                                      ↑
                                   (any state) → escalated → closed
```

---

### `appointment_status`

**Storage:** TEXT with CHECK constraint  
**Default:** `'scheduled'`  
**Used by:** `appointments_v2`

| Value | Description | Progression |
|-------|-------------|-------------|
| `scheduled` | Appointment created with time slot | Initial state |
| `confirmed` | Customer confirmed the appointment | After confirmation |
| `in_progress` | Technician has arrived and started work | On-site active |
| `completed` | Work finished, technician departed | Success terminal |
| `needs_followup` | Issue not fully resolved, requires another visit | Follow-up needed |
| `cancelled` | Appointment cancelled by either party | Cancellation terminal |
| `on_hold` | Appointment paused (awaiting parts, info) | Temporary hold |

**Lifecycle:**
```
scheduled → confirmed → in_progress → completed
     ↓           ↓           ↓
  cancelled   cancelled  needs_followup (loops back to scheduled)
     ↓
  on_hold → confirmed → ...
```

---

### `work_order_status`

**Storage:** TEXT with CHECK constraint  
**Default:** `'created'`  
**Used by:** `work_orders_v2`

| Value | Description | Progression |
|-------|-------------|-------------|
| `created` | Work order generated from ticket/appointment | Initial state |
| `assigned` | Technician assigned to the work order | After dispatch |
| `travelling` | Technician en route to site | GPS-verified |
| `on_site` | Technician arrived at customer location | Arrival logged |
| `working` | Technician actively performing work | Work in progress |
| `completed` | Work finished and signed off | Success terminal |
| `needs_followup` | Additional work required | Re-open cycle |

**Lifecycle:**
```
created → assigned → travelling → on_site → working → completed
                                              ↓
                                       needs_followup → assigned → ...
```

---

### `dispatch_status`

**Storage:** TEXT with CHECK constraint  
**Default:** `'pending'`  
**Used by:** `dispatches_v2`

| Value | Description | Progression |
|-------|-------------|-------------|
| `pending` | Dispatch created, not yet sent to technician | Initial state |
| `sent` | Dispatch notification sent to technician | Notification sent |
| `acknowledged` | Technician acknowledged the dispatch | Tech accepted |
| `declined` | Technician declined the dispatch | Rejection terminal |
| `en_route` | Technician travelling to site | GPS-triggered |
| `on_site` | Technician arrived at location | Arrival logged |
| `completed` | Job done, dispatch closed | Success terminal |
| `cancelled` | Dispatch cancelled (re-assigned or voided) | Cancellation terminal |

**Lifecycle:**
```
pending → sent → acknowledged → en_route → on_site → completed
                   ↓
              declined (terminal)
                   ↓
              cancelled (from any state)
```

---

### `dispute_status`

**Storage:** TEXT with CHECK constraint  
**Default:** `'open'`  
**Used by:** `disputes_v2`

| Value | Description | Progression |
|-------|-------------|-------------|
| `open` | Dispute raised, awaiting review | Initial state |
| `analyzing` | Under investigation by dispute team | Active review |
| `recommendation_ready` | Analysis complete, recommendation made | Awaiting decision |
| `escalated` | Escalated to senior management | Higher review |
| `approved` | Dispute approved (customer favorable) | Resolution path |
| `rejected` | Dispute rejected (company favorable) | Resolution path |
| `closed` | Dispute resolved, final state | Terminal state |

**Lifecycle:**
```
open → analyzing → recommendation_ready → approved → closed
                                   ↓
                              escalated → analyzing → ...
                                   ↓
                              rejected → closed
```

---

### `followup_status`

**Storage:** TEXT with CHECK constraint  
**Default:** `'pending'`  
**Used by:** `followups_v2`

| Value | Description | Progression |
|-------|-------------|-------------|
| `pending` | Follow-up scheduled, not yet started | Initial state |
| `in_progress` | Currently being worked on | Active |
| `completed` | Follow-up successfully completed | Success terminal |
| `missed` | Missed scheduled follow-up (no-show) | Failure terminal |
| `cancelled` | Follow-up cancelled (no longer needed) | Cancellation terminal |

**Lifecycle:**
```
pending → in_progress → completed
              ↓
           missed
              ↓
           cancelled (from pending)
```

---

### `task_status`

**Storage:** TEXT with CHECK constraint  
**Default:** `'open'`  
**Used by:** `tasks_v2`

| Value | Description | Progression |
|-------|-------------|-------------|
| `open` | Task created, not yet started | Initial state |
| `in_progress` | Actively being worked on | Active |
| `blocked` | Cannot proceed due to dependency | Awaiting unblock |
| `done` | Successfully completed | Success terminal |
| `overdue` | Past due date without completion | Escalation state |
| `cancelled` | No longer needed | Failure terminal |

**Lifecycle:**
```
open → in_progress → done
  ↓         ↓
  blocked → in_progress (when unblocked)
  ↓
  overdue (set automatically when due_at passes)
  ↓
  cancelled (from any non-terminal state)
```

---

### `notification_status`

**Storage:** TEXT with CHECK constraint  
**Default:** `'pending'`  
**Used by:** `notifications_v2`

| Value | Description | Progression |
|-------|-------------|-------------|
| `pending` | Queued for delivery | Initial state |
| `sent` | Transmitted to provider (email/SMS/push) | In-transit |
| `delivered` | Confirmed delivered to device/inbox | Success |
| `failed` | Delivery failed (bounce, error) | Failure terminal |
| `read` | User opened/viewed the notification | Read terminal |

**Lifecycle:**
```
pending → sent → delivered → read
                   ↓
              failed → retry (max 3 attempts)
```

---

### `technician_availability`

**Storage:** TEXT with CHECK constraint  
**Default:** `'available'`  
**Used by:** `technicians_v2`

| Value | Description |
|-------|-------------|
| `available` | Ready for new assignments |
| `busy` | Currently working on a job |
| `on_break` | On scheduled break |
| `off_shift` | Outside scheduled work hours |
| `on_leave` | On vacation, sick leave, or PTO |

---

### `customer_status`

**Storage:** TEXT with CHECK constraint  
**Default:** `'active'`  
**Used by:** `customers_v2`

| Value | Description |
|-------|-------------|
| `active` | Customer in good standing, receiving service |
| `inactive` | Not currently receiving service but may return |
| `at_risk` | Showing signs of potential churn |
| `dormant` | No activity for extended period (>6 months) |
| `churned` | Customer has left permanently |

---

### `user_status`

**Storage:** TEXT with CHECK constraint  
**Default:** `'active'`  
**Used by:** `users_v2`

| Value | Description |
|-------|-------------|
| `active` | Account is fully operational |
| `inactive` | Account exists but user hasn't activated or has been disabled voluntarily |
| `suspended` | Temporarily suspended due to policy violation |
| `locked` | Locked due to too many failed login attempts |

---

### `account_health`

**Storage:** TEXT with CHECK constraint  
**Default:** `'healthy'`  
**Used by:** `accounts_v2`, `account_health_scans_v2`

| Value | Description | Score Range |
|-------|-------------|-------------|
| `healthy` | All metrics positive | 80-100 |
| `watch` | Minor concerns detected | 60-79 |
| `slipping` | Significant decline in key metrics | 30-59 |
| `critical` | Severe issues requiring immediate action | 0-29 |

---

### `relationship_status`

**Storage:** TEXT with CHECK constraint  
**Default:** `'new'`  
**Used by:** `customers_v2`

| Value | Description | Progression |
|-------|-------------|-------------|
| `new` | First interaction, recently acquired | Initial |
| `active` | Regular engagements, positive relationship | Active |
| `in_dispute` | Active dispute in progress | Exception |
| `at_risk` | Signs of dissatisfaction or reduced engagement | Warning |
| `service_due` | Service renewal or maintenance due | Action needed |
| `dormant` | No engagement for extended period | Lapsing |
| `churned` | Customer departed | Terminal |
| `won_back` | Previously churned, now re-engaged | Recovery |

**Lifecycle:**
```
new → active → at_risk → dormant → churned → won_back → active
         ↓         ↓
    in_dispute → active or churned
         ↓
    service_due → active or at_risk
```

---

### `article_status`

**Storage:** TEXT with CHECK constraint  
**Default:** `'draft'`  
**Used by:** `knowledge_articles_v2`

| Value | Description |
|-------|-------------|
| `draft` | Being written, not visible to readers |
| `published` | Live and visible to target audience |
| `archived` | No longer current, retained for reference |

---

### `urgency`

**Storage:** TEXT with CHECK constraint  
**Default:** `'normal'`  
**Used by:** `tickets_v2`

| Value | Description |
|-------|-------------|
| `low` | No time pressure, informational |
| `normal` | Standard response time expected |
| `high` | Significant impact, expedited response |
| `urgent` | Critical impact, immediate attention required |

---

### `priority`

**Storage:** TEXT with CHECK constraint  
**Default:** `'normal'`  
**Used by:** `tickets_v2`, `tasks_v2`

| Value | Description | Typical SLA |
|-------|-------------|-------------|
| `low` | No urgency, best-effort timeline | 7+ days |
| `normal` | Standard priority, regular workflow | 48 hours |
| `high` | Needs attention ahead of normal items | 24 hours |
| `urgent` | Time-sensitive, immediate action | 4 hours |
| `critical` | System-down or major outage | 1 hour |

---

### `channel`

**Storage:** TEXT with CHECK constraint  
**Used by:** `tickets_v2`, `appointment_reminders_v2.channel`, `notifications_v2.channel`

| Value | Description |
|-------|-------------|
| `email` | Electronic mail communication |
| `chat` | Live chat or messaging platform |
| `sms` | Short message service (text) |
| `phone` | Telephone voice call |
| `web` | Web form or web portal submission |
| `portal` | Customer portal self-service |

---

### `request_type`

**Storage:** TEXT with CHECK constraint  
**Used by:** `tickets_v2`

| Value | Description |
|-------|-------------|
| `new_booking` | Request for a new service appointment |
| `reschedule` | Request to change existing appointment time |
| `cancellation` | Request to cancel an existing booking |
| `complaint` | Formal complaint about service or product |
| `follow_up` | Following up on previous interaction |
| `general_inquiry` | General question or information request |
| `billing` | Billing or payment related inquiry |

---

### `proficiency`

**Storage:** TEXT with CHECK constraint  
**Default:** `'intermediate'`  
**Used by:** `technician_skills_v2`

| Value | Description |
|-------|-------------|
| `beginner` | Basic knowledge, requires supervision |
| `intermediate` | Competent, can work independently |
| `advanced` | Deep expertise, can train others |
| `expert` | Subject matter expert, leads in this area |

---

### `dispatch_type`

**Storage:** TEXT with CHECK constraint  
**Default:** `'scheduled'`  
**Used by:** `dispatches_v2`

| Value | Description |
|-------|-------------|
| `urgent` | High-priority, immediate dispatch needed |
| `scheduled` | Planned dispatch at a predetermined time |
| `emergency` | Life-safety or critical infrastructure emergency |

---

### `evidence_type`

**Storage:** TEXT with CHECK constraint  
**Used by:** `dispute_evidence_v2`

| Value | Description |
|-------|-------------|
| `photo` | Photographic image evidence |
| `document` | PDF, Word, or text document |
| `audio` | Audio recording or voicemail |
| `video` | Video recording or surveillance footage |
| `statement` | Written statement from involved party |
| `receipt` | Purchase or service receipt |

---

### `inventory_category`

**Storage:** TEXT with CHECK constraint  
**Used by:** `inventory_items_v2`

| Value | Description |
|-------|-------------|
| `parts` | Replacement or repair components |
| `supplies` | Consumable materials |
| `equipment` | Durable tools and machinery |
| `tools` | Hand tools and power tools |

---

### `feedback_source`

**Storage:** TEXT with CHECK constraint  
**Used by:** `feedback_v2`

| Value | Description |
|-------|-------------|
| `post_service` | Feedback collected immediately after service |
| `followup` | Feedback collected during follow-up contact |
| `survey` | Feedback via dedicated survey campaign |
| `portal` | Feedback submitted through customer portal |
| `email` | Feedback received via email reply |

---

### `transaction_type`

**Storage:** TEXT with CHECK constraint  
**Used by:** `inventory_transactions_v2`

| Value | Description | Quantity Sign |
|-------|-------------|---------------|
| `received` | Stock received from supplier | Positive (+) |
| `issued` | Stock issued to technician or work order | Negative (-) |
| `returned` | Stock returned from technician/customer | Positive (+) |
| `transferred` | Stock transferred between locations | +/- |
| `adjusted` | Manual inventory adjustment (count correction) | +/- |

---

### `role_name`

**Storage:** TEXT with CHECK constraint  
**Stored in:** `user_roles_v2.role_name` (system roles are seeded, custom roles can be added)  
**Used by:** `user_roles_v2`

| Value | Description | Typical Access |
|-------|-------------|----------------|
| `super_admin` | Unrestricted system access, bypasses all RLS | Full system-wide CRUD |
| `admin` | Full access within the organization | All tables, all actions |
| `manager` | Department/team oversight | Tenant-scoped, can manage team |
| `agent` | Customer support agent | Ticket and customer access |
| `technician` | Field service technician | Work orders, appointments, inventory |
| `dispatcher` | Scheduling and dispatch operator | Scheduling, dispatch, technician view |
| `customer` | End customer portal user | Own tickets, own profile, own appointments |
| `viewer` | Read-only access for reporting | All tables SELECT only |

---

### `reminder_type`

**Storage:** TEXT with CHECK constraint  
**Used by:** `appointment_reminders_v2`

| Value | Description | Typical Timing |
|-------|-------------|----------------|
| `appointment_24h` | 24-hour reminder before appointment | 24 hours before |
| `appointment_2h` | 2-hour reminder before appointment | 2 hours before |
| `dispatch_alert` | Alert when technician is dispatched | On dispatch |
| `followup_due` | Reminder that a follow-up is due | At due time |

---

### `reminder_status`

**Storage:** TEXT with CHECK constraint  
**Default:** `'pending'`  
**Used by:** `appointment_reminders_v2`

| Value | Description |
|-------|-------------|
| `pending` | Reminder queued for delivery |
| `sent` | Reminder transmitted to provider |
| `delivered` | Confirmed delivered to recipient |
| `failed` | Delivery failed |

---

### `frequency`

**Storage:** TEXT with CHECK constraint  
**Used by:** `analytics_schedules_v2`

| Value | Description | Cron Equivalent |
|-------|-------------|-----------------|
| `daily` | Once every day | `0 0 * * *` |
| `weekly` | Once every week | `0 0 * * 0` |
| `biweekly` | Once every two weeks | `0 0 * * 0` (every other) |
| `monthly` | Once every month | `0 0 1 * *` |
| `quarterly` | Once every quarter (3 months) | `0 0 1 */3 *` |
| `yearly` | Once every year | `0 0 1 1 *` |

---

### `action_type`

**Storage:** TEXT with CHECK constraint  
**Used by:** `role_permissions_v2`, `audit_log_v2`

| Value | Description | Applied To |
|-------|-------------|------------|
| `create` | Create new records | INSERT operations |
| `read` | View/query records | SELECT operations |
| `update` | Modify existing records | UPDATE operations |
| `delete` | Remove records (soft or hard) | DELETE operations |
| `manage` | Admin-level operations (grant, configure, etc.) | Special operations |

---

## 3. `reference_data_v2` — Extensible Categories

The following categories are managed via `reference_data_v2` rather than CHECK constraints because they are expected to grow or be customized per tenant.

| Category | Example Values | Used By |
|----------|---------------|---------|
| `skill` | plumbing, electrical, hvac, carpentry, painting, roofing, landscaping, general_repair, appliance, locksmith | `technician_skills_v2.skill_id` |
| `industry` | healthcare, hospitality, education, retail, manufacturing, technology, finance, realestate, government, nonprofit | `accounts_v2.industry` |
| `region` | northeast, southeast, midwest, southwest, west, northwest | `technicians_v2.service_area` |
| `tag` | vip, warranty, insurance, scheduled_maintenance, emergency_contact | `tickets_v2.tags`, `tasks_v2.tags` |
| `ticket_category` | hardware, software, network, billing, account, service_outage | Application-level categorization |
| `feedback_category` | service_quality, timeliness, professionalism, communication, value | `feedback_v2.categories` |
| `cancellation_reason` | customer_request, no_access, wrong_address, duplicate_booking, parts_unavailable, weather | `appointments_v2.cancellation_reason` |
| `task_type` | inspection, maintenance, audit, review, setup, cleanup, training | `tasks_v2.task_type` |
| `notification_type` | appointment_reminder, dispatch_alert, followup_due, ticket_update, billing_notice, system_alert | `notifications_v2.notification_type` |
| `template_name` | appointment_confirmation, appointment_reminder_24h, dispatch_alert, welcome_email, password_reset | `notification_templates_v2.template_name` |
| `connector_type` | stripe, quickbooks, hubspot, slack, zapier, mailchimp, twilio, sendgrid, aws_sns | `connectors_v2.connector_type` |
| `report_type` | ticket_summary, technician_performance, customer_health, financial_report, sla_compliance, inventory_status | `analytics_reports_v2.report_type` |
| `language` | en, es, fr, de, pt, zh, ja, ar | `notification_templates_v2.locale` |

---

## 4. Enum Usage Matrix

| Enum | Storage | Tables Using It | Columns |
|------|---------|----------------|---------|
| `ticket_status` | CHECK | tickets_v2 | ticket_status |
| `appointment_status` | CHECK | appointments_v2 | appointment_status |
| `work_order_status` | CHECK | work_orders_v2 | work_order_status |
| `dispatch_status` | CHECK | dispatches_v2 | dispatch_status |
| `dispute_status` | CHECK | disputes_v2 | dispute_status |
| `followup_status` | CHECK | followups_v2 | followup_status |
| `task_status` | CHECK | tasks_v2 | task_status |
| `notification_status` | CHECK | notifications_v2, appointment_reminders_v2 | notification_status, reminder_status |
| `technician_availability` | CHECK | technicians_v2 | technician_availability |
| `customer_status` | CHECK | customers_v2 | customer_status |
| `user_status` | CHECK | users_v2 | user_status |
| `account_health` | CHECK | accounts_v2, account_health_scans_v2 | account_health |
| `relationship_status` | CHECK | customers_v2 | relationship_status |
| `article_status` | CHECK | knowledge_articles_v2 | article_status |
| `urgency` | CHECK | tickets_v2 | urgency |
| `priority` | CHECK | tickets_v2, tasks_v2 | priority |
| `channel` | CHECK | tickets_v2, notifications_v2 | channel |
| `request_type` | CHECK | tickets_v2 | request_type |
| `proficiency` | CHECK | technician_skills_v2 | proficiency |
| `dispatch_type` | CHECK | dispatches_v2 | dispatch_type |
| `evidence_type` | CHECK | dispute_evidence_v2 | evidence_type |
| `inventory_category` | CHECK | inventory_items_v2 | inventory_category |
| `feedback_source` | CHECK | feedback_v2 | feedback_source |
| `transaction_type` | CHECK | inventory_transactions_v2 | transaction_type |
| `role_name` | CHECK | user_roles_v2 | role_name |
| `reminder_type` | CHECK | appointment_reminders_v2 | reminder_type |
| `reminder_status` | CHECK | appointment_reminders_v2 | reminder_status |
| `frequency` | CHECK | analytics_schedules_v2 | frequency |
| `action_type` | CHECK | role_permissions_v2, audit_log_v2 | action_type |

---

## 5. Seeding `reference_data_v2` — Initial Values

```sql
-- Core skills
INSERT INTO reference_data_v2 (category, value, label, sort_order) VALUES
    ('skill', 'plumbing', 'Plumbing', 1),
    ('skill', 'electrical', 'Electrical', 2),
    ('skill', 'hvac', 'HVAC', 3),
    ('skill', 'carpentry', 'Carpentry', 4),
    ('skill', 'painting', 'Painting', 5),
    ('skill', 'roofing', 'Roofing', 6),
    ('skill', 'landscaping', 'Landscaping', 7),
    ('skill', 'general_repair', 'General Repair', 8),
    ('skill', 'appliance', 'Appliance Repair', 9),
    ('skill', 'locksmith', 'Locksmith', 10);

-- Industries
INSERT INTO reference_data_v2 (category, value, label, sort_order) VALUES
    ('industry', 'healthcare', 'Healthcare', 1),
    ('industry', 'hospitality', 'Hospitality', 2),
    ('industry', 'education', 'Education', 3),
    ('industry', 'retail', 'Retail', 4),
    ('industry', 'manufacturing', 'Manufacturing', 5),
    ('industry', 'technology', 'Technology', 6),
    ('industry', 'finance', 'Finance', 7),
    ('industry', 'realestate', 'Real Estate', 8),
    ('industry', 'government', 'Government', 9),
    ('industry', 'nonprofit', 'Non-Profit', 10);

-- Notification types
INSERT INTO reference_data_v2 (category, value, label, sort_order) VALUES
    ('notification_type', 'appointment_reminder', 'Appointment Reminder', 1),
    ('notification_type', 'dispatch_alert', 'Dispatch Alert', 2),
    ('notification_type', 'followup_due', 'Follow-Up Due', 3),
    ('notification_type', 'ticket_update', 'Ticket Update', 4),
    ('notification_type', 'billing_notice', 'Billing Notice', 5),
    ('notification_type', 'system_alert', 'System Alert', 6);

-- Connector types
INSERT INTO reference_data_v2 (category, value, label, sort_order) VALUES
    ('connector_type', 'stripe', 'Stripe Payments', 1),
    ('connector_type', 'quickbooks', 'QuickBooks', 2),
    ('connector_type', 'hubspot', 'HubSpot CRM', 3),
    ('connector_type', 'slack', 'Slack', 4),
    ('connector_type', 'zapier', 'Zapier', 5),
    ('connector_type', 'mailchimp', 'Mailchimp', 6),
    ('connector_type', 'twilio', 'Twilio SMS', 7),
    ('connector_type', 'sendgrid', 'SendGrid Email', 8);

-- Languages
INSERT INTO reference_data_v2 (category, value, label, sort_order) VALUES
    ('language', 'en', 'English', 1),
    ('language', 'es', 'Spanish', 2),
    ('language', 'fr', 'French', 3),
    ('language', 'de', 'German', 4),
    ('language', 'pt', 'Portuguese', 5),
    ('language', 'zh', 'Chinese', 6),
    ('language', 'ja', 'Japanese', 7),
    ('language', 'ar', 'Arabic', 8);

-- Feedback categories
INSERT INTO reference_data_v2 (category, value, label, sort_order) VALUES
    ('feedback_category', 'service_quality', 'Service Quality', 1),
    ('feedback_category', 'timeliness', 'Timeliness', 2),
    ('feedback_category', 'professionalism', 'Professionalism', 3),
    ('feedback_category', 'communication', 'Communication', 4),
    ('feedback_category', 'value', 'Value for Money', 5);

-- Report types
INSERT INTO reference_data_v2 (category, value, label, sort_order) VALUES
    ('report_type', 'ticket_summary', 'Ticket Summary', 1),
    ('report_type', 'technician_performance', 'Technician Performance', 2),
    ('report_type', 'customer_health', 'Customer Health', 3),
    ('report_type', 'financial_report', 'Financial Report', 4),
    ('report_type', 'sla_compliance', 'SLA Compliance', 5),
    ('report_type', 'inventory_status', 'Inventory Status', 6);
```

---

## 6. Adding New Enum Values — Process

### For CHECK-constrained enums (requires migration):

```sql
ALTER TABLE tickets_v2 DROP CONSTRAINT tickets_v2_ticket_status_check;
ALTER TABLE tickets_v2 ADD CONSTRAINT tickets_v2_ticket_status_check
    CHECK (ticket_status IN (
        'new', 'classified', 'drafted', 'approved_to_send', 'sent',
        'escalated', 'closed', 'archived'   -- added 'archived'
    ));
```

### For `reference_data_v2`-backed enums (no migration):

```sql
INSERT INTO reference_data_v2 (category, value, label, sort_order)
VALUES ('skill', 'solar', 'Solar Panel Installation', 11);
```

The application layer already queries `reference_data_v2` dynamically, so new values appear immediately in dropdowns and validation.

---

> **Document Maintainers:** Database Engineering Team  
> **Review Cycle:** Semi-annual (or when new enum values are added)  
> **Last Updated:** June 2026
