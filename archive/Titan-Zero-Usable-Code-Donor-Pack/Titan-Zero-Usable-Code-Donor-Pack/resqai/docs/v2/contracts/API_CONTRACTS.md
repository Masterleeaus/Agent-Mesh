# RESQAI V2 — API Contracts

> Phase 3.3 — Integration Contracts  
> Principal Enterprise Solution Architect  
> Date: 2026-06-29

---

## Table of Contents

1. [API Design Standards](#1-api-design-standards)
2. [Support Domain APIs](#2-support-domain-apis)
3. [Operations Domain APIs](#3-operations-domain-apis)
4. [Appointment Domain APIs](#4-appointment-domain-apis)
5. [Technician Domain APIs](#5-technician-domain-apis)
6. [Resolution Domain APIs](#6-resolution-domain-apis)
7. [CRM Domain APIs](#7-crm-domain-apis)
8. [Analytics Domain APIs](#8-analytics-domain-apis)
9. [Customer Domain APIs](#9-customer-domain-apis)
10. [Admin Domain APIs](#10-admin-domain-apis)
11. [Shared API Patterns](#11-shared-api-patterns)

---

## 1. API Design Standards

### Base URL Pattern

```
/api/v2/{domain}/{resource}
```

### Common Headers

| Header | Required | Description |
|--------|----------|-------------|
| Authorization | Yes | Bearer token (Lemma JWT) |
| X-Correlation-Id | Yes | UUID for request tracing |
| X-Idempotency-Key | For mutations | UUID for idempotent writes |
| Accept | Yes | application/json |
| Content-Type | For writes | application/json |

### Common DTO Structure

#### Paginated List Response

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "totalItems": 100,
    "totalPages": 4
  }
}
```

#### Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": [
      { "field": "subject", "message": "Subject is required", "code": "REQUIRED" }
    ],
    "correlationId": "corr_abc123",
    "timestamp": "2026-06-29T12:00:00Z"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Input validation failed |
| UNAUTHORIZED | 401 | Missing or invalid auth token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict (duplicate, locked) |
| RATE_LIMITED | 429 | Rate limit exceeded |
| INTERNAL_ERROR | 500 | Unexpected server error |
| SERVICE_UNAVAILABLE | 503 | Backend dependency unavailable |

### Validation Rules (Standard)

| Rule Type | Format | Error Code |
|-----------|--------|------------|
| Required | Not null, not empty | REQUIRED |
| String Length | minLength, maxLength | INVALID_LENGTH |
| Enum | Must be one of defined values | INVALID_ENUM |
| UUID | Valid UUID v4 format | INVALID_UUID |
| Email | RFC 5322 format | INVALID_EMAIL |
| Phone | E.164 format | INVALID_PHONE |
| DateRange | end >= start | INVALID_RANGE |
| Future Date | timestamp > now | MUST_BE_FUTURE |
| Unique | No duplicate in system | DUPLICATE |

### Authentication

- **Method:** JWT Bearer tokens issued by Lemma Auth
- **Token Validation:** Every request validated against Lemma Auth endpoints
- **Token Expiry:** Access tokens: 15 minutes; Refresh tokens: 7 days
- **Anonymous Access:** Only customer-portal_v2 login page and public endpoints

### Authorization

- **Model:** Role-Based Access Control (RBAC) via role_permissions_v2
- **Enforcement:** Backend validates permissions on every request
- **Data Scoping:** RLS policies enforce customer-scoped data isolation
- **Ownership Checks:** Technician and customer endpoints validate identity match

### Rate Limits

| Tier | Limit | Window | Applied To |
|------|-------|--------|------------|
| Standard | 1000 requests | 1 minute | All authenticated endpoints |
| Mutation | 100 requests | 1 minute | POST/PUT/DELETE endpoints |
| Burst | 50 requests | 1 second | Any endpoint |
| Admin | 5000 requests | 1 minute | Admin domain endpoints |
| Customer | 200 requests | 1 minute | Customer portal endpoints |
| Search | 50 requests | 1 minute | Search endpoints |
| Export | 10 requests | 5 minutes | Report/data export endpoints |

---

## 2. Support Domain APIs

### 2.1 List Tickets

**GET** `/api/v2/support/tickets`

#### Request DTO

| Parameter | Type | Location | Required | Default | Description |
|-----------|------|----------|----------|---------|-------------|
| page | integer | query | No | 1 | Page number |
| pageSize | integer | query | No | 25 | Items per page (max 100) |
| status | string | query | No | — | Comma-separated statuses |
| urgency | string | query | No | — | Comma-separated urgency levels |
| channel | string | query | No | — | Channel filter |
| requestType | string | query | No | — | Request type filter |
| assignedOwner | uuid | query | No | — | Owner user ID |
| dateFrom | ISO8601 | query | No | — | Created after |
| dateTo | ISO8601 | query | No | — | Created before |
| search | string | query | No | — | Full-text search term |
| sortBy | string | query | No | created_at | Sort field |
| sortOrder | enum | query | No | desc | asc or desc |

**Validation Rules:** sortBy must be one of [created_at, updated_at, urgency, status, priority]. page >= 1. pageSize 1-100.

#### Response DTO

```json
{
  "data": [
    {
      "id": "uuid",
      "customerId": "uuid",
      "customerName": "string",
      "subject": "string",
      "requestType": "enum",
      "channel": "enum",
      "urgency": "enum",
      "status": "enum",
      "assignedOwner": "uuid|null",
      "assignedOwnerName": "string|null",
      "escalationLevel": "integer",
      "slaDeadline": "ISO8601|null",
      "slaStatus": "enum|null",
      "messageCount": "integer",
      "createdAt": "ISO8601",
      "updatedAt": "ISO8601"
    }
  ],
  "pagination": { "page": 1, "pageSize": 25, "totalItems": 100, "totalPages": 4 }
}
```

#### Error DTO

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid filter parameters",
    "details": [{ "field": "pageSize", "message": "Must be between 1 and 100", "code": "INVALID_RANGE" }],
    "correlationId": "corr_abc123",
    "timestamp": "2026-06-29T12:00:00Z"
  }
}
```

### 2.2 Get Ticket Detail

**GET** `/api/v2/support/tickets/{id}`

#### Response DTO

```json
{
  "id": "uuid",
  "customerId": "uuid",
  "customerName": "string",
  "customerEmail": "string",
  "customerPhone": "string",
  "subject": "string",
  "message": "string",
  "requestType": "enum",
  "channel": "enum",
  "urgency": "enum",
  "status": "enum",
  "assignedOwner": "uuid|null",
  "assignedOwnerName": "string|null",
  "escalationLevel": "integer",
  "escalationReason": "string|null",
  "slaDeadline": "ISO8601|null",
  "slaStatus": "enum|null",
  "classification": { "type": "enum", "confidence": "float", "suggestedOwner": "uuid|null" },
  "messages": [
    { "id": "uuid", "authorType": "enum", "authorId": "uuid", "authorName": "string", "content": "string", "createdAt": "ISO8601" }
  ],
  "attachments": [
    { "id": "uuid", "fileName": "string", "fileType": "string", "fileSize": "integer", "url": "string" }
  ],
  "timeline": [
    { "action": "string", "actor": "string", "timestamp": "ISO8601", "details": "object|null" }
  ],
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

### 2.3 Create Ticket

**POST** `/api/v2/support/tickets`

#### Request DTO

```json
{
  "customerId": "uuid",
  "subject": "string",
  "message": "string",
  "requestType": "enum",
  "channel": "enum",
  "urgency": "enum|null",
  "phone": "string|null",
  "email": "string|null",
  "attachments": ["uuid"] | null
}
```

**Validation Rules:** subject (3-200 chars), message (10-5000 chars), requestType ∈ [complaint, service_request, billing, general, other], channel ∈ [portal, email, phone, chat, sms, web], phone or email required if customerId not provided.

### 2.4 Update Ticket Status

**PUT** `/api/v2/support/tickets/{id}/status`

#### Request DTO

```json
{
  "status": "enum",
  "reason": "string",
  "changedBy": "uuid"
}
```

**Validation Rules:** Status must be a valid transition from current state. State machine: new → in_progress → waiting → resolved → closed. Escalated can enter from any state. Closed is terminal.

### 2.5 Draft Reply

**PUT** `/api/v2/support/tickets/{id}/draft`

#### Request DTO

```json
{
  "messageContent": "string",
  "useAiSuggestion": "boolean|null",
  "templateId": "uuid|null"
}
```

### 2.6 Approve Reply

**PUT** `/api/v2/support/tickets/{id}/draft/approve`

#### Request DTO

```json
{
  "approval": "enum",
  "managerNotes": "string|null"
}
```

**Validation Rules:** approval ∈ [approve, reject]. ticket status must be draft_ready.

### 2.7 Escalate Ticket

**POST** `/api/v2/support/tickets/{id}/escalate`

#### Request DTO

```json
{
  "reason": "string",
  "escalationLevel": "integer",
  "notifyManager": "boolean",
  "changedBy": "uuid"
}
```

---

## 3. Operations Domain APIs

### 3.1 Get Dashboard

**GET** `/api/v2/operations/dashboard`

#### Response DTO

```json
{
  "kpis": {
    "openTickets": { "value": 42, "trend": "up", "changePct": 12.5 },
    "activeDispatches": { "value": 8, "trend": "down", "changePct": -5.0 },
    "scheduledAppointments": { "value": 24, "trend": "stable", "changePct": 0 },
    "overdueFollowups": { "value": 6, "trend": "up", "changePct": 50.0 },
    "activeTasks": { "value": 18, "trend": "down", "changePct": -10.0 }
  },
  "urgentDispatches": [],
  "activeTasks": [],
  "todayAppointments": [],
  "recentOperationsLog": []
}
```

### 3.2 List Tasks

**GET** `/api/v2/operations/tasks`

**Request DTO:** status (comma-separated), assignedTo (uuid), priority, dateFrom, dateTo, search, sortBy, sortOrder, page, pageSize

#### Response DTO

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string|null",
      "status": "enum",
      "priority": "enum",
      "assignedTo": "uuid|null",
      "assignedToName": "string|null",
      "dueDate": "ISO8601|null",
      "category": "string|null",
      "createdAt": "ISO8601",
      "updatedAt": "ISO8601"
    }
  ],
  "pagination": { "page": 1, "pageSize": 25, "totalItems": 50, "totalPages": 2 }
}
```

### 3.3 Create Task

**POST** `/api/v2/operations/tasks`

#### Request DTO

```json
{
  "title": "string",
  "description": "string|null",
  "assignedTo": "uuid",
  "priority": "enum",
  "dueDate": "ISO8601",
  "category": "string|null"
}
```

### 3.4 Initiate Dispatch

**POST** `/api/v2/operations/dispatches`

#### Request DTO

```json
{
  "ticketId": "uuid",
  "technicianId": "uuid",
  "priority": "enum",
  "dispatchType": "enum",
  "notes": "string|null",
  "scheduledAt": "ISO8601"
}
```

**Validation Rules:** technician must be available. ticket urgency >= high for urgent dispatch. dispatchType ∈ [standard, urgent, emergency].

### 3.5 Generate Standup Report

**POST** `/api/v2/operations/standup/generate`

#### Request DTO

```json
{
  "reportDate": "ISO8601",
  "includeDepartments": ["string"]
}
```

---

## 4. Appointment Domain APIs

### 4.1 List Appointments

**GET** `/api/v2/appointments`

**Request DTO:** from (ISO8601), to (ISO8601), status, technicianId (uuid), customerId (uuid), serviceType, search, sortBy, sortOrder, page, pageSize

#### Response DTO

```json
{
  "data": [
    {
      "id": "uuid",
      "customerId": "uuid",
      "customerName": "string",
      "customerAddress": "string|null",
      "technicianId": "uuid|null",
      "technicianName": "string|null",
      "serviceType": "string",
      "status": "enum",
      "scheduledAt": "ISO8601",
      "durationMinutes": "integer",
      "notes": "string|null",
      "createdAt": "ISO8601"
    }
  ]
}
```

### 4.2 Create Appointment

**POST** `/api/v2/appointments`

#### Request DTO

```json
{
  "customerId": "uuid",
  "serviceType": "string",
  "scheduledAt": "ISO8601",
  "technicianId": "uuid|null",
  "notes": "string|null"
}
```

**Validation Rules:** scheduledAt must be in the future. No double-booking for same technician at same time. Duration derived from serviceType.

### 4.3 Assign Technician

**PUT** `/api/v2/appointments/{id}/assign`

#### Request DTO

```json
{
  "technicianId": "uuid",
  "assignedBy": "uuid",
  "skillMatchScore": "float|null",
  "notes": "string|null"
}
```

**Validation Rules:** Technician must be available at appointment time. Skill match must meet minimum for service type.

### 4.4 Reschedule Appointment

**PUT** `/api/v2/appointments/{id}/reschedule`

#### Request DTO

```json
{
  "newScheduledAt": "ISO8601",
  "reason": "string",
  "changedBy": "uuid"
}
```

---

## 5. Technician Domain APIs

### 5.1 Get My Day

**GET** `/api/v2/technicians/{id}/day`

#### Response DTO

```json
{
  "date": "ISO8601",
  "appointments": [
    {
      "id": "uuid",
      "customerName": "string",
      "customerAddress": "string",
      "customerPhone": "string",
      "serviceType": "string",
      "status": "enum",
      "scheduledAt": "ISO8601",
      "durationMinutes": "integer",
      "notes": "string|null",
      "workOrderId": "uuid|null"
    }
  ],
  "tasks": [],
  "nextJobCountdown": "ISO8601|null"
}
```

### 5.2 Update Appointment Status (Technician)

**PUT** `/api/v2/technicians/{id}/appointments/{appointmentId}/status`

#### Request DTO

```json
{
  "status": "enum",
  "notes": "string|null",
  "gpsCoordinates": { "lat": "float", "lng": "float" } | null,
  "photos": ["uuid"] | null
}
```

**Validation Rules:** Status transitions must follow: assigned → en_route → on_site → in_progress → completed. GPS required for en_route and on_site transitions.

### 5.3 Toggle Availability

**PUT** `/api/v2/technicians/{id}/availability`

#### Request DTO

```json
{
  "availability": "enum",
  "reason": "string|null"
}
```

**Validation Rules:** availability ∈ [available, busy, off_shift, on_leave].

---

## 6. Resolution Domain APIs

### 6.1 List Disputes

**GET** `/api/v2/resolution/disputes`

#### Response DTO

```json
{
  "data": [
    {
      "id": "uuid",
      "appointmentId": "uuid",
      "customerId": "uuid",
      "customerName": "string",
      "status": "enum",
      "type": "enum",
      "severity": "enum",
      "description": "string",
      "aiConfidence": "float|null",
      "recommendedResolution": "enum|null",
      "createdAt": "ISO8601"
    }
  ]
}
```

### 6.2 Analyze Dispute

**POST** `/api/v2/resolution/disputes/{id}/analyze`

#### Response DTO

```json
{
  "disputeId": "uuid",
  "analysisStatus": "analyzing",
  "estimatedCompletion": "ISO8601"
}
```

### 6.3 Resolve Dispute

**PUT** `/api/v2/resolution/disputes/{id}/resolve`

#### Request DTO

```json
{
  "resolution": "enum",
  "resolvedBy": "uuid",
  "resolutionNotes": "string|null",
  "customerCompensation": "number|null"
}
```

**Validation Rules:** resolution ∈ [full_refund, partial_refund, service_credit, no_refund, customer_satisfied, escalated_to_legal]. Compensation amount required for partial_refund and full_refund.

---

## 7. CRM Domain APIs

### 7.1 Get CRM Dashboard

**GET** `/api/v2/crm/dashboard`

#### Response DTO

```json
{
  "accountHealthDistribution": {
    "healthy": 120,
    "watch": 34,
    "slipping": 12,
    "atRisk": 5,
    "churned": 3
  },
  "overdueFollowups": [],
  "recentHealthChanges": [],
  "riskSignals": []
}
```

### 7.2 Get Account Detail

**GET** `/api/v2/crm/accounts/{id}`

#### Response DTO

```json
{
  "id": "uuid",
  "customerId": "uuid",
  "customerName": "string",
  "healthScore": "float",
  "healthCategory": "enum",
  "healthHistory": [{ "score": "float", "category": "enum", "date": "ISO8601" }],
  "openFollowups": [],
  "recentTickets": [],
  "recentAppointments": [],
  "openDisputes": [],
  "lastScanDate": "ISO8601|null",
  "createdAt": "ISO8601"
}
```

### 7.3 Run Health Scan

**POST** `/api/v2/crm/accounts/{id}/scan`

#### Request DTO

```json
{
  "scanType": "enum",
  "triggeredBy": "uuid"
}
```

**Validation Rules:** scanType ∈ [full, quick]. Full scan rate-limited to once per hour per account.

### 7.4 Create Followup

**POST** `/api/v2/crm/followups`

#### Request DTO

```json
{
  "accountId": "uuid",
  "customerId": "uuid",
  "followupType": "enum",
  "subject": "string",
  "assignedTo": "uuid",
  "dueDate": "ISO8601",
  "priority": "enum",
  "notes": "string|null"
}
```

---

## 8. Analytics Domain APIs

### 8.1 Get Executive Dashboard

**GET** `/api/v2/analytics/executive-dashboard`

#### Request DTO

| Parameter | Type | Location | Required | Description |
|-----------|------|----------|----------|-------------|
| dateFrom | ISO8601 | query | Yes | Start of analysis period |
| dateTo | ISO8601 | query | Yes | End of analysis period |
| granularity | enum | query | No | day (default), week, month |

#### Response DTO

```json
{
  "period": { "from": "ISO8601", "to": "ISO8601", "granularity": "enum" },
  "metrics": {
    "ticketVolume": { "value": "number", "trend": "enum", "changePct": "float" },
    "avgResolutionTime": { "value": "number", "trend": "enum", "changePct": "float" },
    "slaCompliance": { "value": "float", "trend": "enum", "changePct": "float" },
    "appointmentCompletion": { "value": "float", "trend": "enum", "changePct": "float" },
    "customerSatisfaction": { "value": "float", "trend": "enum", "changePct": "float" }
  },
  "charts": {
    "ticketTrend": [{ "date": "ISO8601", "value": "number" }],
    "appointmentVolume": [{ "date": "ISO8601", "value": "number" }]
  }
}
```

### 8.2 Generate Report

**POST** `/api/v2/analytics/reports/generate`

#### Request DTO

```json
{
  "reportDefinitionId": "uuid",
  "parameters": {},
  "timeRange": { "start": "ISO8601", "end": "ISO8601" },
  "format": "enum"
}
```

**Validation Rules:** format ∈ [json, csv, pdf].

---

## 9. Customer Domain APIs

### 9.1 Get Customer Dashboard

**GET** `/api/v2/customers/{id}/dashboard`

#### Response DTO

```json
{
  "customerName": "string",
  "accountHealth": { "score": "float", "category": "enum" },
  "openTickets": [],
  "upcomingAppointments": [],
  "unreadNotifications": "integer",
  "openDisputes": []
}
```

### 9.2 Create Customer Ticket

**POST** `/api/v2/customers/{id}/tickets`

#### Request DTO

```json
{
  "subject": "string",
  "message": "string",
  "requestType": "enum",
  "channel": "enum"
}
```

### 9.3 Book Appointment

**POST** `/api/v2/customers/{id}/appointments`

#### Request DTO

```json
{
  "serviceType": "string",
  "preferredDate": "ISO8601",
  "preferredTimeSlot": "string",
  "notes": "string|null"
}
```

### 9.4 Update Profile

**PUT** `/api/v2/customers/{id}/profile`

#### Request DTO

```json
{
  "name": "string|null",
  "phone": "string|null",
  "email": "string|null",
  "address": "string|null",
  "notificationPreferences": { "email": "boolean", "sms": "boolean", "push": "boolean" } | null
}
```

---

## 10. Admin Domain APIs

### 10.1 List Users

**GET** `/api/v2/admin/users`

#### Response DTO

```json
{
  "data": [
    {
      "id": "uuid",
      "email": "string",
      "fullName": "string",
      "roleId": "uuid",
      "roleName": "string",
      "department": "string|null",
      "status": "enum",
      "lastLogin": "ISO8601|null",
      "createdAt": "ISO8601"
    }
  ],
  "pagination": { "page": 1, "pageSize": 25, "totalItems": 50, "totalPages": 2 }
}
```

### 10.2 Create User

**POST** `/api/v2/admin/users`

#### Request DTO

```json
{
  "email": "string",
  "fullName": "string",
  "roleId": "uuid",
  "department": "string|null",
  "notifyUser": "boolean"
}
```

### 10.3 Get Audit Log

**GET** `/api/v2/admin/audit-log`

#### Request DTO

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| entityType | string | No | Filter by entity type |
| entityId | uuid | No | Filter by entity ID |
| actorId | uuid | No | Filter by actor |
| action | string | No | Filter by action type |
| dateFrom | ISO8601 | No | After timestamp |
| dateTo | ISO8601 | No | Before timestamp |
| search | string | No | Full-text search |
| page | integer | No | Page number |
| pageSize | integer | No | Items per page |

#### Response DTO

```json
{
  "data": [
    {
      "id": "uuid",
      "timestamp": "ISO8601",
      "actorId": "uuid",
      "actorType": "enum",
      "actorName": "string",
      "action": "string",
      "entityType": "string",
      "entityId": "uuid",
      "beforeState": "object|null",
      "afterState": "object|null",
      "correlationId": "uuid",
      "metadata": "object|null"
    }
  ],
  "pagination": { "page": 1, "pageSize": 50, "totalItems": 1000, "totalPages": 20 }
}
```

### 10.4 Update System Setting

**PUT** `/api/v2/admin/settings/{key}`

#### Request DTO

```json
{
  "value": "any",
  "changedBy": "uuid",
  "reason": "string"
}
```

### 10.5 Toggle Feature Flag

**PUT** `/api/v2/admin/feature-flags/{key}`

#### Request DTO

```json
{
  "enabled": "boolean",
  "changedBy": "uuid",
  "reason": "string"
}
```

---

## 11. Shared API Patterns

### 11.1 Search API

**GET** `/api/v2/search`

#### Request DTO

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search term (min 2 chars) |
| types | string | No | Comma-separated entity types to search |
| limit | integer | No | Max results per type (default 5, max 20) |

#### Response DTO

```json
{
  "results": {
    "tickets": [{ "id": "uuid", "title": "string", "subtitle": "string", "url": "string", "type": "ticket" }],
    "customers": [],
    "technicians": [],
    "accounts": [],
    "appointments": []
  },
  "totalCount": "integer"
}
```

### 11.2 Notifications API

**GET** `/api/v2/notifications`

**PUT** `/api/v2/notifications/{id}/read`

**POST** `/api/v2/notifications/read-all`

### 11.3 File Upload API

**POST** `/api/v2/upload`

#### Request DTO

Multipart form-data with file binary. Max file size: 10MB. Allowed types: jpg, png, pdf, doc, docx.

#### Response DTO

```json
{
  "fileId": "uuid",
  "fileName": "string",
  "fileSize": "integer",
  "mimeType": "string",
  "url": "string"
}
```
