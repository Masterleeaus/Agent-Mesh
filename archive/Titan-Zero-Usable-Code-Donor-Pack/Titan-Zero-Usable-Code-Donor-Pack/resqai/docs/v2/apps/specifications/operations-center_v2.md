# Operations Center v2 — Complete Application Specification

> Phase 3.2 — Application Specifications  
> Status: Implementation-Ready  
> Date: 2026-06-29

---

## 1. Business Objective

Provide a command-center view of all field service operations — task management, urgent dispatch coordination, daily standup automation, and technician workload monitoring — enabling operations teams to resolve 30% more urgent incidents within SLA.

---

## 2. Primary Users

| User Type | Count Estimate | Usage Pattern |
|-----------|---------------|--------------|
| Operations Coordinator | 3-10 | Daily, full shift |
| Dispatch Manager | 1-3 | Daily, dispatch decisions |
| Service Manager | 2-5 | Daily, oversight |
| Operations Director | 1-2 | Weekly, strategic |

---

## 3. User Roles

| Role | Permissions | Scope |
|------|------------|-------|
| ops:coordinator | view_dashboard, manage_tasks, view_technicians | Full ops access |
| ops:manager | All coordinator + dispatch_override, manage_dispatch, view_standup | Manage override |
| ops:director | All manager + standup_config, export_data | Strategic |
| ops:admin | All + system config | Full |

---

## 4. Business Processes

### 4.1 Urgent Dispatch Process
```
Escalated ticket received (event: ticket.escalated)
  → Appears in Dispatch Center
  → Coordinator reviews details
  → Selects available technician (skill/location/load)
  → Dispatch initiated
  → Technician notified via notification-center
  → Technician accepts/rejects (in technician-portal)
  → If rejected → reassign
  → Status: dispatched → en_route → on_site → completed
  → Dispatch completed → event emitted
  → Operations log updated
```

### 4.2 Task Management Process
```
Task needed identified (by agent or human)
  → Create task with title, owner, priority, due_date
  → Assignee notified
  → Task appears on Task Board (Kanban)
  → Assignee updates status: todo → in_progress → review → done
  → Task completed → logged
```

### 4.3 Daily Standup Process
```
Scheduled trigger (daily, 8:00 AM)
  → Operations coordinator agent gathers data
  → Generates standup report (yesterday's summary, today's priorities, blockers)
  → Standup appears in DailyStandupPage
  → Coordinator reviews and edits notes
  → Standup exported/shared to stakeholders
```

---

## 5. Navigation Flow

```
Top Bar: [App Switcher] [Global Search] [Notification Bell] [User Avatar]

Sidebar:
  ├── Dashboard (/)
  ├── Task Board (/tasks) [badge: overdue count]
  ├── Dispatch Center (/dispatches) [badge: active count]
  ├── Daily Standup (/standup)
  └── Technician Workload (/technicians)
```

---

## 6. Screen Flow

```
DashboardPage (/) 
  → Click task → TaskDetailPage (/tasks/:id)
  → Click dispatch → DispatchDetailPage (/dispatches/:id)
  → Click "New Task" → NewTaskPage (/tasks/new)
  → Click "View All Tasks" → TaskBoardPage (/tasks)
  → Click "View All Dispatches" → DispatchCenterPage (/dispatches)
```

---

## 7. Feature List

| Feature | Priority | Complexity |
|---------|----------|------------|
| Operations Dashboard (KPI cards) | P0 | Medium |
| Urgent dispatch queue and lifecycle | P0 | High |
| Task Kanban board (drag-and-drop) | P0 | Medium |
| Task CRUD with assignment | P0 | Medium |
| Daily standup auto-generation | P1 | High |
| Technician workload visualization | P1 | Medium |
| Incident management | P2 | Medium |
| Cross-app operational summary | P1 | Medium |

---

## 8. Module List

| Module | Description |
|--------|-------------|
| Dashboard | KPI row, urgent panel, task summary, appointment summary |
| Task Management | Kanban + detail + CRUD |
| Dispatch Center | Urgent dispatch coordination |
| Daily Standup | Auto-generated + editable report |
| Technician View | Load/availability visualization |

---

## 9. Permissions

| Permission | Roles |
|------------|-------|
| ops:view_dashboard | All ops roles |
| ops:manage_tasks | Coordinator, Manager, Director, Admin |
| ops:manage_dispatch | Manager, Director, Admin |
| ops:dispatch_override | Manager, Director, Admin |
| ops:view_standup | Manager, Director, Admin |
| ops:view_technicians | All ops roles |
| ops:export_data | Director, Admin |

---

## 10. Future Backend Dependencies

| Dependency | Type |
|------------|------|
| tickets table | Database |
| tasks table | Database |
| appointments table | Database |
| technicians table | Database |
| customers table | Database |
| operations_log table | Database |
| followups table | Database |
| operations-coordinator agent | Agent |
| urgent-dispatch workflow | Workflow |
| daily-standup workflow | Workflow |
| followup-slippage-detector workflow | Workflow |
| appointment-assignment workflow | Workflow |
| create-operations-tasks function | Function |
| dispatch-notifications function | Function |

---

## 11. Screen Specifications

### 11.1 DashboardPage (/) — Operations Dashboard

**Purpose:** Central operational command hub showing real-time KPIs, urgent dispatches, active tasks, and today's appointment summary.

**Entry Points:** App root, sidebar "Dashboard"

**Exit Points:** Click any card/widget → relevant detail page

**Navigation:** Breadcrumbs: Home > Dashboard

**Header:** "Operations Dashboard" with last-refreshed timestamp

**Toolbar:** "Refresh All" button, auto-refresh toggle (30s)

**Filters:** Date range filter (affects all widgets)

**Actions:**
| Action | Button | Permission |
|--------|--------|------------|
| Refresh | Icon button | view_dashboard |
| New Task | "New Task" | manage_tasks |
| View Dispatch | "View All" link | manage_dispatch |

**Cards/Widgets:**
- **KpiCardRow**: Open Tickets count, Pending Dispatches, Scheduled Appointments, Overdue Followups (each with trend arrow)
- **UrgentDispatchPanel**: Real-time list of active urgent dispatches with "View" action
- **ActiveTasksCard**: Top 5 active tasks (status: todo/in_progress) with owner avatars
- **TodayAppointmentsCard**: Today's appointment count + "View All" link
- **RecentOpsLog**: Last 10 operations_log entries (chronological)
- **OperationalBlockerBanner**: Red banner if active blockers detected
- **CrossAppSummary**: Mini-widgets from support (open tickets), appointment (today's sched), crm (slipping followups)

**Loading:** Skeleton grid with placeholder cards
**Error:** ErrorState with "Failed to load dashboard" + Retry
**Empty State:** No data configuration needed (dashboard always has data)

---

### 11.2 TaskBoardPage (/tasks) — Task Board

**Purpose:** Kanban-style task management board with drag-and-drop column transitions.

**Entry Points:** Sidebar "Task Board"

**Exit Points:** Click task → TaskDetailPage, "New Task" → NewTaskPage

**Header:** "Task Board" with task counts per column

**Toolbar:** "New Task" button, filter button, view toggle (Kanban/List)

**Filters:** Owner, Priority, Due Date, Category

**Search:** Title search

**Columns:** Todo | In Progress | Review | Done (drag-and-drop between columns)

**Cards:** TaskCard component — title, priority badge, due date, owner avatar, category

**Actions:** Click card → TaskDetailPage, drag card → update status

**Loading:** Skeleton kanban columns
**Error:** ErrorState with Retry
**Empty State:** "No tasks" with "Create your first task" button

---

### 11.3 NewTaskPage (/tasks/new) — Create Task

**Purpose:** Create operational tasks with assignment, priority, and due date.

**Form Fields:** title (required, max 200), description (optional, max 2000), owner (dropdown, required), priority (required: critical/high/medium/low), due_date (date picker, required), category (dropdown: operations, dispatch, maintenance, other)

**Submit Flow:** Validate → createRecord(tasks) → emit task.created → redirect to TaskDetailPage
**Cancel Flow:** Confirm discard → redirect to TaskBoardPage

---

### 11.4 TaskDetailPage (/tasks/:id) — Single Task View

**Purpose:** Full task details, activity log, status updates.

**Sections:** Task info (title, description, status, priority, owner, dates), Activity timeline (operations_log filtered by task_id), Quick actions

**Actions:** Update status, Edit task, Reassign, Add comment

---

### 11.5 DispatchCenterPage (/dispatches) — Dispatch Queue

**Purpose:** Manage urgent dispatching of technicians to escalated incidents.

**Header:** "Dispatch Center" with active dispatch count

**Filters:** Status (pending, accepted, en_route, on_site, completed), Priority, Technician

**Table:** Dispatch ID, Ticket ID (linked), Customer, Technician, Priority, Status, Created, SLA Remaining

**Actions:** Initiate dispatch, Reassign technician, Mark completed, View ticket detail

---

### 11.6 DispatchDetailPage (/dispatches/:id) — Dispatch Lifecycle

**Purpose:** End-to-end view of a single dispatch operation.

**Sections:** Customer info, Ticket reference, Technician card (name, phone, status), DispatchTimeline component (created → assigned → accepted → en_route → on_site → completed), Notes/updates

**Actions:** Update status, Contact technician (phone link), Reassign

---

### 11.7 DailyStandupPage (/standup) — Standup Report

**Purpose:** View, edit, and export daily operational standup report.

**Sections:** Auto-generated summary (yesterday's results, today's priorities, blockers), Coordinator notes (editable), Team acknowledgments, Export button (PDF/email)

---

### 11.8 TechnicianWorkloadPage (/technicians) — Technician Overview

**Purpose:** Visualize technician availability, current load, and upcoming assignments.

**Cards:** Per-technician card with name, skill tags, current status (available/busy/off_shift), today's appointment count, utilization bar

**Filters:** Skill, Status, Territory

---

## 12. User Journeys

### Journey 1: Coordinator handles urgent dispatch
1. Coordinator sees dispatch badge count = 2
2. Opens DispatchCenterPage, sorted by priority
3. Reviews first dispatch: critical, AC breakdown, elderly customer
4. Clicks "View" → DispatchDetailPage shows ticket + customer info
5. Opens TechnicianPicker, filters by skill=HVAC, status=available
6. Selects best technician based on location + load
7. Clicks "Initiate Dispatch" → technician notified via app
8. Technician accepts → dispatch status → accepted
9. Coordinator monitors in real-time as tech progresses en_route → on_site → completed

### Journey 2: Morning standup review
1. Director opens DailyStandupPage at 8:30 AM
2. Auto-generated report shows: 12 tickets resolved yesterday, 5 urgent dispatches, 1 blocker
3. Director adds notes about escalations
4. Clicks "Share Standup" → emailed to management team

### Journey 3: Task board management
1. Coordinator opens TaskBoardPage → sees Kanban columns
2. Note: task "Reorder HVAC parts" is stuck in "In Progress" for 3 days
3. Coordinator assigns to different technician by dragging to their name
4. Creates new task "Follow up with vendor" via "New Task" button
5. Task appears in "Todo" column

---

## 13. Future Integrations

| Integration | Type | Purpose |
|-------------|------|---------|
| tasks table | DB | Task storage |
| tickets table | DB | Dispatch context |
| appointments table | DB | Dashboard data |
| technicians table | DB | Availability |
| operations_log table | DB | Audit trail |
| operations-coordinator | Agent | Recommendations |
| urgent-dispatch | Workflow | Dispatch lifecycle |
| daily-standup | Workflow | Auto-generated reports |
| create-operations-tasks | Function | Automated task creation |
| dispatch-notifications | Function | Notify stakeholders |
