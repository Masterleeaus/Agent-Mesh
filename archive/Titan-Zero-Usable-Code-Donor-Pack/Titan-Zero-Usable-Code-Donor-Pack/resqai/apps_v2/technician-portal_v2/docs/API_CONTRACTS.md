# API Contracts

## Future Backend API Endpoints

All data shapes are defined in `src/models/`.

---

### Jobs

#### `GET /api/v2/jobs`

List jobs with filtering, search, and pagination.

**Request Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `status` | `JobStatus[]` | Filter by status |
| `serviceType` | `ServiceType[]` | Filter by service type |
| `priority` | `JobPriority[]` | Filter by priority |
| `technicianId` | `string` | Filter by technician |
| `search` | `string` | Full-text search on title/customer/address |
| `dateFrom` | `string` | Filter on or after date |
| `dateTo` | `string` | Filter on or before date |
| `isEscalated` | `boolean` | Filter escalated only |
| `page` | `number` | Page number (1-indexed) |
| `pageSize` | `number` | Items per page (default 25) |

**Response:** `JobListResponse`

---

#### `GET /api/v2/jobs/:id`

Get full job detail with customer, checklist, notes, parts, evidence, messages, and timeline.

**Response:** `JobDetailResponse`

---

#### `PATCH /api/v2/jobs/:id/status`

Update job status.

**Request Body:** `UpdateJobStatusRequest`

---
#### `POST /api/v2/jobs/:id/notes`

Add a service note.

**Request Body:** `AddNotesRequest`
**Response:** `void`

---

#### `POST /api/v2/jobs/:id/evidence`

Upload photo/video evidence.

**Request Body:** `UploadEvidenceRequest`
**Response:** `EvidenceUploadResponse`

---

#### `POST /api/v2/jobs/:id/parts/request`

Request parts from inventory.

**Request Body:** `RequestPartsRequest`
**Response:** `void`

---

#### `POST /api/v2/jobs/:id/escalate`

Escalate a job.

**Request Body:** `EscalateJobRequest`
**Response:** `void`

---

#### `POST /api/v2/jobs/:id/complete`

Complete a job.

**Request Body:** `CompleteJobRequest`
**Response:** `void`

---

#### `POST /api/v2/jobs/:id/pause`

Pause a job.

**Request Body:** `PauseJobRequest`
**Response:** `void`

---

#### `POST /api/v2/jobs/:id/resume`

Resume a paused job.

**Request Body:** `ResumeJobRequest`
**Response:** `void`

---

#### `PATCH /api/v2/jobs/:id/checklist/:itemId`

Update a checklist item.

**Request Body:** `UpdateChecklistItemRequest`
**Response:** `void`

---

### Dashboard

#### `GET /api/v2/technician/dashboard`

Get technician dashboard data.

**Response:** `DashboardResponse`

---

### Customers

#### `GET /api/v2/customers/:id`

Get customer details with job history.

**Response:** `CustomerDetailResponse`

---

### Messages

#### `GET /api/v2/jobs/:id/messages`

Get messages for a job.

**Response:** `MessageDTO[]`

#### `POST /api/v2/jobs/:id/messages`

Send a message for a job.

**Request Body:** `SendMessageRequest`
**Response:** `void`

---

### Notifications

#### `GET /api/v2/technician/notifications`

Get all notifications.

**Response:** `NotificationDTO[]`

#### `POST /api/v2/technician/notifications/:id/read`

Mark notification as read.

**Response:** `void`

#### `POST /api/v2/technician/notifications/read-all`

Mark all notifications as read.

**Response:** `void`

---

### Profile

#### `GET /api/v2/technician/profile`

Get technician profile.

**Response:** `TechnicianDTO`

#### `PATCH /api/v2/technician/profile`

Update technician profile.

**Request Body:** `UpdateProfileRequest`
**Response:** `void`

---

### Settings

#### `GET /api/v2/technician/settings`

Get technician settings.

**Response:** `{ notificationsEnabled, autoAcceptJobs, defaultView, language }`

#### `PATCH /api/v2/technician/settings`

Update technician settings.

**Request Body:** `UpdateSettingsRequest`
**Response:** `void`

---

### Parts

#### `GET /api/v2/technician/parts/history`

Get parts usage history.

**Response:** `PartDTO[]`

---

## Data Models

### Core DTOs (`src/models/dto.ts`)

```typescript
interface JobDTO {
  id: string; appointmentId: string;
  customerId: string; customerName: string; customerPhone: string;
  customerEmail: string; customerAddress: string; customerCity: string;
  customerState: string; customerZip: string;
  serviceType: ServiceType; priority: JobPriority; status: JobStatus;
  title: string; description: string;
  scheduledDate: string; scheduledStart: string; scheduledEnd: string;
  estimatedDuration: number;
  technicianId?: string; technicianName?: string;
  checklistId?: string; notes?: string; partsRequired?: string[];
  escalationReason?: string; escalatedTo?: string;
  pauseReason?: string; pausedAt?: string;
  completedAt?: string; completionNotes?: string;
  signatureData?: string;
  latitude?: number; longitude?: number;
  travelDistance?: number; travelDuration?: number;
  createdAt: string; updatedAt: string;
}

interface CustomerDTO {
  id: string; name: string; phone: string; email: string;
  address: string; city: string; state: string; zip: string;
  accountId?: string; accountName?: string;
  preferredContact: 'phone' | 'email' | 'sms';
  createdAt: string;
}

// Plus: TechnicianDTO, ChecklistDTO, ChecklistItemDTO,
// ServiceNoteDTO, PartDTO, EvidenceDTO, SignatureDTO,
// MessageDTO, NotificationDTO, TimelineEventDTO
```

### Enums

```typescript
type JobStatus = 'assigned' | 'en_route' | 'on_site' | 'in_progress' | 'paused' | 'completed' | 'cancelled' | 'escalated';
type JobPriority = 'low' | 'normal' | 'high' | 'urgent';
type ServiceType = 'installation' | 'repair' | 'maintenance' | 'inspection' | 'emergency' | 'follow_up';
type EvidenceType = 'photo' | 'video' | 'signature';
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
|---|---|---|
| Accept Job | `job.accepted` event -> assign technician | `PATCH /api/v2/jobs/:id/status` |
| Pause Job | `job.paused` event -> notify dispatcher | `POST /api/v2/jobs/:id/pause` |
| Complete Job | `job.completed` event -> generate invoice | `POST /api/v2/jobs/:id/complete` |
| Escalate Job | `job.escalated` event -> notify manager | `POST /api/v2/jobs/:id/escalate` |
| Request Parts | `inventory.requested` event -> warehouse | `POST /api/v2/jobs/:id/parts/request` |
| Upload Evidence | `evidence.uploaded` event -> customer portal | `POST /api/v2/jobs/:id/evidence` |
| Signature Captured | `signature.captured` event -> close work order | Automatically via completion |
