# Support Center v2 — Complete Application Specification

> Phase 3.2 — Application Specifications  
> Status: Implementation-Ready  
> Date: 2026-06-29

---

## 1. Business Objective

Centralize multi-channel ticket intake, triage, AI-assisted classification, reply drafting, escalation management, and SLA compliance tracking into a single support agent workspace that reduces average response time by 40% and first-resolution time by 25%.

---

## 2. Primary Users

| User Type | Count Estimate | Usage Pattern |
|-----------|---------------|--------------|
| Support Agent | 20-200 | Daily, full shift |
| Senior Agent | 5-20 | Daily, oversight |
| Support Manager | 2-10 | Daily, approvals |
| Operations Coordinator | 2-5 | As needed, escalations |
| Admin | 1-3 | Configuration only |

---

## 3. User Roles

| Role | Permissions | Scope |
|------|------------|-------|
| support:agent | view_tickets, create_ticket, draft_reply, update_status | Assigned queue |
| support:senior_agent | All agent + approve_reply, transfer, escalate | All queues |
| support:manager | All senior_agent + manage_templates, manage_queues, view_sla, override_assignments | All queues |
| support:admin | All manager + system configuration | Full access |

---

## 4. Business Processes

### 4.1 Ticket Intake Process
```
Customer creates ticket (portal/email/chat/phone) 
  → Ticket appears in queue (status: new) 
  → AI classification (type, urgency, suggested owner) 
  → Agent picks ticket 
  → Status → in_progress 
  → Investigation
  → Reply drafted (AI-assisted or manual)
  → Manager approves (if required)
  → Reply sent to customer
  → Status → waiting_customer
  → Customer responds
  → Status → in_progress (loop)
  → Resolution reached
  → Status → resolved
  → Status → closed (auto after 72h)
  → Satisfaction survey sent
```

### 4.2 Escalation Process
```
Agent flags escalation
  → Escalation reason + priority recorded
  → Manager notified
  → Escalation review
  → Reassign or promote to urgent dispatch
  → Operations center notified if urgent
```

### 4.3 SLA Tracking Process
```
Ticket created → SLA timer starts
  → Breach warning at 75% of SLA window
  → Breach alert at 100%
  → Breach recorded in SLA log
  → Manager dashboard highlights breaches
```

---

## 5. Navigation Flow

```
Top Bar: [App Switcher] [Global Search] [Notification Bell] [User Avatar]

Sidebar:
  ├── Ticket Queue (/) [badge: unassigned count]
  ├── My Tickets (/my-tickets) [badge: my active count]
  ├── Escalations (/escalations) [badge: escalation count]
  ├── SLA Dashboard (/sla)
  ├── Templates (/templates)
  └── Queue Settings (/settings) [manager+ only]
```

---

## 6. Screen Flow

```
TicketQueuePage (/) 
  → Click ticket row → TicketDetailPage (/tickets/:id)
  → Click "New Ticket" → NewTicketPage (/tickets/new)
  → Navigate sidebar → MyTicketsPage (/my-tickets)
  → Navigate sidebar → EscalationsPage (/escalations)
  → Click escalation → TicketDetailPage (scroll to escalation)
  → Navigate sidebar → SLADashboardPage (/sla)
  → Navigate sidebar → TemplatesPage (/templates)
  → Navigate sidebar → QueueSettingsPage (/settings)
```

---

## 7. Feature List

| Feature | Priority | Complexity | Depends On |
|---------|----------|------------|------------|
| Multi-channel ticket intake | P0 | Medium | Tickets table |
| AI ticket classification | P0 | High | request-classifier agent |
| Ticket queue with filters | P0 | Medium | Tickets table |
| Ticket detail view | P0 | Medium | Tickets, customers, operations_log |
| AI-assisted reply drafting | P0 | High | support-reply-drafter agent |
| Manager reply approval | P1 | Medium | Reply approval workflow |
| Escalation management | P1 | Medium | Escalation workflow |
| SLA tracking & breach alerts | P1 | Medium | SLA timer function |
| Reply templates | P1 | Low | Templates config |
| Bulk actions (assign, close) | P1 | Medium | Bulk update function |
| Queue configuration | P2 | Medium | Queue settings |
| Agent performance metrics | P2 | Medium | Analytics integration |

---

## 8. Module List

| Module | Description | Files |
|--------|-------------|-------|
| Ticket Management | Core CRUD + state machine | pages/, components/ |
| Classification | AI integration for type/urgency | components/ClassificationBadges |
| Reply Drafting | AI + manual reply composition | components/ReplyEditor, AIReplySuggestion |
| Escalation | Escalation workflow UI | pages/EscalationsPage |
| SLA Monitoring | SLA timer + breach dashboard | pages/SLADashboardPage |
| Templates | Reply template CRUD | pages/TemplatesPage |
| Queue Config | Queue rules + routing | pages/QueueSettingsPage |

---

## 9. Permissions

| Permission | Roles | Description |
|------------|-------|-------------|
| support:view_tickets | All support roles | View ticket queue |
| support:create_ticket | All support roles | Create manual tickets |
| support:draft_reply | Agent, Senior Agent, Manager | Draft customer replies |
| support:approve_reply | Senior Agent, Manager | Approve drafted replies |
| support:escalate | Senior Agent, Manager | Escalate tickets |
| support:transfer | Senior Agent, Manager | Transfer ticket ownership |
| support:manage_templates | Manager | CRUD reply templates |
| support:manage_queues | Manager | Configure queue rules |
| support:view_sla | Manager, Admin | View SLA dashboard |
| support:override_assignments | Manager | Force-reassign tickets |

---

## 10. Future Backend Dependencies

| Dependency | Type | Purpose |
|------------|------|---------|
| tickets table | Database | Core ticket storage |
| customers table | Database | Customer context |
| technicians table | Database | Suggested owner resolution |
| appointments table | Database | Ticket context |
| disputes table | Database | Ticket context |
| operations_log table | Database | Activity history |
| user_roles_v2 table | Database | Permission resolution |
| request-classifier agent | Agent | AI ticket classification |
| support-reply-drafter agent | Agent | AI reply drafting |
| ticket-intake workflow | Workflow | Full intake pipeline |
| urgent-dispatch workflow | Workflow | Urgent handling |
| support-escalation-manager workflow | Workflow | Escalation path |
| customer-satisfaction-monitor workflow | Workflow | Post-resolution survey |
| check-ticket-urgency function | Function | Deterministic urgency eval |
| update-ticket-record function | Function | State machine transitions |
| notification:send event | Event | Outbound notifications |

---

## 11. Screen Specifications

### 11.1 TicketQueuePage (/) — Main Ticket Queue

**Purpose:** Central list of all tickets with real-time updates, powerful filtering, and quick-action capabilities.

**Entry Points:** App root, sidebar "Ticket Queue" link, global search "View all tickets"

**Exit Points:** Click ticket row (→ Detail), "New Ticket" button (→ NewTicketPage), sidebar (→ other screens)

**Navigation:** Sidebar item highlighted; breadcrumbs: Home > Ticket Queue

**Header:** "Ticket Queue" with count badge showing total tickets

**Toolbar:**
- "New Ticket" button (permission: create_ticket)
- "Refresh" button
- "Bulk Actions" dropdown (visible when rows selected)
- View toggle: List / Kanban

**Filters:**
- Status: multi-select (new, in_progress, waiting_customer, resolved, closed)
- Urgency: quick chips (critical, high, normal, low)
- Channel: multi-select (portal, email, chat, phone, sms)
- Type: multi-select (support, billing, service, complaint)
- Owner: assignee dropdown
- Date Range: created date picker
- Clear All Filters button

**Search:** Global search bar scoped to tickets (searches subject, customer name, ticket ID)

**Actions:**
| Action | Button | Permission | Confirmation | Success | Failure |
|--------|--------|------------|--------------|---------|---------|
| New Ticket | Primary "New Ticket" | create_ticket | None | → NewTicketPage | N/A |
| Refresh | Icon button | view_tickets | None | List refreshes | Error snackbar |
| Assign | Bulk Action | transfer | Dialog: select new owner | Tickets assigned | Error snackbar |
| Close | Bulk Action | update_status | Dialog: confirm close | Tickets closed (x count) | Error snackbar |
| Escalate | Bulk Action | escalate | Dialog: reason + priority | Tickets escalated | Error snackbar |

**Cards/Widgets:**
- Ticket count summary bar (new / in_progress / waiting / escalated)

**Tables:** TicketList
| Column | Sort | Filter | Search | Width |
|--------|------|--------|--------|-------|
| ID | Yes | No | Yes | 80px |
| Subject | Yes | No | Yes | 2fr |
| Customer | Yes | Yes | Yes | 1fr |
| Type | Yes | Yes | No | 120px |
| Urgency | Yes | Yes | No | 100px |
| Status | Yes | Yes | No | 120px |
| Channel | No | Yes | No | 90px |
| Owner | Yes | Yes | No | 150px |
| Created | Yes | Yes (date) | No | 150px |
| SLA | No | No | No | 100px |

- Pagination: 25/50/100 per page, page navigation, total count
- Sorting: Single column, click header to toggle asc/desc
- Bulk Actions: Checkbox column, select all header checkbox
- Context Menu: Right-click row → Assign, Escalate, View Customer, Copy ID
- Export: CSV export of filtered results (permission: view_sla)

**Loading:** SkeletonTable with 8 rows of skeleton columns
**Error:** ErrorState with "Failed to load tickets" + Retry button
**Empty State:** "No tickets found" with illustration and "Create New Ticket" action

**Dialogs:**
- Assign Dialog: OwnerAssigner component + notes textarea + Confirm/Cancel
- Close Dialog: Confirm close + reason (optional) + Confirm/Cancel
- Escalate Dialog: Escalation reason dropdown + priority selector + notify manager checkbox + Confirm/Cancel

**Side Panels:** None on this page

**Notifications:** Toast snackbar for bulk action results

**Accessibility:** 
- All filters keyboard accessible
- Table rows focusable and navigable via arrow keys
- Aria labels on all action buttons
- Screen reader announcements for bulk actions

---

### 11.2 TicketDetailPage (/tickets/:id) — Single Ticket View

**Purpose:** Full ticket lifecycle management — view thread, draft replies, manage status, view timeline.

**Entry Points:** Click ticket in TicketQueuePage, deep link from email/notification, global search result

**Exit Points:** Back to queue (breadcrumb), sidebar navigation

**Navigation:** Breadcrumbs: Home > Ticket Queue > Ticket #[id]

**Header:** Ticket subject + ID, StatusBadge, UrgencyIndicator, ClassificationBadges (type, channel icon)

**Toolbar:**
- "Back to Queue" link
- Status dropdown (new → in_progress → resolved → closed)
- "Escalate" button (senior agent+)
- "Transfer" button (senior agent+)
- "Refresh" button
- Actions dropdown (more options)

**Filters:** None (single record)

**Search:** None (single record)

**Actions:**
| Action | Button | Permission | Confirmation | Success | Failure |
|--------|--------|------------|--------------|---------|---------|
| Draft Reply | Floating action button / inline | draft_reply | None | Reply saved as draft | Error snackbar |
| Approve Reply | "Approve" on draft | approve_reply | None | Reply sent to customer | Error snackbar |
| Reject Reply | "Reject" on draft | approve_reply | Dialog: reason | Draft returned for revision | Error snackbar |
| Escalate | Button in toolbar | escalate | Dialog: reason + priority | Ticket escalated | Error snackbar |
| Transfer | Button in toolbar | transfer | Dialog: select owner | Ticket transferred | Error snackbar |
| Update Status | Status dropdown | update_status | None | Status updated, event logged | Error snackbar |
| Add Note | "Add Note" button | update_status | None | Internal note added | Error snackbar |

**Cards/Widgets:**
- SLA Stopwatch card (real-time countdown)
- Customer Info card (name, phone, email, linked accounts)
- Ticket Timeline card (chronological event list)

**Tables:** None

**Forms:**
| Form | Fields | Validation | Defaults | Submit Flow | Cancel Flow |
|------|--------|------------|----------|-------------|-------------|
| Reply Draft | message_content (rich text), use_ai_draft (toggle), template_selector | Required: message | Empty message, AI toggle off | Save draft → emit ticket.reply.drafted | Discard draft |
| Approve Reply | approval (radio: approve/reject), manager_notes | Required: approval | Approve selected | Approve → emit ticket.reply.approved → reply sent | Cancel dialog |
| Escalation | escalation_reason (dropdown), priority (dropdown), notify_manager (checkbox) | Required: reason | Notify manager: true | Submit → emit ticket.escalated | Cancel |
| Ticket Transfer | new_owner (searchable dropdown), transfer_note | Required: new_owner | Empty | Submit → update owner | Cancel |

**Dialogs:**
- Confirm Close: "Are you sure? The customer will be notified."
- Discard Draft: "You have unsaved changes. Discard?"
- Approve Reject: With reason textarea

**Side Panels:**
- Customer Panel: Customer details, recent tickets, account health (slide from right)
- Activity Panel: Real-time operations_log filtered by ticket_id (slide from right)

**Notifications:**
- "Reply sent to customer" (success)
- "Ticket escalated to [manager]" (success)
- "Draft saved" (success)
- "Failed to send reply" (error)
- "SLA breach warning" (warning toast)

**Loading:** DetailLayout skeleton with placeholder header, content area, sidebar panel
**Error:** ErrorState with "Failed to load ticket" + Retry button
**Empty State:** "Ticket not found" with back-to-queue link

**Accessibility:**
- Reply editor has proper aria-label
- SLA timer announces breaches via aria-live
- All dialogs trap focus
- Keyboard shortcuts: Ctrl+Enter to send reply

**Components Used:**
| Component | Purpose | Properties | Events | Reusable |
|-----------|---------|------------|--------|----------|
| TicketDetailPanel | Main ticket content | ticket, loading | onUpdate | App-specific |
| MessageThread | Chronological messages | messages, loading | onReply | Shared |
| ReplyEditor | Rich text input | initialValue, loading | onSave, onSend | App-specific |
| AIReplySuggestion | AI draft suggestion | suggestion, confidence | onAccept, onEdit, onReject | App-specific |
| TicketHistoryTimeline | Event timeline | events, loading | none | Shared |
| SLAStopwatch | Real-time SLA timer | createdAt, slaHours | onBreach | App-specific |
| ClassificationBadges | Type + urgency display | type, urgency | none | Shared |
| UrgencyIndicator | Urgency meter | urgency | none | Shared |
| OwnerAssigner | Agent search/select | currentOwner, agents | onAssign | App-specific |
| EscalationBanner | Escalation alert | escalation, visible | onDismiss | Shared |
| TemplateSelector | Reply template picker | templates, selected | onSelect | App-specific |

---

### 11.3 NewTicketPage (/tickets/new) — Manual Ticket Creation

**Purpose:** Create support tickets manually for phone/chat/walk-in requests.

**Entry Points:** "New Ticket" button on TicketQueuePage, direct navigation

**Exit Points:** Save → TicketDetailPage, Cancel → TicketQueuePage

**Navigation:** Breadcrumbs: Home > Ticket Queue > New Ticket

**Header:** "New Ticket"

**Toolbar:** None

**Filters:** None

**Search:** Customer search (TypeaheadSearch component)

**Actions:**
| Action | Button | Permission | Confirmation | Success | Failure |
|--------|--------|------------|--------------|---------|---------|
| Create | Primary "Create Ticket" | create_ticket | None | → TicketDetailPage | Show validation errors |
| Cancel | Secondary "Cancel" | view_tickets | "Discard changes?" | → TicketQueuePage | N/A |

**Tables:** None

**Forms:**
| Field | Type | Required | Validation | Default |
|-------|------|----------|------------|---------|
| customer | TypeaheadSearch | Yes | Must select existing customer | Empty |
| subject | Text input | Yes | Max 200 chars | Empty |
| message | Textarea (rich text) | Yes | Max 5000 chars | Empty |
| request_type | Dropdown | Yes | Must select | Empty |
| channel | Dropdown | Yes | Must select | "phone" |
| urgency | Dropdown | No | Must be valid level | "normal" |
| phone | Phone input | No | Valid phone format | Empty |
| email | Email input | No | Valid email format | Empty |

**Dialogs:** Discard confirmation dialog

**Side Panels:** None

**Notifications:** None (redirects on success)

**Loading:** Form skeleton
**Error:** Inline field validation errors, API error banner at top
**Empty State:** N/A

**Accessibility:** 
- Auto-focus first field
- Error messages linked to fields via aria-describedby
- Tab order follows visual order

---

### 11.4 MyTicketsPage (/my-tickets) — Assigned Tickets

**Purpose:** Filtered view of tickets assigned to the current agent.

**Entry Points:** Sidebar "My Tickets" link

**Exit Points:** Click ticket → TicketDetailPage, sidebar navigation

**Navigation:** Breadcrumbs: Home > My Tickets

**Header:** "My Tickets" with active count

**Toolbar:** View toggle (List/Kanban), "Refresh" button

**Filters:** Same as TicketQueuePage (pre-filtered by current user as owner)

**Search:** Scoped to assigned tickets

**Actions:** Same as TicketQueuePage (minus Assign)

**Tables:** TicketList (filtered by owner = currentUser)

**Loading/Error/Empty:** Same pattern as TicketQueuePage

---

### 11.5 EscalationsPage (/escalations) — Escalated Tickets

**Purpose:** Manage escalated tickets requiring management attention.

**Entry Points:** Sidebar "Escalations" link (badge shows count)

**Exit Points:** Click escalation → TicketDetailPage, sidebar navigation

**Navigation:** Breadcrumbs: Home > Escalations

**Header:** "Escalations" with count

**Toolbar:** "Refresh" button, escalation reason filter

**Filters:** Priority, escalation status (pending_review, reviewed, resolved)

**Search:** Scoped to escalated tickets

**Tables:** Table with columns: ID, Subject, Reason, Priority, Escalated By, Escalated At, Status, Actions

**Actions:** Resolve escalation, Reassign, View Ticket

**Loading/Error/Empty:** Standard patterns

---

### 11.6 SLADashboardPage (/sla) — SLA Compliance

**Purpose:** Monitor SLA compliance metrics and breach history.

**Entry Points:** Sidebar "SLA Dashboard" link

**Exit Points:** Sidebar navigation

**Navigation:** Breadcrumbs: Home > SLA Dashboard

**Header:** "SLA Dashboard"

**Toolbar:** Date range filter, channel filter, "Export" button

**Cards/Widgets:**
- Overall compliance % (large metric card with trend)
- Breached tickets count
- Avg response time by channel (bar chart placeholder)
- Avg resolution time by type (bar chart placeholder)

**Tables:** SLA Breach Table: Ticket ID, Customer, Breach Type (response/resolution), Breach Time, Overdue Duration, Owner

**Actions:** Click breach row → TicketDetailPage

**Loading/Error/Empty:** Standard patterns

---

### 11.7 TemplatesPage (/templates) — Reply Templates

**Purpose:** Manage reply templates for common ticket responses.

**Entry Points:** Sidebar "Templates" link

**Exit Points:** Sidebar navigation

**Navigation:** Breadcrumbs: Home > Templates

**Header:** "Reply Templates"

**Toolbar:** "New Template" button, category filter

**Tables:** Template list — Name, Category, Body (preview), Last Used, Actions (Edit, Delete)

**Forms:** Template form — name (required), body (rich text, required), request_type (dropdown), category (dropdown)

**Actions:** Create, Edit, Delete template (permission: manage_templates)

---

### 11.8 QueueSettingsPage (/settings) — Queue Configuration

**Purpose:** Configure queue routing rules, SLA thresholds, assignment logic.

**Entry Points:** Sidebar "Queue Settings" link (manager+ only)

**Exit Points:** Sidebar navigation

**Navigation:** Breadcrumbs: Home > Queue Settings

**Header:** "Queue Settings"

**Sections:** 
- Routing rules (expression-based assignment)
- SLA thresholds (by type/urgency)
- Auto-close duration
- Agent capacity limits

**Forms:** Various config forms with save/cancel

**Actions:** Save configuration (permission: manage_queues)

---

## 12. User Journeys

### Journey 1: Agent processes incoming ticket
1. Agent logs in → sees TicketQueuePage with unassigned tickets
2. Agent filters by urgency=critical, status=new
3. Agent clicks high-priority ticket → TicketDetailPage
4. Agent reviews customer message in MessageThread
5. Agent clicks "Draft Reply" → ReplyEditor opens
6. Agent toggles "Use AI draft" → AIReplySuggestion shows draft
7. Agent edits draft and saves
8. Agent changes status to in_progress
9. Manager receives notification, approves reply
10. Reply sent → status → waiting_customer
11. Next day: customer replies → status → in_progress
12. Agent resolves ticket → status → resolved

### Journey 2: Manager handles escalation
1. Manager sees Escalations badge count = 3
2. Manager clicks → EscalationsPage sorted by priority
3. Manager reviews critical escalation → clicks → TicketDetailPage
4. Manager reads escalation reason in EscalationBanner
5. Manager clicks "Resolve Escalation" → adds note
6. Manager reassigns to senior agent
7. Escalation resolved, notification sent to original agent

### Journey 3: Agent creates manual ticket from phone call
1. Agent on call with customer → clicks "New Ticket"
2. Agent searches for customer by name/phone
3. Agent fills subject, message, selects request_type=service, channel=phone
4. Agent clicks Create → TicketDetailPage for new ticket
5. Agent begins drafting reply while customer is on phone

---

## 13. Future Integrations

### Database Tables
| Table | Access | Purpose |
|-------|--------|---------|
| tickets | Read/Write | Core ticket data |
| customers | Read | Customer context |
| technicians | Read | Suggested owner |
| appointments | Read | Ticket context |
| disputes | Read | Ticket context |
| operations_log | Read | Activity history |
| user_roles_v2 | Read | Permission resolution |
| notification_templates_v2 | Read | Reply templates |

### Functions
| Function | Trigger | Purpose |
|----------|---------|---------|
| check-ticket-urgency | On ticket create/update | Deterministic urgency override |
| update-ticket-record | On any status change | State machine enforcement |
| dispatch-notifications | On reply send | Outbound notification |
| sla-check | Periodic | SLA breach evaluation |

### Agents
| Agent | Trigger | Purpose |
|-------|---------|---------|
| request-classifier | On ticket created | Classify type, urgency, owner |
| support-reply-drafter | On draft request | AI-generated reply |

### Workflows
| Workflow | Trigger | Steps |
|----------|---------|-------|
| ticket-intake | ticket.created | Classify → route → notify |
| support-escalation-manager | ticket.escalated | Notify → assign → track |
| urgent-dispatch | ticket.escalated (urgent) | Dispatch → coordinates |
| customer-satisfaction-monitor | ticket.status→closed | Send survey → track |

### Notifications
| Event | Channel | Template |
|-------|---------|----------|
| ticket.created | In-app | New ticket alert |
| ticket.assigned | In-app, Email | Ticket assigned to you |
| ticket.escalated | In-app, Email | Escalation notice |
| ticket.reply.approved | In-app | Reply approved/needs revision |
| sla.breach.warning | In-app, Email | SLA breach imminent |
| sla.breached | In-app, Email, Discord | SLA breached |

### Events
| Event | Emitter | Consumers |
|-------|---------|-----------|
| ticket.created | support-center_v2 | intake workflow, analytics |
| ticket.classified | support-center_v2 | operations-center, analytics |
| ticket.reply.drafted | support-center_v2 | notification-center |
| ticket.reply.approved | support-center_v2 | notification-center |
| ticket.status.changed | support-center_v2 | analytics, crm, customer-portal |
| ticket.escalated | support-center_v2 | operations-center, manager |

### Reports
| Report | Source | Frequency |
|--------|--------|-----------|
| Ticket volume by channel | analytics-center_v2 | Daily, weekly, monthly |
| Agent performance | analytics-center_v2 | Weekly |
| SLA compliance | analytics-center_v2 | Daily |
| Escalation trends | analytics-center_v2 | Monthly |
| Customer satisfaction | analytics-center_v2 | Weekly |

### Connectors
| Connector | Direction | Purpose |
|-----------|-----------|---------|
| Email (IMAP/SMTP) | Inbound/Outbound | Email ticket ingestion and reply |
| SMS (Twilio) | Inbound/Outbound | SMS ticket ingestion and reply |
| Chat (WebSocket) | Inbound/Outbound | Live chat tickets |
| Slack/Discord | Outbound | Escalation alerts to ops |
