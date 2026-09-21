# Backend Dependencies

## Required Backend Services

### 1. Operations API Service

**Purpose:** CRUD operations for field operations, filtering, search, pagination

**Endpoints Required:**
- `GET /api/v2/operations` — List with filters, search, pagination
- `GET /api/v2/operations/:id` — Detail with technician, dispatches, timeline, escalations
- `POST /api/v2/operations/:id/dispatch` — Dispatch to technician
- `POST /api/v2/operations/:id/reassign` — Reassign technician
- `POST /api/v2/operations/:id/escalate` — Escalate
- `POST /api/v2/operations/:id/close` — Close operation
- `PATCH /api/v2/operations/:id/status` — Update status

**Database Table:** `operations`

**Fields Required (OperationDTO):**
- id, title, description, type, priority, status
- customerId, customerName, customerAddress, customerPhone
- technicianId, technicianName, region
- scheduledStart, scheduledEnd, actualStart, actualEnd
- estimatedDuration, notes
- escalationReason, escalatedTo
- conflictWarning, createdAt, updatedAt, completedAt

---

### 2. Technicians API Service

**Purpose:** Technician directory and live status

**Endpoints Required:**
- `GET /api/v2/technicians` — List all
- `GET /api/v2/technicians/status` — Status summary

**Database Table:** `technicians`

**Fields Required (TechnicianDTO):**
- id, name, email, phone, status
- currentOperationId, region, skills
- rating, completedJobs, isOnline
- currentLatitude, currentLongitude, lastLocationUpdate
- avatarUrl, createdAt

---

### 3. Dispatch Queue API Service

**Purpose:** Manage dispatch records

**Endpoints Required:**
- `GET /api/v2/dispatch-queue` — Queue summary

**Database Table:** `dispatches`

**Fields Required (DispatchDTO):**
- id, operationId, technicianId, technicianName
- method, dispatchedBy, dispatchedAt
- estimatedArrival, actualArrival
- status, notes

---

### 4. Escalations API Service

**Purpose:** Manage escalation records

**Endpoints Required:**
- `GET /api/v2/escalations` — List all escalations

**Database Table:** `escalations`

**Fields Required (EscalationDTO):**
- id, operationId, operationTitle, reason
- escalatedBy, escalatedTo, priority
- status, createdAt, resolvedAt, resolution

---

### 5. Timeline API Service

**Purpose:** Activity log for operations

**Endpoints Required:**
- `GET /api/v2/timeline` — All timeline events

**Database Table:** `operations_timeline`

**Fields Required (TimelineEventDTO):**
- id, operationId, type, description
- actorName, metadata, createdAt

---

### 6. Regions API Service

**Purpose:** Regional aggregation data

**Endpoints Required:**
- `GET /api/v2/regions` — Region status data

**Database Table:** `regions` (or computed from `operations` and `technicians`)

**Fields Required (RegionDTO):**
- id, name, activeTechnicians, pendingOperations
- inProgressOperations, completedToday, color

---

### 7. Dashboard Metrics API Service

**Purpose:** Aggregated KPIs for the operations dashboard

**Endpoints Required:**
- `GET /api/v2/dashboard/metrics` — All dashboard metrics

**Database Tables:** `operations`, `technicians`, `dispatches`, `escalations`

**Required Computations:**
- Active ticket count and trend
- Active technician count and trend
- Pending dispatch count and trend
- High priority count and trend
- Overdue job count and trend
- Completed today count
- Live metrics (response time, completion time, fix rate, satisfaction, on-time arrival, idle time)
- Regional status breakdown

---

## Future AI Agent Integration Points

| Agent Name | Trigger | Input | Output |
|-----------|---------|-------|--------|
| `dispatch-optimizer` | On dispatch queue change | `{ pendingOperations, availableTechnicians }` | `{ suggestedAssignments, confidence }` |
| `scheduling-advisor` | On operation creation | `{ operation, technicianAvailability }` | `{ suggestedTimeSlot, confidence }` |
| `conflict-detector` | On dispatch/assignment | `{ operationId, technicianId }` | `{ conflicts: string[], warning }` |
| `route-optimizer` | On dispatch | `{ operation, technicianLocation }` | `{ optimizedRoute, eta }` |
| `escalation-classifier` | On escalation | `{ operationId, reason }` | `{ suggestedPriority, recommendedTarget }` |

## Future Function Call Points

| Function | Purpose |
|----------|---------|
| `dispatch_operation` | Assign operation to technician and send notification |
| `reassign_technician` | Reassign operation and notify both technicians |
| `escalate_operation` | Escalate operation and notify management |
| `close_operation` | Close operation and trigger completion workflow |
| `notify_technician` | Send push notification to technician mobile app |
| `notify_customer` | Send status update to customer via preferred channel |
| `generate_operation_report` | Generate PDF/CSV report |

## Future Event Points

| Event Name | Emitted When | Payload |
|-----------|-------------|---------|
| `operation.created` | New operation created | `{ operation: OperationDTO }` |
| `operation.dispatched` | Operation dispatched to technician | `{ operationId, technicianId, method }` |
| `operation.assigned` | Technician assigned to operation | `{ operationId, technicianId, technicianName }` |
| `operation.reassigned` | Technician reassigned | `{ operationId, previousTechnicianId, newTechnicianId, reason }` |
| `operation.status.changed` | Operation status updated | `{ operationId, previousStatus, newStatus }` |
| `operation.escalated` | Operation escalated | `{ operationId, reason, escalatedTo }` |
| `operation.closed` | Operation closed | `{ operationId, resolution }` |
| `technician.status.changed` | Technician status changed | `{ technicianId, previousStatus, newStatus }` |
| `operation.conflict.detected` | Scheduling conflict detected | `{ operationId, technicianId, conflictingOperationId, warning }` |

## Infrastructure Dependencies

| Service | Purpose |
|---------|---------|
| Lemma SDK (Auth) | User authentication and session management |
| Lemma SDK (DataStore) | CRUD operations on all database tables |
| Lemma SDK (Functions) | Execute platform functions |
| Lemma SDK (Agents) | Invoke AI agents |
| Lemma SDK (Connectors) | Send notifications via email/push/sms |
| EventBus (shared) | Cross-application event publishing/subscription |

## Current Mock Implementation

All backend dependencies are currently mocked in `src/services/operations-service.ts` using in-memory data from `src/services/mock-data.ts`. The mocking strategy:

| Method | Mock Behavior |
|--------|--------------|
| `list()` | Filters in-memory `mockOperations`, paginates |
| `getById()` | Looks up in `mockOperations`, returns with related data |
| `getTechnicians()` | Returns `mockTechnicians` array |
| `getTechniciansStatus()` | Computes status counts |
| `getDispatchQueue()` | Filters pending operations |
| `getEscalations()` | Returns `mockEscalations` |
| `getTimeline()` | Returns `mockTimeline` |
| `getRegions()` | Returns `mockRegions` |
| `getDashboardMetrics()` | Returns aggregated metrics |
| `dispatch()` | Updates operation status and technician |
| `reassign()` | Updates operation technician |
| `escalate()` | Sets escalation fields on operation |
| `close()` | Sets completed status and timestamp |
| `updateStatus()` | Updates operation status |
| `search()` | Filters by search query |
| `getDailyOperations()` | Filters by date |
| `getRegionalOperations()` | Filters by region |
| `getCompletedOperations()` | Filters completed operations |

## Integration Checklist

- [ ] Replace `operationsService` implementation with HTTP client calls
- [ ] Wire Lemma SDK auth for protected endpoints
- [ ] Implement real pagination from backend
- [ ] Add real-time updates via WebSocket or polling
- [ ] Connect AI agents for dispatch optimization and conflict detection
- [ ] Wire event bus for cross-app communication
- [ ] Add proper error handling with `ApiError` contract
- [ ] Implement request retry and offline support
- [ ] Add request caching for frequently accessed data
- [ ] Implement technician location tracking
- [ ] Add real-time push notifications for dispatches
