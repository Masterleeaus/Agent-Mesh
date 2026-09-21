# Backend Dependencies

## Required Backend Services

### 1. Appointments API Service

**Purpose:** CRUD operations for appointments, filtering, search, pagination, status transitions

**Endpoints Required:**
- `GET /api/v2/appointments` — List with filters, search, sort, pagination
- `GET /api/v2/appointments/:id` — Detail with timeline
- `POST /api/v2/appointments` — Create
- `PATCH /api/v2/appointments/:id` — Update fields
- `POST /api/v2/appointments/:id/assign` — Assign technician
- `POST /api/v2/appointments/:id/reschedule` — Reschedule
- `POST /api/v2/appointments/:id/cancel` — Cancel
- `POST /api/v2/appointments/:id/complete` — Mark complete

**Database Table:** `appointments`

**Fields Required (AppointmentDTO):**
id, customerId, customerName, customerPhone, customerEmail, customerAddress, serviceTypeId, serviceTypeName, serviceCategory, technicianId, technicianName, date, timeSlot, durationMinutes, status, type, notes, reason, cancelledBy, cancelledAt, rescheduledFrom, rescheduledAt, completedAt, completedNotes, assignedAt, assignedBy, createdAt, updatedAt

---

### 2. Technicians API Service

**Purpose:** Technician directory and schedule views

**Endpoints Required:**
- `GET /api/v2/technicians` — List all technicians
- `GET /api/v2/technicians/:id/schedule?date=` — Get daily schedule

**Database Table:** `technicians`

**Fields Required (TechnicianDTO):**
id, name, email, phone, skills, rating, availability, activeAppointments, completedToday, nextAvailable, isOnline, location

---

### 3. Service Types API Service

**Purpose:** CRUD for service definitions

**Endpoints Required:**
- `GET /api/v2/service-types` — List all
- `POST /api/v2/service-types` — Create
- `PATCH /api/v2/service-types/:id` — Update

**Database Table:** `service_types`

**Fields Required (ServiceTypeDTO):**
id, name, description, category, durationMinutes, requiredSkills, bufferMinutes, isActive

---

### 4. Availability Service

**Purpose:** Time slot availability calculation

**Endpoints Required:**
- `GET /api/v2/availability/slots?date=&serviceTypeId=` — Get available slots

**Required Computations:**
- Overlap with existing appointments
- Technician availability
- Service duration and buffer considerations

---

### 5. Dashboard / Stats Service

**Purpose:** Aggregate metrics for dashboard widgets

**Endpoints Required:**
- `GET /api/v2/dashboard/stats` — Dashboard statistics

**Required Computations:**
- Today's appointment counts by status
- Overdue count
- Pending assignment count
- On-time rate

---

### 6. Reports Service

**Purpose:** Appointment analytics

**Endpoints Required:**
- `POST /api/v2/reports` — Generate report

**Required Computations:**
- Status distribution
- Technician performance
- Service type popularity
- Daily counts
- Completion and cancellation rates

---

### 7. Search Service

**Purpose:** Global search

**Endpoints Required:**
- `GET /api/v2/search?query=` — Search across entities

**Search Targets:**
- Appointments by customer name, ID, service type, technician
- Technicians by name

---

### 8. History Service

**Purpose:** Appointment activity log

**Endpoints Required:**
- `GET /api/v2/appointments/:id/history` — Per-appointment timeline
- `GET /api/v2/history` — Global history with date/type filters

**Database Table:** `appointment_history`

**Fields Required (AppointmentHistoryEventDTO):**
id, appointmentId, eventType, description, actorName, actorRole, timestamp, metadata

---

## Future AI Agent Integration Points

| Agent Name | Trigger | Input | Output |
|-----------|---------|-------|--------|
| `scheduler-optimizer` | On appointment creation | `{ appointmentId, date, timeSlot, technicianId }` | `{ suggestedSlot, confidence, conflicts[] }` |
| `technician-matcher` | On assignment | `{ appointmentId, requiredSkills, location }` | `{ suggestedTechnicians[], rankings }` |
| `conflict-detector` | On schedule change | `{ appointmentId, newDate, newTimeSlot }` | `{ conflicts[], severity }` |
| `report-generator` | Manual trigger | `{ dateFrom, dateTo, type }` | `{ reportData, insights[] }` |

## Future Function Call Points

| Function | Purpose |
|----------|---------|
| `assign_technician` | Assign technician and send notification |
| `reschedule_appointment` | Update time slot and notify customer |
| `cancel_appointment` | Cancel and free resources |
| `generate_appointment_report` | Generate PDF/CSV report |
| `notify_appointment_reminder` | Send reminder before appointment |

## Future Event Points

| Event Name | Emitted When | Payload |
|-----------|-------------|---------|
| `appointment.created` | New appointment created | `{ appointment: AppointmentDTO }` |
| `appointment.assigned` | Technician assigned | `{ appointmentId, technicianId, assignedBy }` |
| `appointment.status.changed` | Status updated | `{ appointmentId, oldStatus, newStatus }` |
| `appointment.cancelled` | Appointment cancelled | `{ appointmentId, reason, cancelledBy }` |
| `appointment.completed` | Appointment completed | `{ appointmentId, technicianId, notes }` |
| `appointment.rescheduled` | Appointment rescheduled | `{ appointmentId, oldDate, newDate, reason }` |
| `appointment.conflict_detected` | Scheduling conflict | `{ appointmentId, conflictType, message }` |
| `appointment.reminder_due` | Reminder time reached | `{ appointmentId, customerId }` |

## Infrastructure Dependencies

| Service | Purpose |
|---------|---------|
| Lemma SDK (Auth) | User authentication and session management |
| Lemma SDK (DataStore) | CRUD operations on all database tables |
| Lemma SDK (Functions) | Execute platform functions |
| Lemma SDK (Agents) | Invoke AI agents |
| Lemma SDK (Connectors) | Send SMS/email notifications |
| EventBus | Cross-application event publishing |

## Current Mock Implementation

All backend dependencies are currently mocked in `src/services/appointment-service.ts` using in-memory data:
- 12 appointments with full field coverage
- 4 technicians with skills and availability
- 5 service types
- 8 time slots
- 15 timeline history events

## Integration Checklist

- [ ] Replace `appointmentService` implementation with HTTP client calls
- [ ] Wire Lemma SDK auth for protected endpoints
- [ ] Implement real pagination from backend
- [ ] Add real-time updates via WebSocket or polling
- [ ] Connect AI agents for scheduling optimization
- [ ] Wire event bus for cross-app communication
- [ ] Add proper error handling with `ApiError` contract
- [ ] Implement request retry and offline support
- [ ] Add request caching for frequently accessed data
