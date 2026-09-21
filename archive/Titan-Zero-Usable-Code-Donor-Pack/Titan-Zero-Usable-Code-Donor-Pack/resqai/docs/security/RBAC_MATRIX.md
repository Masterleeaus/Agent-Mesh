# ResQAI V2 — RBAC Matrix

**Version:** 2.0
**Date:** 2026-06-30

---

## 1. Role Definitions

| Role ID | Name | Description | System Role |
|---------|------|-------------|-------------|
| `...101` | `super_admin` | Full system access with all privileges | Yes |
| `...102` | `admin` | Administrative access, broad management | Yes |
| `...103` | `manager` | Team management and oversight | Yes |
| `...104` | `agent` | Customer support agent with ticket handling | Yes |
| `...105` | `technician` | Field technician with work order access | Yes |
| `...106` | `dispatcher` | Dispatch operator scheduling and routing | Yes |
| `...107` | `customer` | End customer with self-service portal access | Yes |
| `...108` | `viewer` | Read-only access for reporting and dashboards | Yes |

**Source:** `database/migrations_v2/006_create_user_roles_v2.sql`
**Data:** `database/lookup_data/role_permissions_v2.json` (327 entries)

---

## 2. Resource Scope Model

| Scope | Meaning | Enforcement |
|-------|---------|-------------|
| `own` | Only resources owned by or assigned to the user | Application-level + RLS |
| `team` | Resources belonging to the user's team | Application-level + RLS |
| `all` | All resources across the organization | RBAC policy |

---

## 3. Role-to-Permission Mapping

### 3.1 super_admin (ID: ...101)
Scope: `all` on every resource and action.

| Resource | C | R | U | D | M |
|----------|---|---|---|---|---|
| tickets | all | all | all | all | all |
| customers | all | all | all | all | all |
| appointments | all | all | all | all | all |
| technicians | all | all | all | all | all |
| work_orders | all | all | all | all | all |
| dispatches | all | all | all | all | all |
| disputes | all | all | all | all | all |
| accounts | all | all | all | all | all |
| followups | all | all | all | all | all |
| tasks | all | all | all | all | all |
| notifications | all | all | all | all | all |
| knowledge_articles | all | all | all | all | all |
| inventory_items | all | all | all | all | all |
| analytics_reports | all | all | all | all | all |
| users | all | all | all | all | all |
| roles | all | all | all | all | all |
| permissions | all | all | all | all | all |
| settings | all | all | all | all | all |
| feature_flags | all | all | all | all | all |
| connectors | all | all | all | all | all |
| audit_log | all | all | all | all | all |
| events | all | all | all | all | all |

### 3.2 admin (ID: ...102)
Scope: `all` on all resources except `audit_log` (read-only).

| Resource | C | R | U | D | M |
|----------|---|---|---|---|---|
| tickets | all | all | all | all | all |
| customers | all | all | all | all | all |
| appointments | all | all | all | all | all |
| technicians | all | all | all | all | all |
| work_orders | all | all | all | all | all |
| dispatches | all | all | all | all | all |
| disputes | all | all | all | all | all |
| accounts | all | all | all | all | all |
| followups | all | all | all | all | all |
| tasks | all | all | all | all | all |
| notifications | all | all | all | all | all |
| knowledge_articles | all | all | all | all | all |
| inventory_items | all | all | all | all | all |
| analytics_reports | all | all | all | all | all |
| users | all | all | all | all | all |
| roles | all | all | all | all | all |
| permissions | all | all | all | all | all |
| settings | all | all | all | all | all |
| feature_flags | all | all | all | all | all |
| connectors | all | all | all | all | all |
| audit_log | - | all | - | - | - |
| events | all | all | all | all | all |

### 3.3 manager (ID: ...103)
Scope: `team` on operational resources, `all` on read-only resources.

| Resource | C | R | U | D | M |
|----------|---|---|---|---|---|
| tickets | team | team | team | team | team |
| customers | team | team | team | team | team |
| appointments | team | team | team | team | team |
| work_orders | team | team | team | team | team |
| dispatches | team | team | team | team | team |
| disputes | team | team | team | team | team |
| accounts | team | team | team | team | team |
| followups | team | team | team | team | team |
| tasks | team | team | team | team | team |
| notifications | - | all | - | - | - |
| knowledge_articles | - | all | - | - | - |
| inventory_items | - | all | - | - | - |
| analytics_reports | - | all | - | - | - |
| settings | - | all | - | - | - |
| feature_flags | - | all | - | - | - |
| connectors | - | all | - | - | - |

### 3.4 agent (ID: ...104)
Scope: `own` on primary resources, read-only `all` on knowledge base.

| Resource | C | R | U | D | M |
|----------|---|---|---|---|---|
| tickets | own | own | own | own | - |
| customers | own | own | own | own | - |
| appointments | - | own | - | - | - |
| knowledge_articles | - | all | - | - | - |

### 3.5 technician (ID: ...105)
Scope: `own` on work orders and dispatches, `all` read on inventory.

| Resource | C | R | U | D | M |
|----------|---|---|---|---|---|
| work_orders | - | own | own | - | - |
| dispatches | - | own | own | - | - |
| appointments | - | own | - | - | - |
| inventory_items | - | all | - | - | - |

### 3.6 dispatcher (ID: ...106)
Scope: `all` on dispatch and appointment operations.

| Resource | C | R | U | D | M |
|----------|---|---|---|---|---|
| dispatches | all | all | all | all | - |
| appointments | all | all | all | all | - |
| technicians | all | all | all | all | - |
| tickets | - | all | - | - | - |
| customers | - | all | - | - | - |

### 3.7 customer (ID: ...107)
Scope: `own` on tickets and appointments, read-only on knowledge base.

| Resource | C | R | U | D | M |
|----------|---|---|---|---|---|
| tickets | own | own | - | - | - |
| appointments | own | own | - | - | - |
| knowledge_articles | - | all | - | - | - |

### 3.8 viewer (ID: ...108)
Scope: `all` read-only across all resources.

| Resource | C | R | U | D | M |
|----------|---|---|---|---|---|
| tickets | - | all | - | - | - |
| customers | - | all | - | - | - |
| appointments | - | all | - | - | - |
| technicians | - | all | - | - | - |
| work_orders | - | all | - | - | - |
| dispatches | - | all | - | - | - |
| disputes | - | all | - | - | - |
| accounts | - | all | - | - | - |
| followups | - | all | - | - | - |
| tasks | - | all | - | - | - |
| notifications | - | all | - | - | - |
| knowledge_articles | - | all | - | - | - |
| inventory_items | - | all | - | - | - |
| analytics_reports | - | all | - | - | - |
| users | - | all | - | - | - |
| roles | - | all | - | - | - |
| permissions | - | all | - | - | - |
| settings | - | all | - | - | - |
| feature_flags | - | all | - | - | - |
| connectors | - | all | - | - | - |
| audit_log | - | all | - | - | - |
| events | - | all | - | - | - |

---

## 4. Role Hierarchy

```
super_admin
    │
    ├── admin
    │     ├── manager
    │     │     ├── agent
    │     │     ├── technician
    │     │     └── dispatcher
    │     └── ... (custom roles in future)
    │
    ├── viewer (read-only, orthogonal)
    └── customer (external, orthogonal)
```

- **Inheritance**: Roles do NOT automatically inherit. Each role has explicit permissions.
- **Separation**: `customer` and `viewer` are orthogonal and can be combined with other roles.
- **Custom roles**: The system supports custom roles via the `is_system` flag (non-system roles).

---

## 5. Role Assignment

Assignment is done via the `assign-user-role` function:

```python
# Source: functions/assign-user-role/src/handler.py
pod.records.update("users", user_id, {
    "role_id": role_id,
    "updated_at": datetime.utcnow().isoformat(),
})
```

- Only users with `admin:manage_roles` permission can assign roles.
- Role changes are logged to both `operations_log` and audit trail.
- System roles cannot be deleted.
