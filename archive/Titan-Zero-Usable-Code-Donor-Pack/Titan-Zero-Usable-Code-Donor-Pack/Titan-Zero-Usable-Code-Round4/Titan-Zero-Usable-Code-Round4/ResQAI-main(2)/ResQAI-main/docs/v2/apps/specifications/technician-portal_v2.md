# Technician Portal v2 — Complete Application Specification

> Phase 3.2 — Application Specifications  
> Status: Implementation-Ready  
> Date: 2026-06-29

---

## 1. Business Objective

Provide a mobile-first field portal for technicians to view their daily schedule, manage job status (en route → on site → completed), upload completion evidence, and communicate with operations — reducing admin overhead by 30% and improving job completion data accuracy.

---

## 2. Primary Users

| User Type | Count Estimate | Usage Pattern |
|-----------|---------------|--------------|
| Field Technician | 20-200 | Daily, on-site |
| Senior/Lead Technician | 3-10 | Daily, oversight |
| Operations Coordinator | 3-10 | Monitor technician status |

---

## 3. User Roles

| Role | Permissions | Scope |
|------|------------|-------|
| technician:field | view_schedule, update_status, view_tasks, complete_tasks, view_notifications, manage_profile | Self only |
| technician:senior | All field + override_assignment, approve_completion | Self + team oversight |
| technician:admin | All + manage_availability | Full |

---

## 4. Business Processes

### 4.1 Daily Job Flow
```
Technician logs in → My Day dashboard
  → View first job card (address, time, customer, type)
  → Navigate to job (map link)
  → Update status: en_route
  → Arrive on site → update status: on_site
  → Complete service → update status: in_progress
  → Upload photos + notes
  → Mark complete → status: completed
  → Next job → repeat
  → End of day → update availability → off_shift
```

### 4.2 Task Completion Process
```
Operations assigns task to technician
  → Task appears in TaskListPage
  → Technician views task details
  → Completes task → marks done
  → Task recorded in operations_log
  → Operations notified
```

---

## 5. Navigation Flow

```
Top Bar: [Logo] [Notification Bell] [Avatar]

Bottom Navigation (mobile-first):
  ├── My Day (/)
  ├── Jobs (/appointments)
  ├── Tasks (/tasks)
  ├── Notifications (/notifications)
  └── Profile (/profile)
```

---

## 6. Screen Flow

```
MyDayPage (/) 
  → Click job card → AppointmentDetailPage (/appointments/:id)
  → Click task → TaskDetailPage (/tasks/:id)
  → Bottom nav → AppointmentsPage (/appointments)
  → Bottom nav → TaskListPage (/tasks)
  → Bottom nav → NotificationsPage (/notifications)
  → Bottom nav → ProfilePage (/profile)
```

---

## 7. Feature List

| Feature | Priority | Complexity |
|---------|----------|------------|
| Daily schedule view (My Day) | P0 | Medium |
| Job status lifecycle updates | P0 | Medium |
| Job detail with customer info | P0 | Medium |
| Photo upload for job evidence | P0 | Medium |
| Job notes editor | P0 | Low |
| Turn-by-turn navigation link | P0 | Low |
| Task list with status updates | P1 | Medium |
| Notification feed | P1 | Low |
| Availability toggle | P1 | Low |
| Skill profile management | P2 | Low |

---

## 8. Module List

| Module | Description |
|--------|-------------|
| My Day | Today's schedule, next job, notifications summary |
| Jobs | All assigned appointments with detail |
| Tasks | Assigned operational tasks |
| Notifications | Notification history |
| Profile | Availability, skills, contact |

---

## 9. Permissions

| Permission | Roles |
|------------|-------|
| technician:view_schedule | All technician roles |
| technician:update_status | All technician roles |
| technician:view_tasks | All technician roles |
| technician:complete_tasks | All technician roles |
| technician:view_notifications | All technician roles |
| technician:manage_profile | All technician roles |
| technician:override_assignment | Senior, Admin |
| technician:approve_completion | Senior, Admin |

---

## 10. Future Backend Dependencies

| Dependency | Type |
|------------|------|
| appointments table | Database |
| tasks table | Database |
| technicians table | Database |
| customers table | Database |
| notifications_v2 table | Database |
| operations_log table | Database |
| appointment-assignment workflow | Workflow |
| appointment-reminders workflow | Workflow |
| urgent-dispatch workflow | Workflow |
| dispatch-notifications function | Function |
| fetch-upcoming-appointments function | Function |

---

## 11. Screen Specifications

### 11.1 MyDayPage (/) — Daily Dashboard

**Purpose:** Mobile-first home screen showing today's schedule, next job countdown, and unread notifications.

**Entry Points:** App root, bottom nav "My Day"

**Header:** "Good morning, [Technician Name]" + today's date

**Widgets:**
- **Next Job Card**: Countdown timer to next appointment, address, customer name, service type, "Navigate" button (opens maps)
- **DaySchedule**: Vertical timeline of today's jobs (JobCard per appointment)
- **Notification Brief**: Last 3 unread notifications with "View All" link

**Cards:** JobCard — time, customer name, address, service type, StatusBadge (scheduled/en_route/on_site/in_progress/completed)

**Actions:** Click JobCard → AppointmentDetailPage, "Navigate" → external maps app

**Loading:** Skeleton cards
**Error:** ErrorState + Retry
**Empty State:** "No jobs scheduled today" with cheerful message

---

### 11.2 AppointmentsPage (/appointments) — All Jobs

**Purpose:** List all assigned appointments with filtering.

**Filters:** Status (all/scheduled/en_route/on_site/completed), Date range

**Search:** Customer name, address

**List:** JobCard list with status, sortable by date/time

**Pagination:** Load more (infinite scroll)

---

### 11.3 AppointmentDetailPage (/appointments/:id) — Job Detail

**Purpose:** Full job details — customer info, job stepper, notes, photos.

**Tabs:**
- **Job Details**: CustomerInfoPanel (name, phone, address, notes), service type, scheduled time
- **Status**: JobStatusStepper (en_route → on_site → in_progress → completed), current step highlighted
- **Notes & Photos**: JobNotesEditor (rich text), PhotoUploader (camera/gallery, multiple photos)
- **Activity**: TaskChecklist (assigned tasks), timestamps

**Actions:**
| Action | Button | Position | Confirmation | Result |
|--------|--------|----------|--------------|--------|
| En Route | "I'm on my way" | Stepper | None | Status → en_route |
| On Site | "I've arrived" | Stepper | None | Status → on_site |
| Start Service | "Starting work" | Stepper | None | Status → in_progress |
| Complete | "Job Complete" | Stepper | Dialog: confirm photos added | Status → completed |
| Add Photo | Camera icon | Photo section | None | Photo uploaded |
| Call Customer | Phone icon | Customer panel | None | Opens phone dialer |
| Navigate | Map icon | Customer panel | None | Opens maps app |

**JobStatusStepper Component:**
| Props | currentStatus, enabled, onStatusChange |
|-------|----------------------------------------|
| States | Loading (checking permissions), Disabled (step not available), Active (clickable) |
| Validation | Cannot mark complete without at least 1 photo |

**Loading:** Skeleton with tabs
**Error:** ErrorState + Retry
**Empty State:** "Job not found"

---

### 11.4 TaskListPage (/tasks) — Technician Tasks

**Purpose:** View operational tasks assigned to technician.

**List:** Task items with title, priority badge, due date, status (todo/in_progress/done)

**Filters:** Status, Priority

**Actions:** Click task → TaskDetailPage, Checkbox to mark complete

---

### 11.5 TaskDetailPage (/tasks/:id) — Task Detail

**Purpose:** View and complete a single task.

**Sections:** Task title, description, priority, due date, assigned by, notes, "Mark Complete" button

---

### 11.6 NotificationsPage (/notifications) — Notification History

**Purpose:** Chronological list of all notifications.

**List:** NotificationFeed component — icon, title, message, timestamp, read/unread indicator

**Actions:** Click notification → deep link to relevant page, "Mark all read"

---

### 11.7 ProfilePage (/profile) — Technician Profile

**Purpose:** Manage personal info, availability, and skills.

**Sections:**
- **Profile**: Name, phone, email (editable with manage_profile permission)
- **AvailabilityToggle**: Available / Busy / Off Shift toggle
- **Skills**: List of skills (read-only from technicians table)

---

## 12. User Journeys

### Journey 1: Technician completes a job
1. Technician opens app → My Day shows first job: "AC Repair - 123 Main St - 9:00 AM"
2. Technician taps "Navigate" → opens Google Maps with address
3. Arrives at 8:55 AM → taps "I'm on site"
4. Completes AC repair → taps "Starting work"
5. Takes 3 photos of completed work via PhotoUploader
6. Adds notes: "Replaced capacitor, system working correctly"
7. Taps "Job Complete" → confirmation dialog
8. Confirms → status → completed
9. Next job appears in My Day

### Journey 2: Technician handles urgent dispatch
1. Technician receives push notification: "Urgent dispatch - Johnson residence"
2. Opens notification → DispatchDetailPage
3. Views customer info and issue description
4. Taps "Accept" → dispatch accepted
5. Navigates to address
6. Completes job with documentation

---

## 13. Future Integrations

| Integration | Type |
|-------------|------|
| appointments table | DB |
| technicians table | DB |
| tasks table | DB |
| customers table | DB |
| notifications_v2 table | DB |
| operations_log table | DB |
| appointment-assignment | Workflow |
| appointment-reminders | Workflow |
| urgent-dispatch | Workflow |
| dispatch-notifications | Function |
| fetch-upcoming-appointments | Function |
