# CRM Center v2 — Complete Application Specification

> Phase 3.2 — Application Specifications  
> Status: Implementation-Ready  
> Date: 2026-06-29

---

## 1. Business Objective

Monitor account health, manage followups, detect churn risk signals, and run automated health scans — reducing account churn by 15% through proactive engagement and early intervention.

---

## 2. Primary Users

| User Type | Count Estimate | Usage Pattern |
|-----------|---------------|--------------|
| Account Manager | 3-15 | Daily, account oversight |
| CRM Coordinator | 2-8 | Daily, followups |
| Service Manager | 2-5 | Weekly, health review |
| Operations Coordinator | 3-10 | As needed, alerts |

---

## 3. User Roles

| Role | Permissions | Scope |
|------|------------|-------|
| crm:account_manager | view_dashboard, view_accounts, manage_accounts, manage_followups, run_scans | Assigned accounts |
| crm:coordinator | All + view_risks, bulk_actions | All accounts |
| crm:manager | All + override, export | Full |
| crm:admin | All + config | Full |

---

## 4. Business Processes

### 4.1 Account Health Monitoring Process
```
Accounts tracked with health score (0-100)
  → Health scan runs (nightly or on-demand)
  → Factors evaluated:
    ├── Ticket volume (30d)
    ├── Dispute status
    ├── Followup completion rate
    ├── Appointment attendance
    ├── Payment status (external)
  → Health score calculated
  → Health status: healthy (80+) / at_risk (50-79) / critical (under 50)
  → If at_risk → followup created automatically
  → If critical → alert sent to account manager
```

### 4.2 Followup Management Process
```
Followup needed identified (by scan, agent, or manual)
  → Followup created with priority, due date, assigned to
  → Account manager notified
  → Followup completed or overdue
  → If overdue → escalation alert
  → Followup closed → account health updated
```

### 4.3 Risk Signal Detection
```
Multiple risk signals monitored:
  ├── High ticket volume (3+ in 30 days)
  ├── Open dispute
  ├── Missed appointments
  ├── Slipping followups
  → Risk detected → RiskSignalCard created
  → Combined risk score calculated
  → Manager alerted if high-risk
```

---

## 5. Navigation Flow

```
Top Bar: [App Switcher] [Search] [Bell] [Avatar]

Sidebar:
  ├── Dashboard (/)
  ├── Accounts (/accounts)
  ├── Followup Center (/followups) [badge: overdue count]
  ├── Health Scans (/scans)
  └── Risk Signals (/risks) [badge: high risk count]
```

---

## 6. Screen Flow

```
AccountDashboardPage (/) 
  → Click account → AccountDetailPage (/accounts/:id)
  → Click followup → FollowupDetailPage (/followups/:id)
  → Navigate sidebar → AccountListPage (/accounts)
  → Navigate sidebar → FollowupCenterPage (/followups)
  → Navigate sidebar → HealthScansPage (/scans)
  → Navigate sidebar → RiskSignalsPage (/risks)
```

---

## 7. Feature List

| Feature | Priority | Complexity |
|---------|----------|------------|
| Account health dashboard | P0 | Medium |
| Account list with health indicators | P0 | Medium |
| Account detail with health history | P0 | Medium |
| Followup management (CRUD) | P0 | Medium |
| Automated health scans | P0 | High |
| Risk signal detection | P1 | High |
| Slipping followup alerts | P1 | Medium |
| Account timeline | P1 | Medium |
| Bulk followup operations | P2 | Medium |

---

## 8. Module List

| Module | Description |
|--------|-------------|
| Account Dashboard | Health gauge, KPIs, alerts |
| Account Management | Account list, detail, health history |
| Followup Center | Followup CRUD, overdue tracking |
| Health Scans | Scan history, results, scheduling |
| Risk Signals | Risk detection, categorization |

---

## 9. Permissions

| Permission | Roles |
|------------|-------|
| crm:view_dashboard | All CRM roles |
| crm:view_accounts | All CRM roles |
| crm:manage_accounts | Account Manager, Coordinator, Manager, Admin |
| crm:manage_followups | All CRM roles |
| crm:run_scans | Account Manager, Coordinator, Manager, Admin |
| crm:view_risks | Coordinator, Manager, Admin |
| crm:bulk_actions | Coordinator, Manager, Admin |
| crm:export_data | Manager, Admin |

---

## 10. Future Backend Dependencies

| Dependency | Type |
|------------|------|
| accounts table | Database |
| customers table | Database |
| followups table | Database |
| tickets table | Database |
| appointments table | Database |
| disputes table | Database |
| tasks table | Database |
| operations_log table | Database |
| account-health-monitor agent | Agent |
| account-health-monitoring workflow | Workflow |
| followup-slippage-detector workflow | Workflow |
| account-health-scan function | Function |
| flag-slipping-followups function | Function |

---

## 11. Screen Specifications

### 11.1 AccountDashboardPage (/) — CRM Dashboard

**Purpose:** High-level account health overview with alerts and key metrics.

**Header:** "Account Health Dashboard"

**Toolbar:** "Run Health Scan" button, "Export" button

**Widgets:**
- **HealthGauge**: Large circular gauge showing overall health % (green/yellow/red)
- **HealthCategoryBar**: Breakdown bar — healthy count / at_risk count / critical count
- **SlippingAlertBanner**: Red banner if followups are slipping
- **RiskSignalCards**: Top 3 recent risk signals with severity
- **KPI Row**: Total accounts, active followups, overdue followups, open disputes

**Loading:** Skeleton gauge + cards
**Error:** ErrorState + Retry
**Empty State:** N/A (dashboard always has data)

---

### 11.2 AccountListPage (/accounts) — Account List

**Purpose:** Searchable, filterable list of all accounts with health status.

**Header:** "Accounts" with total count

**Toolbar:** "Refresh" button, "Bulk Action" dropdown

**Filters:** Health Status (healthy/at_risk/critical), Region, Account Type (residential/commercial), Date Range (created)

**Search:** Account name, customer name, phone, email

**Table:**
| Column | Sort | Filter | Width |
|--------|------|--------|-------|
| Account Name | Yes | No | 2fr |
| Customer | Yes | No | 1fr |
| Health | Yes | Yes | 100px |
| Open Tickets | Yes | No | 100px |
| Active Followups | Yes | No | 100px |
| Last Service | Yes | Yes (date) | 130px |
| Type | Yes | Yes | 100px |

- Click row → AccountDetailPage
- Row color coded by health status

**Loading:** Skeleton table
**Error:** ErrorState + Retry
**Empty State:** "No accounts found"

---

### 11.3 AccountDetailPage (/accounts/:id) — Account Detail

**Purpose:** Full account view with health history, activity timeline, and followups.

**Header:** Account name + health badge

**Tabs:**
| Tab | Content |
|-----|---------|
| Overview | Health score, key metrics (tickets, appointments, disputes), contact info |
| Health History | Health score trend chart (placeholder), scan results history |
| Followups | FollowupList filtered by account, create new followup |
| Activity | AccountTimeline (chronological events from operations_log) |
| Tickets | Linked tickets table |
| Appointments | Linked appointments table |

**Actions:**
| Action | Button | Permission |
|--------|--------|------------|
| New Followup | "New Followup" | manage_followups |
| Run Health Scan | "Run Scan" | run_scans |
| Edit Account | "Edit" | manage_accounts |
| Add Note | "Add Note" | manage_accounts |

**HealthGauge Component:**
| Property | Values |
|----------|--------|
| Props | score (0-100), size (sm/md/lg), animated |
| States | Loading (pulse), Error (dashed red), Data (colored arc) |
| Color | Green (80+), Yellow (50-79), Red (under 50) |

---

### 11.4 FollowupCenterPage (/followups) — Followup Center

**Purpose:** Central management of all followups across accounts.

**Header:** "Followup Center" with overdue count

**Toolbar:** "New Followup" button, "Bulk Action" dropdown

**Filters:** Status (pending, completed, overdue), Priority (high/medium/low), Account, Date Range

**Table (FollowupList):**
| Column | Sort | Width |
|--------|------|--------|
| Account | Yes | 1fr |
| Subject | Yes | 2fr |
| Priority | Yes | 90px |
| Status | Yes | 100px |
| Assigned To | Yes | 150px |
| Due Date | Yes | 130px |
| Created | Yes | 130px |

- Row color coded: red if overdue, yellow if due within 24h
- Context Menu: Mark Complete, Reassign, Edit, View Account

---

### 11.5 NewFollowupPage (/followups/new) — Create Followup

**Form Fields:** account (typeahead, required), subject (required, max 200), description (optional), priority (required: high/medium/low), assigned_to (dropdown, required), due_date (date picker, required), followup_type (dropdown: call, email, visit, other)

**Submit:** Create → emit followup.created → redirect to FollowupDetailPage

---

### 11.6 FollowupDetailPage (/followups/:id) — Followup Detail

**Sections:** Subject, description, priority, status, assigned to, due date, completion notes, activity timeline

**Actions:** Mark Complete, Edit, Reassign

---

### 11.7 HealthScansPage (/scans) — Health Scan History

**Purpose:** View automated health scan results and schedule scans.

**Header:** "Health Scans"

**Toolbar:** "Run New Scan", scan type filter

**Cards:** HealthScanResultCard — scan date, accounts scanned, summary (healthy/at_risk/critical counts), findings list

---

### 11.8 RiskSignalsPage (/risks) — Risk Signals

**Purpose:** Monitor account churn risk signals.

**Filters:** Severity (critical/high/medium/low), Type, Status (active/resolved), Date Range

**Cards:** RiskSignalCard — severity badge, account name, signal type, description, detected date, "View Account" action

**Bulk Actions:** Resolve selected, Assign to manager

---

## 12. User Journeys

### Journey 1: Account Manager reviews health
1. Account Manager opens dashboard → sees HealthGauge: 78% overall (yellow)
2. HealthCategoryBar shows 45 healthy, 12 at_risk, 3 critical
3. Clicks "at_risk" category → AccountListPage filtered by at_risk
4. Opens "Johnson Properties" → AccountDetailPage
5. Notes: 5 open tickets, 2 overdue followups, 1 open dispute
6. Clicks "Run Health Scan" → agent recalculates health
7. Score updated to 52 (still at_risk)
8. Creates followup: "Call Johnson to discuss issues"
9. Escalation note added to task board

### Journey 2: Slipping followup alert
1. Coordinator sees SlippingAlertBanner: "3 followups overdue"
2. Opens FollowupCenterPage sorted by due_date ascending
3. Reviews overdue items: 2 are high priority
4. Reassigns one to different account manager
5. Marks one as "completed" via call notes
6. Creates new followup for third
7. Banner disappears when all addressed

---

## 13. Future Integrations

| Integration | Type |
|-------------|------|
| accounts table | DB |
| customers table | DB |
| followups table | DB |
| tickets table | DB |
| appointments table | DB |
| disputes table | DB |
| tasks table | DB |
| operations_log table | DB |
| account-health-monitor | Agent |
| account-health-monitoring | Workflow |
| followup-slippage-detector | Workflow |
| account-health-scan | Function |
| flag-slipping-followups | Function |
