# ResQAI V2 — Audit Policy

**Version:** 2.0
**Date:** 2026-06-30

---

## 1. Audit Infrastructure

```
┌──────────────────────────────────────────────────────────────┐
│                      AUDIT INFRASTRUCTURE                    │
├──────────────────────────────────────────────────────────────┤
│  audit_log_v2 table  │  Immutable, append-only audit trail   │
│  operations_log      │  Operational activity log             │
│  record-audit        │  Serverless function to create entry  │
│  query-audit-log     │  Serverless function to query entries │
│  admin:view_audit    │  Permission to view audit trail       │
│  admin:export_audit  │  Permission to export audit data      │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Audit Log Data Model

```sql
-- Source: database/migrations_v2/040_create_audit_log_v2.sql
CREATE TABLE audit_log_v2 (
  id              UUID PRIMARY KEY,
  entity_type     TEXT NOT NULL,        -- e.g. 'ticket', 'user', 'role'
  entity_id       UUID NOT NULL,        -- ID of the affected entity
  action          TEXT NOT NULL,        -- e.g. 'created', 'updated', 'deleted'
  actor_type      TEXT,                 -- 'user', 'agent', 'system', 'function'
  actor_id        TEXT,                 -- ID or name of the actor
  previous_state  JSONB,                -- Snapshot before change
  new_state       JSONB,                -- Snapshot after change
  changed_fields  TEXT[],               -- List of changed field names
  ip_address      TEXT,                 -- Client IP address
  user_agent      TEXT,                 -- Client user agent
  correlation_id  TEXT,                 -- Request correlation ID
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes

```sql
CREATE INDEX audit_log_v2_entity ON audit_log_v2(entity_type, entity_id);
CREATE INDEX audit_log_v2_entity_created ON audit_log_v2(entity_type, created_at DESC);
CREATE INDEX audit_log_v2_actor ON audit_log_v2(actor_type, actor_id);
CREATE INDEX audit_log_v2_action ON audit_log_v2(action);
CREATE INDEX audit_log_v2_created ON audit_log_v2(created_at DESC);
CREATE INDEX audit_log_v2_correlation ON audit_log_v2(correlation_id);
```

---

## 3. Audit Event Categories

### 3.1 Authentication Events

| Event | Description | Recorded Fields |
|-------|-------------|-----------------|
| `user.login` | User authentication | actor_id, ip_address, user_agent |
| `user.logout` | User logout | actor_id, ip_address |
| `user.login_failed` | Failed auth attempt | actor_id (email), ip_address |
| `session.expired` | Session TTL exceeded | entity_id (session) |
| `session.invalidated` | Session revoked | actor_id, entity_id |

### 3.2 Authorization Events

| Event | Description | Recorded Fields |
|-------|-------------|-----------------|
| `role.assigned` | Role assigned to user | actor_id, previous_state, new_state |
| `role.revoked` | Role removed from user | actor_id, previous_state, new_state |
| `permission.granted` | Permission added to role | actor_id, previous_state, new_state |
| `permission.revoked` | Permission removed from role | actor_id, previous_state, new_state |

### 3.3 CRUD Events

| Event | Description | Recorded Fields |
|-------|-------------|-----------------|
| `*.created` | Resource created | new_state (full snapshot) |
| `*.updated` | Resource updated | changed_fields, previous_state, new_state |
| `*.deleted` | Resource deleted | previous_state (full snapshot) |

### 3.4 Security Events

| Event | Description | Recorded Fields |
|-------|-------------|-----------------|
| `security.mfa_enabled` | MFA enabled for user | actor_id |
| `security.mfa_disabled` | MFA disabled for user | actor_id |
| `security.password_changed` | Password changed | actor_id |
| `security.api_key_created` | API key generated | actor_id |
| `security.api_key_revoked` | API key revoked | actor_id |

### 3.5 Administrative Events

| Event | Description | Recorded Fields |
|-------|-------------|-----------------|
| `admin.settings_changed` | System settings modified | changed_fields, previous_state, new_state |
| `admin.user_impersonated` | Admin impersonated user | actor_id, entity_id |
| `admin.export_performed` | Data export | actor_id, entity_type |

---

## 4. Audit Recording

### 4.1 record-audit Function

```python
# functions/record-audit/src/handler.py
async def record_audit(ctx, data):
    record = pod.records.create("audit_log", {
        "entity_type": data.entity_type,
        "entity_id": data.entity_id,
        "action": data.action,
        "actor_type": data.actor_type,
        "actor_id": data.actor_id,
        "previous_state": data.previous_state,
        "new_state": data.new_state,
        "changed_fields": data.changed_fields or [],
        "ip_address": data.ip_address,
        "user_agent": data.user_agent,
        "correlation_id": data.correlation_id,
        "created_at": datetime.utcnow().isoformat(),
    })
    return {"status": "success", "audit_id": record.get("id")}
```

### 4.2 Operations Log (Lightweight Audit)

```python
# Used in authenticate-user, assign-user-role, manage-permission
pod.records.create("operations_log", {
    "action": "user authentication",
    "result": f"user_id={user['id']}, email={data.email}",
    "actor": "system",
})
```

---

## 5. Audit Query

### 5.1 query-audit-log Function

```python
# functions/query-audit-log/src/handler.py
filters = {}
if data.entity_type: filters["entity_type"] = data.entity_type
if data.entity_id:   filters["entity_id"] = data.entity_id
if data.action:      filters["action"] = data.action
if data.actor_type:  filters["actor_type"] = data.actor_type
if data.actor_id:    filters["actor_id"] = data.actor_id
if data.correlation_id: filters["correlation_id"] = data.correlation_id
if data.date_from:   filters["date_from"] = data.date_from
if data.date_to:     filters["date_to"] = data.date_to

records = pod.records.list("audit_log", filters, limit=data.limit, offset=data.offset, order_by="-created_at")
```

### Supported Filters

| Filter | Type | Description |
|--------|------|-------------|
| `entity_type` | string | Filter by resource type |
| `entity_id` | UUID | Filter by resource ID |
| `action` | string | Filter by action type |
| `actor_type` | string | Filter by actor category |
| `actor_id` | string | Filter by specific actor |
| `correlation_id` | string | Trace a request chain |
| `date_from` | ISO datetime | Start of time range |
| `date_to` | ISO datetime | End of time range |
| `limit` | integer | Max results (pagination) |
| `offset` | integer | Pagination offset |

---

## 6. Audit Retention Policy

| Tier | Retention Period | Storage |
|------|-----------------|---------|
| **Hot** | 90 days | Online (indexed) |
| **Warm** | 1 year | Online (compressed) |
| **Cold** | 7 years | Archived export |

- Audit records are **never deleted** from the database
- Retention enforcement via data archiving, not deletion
- Export available via `admin:export_audit` permission

---

## 7. Audit Access Control

| Permission | Access Level |
|------------|-------------|
| `admin:view_audit` | View audit log entries |
| `admin:export_audit` | Export audit log data |
| `analytics:view_audit` | View audit in analytics context |
| `audit_log:read` | RBAC resource-level read access |

**Audit log write** is restricted to system functions only (`record-audit` function). No user-facing API allows direct audit log mutation.

---

## 8. Audit Integrity

| Property | Implementation |
|----------|---------------|
| **Immutability** | Append-only — no update or delete operations exposed |
| **Tamper evidence** | JSONB snapshots capture full before/after state |
| **Chain of custody** | `actor_type` + `actor_id` + `correlation_id` per entry |
| **Non-repudiation** | Timestamps + actor identification |
| **Completeness** | `changed_fields` array documents exact modifications |

---

## 9. Recommended Monitoring Rules

| Rule | Alert | Threshold |
|------|-------|-----------|
| Failed logins | Multiple failures for same user | > 5 in 15 minutes |
| Permission changes | Unexpected grant/revoke | Any |
| Role assignment | New admin/super_admin | Any |
| Data export | Large exports | > 1000 records |
| Session invalidation | Bulk invalidations | > 10 in 5 minutes |
| Deleted resources | Mass deletion events | > 10 in 5 minutes |
