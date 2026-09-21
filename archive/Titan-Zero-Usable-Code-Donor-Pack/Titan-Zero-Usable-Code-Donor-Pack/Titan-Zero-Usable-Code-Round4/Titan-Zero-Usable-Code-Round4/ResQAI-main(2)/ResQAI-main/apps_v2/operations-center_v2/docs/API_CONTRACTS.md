# API Contracts

## Future Backend API Endpoints

The following endpoints define the future backend integration contracts. All data shapes are defined in `src/models/`.

---

### Operations

#### `GET /api/v2/operations`

List operations with filtering, search, and pagination.

**Request Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | `OperationStatus[]` | Filter by status |
| `priority` | `OperationPriority[]` | Filter by priority |
| `type` | `OperationType[]` | Filter by type |
| `region` | `RegionName[]` | Filter by region |
| `technicianId` | `string` | Filter by technician |
| `search` | `string` | Full-text search on title/customer/address |
| `isEscalated` | `boolean` | Filter escalated only |
| `dateFrom` | `string` | Start date filter |
| `dateTo` | `string` | End date filter |
| `page` | `number` | Page number (1-indexed) |
| `pageSize` | `number` | Items per page (default 25) |

**Response:** `OperationsListResponse`

```typescript
{
  data: OperationDTO[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

#### `GET /api/v2/operations/:id`

Get full operation detail with technician, dispatches, timeline, and escalations.

**Response:** `OperationDetailResponse`

```typescript
{
  operation: OperationDTO;
  technician?: TechnicianDTO;
  dispatches: DispatchDTO[];
  timeline: TimelineEventDTO[];
  escalations: EscalationDTO[];
}
```

---

#### `POST /api/v2/operations/:id/dispatch`

Dispatch an operation to a technician.

**Request Body:** `DispatchOperationRequest`

```typescript
{
  operationId: string;
  technicianId: string;
  method: DispatchMethod;
  notes?: string;
}
```

**Response:** `void`

---

#### `POST /api/v2/operations/:id/reassign`

Reassign an operation to a different technician.

**Request Body:** `ReassignTechnicianRequest`

```typescript
{
  operationId: string;
  currentTechnicianId: string;
  newTechnicianId: string;
  reason: string;
}
```

**Response:** `void`

---

#### `POST /api/v2/operations/:id/escalate`

Escalate an operation with reason and optional target.

**Request Body:** `EscalateOperationRequest`

```typescript
{
  operationId: string;
  reason: string;
  escalateTo?: string;
}
```

**Response:** `void`

---

#### `POST /api/v2/operations/:id/close`

Close a completed operation.

**Request Body:** `CloseOperationRequest`

```typescript
{
  operationId: string;
  resolution: string;
  actualDuration?: number;
}
```

**Response:** `void`

---

#### `PATCH /api/v2/operations/:id/status`

Update operation status.

**Request Body:** `UpdateOperationStatusRequest`

```typescript
{
  operationId: string;
  status: OperationStatus;
  notes?: string;
}
```

**Response:** `void`

---

### Technicians

#### `GET /api/v2/technicians`

List all technicians.

**Response:** `TechniciansListResponse`

```typescript
{
  data: TechnicianDTO[];
  total: number;
}
```

---

#### `GET /api/v2/technicians/status`

Get technician status summary.

**Response:** `TechniciansStatusResponse`

```typescript
{
  data: TechnicianDTO[];
  total: number;
  available: number;
  enRoute: number;
  onSite: number;
  offline: number;
}
```

---

### Dispatch Queue

#### `GET /api/v2/dispatch-queue`

Get dispatch queue summary.

**Response:** `DispatchQueueResponse`

```typescript
{
  data: DispatchDTO[];
  total: number;
  pendingCount: number;
}
```

---

### Escalations

#### `GET /api/v2/escalations`

List all escalations.

**Response:** `EscalationsListResponse`

```typescript
{
  data: EscalationDTO[];
  total: number;
  openCount: number;
}
```

---

### Timeline

#### `GET /api/v2/timeline`

Get all timeline events.

**Response:** `TimelineResponse`

```typescript
{
  data: TimelineEventDTO[];
  total: number;
}
```

---

### Regions

#### `GET /api/v2/regions`

Get all regions and their status.

**Response:** `RegionsListResponse`

```typescript
{
  data: RegionDTO[];
}
```

---

### Dashboard

#### `GET /api/v2/dashboard/metrics`

Get dashboard metrics.

**Response:** `DashboardMetricsResponse`

```typescript
{
  metrics: DashboardMetricsVM;
  liveMetrics: LiveMetricVM[];
  regionalStatus: RegionalStatusVM[];
}
```

---

## Data Models

### Core DTOs (`src/models/dto.ts`)

```typescript
interface OperationDTO {
  id: string;
  title: string;
  description: string;
  type: OperationType;
  priority: OperationPriority;
  status: OperationStatus;
  customerId: string;
  customerName: string;
  customerAddress: string;
  customerPhone?: string;
  technicianId?: string;
  technicianName?: string;
  region: RegionName;
  scheduledStart?: string;
  scheduledEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  estimatedDuration: number;
  notes?: string;
  escalationReason?: string;
  escalatedTo?: string;
  conflictWarning?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface TechnicianDTO {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: TechnicianStatus;
  currentOperationId?: string;
  region: RegionName;
  skills: string[];
  rating: number;
  completedJobs: number;
  isOnline: boolean;
  currentLatitude?: number;
  currentLongitude?: number;
  lastLocationUpdate?: string;
  avatarUrl?: string;
  createdAt: string;
}

interface DispatchDTO {
  id: string;
  operationId: string;
  technicianId: string;
  technicianName: string;
  method: DispatchMethod;
  dispatchedBy: string;
  dispatchedAt: string;
  estimatedArrival?: string;
  actualArrival?: string;
  status: 'pending' | 'accepted' | 'declined' | 'en_route' | 'completed';
  notes?: string;
}

interface RegionDTO {
  id: RegionName;
  name: string;
  activeTechnicians: number;
  pendingOperations: number;
  inProgressOperations: number;
  completedToday: number;
  color: string;
}

interface EscalationDTO {
  id: string;
  operationId: string;
  operationTitle: string;
  reason: string;
  escalatedBy: string;
  escalatedTo?: string;
  status: 'open' | 'acknowledged' | 'resolved' | 'closed';
  priority: OperationPriority;
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
}

interface TimelineEventDTO {
  id: string;
  operationId: string;
  type: 'dispatch' | 'assignment' | 'status_change' | 'note' | 'escalation' | 'completion' | 'conflict';
  description: string;
  actorName: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
```

### Enums

```typescript
type OperationStatus = 'pending_dispatch' | 'dispatched' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled' | 'escalated';
type OperationPriority = 'low' | 'normal' | 'high' | 'critical';
type OperationType = 'installation' | 'repair' | 'maintenance' | 'inspection' | 'consultation' | 'delivery' | 'pickup' | 'emergency';
type TechnicianStatus = 'available' | 'en_route' | 'on_site' | 'on_break' | 'offline' | 'completed';
type DispatchMethod = 'auto' | 'manual' | 'scheduled';
type RegionName = 'northeast' | 'southeast' | 'midwest' | 'southwest' | 'west' | 'national';
```

### Error Contract

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}
```

## Future Workflow Trigger Points

| UI Action | Workflow / Function | Trigger |
|-----------|--------------------|---------|
| Dispatch operation | `operation.dispatched` event → notify technician | `POST /api/v2/operations/:id/dispatch` |
| Reassign technician | `operation.reassigned` event → notify both techs | `POST /api/v2/operations/:id/reassign` |
| Escalate operation | `operation.escalated` event → notify manager | `POST /api/v2/operations/:id/escalate` |
| Close operation | `operation.closed` event → update customer portal | `POST /api/v2/operations/:id/close` |
| Status change | `operation.status.changed` event → update timeline | `PATCH /api/v2/operations/:id/status` |
| Conflict detection | `operation.conflict.detected` event → alert dispatcher | Background check |
| Technician offline | `technician.status.changed` event → reassign ops | Background check |
