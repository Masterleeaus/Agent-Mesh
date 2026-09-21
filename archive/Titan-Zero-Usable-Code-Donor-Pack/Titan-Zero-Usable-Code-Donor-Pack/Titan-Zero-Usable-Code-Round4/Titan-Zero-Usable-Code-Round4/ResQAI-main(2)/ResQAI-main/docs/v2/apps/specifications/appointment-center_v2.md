# Appointment Center v2 — Complete Application Specification

> Phase 3.2 — Application Specifications  
> Status: Implementation-Ready  
> Date: 2026-06-29

---

## 1. Business Objective

Manage the full appointment lifecycle — booking, scheduling, technician assignment, rescheduling, and cancellation — with AI-powered technician suggestions and conflict detection, reducing scheduling conflicts to zero and improving technician utilization by 20%.

---

## 2. Primary Users

| User Type | Count Estimate | Usage Pattern |
|-----------|---------------|--------------|
| Scheduling Coordinator | 2-8 | Daily, full shift |
| Operations Coordinator | 3-10 | Daily, coordination |
| Service Manager | 2-5 | Daily, approval oversight |
| Technician | 20-200 | Read-only own schedule |

---

## 3. User Roles

| Role | Permissions | Scope |
|------|------------|-------|
| appointment:scheduler | view, create, edit, reschedule, cancel | All appointments |
| appointment:manager | All + assign_technician, approve, manage_services | Manage + service config |
| appointment:technician | view (own schedule only), update_status | Self only |
| appointment:admin | All + manage_settings, system config | Full |

---

## 4. Business Processes

### 4.1 Booking Process
```
Customer requests appointment (portal) OR coordinator books manually
  → Select service type → duration set
  → Select date → available time slots shown
  → Select time slot
  → AI suggests best technician (skill + availability + rating)
  → Manager approves assignment (if required)
  → Appointment confirmed
  → Customer notified (email/SMS)
  → Technician notified
  → 24h reminder sent
  → 2h reminder sent
```

### 4.2 Rescheduling Process
```
Customer/coordinator requests reschedule
  → Reason recorded
  → New date/time selected
  → Availability rechecked
  → Technician reassigned if needed
  → Appointment updated
  → All parties notified
```

### 4.3 Completion Process
```
Technician marks appointment in_progress → on_site → completed
  → Appointment status → completed
  → Customer notified
  → Satisfaction survey triggered
  → If dispute filed → resolution-center notified
```

---

## 5. Navigation Flow

```
Top Bar: [App Switcher] [Search] [Bell] [Avatar]

Sidebar:
  ├── Schedule Board (/)
  ├── New Appointment (/appointments/new)
  ├── Technician Schedules (/technicians)
  ├── Service Types (/services)
  └── Settings (/settings)
```

---

## 6. Screen Flow

```
ScheduleBoardPage (/) 
  → Click appointment → AppointmentDetailPage (/appointments/:id)
  → Click "New Appointment" → NewAppointmentPage (/appointments/new)
  → Click reschedule → ReschedulePage (/appointments/:id/reschedule)
  → Click technician → TechnicianSchedulePage (/technicians/:id/schedule)
  → Navigate → ServiceTypesPage (/services)
  → Navigate → SettingsPage (/settings)
```

---

## 7. Feature List

| Feature | Priority | Complexity |
|---------|----------|------------|
| Schedule calendar (day/week/month) | P0 | High |
| Appointment CRUD | P0 | Medium |
| AI technician suggestion | P0 | High |
| Conflict detection | P0 | Medium |
| Booking wizard (self-service) | P1 | Medium |
| Time slot availability | P0 | Medium |
| Technician schedule view | P0 | Medium |
| Service type management | P1 | Low |
| Schedule settings (buffers, rules) | P1 | Medium |
| Appointment reminders | P1 | Medium |
| Bulk rescheduling | P2 | High |

---

## 8. Module List

| Module | Description |
|--------|-------------|
| Schedule Calendar | Day/week/month calendar views |
| Appointment Management | Create, read, update, cancel |
| Technician Scheduling | Per-tech schedule, assignment |
| Service Catalog | Service type configuration |
| Settings | Scheduling rules, constraints |

---

## 9. Permissions

| Permission | Roles |
|------------|-------|
| appointment:view | All roles |
| appointment:create | Scheduler, Manager, Admin |
| appointment:edit | Scheduler, Manager, Admin |
| appointment:assign_technician | Manager, Admin |
| appointment:approve | Manager, Admin |
| appointment:manage_services | Manager, Admin |
| appointment:manage_settings | Admin |

---

## 10. Future Backend Dependencies

| Dependency | Type |
|------------|------|
| appointments table | Database |
| technicians table | Database |
| customers table | Database |
| service_types_v2 table | Database |
| operations_log table | Database |
| tech-suggester agent | Agent |
| appointment-assignment workflow | Workflow |
| appointment-reminders workflow | Workflow |
| assign-appointment-technician function | Function |
| fetch-upcoming-appointments function | Function |

---

## 11. Screen Specifications

### 11.1 ScheduleBoardPage (/) — Calendar Schedule View

**Purpose:** Central calendar-based view of all appointments for scheduling coordination.

**Header:** "Schedule Board" with date range display

**Toolbar:** Date navigation (prev/next/today), view toggle (day/week/month), "New Appointment" button

**Filters:** Status (all/scheduled/in_progress/completed/cancelled), Technician, Service Type

**Search:** Customer name, appointment ID

**Calendar:** ScheduleCalendar component — day columns (day view) or week/month grid. Each cell shows AppointmentCard with time, customer, service type, technician, status badge

**Actions:** Click appointment → AppointmentDetailPage, drag to reschedule (day view), right-click for context menu

**Loading:** Skeleton calendar grid
**Error:** ErrorState + Retry
**Empty State:** "No appointments for this period" + "Book an Appointment" button

---

### 11.2 NewAppointmentPage (/appointments/new) — Create Appointment

**Purpose:** Manual appointment booking by coordinator.

**Form (BookingWizard):**
| Step | Fields | Validation |
|------|--------|------------|
| 1. Customer | customer_search (typeahead) | Required |
| 2. Service | service_type (dropdown with durations) | Required |
| 3. Date/Time | date_picker, time_slot grid (available slots) | Required, future date |
| 4. Technician | technician selector (AI suggestion + manual) | Required |
| 5. Confirm | notes (optional), conflict summary | Review all |

**ConflictWarning:** Visual indicator if overlapping appointments detected

**Submit:** Create appointment → emit appointment.created → redirect to AppointmentDetailPage

---

### 11.3 AppointmentDetailPage (/appointments/:id) — Appointment Detail

**Purpose:** Full appointment view with customer info, technician assignment, timeline, and actions.

**Sections:**
- Header: Customer name, service type, date/time, StatusBadge
- Appointment Info: Duration, notes, address
- Technician Card: Name, phone, skill, status
- AppointmentTimeline: Created → Scheduled → Assigned → In Progress → Completed
- Customer Info Panel: Name, phone, email, linked tickets
- Quick Actions: Reschedule, Cancel, Reassign Technician, Mark Complete

**Actions:**
| Action | Permission | Confirmation | Result |
|--------|------------|--------------|--------|
| Reschedule | edit | Date/time picker | → ReschedulePage |
| Cancel | edit | "Are you sure?" + reason | Cancel with notification |
| Reassign | assign_technician | Select technician | Update assignment |
| Mark Complete | edit | Confirm | Status → completed |

---

### 11.4 ReschedulePage (/appointments/:id/reschedule) — Reschedule Flow

**Purpose:** Change appointment date/time with conflict detection.

**Form:** new_date (required, future), new_time_slot (required, from available slots), reason (required), notify_customer (checkbox, default: true)

**Submit:** Update appointment → emit appointment.status.changed → redirect to detail

---

### 11.5 TechnicianSchedulePage (/technicians/:id/schedule) — Tech Schedule

**Purpose:** View a single technician's schedule for a day/week.

**View:** TechnicianDayView — timeline of appointments for the selected day, with customer name, address, time, status

**Navigation:** Prev/next day, jump to date, back to all technicians

---

### 11.6 ServiceTypesPage (/services) — Service Catalog

**Purpose:** Manage the catalog of service types offered.

**Table:** Name, Description, Duration (min), Required Skills, Buffer (min), Active toggle

**Actions:** Create, Edit, Deactivate service type (manage_services)

---

### 11.7 ScheduleSettingsPage (/settings) — Configuration

**Purpose:** Configure scheduling rules, buffers, constraints.

**Sections:** Default appointment duration, Buffer time between appointments, Max appointments per technician per day, Working hours (per day), Holiday schedule, Auto-assignment rules

---

## 12. User Journeys

### Journey 1: Coordinator books appointment
1. Coordinator opens ScheduleBoardPage, sees today's calendar
2. Notices an open slot at 2 PM, customer on phone wants service
3. Clicks "New Appointment" → BookingWizard starts
4. Searches customer by name → selects
5. Selects "AC Repair" (60 min) → date = today → slot 2:00 PM
6. AI suggests Tech #3 (skill match 95%, availability: free)
7. Coordinator confirms → AppointmentDetailPage
8. Appointment confirmed, customer gets email, tech gets push notification

### Journey 2: Customer reschedules via portal
1. Customer clicks "Reschedule" on AppointmentDetailPage (customer-portal)
2. Event received → ReschedulePage opens
3. Customer selects next Thursday, 10 AM slot
4. Reason: "Work schedule conflict"
5. Confirms → appointment updated
6. Coordinator sees change in real-time on ScheduleBoardPage
7. Technician notified of schedule change

---

## 13. Future Integrations

| Integration | Type |
|-------------|------|
| appointments table | DB |
| service_types_v2 table | DB |
| technicians table | DB |
| customers table | DB |
| operations_log table | DB |
| tech-suggester | Agent |
| appointment-assignment | Workflow |
| appointment-reminders | Workflow |
| assign-appointment-technician | Function |
| fetch-upcoming-appointments | Function |
