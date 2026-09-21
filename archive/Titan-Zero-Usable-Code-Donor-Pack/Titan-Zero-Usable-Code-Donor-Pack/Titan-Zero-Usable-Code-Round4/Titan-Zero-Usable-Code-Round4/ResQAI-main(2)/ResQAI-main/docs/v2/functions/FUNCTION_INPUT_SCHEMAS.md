# Function Input Schemas — ResQAI V2

> Complete input schema documentation for all ~68 functions across 17 domains.

---

## Authentication & Security (5 functions)

### authenticate_user
**Domain:** Authentication & Security

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| email | `string` | User email address |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| password | `string?` | null | Plain-text password for legacy auth |
| auth_provider | `string?` | null | OAuth provider name (e.g. google, microsoft) |
| auth_provider_id | `string?` | null | User ID from the external auth provider |

### validate_session
**Domain:** Authentication & Security

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| session_id | `string` | Session UUID to validate |

**Optional:** None

### create_user
**Domain:** Authentication & Security

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| email | `string` | User email address |
| name | `string` | Display name of the user |
| role_id | `string` | Role UUID to assign |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| auth_provider | `string?` | null | External auth provider name |
| auth_provider_id | `string?` | null | External auth provider user ID |
| preferences_config | `dict?` | null | JSON preferences configuration |
| created_by | `string?` | null | User or system that created this user |

### update_user
**Domain:** Authentication & Security

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| user_id | `string` | UUID of the user to update |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| name | `string?` | null | New display name |
| email | `string?` | null | New email address |
| role_id | `string?` | null | New role UUID |
| status | `string?` | null | New status (active, suspended, inactive) |
| preferences_config | `dict?` | null | Updated preferences configuration |
| updated_by | `string?` | null | User or system that performed the update |

### assign_user_role
**Domain:** Authentication & Security

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| user_id | `string` | UUID of the user to assign the role to |
| role_id | `string` | UUID of the role to assign |
| assigned_by | `string` | User or system that performed the assignment |

**Optional:** None

---

## Administration (14 functions)

### create_role
**Domain:** Administration

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| name | `string` | Unique role name |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| description | `string?` | null | Role description |
| is_system | `bool` | false | Whether this is a system-managed role |

### list_users
**Domain:** Administration

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| role_id | `string?` | null | Filter by role UUID |
| status | `string?` | null | Filter by status (active, suspended, inactive) |
| limit | `int` | 100 | Maximum number of users to return |

### list_permissions
**Domain:** Administration

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| role_id | `string?` | null | Filter by role UUID |
| resource | `string?` | null | Filter by resource name |
| limit | `int` | 200 | Maximum number of permissions to return |

### manage_permission
**Domain:** Administration

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| action | `Literal["grant","revoke"]` | Whether to grant or revoke the permission |
| role_id | `string` | UUID of the role |
| resource | `string` | Resource name (e.g. tickets, users_v2) |
| permission_action | `string` | Permission action (e.g. datastore.record.read) |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| scope | `string` | "own" | Scope of the permission (own, department, all) |

### record_audit
**Domain:** Administration

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| entity_type | `string` | Type of entity being audited (e.g. ticket, user) |
| entity_id | `string` | UUID of the entity |
| action | `string` | Action performed (e.g. created, updated, deleted) |
| actor_type | `string` | Type of actor (user, system, workflow) |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| actor_id | `string?` | null | UUID of the actor |
| previous_state | `dict?` | null | Snapshot of state before the action |
| new_state | `dict?` | null | Snapshot of state after the action |
| changed_fields | `list[string]?` | null | List of field names that changed |
| ip_address | `string?` | null | IP address of the actor |
| user_agent | `string?` | null | User agent string from the request |
| correlation_id | `string?` | null | Correlation ID for tracing related events |

### query_audit_log
**Domain:** Administration

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| entity_type | `string?` | null | Filter by entity type |
| entity_id | `string?` | null | Filter by entity UUID |
| action | `string?` | null | Filter by action name |
| actor_type | `string?` | null | Filter by actor type |
| actor_id | `string?` | null | Filter by actor UUID |
| correlation_id | `string?` | null | Filter by correlation ID |
| date_from | `string?` | null | Include entries on or after this ISO timestamp |
| date_to | `string?` | null | Include entries on or before this ISO timestamp |
| limit | `int` | 100 | Maximum number of entries to return |
| offset | `int` | 0 | Number of entries to skip for pagination |

### create_inventory_item
**See Inventory domain**

### update_inventory_item
**See Inventory domain**

### list_inventory
**See Inventory domain**

### create_report
**See Reporting domain**

### execute_report
**See Reporting domain**

### schedule_report
**See Reporting domain**

### create_customer
**See CRM domain**

### update_customer
**See CRM domain**

### get_customer
**See CRM domain**

### search_customers
**See CRM domain**

---

## Support / Ticket (13 functions)

### create_ticket
**Domain:** Support / Ticket

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| customer_id | `string` | ID of the customer creating the ticket |
| channel | `string` | Channel through which the ticket was submitted (email, phone, web, chat) |
| subject | `string` | Short summary of the issue |
| message | `string` | Full description of the issue |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| customer_name | `string?` | null | Display name of the customer |
| request_type | `string?` | null | Type of request (new_booking, complaint, billing, etc.) |
| urgency | `string` | "normal" | Urgency level: low, normal, high, urgent |
| created_by | `string?` | null | User or workflow that created the ticket |

### update_ticket_v2
**Domain:** Support / Ticket

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| ticket_id | `string` | ID of the ticket to update |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| status | `string?` | null | New status value (new, classified, drafted, sent, approved_to_send, closed) |
| assigned_to | `string?` | null | Technician or agent to assign |
| human_notes | `string?` | null | Internal notes from human review |
| draft_reply | `string?` | null | Draft reply to send to customer |
| approved_to_send | `bool?` | null | Whether the draft is approved to be sent |
| resolution_summary | `string?` | null | Summary of how the ticket was resolved |
| updated_by | `string?` | null | User or workflow that performed the update |

### search_tickets
**Domain:** Support / Ticket

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| status | `string?` | null | Filter by ticket status (new, classified, drafted, sent, approved_to_send, closed) |
| urgency | `string?` | null | Filter by urgency level (low, normal, high, urgent) |
| assigned_to | `string?` | null | Filter by assigned agent or technician |
| customer_name | `string?` | null | Filter by customer name (substring match) |
| channel | `string?` | null | Filter by channel (email, phone, web, chat) |
| limit | `int` | 50 | Maximum number of results to return |
| offset | `int` | 0 | Number of results to skip for pagination |

### assign_ticket
**Domain:** Support / Ticket

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| ticket_id | `string` | ID of the ticket to assign |
| assigned_to | `string` | Technician or agent to assign the ticket to |
| assigned_by | `string` | User or workflow that performed the assignment |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| assignment_note | `string?` | null | Optional note explaining the assignment |

### escalate_ticket
**Domain:** Support / Ticket

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| ticket_id | `string` | ID of the ticket to escalate |
| escalation_reason | `string` | Reason for the escalation |
| escalated_by | `string` | User or workflow that escalated the ticket |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| target_urgency | `string` | "urgent" | Target urgency level after escalation |

### close_ticket
**Domain:** Support / Ticket

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| ticket_id | `string` | ID of the ticket to close |
| resolution_summary | `string` | Summary of how the issue was resolved |
| closed_by | `string` | User or workflow that closed the ticket |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| resolution_reasoning | `string?` | null | Detailed reasoning behind the resolution |
| send_notification | `bool` | false | Whether to send an email notification to the customer |

### update_ticket_record
**Domain:** Support / Ticket

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| ticket_id | `string` | ID of the ticket to update |
| status | `string` | New status value |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| approved_to_send | `bool?` | null | Whether the draft is approved to be sent |
| assigned_to | `string?` | null | Technician or agent to assign |
| human_notes | `string?` | null | Internal notes from human review |
| resolution_summary | `string?` | null | Summary of resolution |
| resolution_reasoning | `string?` | null | Reasoning behind the resolution |
| analysis_status | `string?` | null | Status of AI analysis |

### check_ticket_urgency
**Domain:** Support / Ticket

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| ticket_id | `string` | ID of the ticket to check |
| urgency | `string` | Urgency level of the ticket |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| classification_status | `string?` | null | Status of ticket classification |

### collect_resolved_tickets
**Domain:** Support / Ticket

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| lookback_days | `int` | 7 | How many days back to search for closed tickets |
| today | `date?` | null | Override date for testing. Defaults to system date |
| max_tickets | `int` | 50 | Maximum tickets to return |

### finalize_dispatch
**Domain:** Support / Ticket

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| ticket_id | `string` | The ticket UUID being dispatched |
| dispatcher | `string` | Who performed the dispatch: workflow:urgent-dispatch or human:manager |
| status | `string` | Dispatch status: dispatched, manual_assignment, or escalation |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| assigned_technician | `string?` | null | Technician name assigned to this ticket |
| dispatch_notes | `string?` | null | Notes from the dispatch process |

---

## Appointment (10 functions)

### create_appointment
**Domain:** Appointment

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| customer_id | `string` | UUID of the customer |
| service_type | `string` | Type of service requested |
| scheduled_date | `string` | ISO 8601 datetime for the appointment |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| duration_minutes | `int` | 60 | Duration in minutes |
| notes | `string?` | null | Optional notes |
| created_by | `string?` | null | Actor who created the appointment |

### get_appointment
**Domain:** Appointment

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| appointment_id | `string` | UUID of the appointment to retrieve |

**Optional:** None

### list_appointments
**Domain:** Appointment

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| status | `string?` | null | Filter by status |
| technician_id | `string?` | null | Filter by technician UUID |
| customer_id | `string?` | null | Filter by customer UUID |
| scheduled_date_from | `date?` | null | Filter by scheduled date start (inclusive) |
| scheduled_date_to | `date?` | null | Filter by scheduled date end (inclusive) |
| limit | `int` | 100 | Maximum number of results to return |

### assign_appointment_technician
**Domain:** Appointment

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| appointment_id | `string` | The appointment UUID to update |
| technician_name | `string` | Name of the technician to assign |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| manager_notes | `string?` | null | Notes from the approving manager |
| technician_id | `string?` | null | Technician UUID if known |

### accept_appointment
**Domain:** Appointment

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| appointment_id | `string` | UUID of the appointment to accept |
| technician_id | `string` | UUID of the accepting technician |
| technician_name | `string` | Name of the accepting technician |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| notes | `string?` | null | Optional notes from the technician |

### complete_appointment
**Domain:** Appointment

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| appointment_id | `string` | UUID of the appointment to complete |
| completed_by | `string` | Actor completing the appointment |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| work_summary | `string?` | null | Summary of work performed |
| parts_used | `list[PartUsed]?` | null | Parts used during service (part_name, quantity, part_number?) |
| customer_signature | `string?` | null | Base64-encoded customer signature or reference |

### cancel_appointment
**Domain:** Appointment

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| appointment_id | `string` | UUID of the appointment to cancel |
| cancellation_reason | `string` | Reason for cancellation |
| cancelled_by | `string` | Actor cancelling the appointment |

**Optional:** None

### fetch_upcoming_appointments
**Domain:** Appointment

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| today | `date?` | null | Override date for testing. Defaults to system date |
| days_ahead | `int` | 2 | How many days ahead to look for appointments |
| statuses | `list[string]` | ["confirmed","scheduled"] | Appointment statuses to include |

### create_work_order
**See Work Order domain**

### update_work_order
**See Work Order domain**

---

## Technician (4 functions)

### create_technician
**Domain:** Technician

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| name | `string` | Technician full name |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| primary_phone | `string?` | null | Primary phone number |
| primary_email | `string?` | null | Primary email address |
| timezone | `string` | "UTC" | Timezone of the technician |
| certification | `list?` | null | List of certifications or skills |
| max_daily_jobs | `int` | 4 | Maximum jobs per day |
| notes | `string?` | null | Optional notes |
| created_by | `string?` | null | Actor creating the technician |

### update_technician
**Domain:** Technician

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| technician_id | `string` | UUID of the technician to update |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| name | `string?` | null | Updated full name |
| primary_phone | `string?` | null | Updated primary phone |
| primary_email | `string?` | null | Updated primary email |
| status | `string?` | null | Updated status |
| notes | `string?` | null | Updated notes |
| max_daily_jobs | `int?` | null | Updated max daily jobs |
| updated_by | `string?` | null | Actor performing the update |

### update_technician_skills
**Domain:** Technician

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| technician_id | `string` | UUID of the technician to update |
| skills | `list[string]` | List of skills or certifications to set |

**Optional:** None

### list_technicians
**Domain:** Technician

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| status | `string?` | null | Filter by status (e.g. active, inactive) |
| availability | `string?` | null | Filter by availability (e.g. available, busy) |
| min_rating | `float?` | null | Minimum rating filter |
| limit | `int` | 100 | Maximum number of results to return |

---

## CRM (14 functions)

### create_customer
**Domain:** CRM

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| name | `string` | Customer name |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| primary_phone | `string?` | null | Primary phone number |
| primary_email | `string?` | null | Primary email address |
| customer_type | `string?` | null | Customer type |
| timezone | `string` | "UTC" | Customer timezone |
| communication_prefs | `dict?` | null | Communication preferences |
| notes | `string?` | null | Notes |
| tags | `list[string]?` | null | Tags |
| created_by | `string?` | null | Creator |

### update_customer
**Domain:** CRM

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| customer_id | `string` | Customer UUID |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| name | `string?` | null | Updated name |
| primary_phone | `string?` | null | Updated phone |
| primary_email | `string?` | null | Updated email |
| status | `string?` | null | Updated status |
| customer_type | `string?` | null | Updated type |
| timezone | `string?` | null | Updated timezone |
| communication_prefs | `dict?` | null | Updated prefs |
| notes | `string?` | null | Updated notes |
| tags | `list?` | null | Updated tags |
| updated_by | `string?` | null | Updater |

### get_customer
**Domain:** CRM

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| customer_id | `string` | Customer UUID |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| include_account | `bool` | false | Whether to include account data |

### search_customers
**Domain:** CRM

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| query | `string?` | null | Search query (substring match on name) |
| status | `string?` | null | Filter by status |
| customer_type | `string?` | null | Filter by customer type |
| limit | `int` | 50 | Maximum results |

### create_followup
**Domain:** CRM

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| account_id | `string` | Account UUID |
| type | `string` | Follow-up type |
| subject | `string` | Follow-up subject |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| customer_id | `string?` | null | Customer UUID |
| priority | `string` | "normal" | Priority (low, normal, high, urgent) |
| due_date | `string?` | null | Due date ISO string |
| assigned_to | `string?` | null | Assignee |
| related_ticket_id | `string?` | null | Related ticket UUID |
| related_appointment_id | `string?` | null | Related appointment UUID |
| related_dispute_id | `string?` | null | Related dispute UUID |
| notes | `string?` | null | Notes |
| created_by | `string?` | null | Creator |

### complete_followup
**Domain:** CRM

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| followup_id | `string` | Follow-up UUID |
| completed_by | `string` | Completing actor |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| notes | `string?` | null | Completion notes |

### list_followups
**Domain:** CRM

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| account_id | `string?` | null | Filter by account UUID |
| customer_id | `string?` | null | Filter by customer UUID |
| status | `string?` | null | Filter by status |
| assigned_to | `string?` | null | Filter by assignee |
| due_date_from | `string?` | null | Due date start range |
| due_date_to | `string?` | null | Due date end range |
| limit | `int` | 100 | Maximum results |

### account_health_scan
**Domain:** CRM

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| today | `date?` | null | Override 'now'. Defaults to system date |
| lookback_days | `int` | 120 | How many days back define 'recent engagement' |
| write_back | `bool` | true | If true, update accounts.health, health_score, etc. |
| top_n_riskiest | `int` | 10 | How many riskiest accounts to return |
| relationship_overrides | `dict[str,str]` | {} | Map of account_id -> relationship_status to enforce |

### update_account_health
**Domain:** CRM

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| account_id | `string` | Account UUID |
| health_score | `float` | Numeric health score |
| health | `Literal["healthy","watch","slipping","critical"]` | Health status |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| scan_notes | `string?` | null | Notes from the scan |
| triggered_by | `string?` | null | Triggering actor |

### update_account_health_status
**Domain:** CRM

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| health_category | `Literal["healthy","warning","critical"]` | The health branch taken in the workflow |
| coordination_status | `string` | Echo of the agent's coordination_status for audit context |
| today | `date` | ISO date of this workflow run |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| summary | `string?` | null | Agent-generated summary |
| recovery_notes | `string?` | null | Optional recovery plan notes from human escalation |

### create_followup_tasks
**Domain:** CRM

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| recommendations | `list[Recommendation]` | List of recommendations from the health/analysis agent |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| today | `date?` | null | Override date for testing |
| category | `string` | "remediation" | Task category label |

**Recommendation sub-fields:** account_id (string), customer_id (string), action (string), priority (string, default "normal"), due_offset_days (int, default 3), notes (string?)

### list_disputes
**Domain:** CRM

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| status | `string?` | null | Filter by status |
| customer_id | `string?` | null | Filter by customer UUID |
| appointment_id | `string?` | null | Filter by appointment UUID |
| ticket_id | `string?` | null | Filter by ticket UUID |
| limit | `int` | 100 | Maximum results |

### resolve_dispute
**Domain:** CRM

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| dispute_id | `string` | Dispute UUID |
| action | `string` | "approve" or "reject" |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| recommended_resolution | `string?` | null | Recommended resolution description |
| resolution_reason | `string?` | null | Reason for the resolution |
| confidence | `float?` | null | Confidence score |
| human_notes | `string?` | null | Human review notes |
| analysis_status | `string?` | null | AI analysis status |
| ticket_id | `string?` | null | Related ticket UUID |

### resolve_dispute_v2
**Domain:** CRM

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| dispute_id | `string` | Dispute UUID |
| resolution_type | `Literal["full_refund","partial_refund","redo_service","discount_credit","no_action","escalate_legal"]` | Resolution type |
| resolved_by | `string` | Resolving actor |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| resolution_notes | `string?` | null | Resolution notes |
| notify_customer | `bool` | false | Whether to notify the customer |

---

## Operations (5 functions)

### create_followup_tasks
*(See CRM domain)*

### create_operations_tasks
**Domain:** Operations

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| recommendations | `list[OperationRecommendation]` | List of operation recommendations from the coordinator agent |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| today | `date?` | null | Override date for testing |
| scope | `string` | "daily" | Operations scope: daily, weekly, or ad_hoc |

**OperationRecommendation sub-fields:** team (string), action (string), priority (string, default "normal"), assigned_to (string?), notes (string?)

### finalize_dispatch
*(See Support / Ticket domain)*

### flag_slipping_followups
**Domain:** Operations

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| today | `date?` | null | Override 'now'. Defaults to system date |
| days_ahead | `int` | 7 | Days from today to consider 'due soon' (not slipping yet) |
| include_statuses | `list[string]` | ["pending","in_progress"] | Statuses that are still 'open' |
| top_n | `int` | 20 | Cap result size for UI lists |

### finalize_slippage_review
**Domain:** Operations

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| slippage_counts | `dict` | Counts from the slippage scan |
| slipping_followups | `list` | List of slipping followups |
| approved | `bool` | Whether the reminders were approved |
| workflow_run_time | `string` | ISO timestamp of the workflow run |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| coordinator_summary | `string?` | null | Summary from operations-coordinator |
| coordinator_recommendations | `list` | [] | Recommendations from operations-coordinator |
| human_notes | `string?` | null | Notes from human reviewer |

---

## Resolution / Dispute (3 functions)

### list_disputes
*(See CRM domain)*

### resolve_dispute
*(See CRM domain)*

### resolve_dispute_v2
*(See CRM domain)*

---

## Work Order (6 functions)

### create_work_order
**Domain:** Work Order

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| appointment_id | `string` | The appointment UUID this work order belongs to |
| technician_id | `string` | The technician UUID assigned to the work order |
| customer_id | `string` | The customer UUID |
| service_description | `string` | Description of the service to be performed |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| customer_notes | `string?` | null | Optional notes from the customer |
| created_by | `string?` | null | Actor creating the work order |

### update_work_order
**Domain:** Work Order

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| work_order_id | `string` | The work order UUID to update |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| status | `string?` | null | New status for the work order |
| technician_notes | `string?` | null | Notes from the technician |
| parts_used | `list[dict]?` | null | List of parts used with part_id and quantity |
| photos | `list[string]?` | null | List of photo attachment URLs |
| signature_ref | `string?` | null | Signature reference or URL |
| updated_by | `string?` | null | Actor updating the work order |

### get_work_order
**Domain:** Work Order

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| work_order_id | `string` | The work order UUID to retrieve |

**Optional:** None

### list_work_orders
**Domain:** Work Order

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| technician_id | `string?` | null | Filter by technician UUID |
| status | `string?` | null | Filter by work order status |
| appointment_id | `string?` | null | Filter by appointment UUID |
| limit | `int` | 100 | Maximum number of work orders to return |

### create_appointment
*(See Appointment domain)*

### assign_appointment_technician
*(See Appointment domain)*

---

## Notification (6 functions)

### dispatch_notifications
**Domain:** Notification

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| reminders | `list[Reminder]` | List of reminder messages to dispatch |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| channels | `list[string]` | ["email","sms"] | Allowed dispatch channels |

**Reminder sub-fields:** appointment_id (string), customer_id (string), customer_name (string), channel (string: email/sms), recipient (string), message (string), technician (string?)

### dispatch_notification_v2
**Domain:** Notification

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| recipient_id | `string` | UUID of the recipient (user or customer) |
| recipient_type | `string` | Type of recipient: user or customer |
| notification_type | `string` | Type/category of notification |
| channel | `string` | Dispatch channel: in_app, email, or sms |
| subject | `string` | Notification subject line |
| body | `string` | Notification body content |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| correlation_id | `string?` | null | Optional correlation ID for grouping notifications |

### send_bulk_notification
**Domain:** Notification

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| notification_type | `string` | Type/category of notification |
| subject_template | `string` | Subject line template |
| body_template | `string` | Body content template |
| recipients | `list[BulkNotificationRecipient]` | List of recipients to notify |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| correlation_id | `string?` | null | Optional correlation ID for grouping |

**BulkNotificationRecipient sub-fields:** recipient_id (string), recipient_type (string: user/customer), channel (string: in_app/email/sms), recipient_address (string)

### track_notification
**Domain:** Notification

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| notification_id | `string?` | null | UUID of the notification to find |
| correlation_id | `string?` | null | Correlation ID to find notifications by |
| mark_read | `bool` | false | If true, mark the notification as read |

### dispatch_notifications
*(See above)*

### send_bulk_notification
*(See above)*

---

## Analytics (7 functions)

### analytics_aggregation
**Domain:** Analytics

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| period | `string` | Aggregation period: daily, weekly, or monthly |
| date_from | `date` | Start date for aggregation (inclusive) |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| date_to | `date?` | null | End date for aggregation (inclusive). Defaults to date_from |

### dashboard_metrics
**Domain:** Analytics

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| include_trends | `bool` | false | Whether to include trend computations |

### account_health_scan
*(See CRM domain)*

### flag_slipping_followups
*(See Operations domain)*

### execute_report
**See Reporting domain**

### create_report
**See Reporting domain**

### schedule_report
**See Reporting domain**

---

## Reporting (3 functions)

### create_report
**Domain:** Reporting

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| name | `string` | Report display name |
| config | `dict` | Report configuration dict (tables, metrics, filters, etc.) |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| description | `string?` | null | Optional description of the report |
| is_public | `bool` | false | Whether the report is publicly accessible |
| created_by | `string?` | null | User or system that created the report |

### execute_report
**Domain:** Reporting

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| report_id | `string` | UUID of the report to execute |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| params | `dict?` | null | Override parameters for report execution (date range, filters, etc.) |

### schedule_report
**Domain:** Reporting

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| report_id | `string` | UUID of the report to schedule |
| frequency | `Literal["daily","weekly","monthly"]` | Delivery frequency |
| recipients | `list[string]` | List of recipient email addresses |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| format | `string` | "pdf" | Output format (pdf, csv, xlsx) |
| is_active | `bool` | true | Whether the schedule is active on creation |

---

## Knowledge (3 functions)

### record_audit
*(See Administration domain)*

### query_audit_log
*(See Administration domain)*

### execute_report
*(See Reporting domain)*

---

## Inventory (6 functions)

### create_inventory_item
**Domain:** Inventory

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| name | `string` | Display name of the inventory item |
| sku | `string` | Stock-keeping unit identifier (must be unique) |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| description | `string?` | null | Optional description of the item |
| category | `string?` | null | Item category for grouping |
| unit_price_cents | `int` | 0 | Price per unit in cents |
| quantity_on_hand | `int` | 0 | Current stock quantity |
| reorder_threshold | `int` | 10 | Quantity threshold that triggers reorder |
| reorder_quantity | `int` | 50 | Quantity to reorder when threshold is hit |
| supplier_info | `string?` | null | Supplier name or contact info |
| created_by | `string?` | null | Actor creating the item |

### update_inventory_item
**Domain:** Inventory

**Required:**
| Field | Type | Description |
|-------|------|-------------|
| item_id | `string` | The inventory item UUID to update |

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| name | `string?` | null | New display name |
| description | `string?` | null | New description |
| category | `string?` | null | New category |
| unit_price_cents | `int?` | null | New unit price in cents |
| quantity_on_hand | `int?` | null | New stock quantity |
| reorder_threshold | `int?` | null | New reorder threshold |
| reorder_quantity | `int?` | null | New reorder quantity |
| supplier_info | `string?` | null | New supplier info |
| updated_by | `string?` | null | Actor updating the item |

### list_inventory
**Domain:** Inventory

**Optional:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| category | `string?` | null | Filter by category |
| low_stock_only | `bool` | false | Only return items below reorder threshold |
| limit | `int` | 100 | Maximum number of items to return |

### complete_appointment (parts_used impact)
*(See Appointment domain)*

### update_work_order (parts_used impact)
*(See Work Order domain)*

### create_inventory_item
*(See above)*

---

## Customer Experience (2 functions)

### close_ticket
*(See Support / Ticket domain)*

### resolve_dispute_v2
*(See CRM domain)*

### track_notification
*(See Notification domain)*

---

## Automation (3 functions)

### create_followup_tasks
**Domain:** Automation

*(See CRM domain for input schema)*

### create_operations_tasks
**Domain:** Automation

*(See Operations domain for input schema)*

### flag_slipping_followups
**Domain:** Automation

*(See Operations domain for input schema)*

---

## Quality (2 functions)

### collect_resolved_tickets
**Domain:** Quality

*(See Support / Ticket domain for input schema)*

### finalize_slippage_review
**Domain:** Quality

*(See Operations domain for input schema)*
