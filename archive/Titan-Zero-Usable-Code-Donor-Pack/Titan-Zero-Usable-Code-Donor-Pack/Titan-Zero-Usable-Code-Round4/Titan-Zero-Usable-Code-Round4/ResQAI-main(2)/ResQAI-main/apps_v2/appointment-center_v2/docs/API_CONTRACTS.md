# API Contracts

## Future Backend API Endpoints

The following endpoints define the future backend integration contracts. All data shapes are defined in `src/models/`.

---

### Appointments

#### `GET /api/v2/appointments`

List appointments with filtering, search, sorting, and pagination.

**Request Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | `AppointmentStatus[]` | Filter by status |
| `date` | `string` | Filter by exact date |
| `dateFrom` | `string` | Filter from date |
| `dateTo` | `string` | Filter to date |
| `technicianId` | `string` | Filter by technician |
| `serviceTypeId` | `string` | Filter by service type |
| `type` | `AppointmentType` | Filter by appointment type |
| `search` | `string` | Full-text search |
| `page` | `number` | Page number (1-indexed) |
| `pageSize` | `number` | Items per page (default 25) |
| `sortBy` | `string` | Sort field |
| `sortOrder` | `asc | desc` | Sort direction |

**Response:** `AppointmentListResponse`
```typescript
{ appointments: AppointmentDTO[]; total: number; page: number; pageSize: number; }
```

---

#### `GET /api/v2/appointments/:id`

Get full appointment detail with timeline.

**Response:** `AppointmentDetailResponse`
```typescript
{ appointment: AppointmentDTO; timeline: AppointmentHistoryEventDTO[]; }
```

---

#### `POST /api/v2/appointments`

Create a new appointment.

**Request Body:** `CreateAppointmentRequest`
```typescript
{
  customerId: string; serviceTypeId: string; date: string;
  timeSlot: string; technicianId: string; type: AppointmentType;
  notes?: string; customerName?: string; customerPhone?: string;
  customerEmail?: string; customerAddress?: string;
}
```

**Response:** `AppointmentDTO`

---

#### `PATCH /api/v2/appointments/:id`

Update appointment fields.

**Request Body:** `UpdateAppointmentRequest`
```typescript
{ serviceTypeId?: string; date?: string; timeSlot?: string;
  technicianId?: string; type?: AppointmentType; notes?: string; status?: string; }
```

**Response:** `AppointmentDTO`

---

#### `POST /api/v2/appointments/:id/assign`

Assign technician to appointment.

**Request Body:** `AssignTechnicianRequest`
```typescript
{ technicianId: string; notes?: string; }
```

**Response:** `AppointmentDTO`

---

#### `POST /api/v2/appointments/:id/reschedule`

Reschedule appointment.

**Request Body:** `RescheduleRequest`
```typescript
{ newDate: string; newTimeSlot: string; reason: string; }
```

**Response:** `AppointmentDTO`

---

#### `POST /api/v2/appointments/:id/cancel`

Cancel appointment.

**Request Body:** `CancelAppointmentRequest`
```typescript
{ reason: string; cancelledBy: string; }
```

**Response:** `void`

---

#### `POST /api/v2/appointments/:id/complete`

Mark appointment as completed.

**Request Body:** `CompleteAppointmentRequest`
```typescript
{ notes: string; completedBy: string; }
```

**Response:** `void`

---

### Technicians

#### `GET /api/v2/technicians`

List all technicians.

**Response:** `TechnicianListResponse`
```typescript
{ technicians: TechnicianDTO[]; total: number; }
```

---

#### `GET /api/v2/technicians/:id/schedule?date=`

Get technician's schedule for a date.

**Response:** `TechnicianScheduleResponse`
```typescript
{ technician: TechnicianDTO; date: string; slots: { time: string; appointment: AppointmentDTO | null }[]; }
```

---

### Service Types

#### `GET /api/v2/service-types`

List all service types.

**Response:** `ServiceTypeListResponse`
```typescript
{ services: ServiceTypeDTO[]; total: number; }
```

---

#### `POST /api/v2/service-types`

Create service type.

**Request Body:** `CreateServiceTypeRequest`

**Response:** `ServiceTypeDTO`

---

#### `PATCH /api/v2/service-types/:id`

Update service type.

**Request Body:** `UpdateServiceTypeRequest`

**Response:** `ServiceTypeDTO`

---

### Availability

#### `GET /api/v2/availability/slots?date=&serviceTypeId=`

Get available time slots for a date and service type.

**Response:** `AvailableSlotsResponse`
```typescript
{ date: string; serviceTypeId: string; slots: TimeSlotDTO[]; }
```

---

### Dashboard / Stats

#### `GET /api/v2/dashboard/stats`

Get dashboard statistics.

**Response:** `DashboardStatsResponse`
```typescript
{ stats: AppointmentStatsDTO; }
```

---

### Reports

#### `POST /api/v2/reports`

Generate appointment report.

**Request Body:** `GenerateReportRequest`
```typescript
{ dateFrom: string; dateTo: string; groupBy?: string; }
```

**Response:** `ReportResponse`
```typescript
{ report: ReportStatsVM; }
```

---

### Search

#### `GET /api/v2/search?query=`

Global search across appointments, customers, and technicians.

**Response:** `SearchResponse`
```typescript
{ results: SearchResultVM[]; total: number; }
```

---

### History

#### `GET /api/v2/appointments/:id/history`

Get timeline history for a specific appointment.

**Response:** `AppointmentHistoryResponse`
```typescript
{ events: AppointmentHistoryEventDTO[]; total: number; page: number; pageSize: number; }
```

---

#### `GET /api/v2/history?dateFrom=&dateTo=&eventType=`

Get all appointment history with optional filters.

**Response:** `AppointmentHistoryResponse`

---

## Data Models

### Core DTOs (`src/models/dto.ts`)

| Entity | Fields |
|--------|--------|
| `AppointmentDTO` | id, customerId, customerName, customerPhone, customerEmail, customerAddress, serviceTypeId, serviceTypeName, serviceCategory, technicianId, technicianName, date, timeSlot, durationMinutes, status, type, notes, reason, cancelledBy, cancelledAt, rescheduledFrom, rescheduledAt, completedAt, completedNotes, assignedAt, assignedBy, createdAt, updatedAt |
| `TechnicianDTO` | id, name, email, phone, skills, rating, availability, activeAppointments, completedToday, nextAvailable, isOnline, location |
| `ServiceTypeDTO` | id, name, description, category, durationMinutes, requiredSkills, bufferMinutes, isActive |
| `TimeSlotDTO` | start, end, available, label |
| `AppointmentHistoryEventDTO` | id, appointmentId, eventType, description, actorName, actorRole, timestamp, metadata |
| `AppointmentStatsDTO` | totalToday, completedToday, pendingToday, overdue, pendingAssignment, upcomingCount, cancelledCount, averageDuration, onTimeRate |

### Enums
```typescript
AppointmentStatus: Scheduled | Confirmed | InProgress | Completed | Cancelled | NoShow | Rescheduled
AppointmentType: Standard | Emergency | FollowUp | Recurring
ServiceCategory: Repair | Maintenance | Installation | Inspection | Consultation
TechnicianSkill: Electrical | Plumbing | HVAC | Carpentry | Painting | General
```

### Error Contract
```typescript
interface ApiError { code: string; message: string; details?: Record<string, string[]>; }
```

## Future Workflow Trigger Points

| UI Action | Workflow / Function | Trigger |
|-----------|--------------------|---------|
| Create appointment | `appointment.created` event → scheduling agent | `POST /api/v2/appointments` |
| Assign technician | `appointment.assigned` event → notify technician | `POST /api/v2/appointments/:id/assign` |
| Reschedule | `appointment.rescheduled` event → notify customer | `POST /api/v2/appointments/:id/reschedule` |
| Cancel | `appointment.cancelled` event → free slot | `POST /api/v2/appointments/:id/cancel` |
| Complete | `appointment.completed` event → billing trigger | `POST /api/v2/appointments/:id/complete` |
| Conflict | `appointment.conflict_detected` event → alert dispatcher | Background check |
