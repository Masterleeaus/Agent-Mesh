# Backend Dependencies

## Required Backend Services

### 1. Jobs API Service

**Purpose:** CRUD operations for technician jobs, including status transitions and sub-resources

**Endpoints Required:**
- `GET /api/v2/jobs` — List with filters, search, pagination
- `GET /api/v2/jobs/:id` — Detail with customer, checklist, notes, parts, evidence, messages, timeline
- `PATCH /api/v2/jobs/:id/status` — Update job status
- `POST /api/v2/jobs/:id/notes` — Add service note
- `POST /api/v2/jobs/:id/evidence` — Upload evidence
- `POST /api/v2/jobs/:id/parts/request` — Request parts
- `POST /api/v2/jobs/:id/escalate` — Escalate
- `POST /api/v2/jobs/:id/complete` — Complete
- `POST /api/v2/jobs/:id/pause` — Pause
- `POST /api/v2/jobs/:id/resume` — Resume
- `PATCH /api/v2/jobs/:id/checklist/:itemId` — Update checklist item

**Database Table:** `jobs`

**Fields Required (JobDTO):**
- id, appointmentId, customerId, customerName, customerPhone, customerEmail, customerAddress, customerCity, customerState, customerZip
- serviceType, priority, status, title, description
- scheduledDate, scheduledStart, scheduledEnd, estimatedDuration
- technicianId, technicianName, checklistId, notes, partsRequired
- escalationReason, escalatedTo, pauseReason, pausedAt
- completedAt, completionNotes, signatureData
- latitude, longitude, travelDistance, travelDuration
- createdAt, updatedAt

---

### 2. Customers API Service

**Purpose:** Customer lookup for job detail view

**Endpoints Required:**
- `GET /api/v2/customers/:id` — Get customer with job history

**Database Table:** `customers`

**Fields Required (CustomerDTO):**
- id, name, phone, email, address, city, state, zip
- accountId, accountName, preferredContact, createdAt

---

### 3. Dashboard API Service

**Purpose:** Aggregate technician dashboard data

**Endpoints Required:**
- `GET /api/v2/technician/dashboard` — Dashboard with today's jobs, current job, next appointment, urgent jobs, stats

**Database Tables:** `jobs`, `technician_metrics`

**Required Computations:**
- Today's jobs count
- Current active job
- Next upcoming appointment
- Urgent/high priority jobs
- Completion rate (completed / total)
- Unread messages and notifications

---

### 4. Messages API Service

**Purpose:** Per-job messaging for technician-operations communication

**Endpoints Required:**
- `GET /api/v2/jobs/:id/messages` — List messages
- `POST /api/v2/jobs/:id/messages` — Send message

**Database Table:** `messages`

**Fields Required (MessageDTO):**
- id, jobId, senderId, senderName, senderRole, body, read, createdAt

---

### 5. Notifications API Service

**Purpose:** Push notifications and in-app alerts

**Endpoints Required:**
- `GET /api/v2/technician/notifications` — List all
- `POST /api/v2/technician/notifications/:id/read` — Mark read
- `POST /api/v2/technician/notifications/read-all` — Mark all read

**Database Table:** `notifications`

**Fields Required (NotificationDTO):**
- id, jobId, type, title, message, read, createdAt

---

### 6. Technician Profile API Service

**Purpose:** Profile management and performance metrics

**Endpoints Required:**
- `GET /api/v2/technician/profile` — Get profile
- `PATCH /api/v2/technician/profile` — Update profile

**Database Table:** `technicians`

**Fields Required:**
- id, name, email, phone, role, isOnline, skills, certifications

---

### 7. Parts/Inventory API Service

**Purpose:** Track parts used on jobs and request new inventory

**Endpoints Required:**
- `GET /api/v2/technician/parts/history` — Parts usage history

**Database Table:** `parts`

**Fields Required (PartDTO):**
- id, jobId, name, sku, quantity, unitPrice, totalPrice, category, usedAt

---

## Future AI Agent Integration Points

| Agent Name | Trigger | Input | Output |
|---|---|---|---|
| `parts-recommender` | On job creation | `{ jobType, customerHistory }` | `{ recommendedParts, estimatedCost }` |
| `scheduling-optimizer` | On job assignment | `{ technicianId, allJobs }` | `{ optimizedRoute, ETA }` |
| `issue-classifier` | On service notes added | `{ noteContent }` | `{ issueCategory, severity, suggestedAction }` |

## Future Function Call Points

| Function | Purpose |
|---|---|
| `notify_dispatcher` | Notify dispatcher on status change |
| `request_inventory_fulfillment` | Submit inventory request to warehouse |
| `generate_service_report` | Generate PDF service report after completion |
| `update_customer_portal` | Push evidence and notes to customer portal |
| `send_completion_notification` | Notify customer on job completion |

## Future Event Points

| Event Name | Emitted When | Payload |
|---|---|---|
| `job.accepted` | Technician accepts job | `{ jobId }` |
| `job.rejected` | Technician rejects job | `{ jobId, reason? }` |
| `job.status.changed` | Job status updated | `{ jobId, previousStatus, newStatus }` |
| `job.paused` | Job paused | `{ jobId, reason }` |
| `job.resumed` | Job resumed | `{ jobId }` |
| `job.escalated` | Job escalated | `{ jobId, reason, escalatedTo? }` |
| `job.completed` | Job completed | `{ jobId, completionNotes }` |
| `evidence.uploaded` | Photo/video uploaded | `{ jobId, evidenceId, type }` |
| `signature.captured` | Signature captured | `{ jobId, signatureId }` |
| `message.sent` | Message sent | `{ jobId, messageId }` |
| `inventory.requested` | Parts requested | `{ jobId, requestId, parts }` |
| `offline.sync.completed` | Offline data synced | `{ timestamp, uploaded, downloaded }` |

## Infrastructure Dependencies

| Service | Purpose |
|---|---|
| Lemma SDK (Auth) | User authentication and session management |
| Lemma SDK (DataStore) | CRUD operations on all database tables |
| Lemma SDK (Functions) | Execute platform functions |
| Lemma SDK (Agents) | Invoke AI agents |
| Lemma SDK (Connectors) | SMS/email notifications |
| EventBus (shared) | Cross-application event publishing |
| Geolocation API | GPS-based travel tracking |
| Google Maps / Waze | Navigation integration |

## Current Mock Implementation

All backend dependencies are currently mocked in `src/services/technician-service.ts` using in-memory data from `src/services/mock-data.ts`.

| Method | Mock Behavior |
|---|---|
| `getDashboard()` | Filters today's jobs, computes current/next/urgent + stats |
| `listJobs()` | Filters in-memory `mockJobs`, paginates |
| `getJobById()` | Looks up in `mockJobs`, returns with all related data |
| `updateJobStatus()` | Mutates job status in-place |
| `addNotes()` | Appends to `mockServiceNotes` |
| `uploadEvidence()` | Creates evidence entry with mock URLs |
| `requestParts()` | Appends to `mockParts` |
| `escalateJob()` | Sets status, reason, escalatedTo |
| `completeJob()` | Sets status, notes, completion time, optional signature |
| `pauseJob()` / `resumeJob()` | Toggles status and reason fields |
| `updateChecklistItem()` | Mutates checklist item in-memory |
| `getNotifications()` | Returns sorted `mockNotifications` |
| `getMessages()` / `sendMessage()` | Reads/appends to `mockMessages` |
| `getProfile()` / `updateProfile()` | Returns/mutates `defaultTechnicianProfile` |
| `getSettings()` / `updateSettings()` | Returns/mutates default settings object |

## Integration Checklist

- [ ] Replace `technicianService` implementation with HTTP client calls
- [ ] Wire Lemma SDK auth for protected endpoints
- [ ] Implement real pagination from backend
- [ ] Add real-time updates via WebSocket or polling
- [ ] Connect AI agents for classification and optimization
- [ ] Wire event bus for cross-app communication
- [ ] Add proper error handling with `ApiError` contract
- [ ] Implement offline queue with IndexedDB/localStorage
- [ ] Add background sync when network restored
- [ ] Implement GPS tracking during active jobs
- [ ] Add Waze/Google Maps deep linking for navigation
