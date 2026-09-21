# Admin Center v2 — Complete Application Specification

> Phase 3.2 — Application Specifications  
> Status: Implementation-Ready  
> Date: 2026-06-29

---

## 1. Business Objective

Provide a centralized administration console for managing users, roles and permissions, system settings, audit logs, connector configuration, feature flags, and event bus monitoring — ensuring secure, auditable, and configurable platform governance.

---

## 2. Primary Users

| User Type | Count Estimate | Usage Pattern |
|-----------|---------------|--------------|
| System Administrator | 1-3 | Weekly, configuration |
| Security Officer | 1 | Monthly, audit review |
| IT Support | 2-5 | As needed, user mgmt |
| Compliance Auditor | 1 | Quarterly, audit export |

---

## 3. User Roles

| Role | Permissions | Scope |
|------|------------|-------|
| admin:it_support | view_dashboard, manage_users, export_audit | User management + audit |
| admin:administrator | All IT + manage_roles, manage_settings, manage_connectors, view_events | Full system admin |
| admin:super_admin | All + manage_feature_flags, override_all | Unrestricted |

---

## 4. Business Processes

### 4.1 User Management Process
```
Admin navigates to User Management
  → Views user list (searchable, sortable)
  → Can:
    ├── Create new user (name, email, role, app access)
    ├── Edit user (profile, role assignment, status)
    ├── Disable user (can't log in, tickets preserved)
    ├── Delete user (with confirmation, audit logged)
  → Changes take effect immediately
  → Audit entry created for all actions
```

### 4.2 Role & Permission Management Process
```
Admin navigates to Role Manager
  → Views role list
  → Can:
    ├── Create new role (name, description, permission set)
    ├── Edit role (modify permissions checkboxes)
    ├── Clone role (copy from existing)
    ├── Delete role (cannot delete if users assigned)
  → Permission changes apply on next user login
```

### 4.3 Audit Log Review Process
```
Security Officer navigates to Audit Log
  → Views chronological event stream
  → Filters by: actor, action, entity, date range
  → Searches by keyword
  → Exports selected entries as CSV
  → Reviews suspicious patterns
```

### 4.4 Connector Configuration Process
```
Admin navigates to Connector Configuration
  → Views configured connectors
  → Can:
    ├── Add new connector (type, credentials, endpoint, settings)
    ├── Test connection
    ├── Enable/disable connector
    ├── View connection status/health
    ├── Delete connector
  → Status monitoring (connected, disconnected, error)
```

---

## 5. Navigation Flow

```
Top Bar: [App Switcher] [Global Search] [Notification Bell] [User Avatar]

Sidebar:
  ├── Dashboard (/)
  ├── User Management (/users) [badge: pending count]
  ├── Role Manager (/roles)
  ├── Audit Log (/audit)
  ├── System Settings (/settings)
  ├── Connectors (/connectors)
  └── Event Bus Monitor (/events)
```

---

## 6. Screen Flow

```
AdminDashboardPage (/) 
  → Click user count → UserManagementPage (/users)
  → Click "Create User" → CreateUserPage (/users/new)
  → Click user row → UserDetailPage (/users/:id)
  → Navigate sidebar → RoleManagerPage (/roles)
  → Click "Create Role" → CreateRolePage (/roles/new)
  → Click role row → RoleDetailPage (/roles/:id)
  → Navigate sidebar → AuditLogPage (/audit)
  → Navigate sidebar → SystemSettingsPage (/settings)
  → Navigate sidebar → ConnectorConfigPage (/connectors)
  → Navigate sidebar → EventBusMonitorPage (/events)
```

---

## 7. Feature List

| Feature | Priority | Complexity |
|---------|----------|------------|
| Admin dashboard (system health) | P0 | Medium |
| User management (CRUD) | P0 | Medium |
| Role & permission management | P0 | High |
| Audit log viewer | P0 | Medium |
| System settings configuration | P1 | Medium |
| Connector configuration | P1 | Medium |
| Event bus monitor | P1 | Medium |
| Feature flag management | P1 | Low |
| Audit log export | P1 | Low |
| Bulk user operations | P2 | Medium |

---

## 8. Module List

| Module | Description |
|--------|-------------|
| System Dashboard | Health metrics, system status |
| User Management | CRUD users, assign roles |
| Role Manager | CRUD roles, permission tree |
| Audit Log | Event stream viewer, export |
| System Settings | Global platform settings |
| Connectors | External service configuration |
| Event Bus Monitor | Real-time event inspection |
| Feature Flags | Toggle platform features |

---

## 9. Permissions

| Permission | Roles |
|------------|-------|
| admin:view_dashboard | All admin roles |
| admin:manage_users | IT Support, Administrator, Super Admin |
| admin:manage_roles | Administrator, Super Admin |
| admin:view_audit | All admin roles |
| admin:export_audit | IT Support, Administrator, Super Admin |
| admin:manage_settings | Administrator, Super Admin |
| admin:manage_connectors | Administrator, Super Admin |
| admin:view_events | Administrator, Super Admin |
| admin:manage_feature_flags | Super Admin |
| admin:override_all | Super Admin |

---

## 10. Future Backend Dependencies

| Dependency | Type |
|------------|------|
| users_v2 table | Database |
| user_roles_v2 table | Database |
| system_settings_v2 table | Database |
| feature_flags_v2 table | Database |
| connectors_v2 table | Database |
| operations_log table | Database |
| event_bus_log_v2 table | Database |

---

## 11. Screen Specifications

### 11.1 AdminDashboardPage (/) — System Dashboard

**Purpose:** System health overview with key metrics, active users, connector status.

**Header:** "Admin Dashboard"

**Widgets:**
- **SystemHealthCard**: Platform status (All Systems Operational / Degraded / Down)
- **Metrics Row**: Total Users, Active Sessions, Active Connectors, Events/min
- **EventVolumeChart**: Real-time event volume graph (last 24h)
- **Recent Audit Log**: Last 10 audit log entries
- **Connector Status Summary**: Connected / Disconnected counts
- **Active Sessions**: Currently logged-in users (ActiveSessionList)

**Loading:** Skeleton grid
**Error:** ErrorState + Retry

---

### 11.2 UserManagementPage (/users) — User Management

**Purpose:** CRUD interface for platform users.

**Header:** "User Management" with total user count

**Toolbar:** "Create User" button, "Export" button, bulk action dropdown

**Filters:** Role filter, Status (active/disabled), App access filter, Date range

**Search:** Name, email, username

**Table (UserTable):**
| Column | Sort | Filter | Width |
|--------|------|--------|-------|
| Name | Yes | No | 1fr |
| Email | Yes | No | 1fr |
| Role | Yes | Yes | 130px |
| Apps | No | Yes | 150px |
| Status | Yes | Yes | 100px |
| Last Login | Yes | Yes (date) | 150px |
| Created | Yes | Yes (date) | 130px |

- Context Menu: Edit, Disable, Delete, Reset Password
- Bulk Actions: Disable selected, Export selected

**Loading:** Skeleton table
**Error:** ErrorState + Retry
**Empty State:** "No users found" — "Create your first user"

---

### 11.3 CreateUserPage (/users/new) — Create User

**Purpose:** Create a new platform user.

**Form (UserForm):**
| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | Text | Yes | Max 100 chars |
| email | Email | Yes | Valid email, unique |
| role | Dropdown | Yes | Must select from existing roles |
| app_access | Multi-select | Yes | At least 1 app |
| status | Toggle | No | Default: active |

**Submit:** Create user → emit user.created → redirect to UserDetailPage
**Cancel:** Confirm discard → back to UserManagementPage

---

### 11.4 UserDetailPage (/users/:id) — User Detail

**Purpose:** View and edit single user details.

**Header:** User name + avatar + StatusBadge

**Tabs:**
| Tab | Content |
|-----|---------|
| Profile | Name, email, phone, avatar (editable) |
| Roles | Current roles, role assignment checkboxes |
| App Access | Application access toggles |
| Activity | Recent audit entries for this user |
| Sessions | Active sessions (ActiveSessionList) — force logout option |

**Actions:** Save changes, Disable User, Delete User (with confirmation), Reset Password

---

### 11.5 RoleManagerPage (/roles) — Role Management

**Purpose:** CRUD for roles and permissions.

**Header:** "Role Manager"

**Toolbar:** "Create Role" button, "Clone Role" button

**Table:** Role Name, Description, User Count, Permissions Count, Created, Actions (Edit, Clone, Delete)

---

### 11.6 CreateRolePage (/roles/new) — Create Role

**Purpose:** Define a new role with permissions.

**Form Sections:**
- **Basic Info**: name (required), description
- **PermissionCheckboxTree**: Hierarchical permission tree grouped by app

`PermissionCheckboxTree Component:`
| Property | Description |
|----------|-------------|
| Props | permissions, selected, onChange |
| Groups | By application domain (support, ops, appointment, etc.) |
| States | Loading (skeleton tree), Data (checkbox tree) |
| Actions | Check all / Uncheck all per group, Indeterminate states |

---

### 11.7 RoleDetailPage (/roles/:id) — Role Detail

**Purpose:** View and edit existing role.

**Same form as CreateRolePage** pre-populated with role data.

**Submit:** Update role → emit user.role.changed → redirect to RoleManagerPage

**Warning:** "Changes will apply on next user login"

---

### 11.8 AuditLogPage (/audit) — Audit Log

**Purpose:** View and search platform audit trail.

**Header:** "Audit Log"

**Toolbar:** Date range filter, Export CSV button

**Filters:** Actor (user dropdown), Action type (dropdown: create, update, delete, login, agent_action), Entity type (user, role, ticket, appointment, etc.), Date range

**Search:** Free text across all audit fields

**Table (AuditLogTable):**
| Column | Sort | Width |
|--------|------|--------|
| Timestamp | Yes | 160px |
| Actor | Yes | 150px |
| Action | Yes | 120px |
| Entity Type | Yes | 120px |
| Entity ID | Yes | 100px |
| Details | No | 2fr |
| IP Address | No | 130px |

**Pagination:** 50/100/200 per page
**Export:** CSV with current filter applied

---

### 11.9 SystemSettingsPage (/settings) — System Settings

**Purpose:** Configure global platform settings.

**Sections (ConfigEditor):**
| Section | Settings |
|---------|----------|
| General | Platform name, timezone, date format |
| Notifications | Default notification channels, rate limits |
| Security | Password policy, session timeout, MFA enforcement |
| SLA | Default SLA hours by urgency level |
| Appearance | Brand colors, logo URL |
| Email | SMTP config, from address, reply-to |

**Form:** Key-value editor with typed inputs (text, number, toggle, dropdown)

---

### 11.10 ConnectorConfigPage (/connectors) — Connectors

**Purpose:** Configure external service integrations.

**Header:** "Connectors"

**List:** ConnectorCard — name, type, status (connected/disconnected/error), last checked, actions (Configure, Test, Enable/Disable, Delete)

**Supported Connector Types:**
- Email (IMAP/SMTP)
- SMS (Twilio)
- Chat (WebSocket)
- Slack
- Discord
- External CRM
- Payment Gateway

**Dialog:** Add/Edit connector with fields: name, type, credentials (masked), endpoint URL, settings (JSON)

**Actions:** Test Connection button (shows success/failure), Save, Cancel

---

### 11.11 EventBusMonitorPage (/events) — Event Monitor

**Purpose:** Real-time view of events flowing through the platform event bus.

**Header:** "Event Bus Monitor"

**Toolbar:** Auto-refresh toggle, event type filter, "Pause" button

**Table:** Timestamp, Event Name, Source App, Payload (truncated), Status (delivered/failed)

**Filter:** By event name, source app, status

**Highlighting:** Failed events in red, high-volume events in bold

---

## 12. User Journeys

### Journey 1: Admin creates new employee
1. Admin opens UserManagementPage
2. Clicks "Create User" → CreateUserPage
3. Fills: name="Jane Smith", email="jane@company.com"
4. Selects role=support:agent
5. Selects app access: support-center_v2, crm-center_v2
6. Status: active
7. Clicks "Create" → user.created event emitted
8. Redirects to UserDetailPage
9. Jane receives welcome email with login instructions

### Journey 2: Security Officer audits system
1. Security Officer opens AuditLogPage
2. Sets date range: "This Month"
3. Filters by action = "delete"
4. Finds 3 deletion events in admin log
5. Exports filtered results as CSV
6. Reviews and files for compliance

### Journey 3: Admin configures email connector
1. Admin opens ConnectorConfigPage
2. Clicks "Add Connector"
3. Type: Email (SMTP)
4. Host: smtp.company.com, Port: 587
5. Username/password for service account
6. Clicks "Test Connection" → "Connection successful"
7. Saves connector → Status: Connected
8. Email connector now available for notification-center

---

## 13. Future Integrations

| Integration | Type |
|-------------|------|
| users_v2 table | DB |
| user_roles_v2 table | DB |
| system_settings_v2 table | DB |
| feature_flags_v2 table | DB |
| connectors_v2 table | DB |
| operations_log table | DB |
| event_bus_log_v2 table | DB |
| user.created event | Event |
| user.role.changed event | Event |
| system.config.changed event | Event |
| notification-templates table | DB (future) |
| audit-export function | Function (future) |
