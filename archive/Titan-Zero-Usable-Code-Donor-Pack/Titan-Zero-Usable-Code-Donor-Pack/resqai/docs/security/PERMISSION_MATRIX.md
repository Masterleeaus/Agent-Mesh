# ResQAI V2 — Permission Matrix

**Version:** 2.0
**Date:** 2026-06-30

---

## 1. Permission Namespace Convention

```
<app-abbreviation>:<action>
```

| Prefix | Application | Permission Count |
|--------|-------------|-----------------|
| `support:` | support-center_v2 | 8 |
| `appointment:` | appointment-center_v2 | 18 |
| `ops:` | operations-center_v2 | 18 |
| `technician:` | technician-portal_v2 | 22 |
| `resolution:` | resolution-center_v2 | 21 |
| `crm:` | crm-center_v2 | 24 |
| `analytics:` | analytics-center_v2 | 20 |
| `portal:` | customer-portal_v2 | 28 |
| `admin:` | admin-center_v2 | 22 |

**Total: 181 permissions across 9 applications**

**Source:** `integration/SHARED_PERMISSIONS.md` and each app's `contracts/permissions.ts`

---

## 2. Full Permission Registry

### 2.1 support-center_v2

```typescript
export const SUPPORT_CENTER_PERMISSIONS = {
  VIEW_TICKETS:       'support:view_tickets',
  CREATE_TICKET:      'support:create_ticket',
  DRAFT_REPLY:        'support:draft_reply',
  APPROVE_REPLY:      'support:approve_reply',
  ESCALATE_TICKET:    'support:escalate',
  MANAGE_TEMPLATES:   'support:manage_templates',
  MANAGE_QUEUES:      'support:manage_queues',
  VIEW_SLA:           'support:view_sla',
};
```

### 2.2 appointment-center_v2

```typescript
export const AppointmentPermissions = {
  ViewSchedule:       'appointment:view_schedule',
  ViewQueue:          'appointment:view_queue',
  ViewDetail:         'appointment:view_detail',
  ViewHistory:        'appointment:view_history',
  ViewReports:        'appointment:view_reports',
  ViewCancelled:      'appointment:view_cancelled',
  ViewCompleted:      'appointment:view_completed',
  Create:             'appointment:create',
  Edit:               'appointment:edit',
  AssignTechnician:   'appointment:assign_technician',
  Reschedule:         'appointment:reschedule',
  Cancel:             'appointment:cancel',
  Complete:           'appointment:complete',
  ManageServices:     'appointment:manage_services',
  ManageSettings:     'appointment:manage_settings',
  Export:             'appointment:export',
  BatchAction:        'appointment:batch_action',
};
```

### 2.3 operations-center_v2

```typescript
export const OPERATIONS_CENTER_PERMISSIONS = {
  VIEW_DASHBOARD:         'ops:view_dashboard',
  VIEW_DISPATCH_QUEUE:    'ops:view_dispatch_queue',
  CREATE_DISPATCH:        'ops:create_dispatch',
  VIEW_LIVE_BOARD:        'ops:view_live_board',
  VIEW_ASSIGNMENTS:       'ops:view_assignments',
  ASSIGN_TECHNICIAN:      'ops:assign_technician',
  REASSIGN_TECHNICIAN:    'ops:reassign_technician',
  MONITOR_TECHNICIANS:    'ops:monitor_technicians',
  VIEW_ESCALATIONS:       'ops:view_escalations',
  ESCALATE_OPERATION:     'ops:escalate_operation',
  CLOSE_OPERATION:        'ops:close_operation',
  UPDATE_OPERATION_STATUS:'ops:update_operation_status',
  VIEW_TIMELINE:          'ops:view_timeline',
  VIEW_DAILY_OPS:         'ops:view_daily_ops',
  VIEW_REGIONAL_OPS:      'ops:view_regional_ops',
  VIEW_COMPLETED_OPS:     'ops:view_completed_ops',
  VIEW_REPORTS:           'ops:view_reports',
  SEARCH_OPERATIONS:      'ops:search_operations',
};
```

### 2.4 technician-portal_v2

```typescript
export const TECHNICIAN_PORTAL_PERMISSIONS = {
  VIEW_DASHBOARD:     'technician:view_dashboard',
  VIEW_JOBS:          'technician:view_jobs',
  VIEW_JOB_DETAIL:    'technician:view_job_detail',
  ACCEPT_JOB:         'technician:accept_job',
  REJECT_JOB:         'technician:reject_job',
  UPDATE_PROGRESS:    'technician:update_progress',
  ADD_NOTES:          'technician:add_notes',
  UPLOAD_PHOTOS:      'technician:upload_photos',
  UPLOAD_VIDEOS:      'technician:upload_videos',
  CAPTURE_SIGNATURE:  'technician:capture_signature',
  USE_PARTS:          'technician:use_parts',
  REQUEST_INVENTORY:  'technician:request_inventory',
  PAUSE_JOB:          'technician:pause_job',
  RESUME_JOB:         'technician:resume_job',
  ESCALATE_JOB:       'technician:escalate_job',
  COMPLETE_JOB:       'technician:complete_job',
  VIEW_MESSAGES:      'technician:view_messages',
  SEND_MESSAGE:       'technician:send_message',
  VIEW_NOTIFICATIONS: 'technician:view_notifications',
  VIEW_HISTORY:       'technician:view_history',
  VIEW_PROFILE:       'technician:view_profile',
  EDIT_SETTINGS:      'technician:edit_settings',
};
```

### 2.5 resolution-center_v2

```typescript
export const RESOLUTION_CENTER_PERMISSIONS = {
  VIEW_DASHBOARD:          'resolution:view_dashboard',
  VIEW_PENDING:            'resolution:view_pending',
  VIEW_DISPUTES:           'resolution:view_disputes',
  VIEW_CASES:              'resolution:view_cases',
  VIEW_EVIDENCE:           'resolution:view_evidence',
  VIEW_TECHNICIAN_REPORTS: 'resolution:view_technician_reports',
  VIEW_COMPLAINTS:         'resolution:view_complaints',
  VIEW_APPROVALS:          'resolution:view_approvals',
  VIEW_ESCALATIONS:        'resolution:view_escalations',
  VIEW_HISTORY:            'resolution:view_history',
  VIEW_CLOSED:             'resolution:view_closed',
  VIEW_KNOWLEDGE_BASE:     'resolution:view_knowledge_base',
  VIEW_REPORTS:            'resolution:view_reports',
  VIEW_SEARCH:             'resolution:view_search',
  CREATE_RESOLUTION:       'resolution:create_resolution',
  APPROVE_RESOLUTION:      'resolution:approve_resolution',
  REJECT_RESOLUTION:       'resolution:reject_resolution',
  ESCALATE_CASE:           'resolution:escalate_case',
  CLOSE_CASE:              'resolution:close_case',
  REQUEST_INFO:            'resolution:request_info',
  MANAGE_KNOWLEDGE_BASE:   'resolution:manage_knowledge_base',
};
```

### 2.6 crm-center_v2

```typescript
export const CRM_PERMISSIONS = {
  VIEW_DASHBOARD:      'crm:view_dashboard',
  VIEW_ACCOUNTS:       'crm:view_accounts',
  MANAGE_ACCOUNTS:     'crm:manage_accounts',
  VIEW_CUSTOMERS:      'crm:view_customers',
  MANAGE_CUSTOMERS:    'crm:manage_customers',
  MANAGE_FOLLOWUPS:    'crm:manage_followups',
  VIEW_FOLLOWUPS:      'crm:view_followups',
  RUN_SCANS:           'crm:run_scans',
  VIEW_RISKS:          'crm:view_risks',
  VIEW_INTERACTIONS:   'crm:view_interactions',
  LOG_INTERACTIONS:    'crm:log_interactions',
  VIEW_NOTES:          'crm:view_notes',
  MANAGE_NOTES:        'crm:manage_notes',
  VIEW_TASKS:          'crm:view_tasks',
  MANAGE_TASKS:        'crm:manage_tasks',
  VIEW_FEEDBACK:       'crm:view_feedback',
  RECORD_FEEDBACK:     'crm:record_feedback',
  VIEW_SATISFACTION:   'crm:view_satisfaction',
  VIEW_OPPORTUNITIES:  'crm:view_opportunities',
  MANAGE_OPPORTUNITIES:'crm:manage_opportunities',
  VIEW_COMMUNICATIONS: 'crm:view_communications',
  VIEW_REPORTS:        'crm:view_reports',
  SEARCH:              'crm:search',
  MERGE_CUSTOMERS:     'crm:merge_customers',
};
```

### 2.7 analytics-center_v2

```typescript
export const ANALYTICS_PERMISSIONS = {
  VIEW_EXECUTIVE:     'analytics:view_executive',
  VIEW_SUPPORT:       'analytics:view_support',
  VIEW_OPERATIONS:    'analytics:view_operations',
  VIEW_APPOINTMENTS:  'analytics:view_appointments',
  VIEW_TECHNICIANS:   'analytics:view_technicians',
  VIEW_CUSTOMERS:     'analytics:view_customers',
  VIEW_CRM:           'analytics:view_crm',
  VIEW_RESOLUTION:    'analytics:view_resolution',
  VIEW_SLA:           'analytics:view_sla',
  VIEW_PRODUCTIVITY:  'analytics:view_productivity',
  VIEW_TRENDS:        'analytics:view_trends',
  VIEW_FORECASTING:   'analytics:view_forecasting',
  VIEW_ACCOUNTS:      'analytics:view_accounts',
  VIEW_DISPUTES:      'analytics:view_disputes',
  VIEW_AUDIT:         'analytics:view_audit',
  VIEW_HEALTH:        'analytics:view_health',
  MANAGE_REPORTS:     'analytics:manage_reports',
  MANAGE_SCHEDULES:   'analytics:manage_schedules',
  EXPORT_DATA:        'analytics:export_data',
  VIEW_ALL:           'analytics:view_all',
};
```

### 2.8 customer-portal_v2

```typescript
export const CustomerPortalPermissions = {
  ViewDashboard:          'portal:view_dashboard',
  ViewTickets:            'portal:view_tickets',
  CreateTicket:           'portal:create_ticket',
  ViewTicketDetail:       'portal:view_ticket_detail',
  UpdateTicket:           'portal:update_ticket',
  SendMessage:            'portal:send_message',
  ViewAppointments:       'portal:view_appointments',
  BookAppointment:        'portal:book_appointment',
  RescheduleAppointment:  'portal:reschedule_appointment',
  CancelAppointment:      'portal:cancel_appointment',
  TrackTechnician:        'portal:track_technician',
  ViewLiveStatus:         'portal:view_live_status',
  ViewDisputes:           'portal:view_disputes',
  ViewMessages:           'portal:view_messages',
  ViewNotifications:      'portal:view_notifications',
  ViewServiceHistory:     'portal:view_service_history',
  ViewInvoices:           'portal:view_invoices',
  ViewPayments:           'portal:view_payments',
  MakePayment:            'portal:make_payment',
  SubmitFeedback:         'portal:submit_feedback',
  ViewKnowledgeBase:      'portal:view_knowledge_base',
  ViewDownloads:          'portal:view_downloads',
  ManageAccount:          'portal:manage_account',
  ManageProfile:          'portal:manage_profile',
  ChangePassword:         'portal:change_password',
  ManageSecurity:         'portal:manage_security',
  ViewSettings:           'portal:view_settings',
  ViewHelpCenter:         'portal:view_help_center',
};
```

### 2.9 admin-center_v2

```typescript
export const PERMISSIONS = {
  ADMIN_VIEW_DASHBOARD:       'admin:view_dashboard',
  ADMIN_MANAGE_USERS:         'admin:manage_users',
  ADMIN_MANAGE_ROLES:         'admin:manage_roles',
  ADMIN_VIEW_AUDIT:           'admin:view_audit',
  ADMIN_MANAGE_SETTINGS:      'admin:manage_settings',
  ADMIN_MANAGE_CONNECTORS:    'admin:manage_connectors',
  ADMIN_VIEW_EVENTS:          'admin:view_events',
  ADMIN_EXPORT_AUDIT:         'admin:export_audit',
  ADMIN_MANAGE_APPLICATIONS:  'admin:manage_applications',
  ADMIN_MANAGE_WORKFLOWS:     'admin:manage_workflows',
  ADMIN_MANAGE_FUNCTIONS:     'admin:manage_functions',
  ADMIN_MANAGE_AGENTS:        'admin:manage_agents',
  ADMIN_VIEW_MONITORING:      'admin:view_monitoring',
  ADMIN_MANAGE_INTEGRATIONS:  'admin:manage_integrations',
  ADMIN_MANAGE_NOTIFICATIONS: 'admin:manage_notifications',
  ADMIN_MANAGE_FEATURE_FLAGS: 'admin:manage_feature_flags',
  ADMIN_MANAGE_SECURITY:      'admin:manage_security',
  ADMIN_MANAGE_API_KEYS:      'admin:manage_api_keys',
  ADMIN_MANAGE_ORGANIZATIONS: 'admin:manage_organizations',
  ADMIN_MANAGE_TEAMS:         'admin:manage_teams',
  ADMIN_VIEW_ERRORS:          'admin:view_errors',
  ADMIN_MANAGE_DATABASE:      'admin:manage_database',
};
```

---

## 3. Cross-Application Permission Checks

| Navigation Path | Required Permission | Check Context |
|----------------|-------------------|---------------|
| support → crm (view customer) | `crm:view_customers` | customerId |
| support → appointment (create) | `appointment:create` | customerId |
| support → appointment (view) | `appointment:view_detail` | appointmentId |
| ops → support (view ticket) | `support:view_tickets` | ticketId |
| crm → support (create ticket) | `support:create_ticket` | customerId |
| resolution → technician (view report) | `technician:view_job_detail` | jobId |
| customer → support (view ticket) | `portal:view_tickets` | customerId |
| admin → any app (manage) | `admin:manage_applications` | — |

---

## 4. Resource-Level Actions (DB RBAC)

| Action | Description |
|--------|-------------|
| `create` | Create new records |
| `read` | View existing records |
| `update` | Modify existing records |
| `delete` | Remove records |
| `manage` | Full administrative control |

### Resources in RBAC System

| Resource | Description |
|----------|-------------|
| tickets | Support tickets |
| customers | Customer records |
| appointments | Service appointments |
| technicians | Technician records |
| work_orders | Work orders |
| dispatches | Dispatch operations |
| disputes | Dispute cases |
| accounts | Customer accounts |
| followups | Follow-up tasks |
| tasks | General tasks |
| notifications | System notifications |
| knowledge_articles | Knowledge base |
| inventory_items | Parts/equipment inventory |
| analytics_reports | Reporting data |
| users | User accounts |
| roles | User roles |
| permissions | Permission policies |
| settings | System settings |
| feature_flags | Feature flags |
| connectors | Integration connectors |
| audit_log | Audit trail |
| events | System events |

---

## 5. Agent Permissions

| Agent | Tables Read | Tables Written |
|-------|------------|----------------|
| request-classifier | tickets, technicians | tickets |
| support-reply-drafter | tickets, technicians, customers | tickets |
| operations-coordinator | tickets, appointments, technicians, customers, tasks, operations_log | tasks, operations_log |
| resolution-advisor | disputes, customers, appointments, tickets, operations_log | disputes, operations_log |
| account-health-monitor | accounts, followups, customers, appointments, disputes, tasks | tasks, operations_log |

Each agent has a `permissions.json` file defining granular table-level read/write access.
