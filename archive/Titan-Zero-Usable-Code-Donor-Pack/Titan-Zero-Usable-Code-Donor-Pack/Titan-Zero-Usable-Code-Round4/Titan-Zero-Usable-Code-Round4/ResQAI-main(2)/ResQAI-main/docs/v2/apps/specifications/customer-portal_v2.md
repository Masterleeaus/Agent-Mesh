# Customer Portal v2 — Complete Application Specification

> Phase 3.2 — Application Specifications  
> Status: Implementation-Ready  
> Date: 2026-06-29

---

## 1. Business Objective

Enable end customers to self-manage their entire service relationship — create and track tickets, schedule appointments, monitor disputes, view account health, and update preferences — reducing inbound support calls by 30% and improving customer satisfaction scores by 15 points.

---

## 2. Primary Users

| User Type | Count Estimate | Usage Pattern |
|-----------|---------------|--------------|
| Homeowner | 500-5000 | Monthly, as needed |
| Property Manager | 50-500 | Weekly, multi-property |
| Business Client | 20-200 | Monthly |

---

## 3. User Roles

| Role | Permissions | Scope |
|------|------------|-------|
| customer:self | view_dashboard, view_tickets, create_ticket, view_appointments, book_appointment, view_disputes, manage_account | Own account only |
| customer:business | All self + multi_property | Managed properties |
| customer:admin | All business + manage_users | Account admins |

---

## 4. Business Processes

### 4.1 Ticket Creation Process
```
Customer logs in → Home Dashboard
  → Clicks "Create Ticket"
  → Selects request type (service/billing/complaint/general)
  → Enters subject and description
  → Optionally uploads photos
  → Submits → Ticket created
  → Confirmation shown with ticket ID
  → Email confirmation sent
  → Support center notified (event: ticket.created.customer)
```

### 4.2 Self-Service Appointment Booking
```
Customer navigates to Book Appointment
  → Selects service type from available list
  → Calendar shows available dates (based on service type + duration)
  → Selects date → available time slots shown
  → Selects time slot
  → Confirms booking details
  → Appointment requested
  → Pending assignment confirmation
  → Appointment confirmed (event: appointment.confirmed)
```

### 4.3 Dispute Tracking Process
```
Dispute filed (by customer or agent)
  → Customer sees dispute in DisputesPage
  → Status updates in real-time
  → Resolution offered → customer accepts/rejects
  → Status timeline visible throughout
```

---

## 5. Navigation Flow

```
Top Bar: [Logo] [Global Search] [Notification Bell] [Avatar dropdown: Account, Sign Out]

Sidebar:
  ├── Dashboard (/)
  ├── My Tickets (/tickets)
  ├── Appointments (/appointments)
  ├── Disputes (/disputes)
  └── Account & Health (/account)
```

---

## 6. Screen Flow

```
HomeDashboardPage (/) 
  → Click "Create Ticket" → NewTicketPage (/tickets/new)
  → Click ticket → TicketDetailPage (/tickets/:id)
  → Click "View All" tickets → MyTicketsPage (/tickets)
  → Click appointment card → AppointmentDetailPage (/appointments/:id)
  → Click "Book Appointment" → BookAppointmentPage (/appointments/book)
  → Click dispute → DisputeDetailPage (/disputes/:id)
  → Click "Account" → AccountPage (/account)
  → Click "Account Health" → AccountHealthPage (/account/health)
```

---

## 7. Feature List

| Feature | Priority | Complexity |
|---------|----------|------------|
| Home dashboard (account summary) | P0 | Medium |
| Ticket creation and tracking | P0 | Medium |
| Appointment self-service booking | P0 | High |
| Appointment view/reschedule/cancel | P0 | Medium |
| Dispute status tracking | P1 | Medium |
| Account health view | P1 | Medium |
| Profile editing | P1 | Low |
| Notification preferences | P1 | Low |
| Service history | P2 | Medium |
| Multi-property management | P2 | High |

---

## 8. Module List

| Module | Description |
|--------|-------------|
| Home Dashboard | Account summary, open tickets, upcoming appointments |
| Tickets | Create, list, detail, status timeline |
| Appointments | Book, view, reschedule, cancel |
| Disputes | View, track progress |
| Account | Profile, health, preferences, history |

---

## 9. Permissions

| Permission | Roles |
|------------|-------|
| portal:view_dashboard | All customer roles |
| portal:view_tickets | All customer roles |
| portal:create_ticket | All customer roles (active status) |
| portal:view_appointments | All customer roles |
| portal:book_appointment | All customer roles (active) |
| portal:view_disputes | All customer roles |
| portal:manage_account | All customer roles |
| portal:multi_property | Business, Admin |

---

## 10. Future Backend Dependencies

| Dependency | Type |
|------------|------|
| customers table | Database |
| tickets table | Database |
| appointments table | Database |
| disputes table | Database |
| accounts table | Database |
| followups table | Database |
| ticket-intake workflow | Workflow |
| appointment-assignment workflow | Workflow |
| appointment-reminders workflow | Workflow |
| check-ticket-urgency function | Function |

---

## 11. Screen Specifications

### 11.1 HomeDashboardPage (/) — Customer Home

**Purpose:** Welcome screen with account overview, open tickets, upcoming appointments, and recent activity.

**Entry Points:** App root, sidebar "Dashboard"

**Header:** "Welcome back, [Name]" + last login timestamp

**Toolbar:** None

**Widgets:**
- **AccountSummaryCard**: Account health gauge (mini), open tickets count, next appointment countdown
- **Open Tickets Card**: Last 3 open tickets (subject, status, last update) + "View All" link
- **Upcoming Appointment Card**: Next appointment (date, time, service type, technician name if assigned) + "View Details" link
- **Recent Activity Feed**: Last 10 operations_log entries related to customer
- **Quick Actions**: "Create Ticket", "Book Appointment" buttons

**Loading:** Skeleton dashboard
**Error:** ErrorState + Retry
**Empty State:** Welcome message for new customers with getting-started guide

---

### 11.2 MyTicketsPage (/tickets) — Ticket List

**Purpose:** View all customer tickets with status, search, and filtering.

**Header:** "My Tickets"

**Filters:** Status (all/open/in_progress/resolved/closed), Date range

**Search:** Subject, ticket ID

**Table:** ID, Subject, Status (badge), Created Date, Last Updated

**Actions:** Click row → TicketDetailPage

**Loading:** Skeleton table
**Error:** ErrorState + Retry
**Empty State:** "No tickets yet" + "Create your first ticket" button

---

### 11.3 NewTicketPage (/tickets/new) — Create Ticket

**Purpose:** Quick ticket creation form.

**Form (QuickTicketForm):**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| request_type | Dropdown | Yes | Must select |
| subject | Text input | Yes | Max 200 chars |
| description | Textarea | Yes | Max 5000 chars |
| priority | Dropdown | No | Default: normal |
| attachments | File upload | No | Max 5 files, 10MB each |

**Submit:** Create ticket → emit ticket.created.customer → confirmation page
**Cancel:** Back to MyTicketsPage with discard confirmation

---

### 11.4 TicketDetailPage (/tickets/:id) — Ticket Detail

**Purpose:** Full ticket view with status timeline and message thread.

**Sections:**
- Header: Subject, StatusBadge, Created date
- TicketStatusTimeline (visual progress: submitted → in_review → in_progress → resolved → closed)
- Message thread: customer messages and agent replies (read-only)
- File attachments preview

---

### 11.5 AppointmentsPage (/appointments) — Appointments

**Purpose:** List upcoming and past appointments.

**Header:** "My Appointments"

**Tabs:** Upcoming | Past

**Cards:** AppointmentCard — date, time, service type, technician name (if assigned), status, "View" / "Reschedule" / "Cancel" actions

---

### 11.6 AppointmentDetailPage (/appointments/:id) — Appointment Detail

**Purpose:** Single appointment details with actions.

**Sections:** Service type, date/time, technician info (name, photo), address, notes, status, "Reschedule" / "Cancel" buttons

---

### 11.7 BookAppointmentPage (/appointments/book) — Booking

**Purpose:** Self-service booking flow.

**Wizard (SelfServiceBooking):**
| Step | Content |
|------|---------|
| 1. Service Type | ServiceTypeSelector with descriptions |
| 2. Date | Calendar showing available dates |
| 3. Time | TimeSlotPicker showing available slots |
| 4. Confirm | Summary + notes + Confirm button |

---

### 11.8 DisputesPage (/disputes) — Disputes

**Purpose:** View open and past disputes.

**List:** Dispute ID, appointment reference, status, created date, "View" action

---

### 11.9 DisputeDetailPage (/disputes/:id) — Dispute Detail

**Purpose:** Track dispute resolution progress.

**Widgets:** DisputeStatusCard (status: filed → under_review → resolution_offered → accepted/rejected → resolved), timeline, resolution offer details

---

### 11.10 AccountPage (/account) — Account Settings

**Purpose:** Manage profile, contact info, and notification preferences.

**Sections:**
- ProfileEditor: name, phone, email, address
- NotificationPreferences: toggle channels (email, SMS, in-app) per event type
- Password/security settings

---

### 11.11 AccountHealthPage (/account/health) — Health

**Purpose:** View account health score and history.

**Widgets:** Health gauge, health timeline, recent followups, open disputes count

---

## 12. User Journeys

### Journey 1: Customer creates support ticket
1. Customer logs into portal → HomeDashboardPage
2. Sees account health: 85% (green), no open tickets
3. Clicks "Create Ticket" → NewTicketPage
4. Selects request_type = "Service"
5. Subject: "AC unit not cooling properly"
6. Description: "AC stopped working overnight, temperature 85°F inside"
7. Uploads photo of thermostat reading
8. Clicks "Submit" → confirmation with ticket ID #4582
9. Email confirmation sent
10. Returns to dashboard → ticket now shows in Open Tickets

### Journey 2: Customer books appointment
1. Customer clicks "Book Appointment" from dashboard
2. Step 1: Selects "AC Repair - Standard" (60 min)
3. Step 2: Calendar shows next 14 days, weekends grayed out
4. Selects Wednesday → Step 3: Morning slots available (8-12)
5. Selects 9:00 AM → Step 4: Confirm details
6. Adds notes: "Please call 30 min before arrival"
7. Confirms → "Appointment requested" with pending assignment
8. Next day: notification received "Appointment confirmed - Technician Mike assigned"
9. Dashboard now shows appointment countdown card

### Journey 3: Customer tracks dispute
1. Customer opens Disputes → sees active dispute for service on June 15
2. Opens detail → DisputeStatusCard shows: under_review (step 2 of 5)
3. Timeline shows: Filed Jun 16 → Under Review Jun 17 (current)
4. 2 days later: status → resolution_offered
5. Reviews offer: "50% refund or free re-service"
6. Selects "Accept" → dispute → resolved
7. Notification: "Your dispute has been resolved"

---

## 13. Future Integrations

| Integration | Type |
|-------------|------|
| customers table | DB |
| tickets table | DB |
| appointments table | DB |
| disputes table | DB |
| accounts table | DB |
| followups table | DB |
| ticket-intake | Workflow |
| appointment-assignment | Workflow |
| appointment-reminders | Workflow |
| check-ticket-urgency | Function |
