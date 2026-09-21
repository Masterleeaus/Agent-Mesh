# Analytics Center v2 — Complete Application Specification

> Phase 3.2 — Application Specifications  
> Status: Implementation-Ready  
> Date: 2026-06-29

---

## 1. Business Objective

Provide a consolidated analytics platform with role-specific dashboards, custom report builder, scheduled report distribution, and data export across all operational domains — enabling data-driven decision-making with zero engineering dependencies for report creation.

---

## 2. Primary Users

| User Type | Count Estimate | Usage Pattern |
|-----------|---------------|--------------|
| Executive Director | 1-3 | Weekly, strategic |
| Operations Director | 1-2 | Weekly, ops review |
| Service Manager | 2-5 | Daily, performance |
| Support Manager | 2-5 | Daily, ticket metrics |
| Account Manager | 3-15 | Weekly, health trends |
| Business Analyst | 1-3 | Daily, custom reports |

---

## 3. User Roles

| Role | Permissions | Scope |
|------|------------|-------|
| analytics:executive | view_executive | Executive dashboard only |
| analytics:manager | view_support, view_operations, view_appointments, view_accounts, view_disputes | Domain dashboards |
| analytics:analyst | All domain views + manage_reports, manage_schedules, export_data | Full analytics |
| analytics:admin | All + system config | Full |

---

## 4. Business Processes

### 4.1 Dashboard Review Process
```
User selects domain dashboard (executive/support/ops/etc.)
  → Dashboard loads with pre-configured KPIs and charts
  → User adjusts date range
  → All widgets refresh with new data
  → User drills down into specific metric
  → Drill-down opens filtered detail view
  → User exports chart/data as PNG/CSV
```

### 4.2 Report Building Process
```
User navigates to Report Builder
  → Selects data source (domain + metric)
  → Configures chart type (line, bar, pie, table)
  → Applies filters
  → Sets date range
  → Preview renders
  → Saves report
  → Optionally schedules recurring delivery
```

### 4.3 Scheduled Report Process
```
Report created with schedule config
  → Cron-based trigger
  → System generates report data
  → Renders as PDF/CSV
  → Emailed to recipients
  → Logged in scheduled reports history
```

---

## 5. Navigation Flow

```
Top Bar: [App Switcher] [Global Search] [Bell] [Avatar] [Date Navigator]

Sidebar:
  ├── Executive Dashboard (/) [permission: view_executive]
  ├── Support Analytics (/support) [permission: view_support]
  ├── Operations Analytics (/operations) [permission: view_operations]
  ├── Appointment Analytics (/appointments) [permission: view_appointments]
  ├── Account Analytics (/accounts) [permission: view_accounts]
  ├── Dispute Analytics (/disputes) [permission: view_disputes]
  ├── Custom Reports (/reports) [permission: manage_reports]
  └── Scheduled Reports (/reports/scheduled) [permission: manage_schedules]
```

---

## 6. Screen Flow

```
ExecutiveDashboardPage (/) 
  → Click domain tab → tab switches between domain summaries
  → Click drill-down → specific domain analytics page
  → Navigate sidebar → any domain analytics page
  → Navigate sidebar → CustomReportsPage (/reports)
  → Click "New Report" → ReportBuilderPage (/reports/builder)
  → Navigate sidebar → ScheduledReportsPage (/reports/scheduled)
```

---

## 7. Feature List

| Feature | Priority | Complexity |
|---------|----------|------------|
| Executive summary dashboard | P0 | Medium |
| Domain-specific analytics pages (5) | P0 | Medium per page |
| KPI metric cards with trends | P0 | Medium |
| Time series charts | P0 | High |
| Date range navigation | P0 | Low |
| Data export (CSV/PNG/PDF) | P0 | Medium |
| Chart drill-down to detail view | P1 | High |
| Custom report builder | P1 | High |
| Scheduled report distribution | P1 | High |
| Report templates | P2 | Medium |
| Data freshness indicator | P0 | Low |
| Comparison periods (vs last week/month/year) | P1 | Medium |

---

## 8. Module List

| Module | Description |
|--------|-------------|
| Executive Dashboard | High-level cross-domain summary |
| Support Analytics | Ticket volume, SLA, agent KPIs |
| Operations Analytics | Dispatch, task, standup metrics |
| Appointment Analytics | Booking volume, completion, no-show rates |
| Account Analytics | Health distribution, churn risk, followups |
| Dispute Analytics | Volume, resolution time, by-type breakdown |
| Report Builder | Drag-and-drop report configuration |
| Scheduled Reports | Recurring report management |

---

## 9. Permissions

| Permission | Roles |
|------------|-------|
| analytics:view_executive | Executive, Manager, Analyst, Admin |
| analytics:view_support | Manager, Analyst, Admin |
| analytics:view_operations | Manager, Analyst, Admin |
| analytics:view_appointments | Manager, Analyst, Admin |
| analytics:view_accounts | Manager, Analyst, Admin |
| analytics:view_disputes | Manager, Analyst, Admin |
| analytics:manage_reports | Analyst, Admin |
| analytics:manage_schedules | Analyst, Admin |
| analytics:export_data | Analyst, Admin |

---

## 10. Future Backend Dependencies

| Dependency | Type | Purpose |
|------------|------|---------|
| tickets table | Database | Support/ops metrics |
| appointments table | Database | Appointment metrics |
| disputes table | Database | Dispute metrics |
| accounts table | Database | Account health metrics |
| followups table | Database | Followup metrics |
| tasks table | Database | Task metrics |
| technicians table | Database | Tech performance |
| operations_log table | Database | Event-based metrics |
| notifications_v2 table | Database | Notification delivery metrics |

*Note: Analytics is read-only. No tables are written by this app.*

---

## 11. Screen Specifications

### 11.1 ExecutiveDashboardPage (/) — Executive Dashboard

**Purpose:** High-level cross-domain executive summary with key business KPIs.

**Entry Points:** App root, sidebar "Executive Dashboard"

**Header:** "Executive Dashboard" with date range + data freshness indicator

**Toolbar:** DateRangeNavigator (presets: Today, This Week, This Month, This Quarter, This Year, Custom), DataExportButton (PDF summary), DataFreshnessIndicator

**Tabs:** Overview (default) | Support | Operations | Appointments

**Widgets/KpiDashboardGrid:**
| MetricCard | Source | Color |
|------------|--------|-------|
| Total Tickets (period) | tickets | Blue |
| Avg Response Time | tickets | Green |
| SLA Compliance % | tickets | Green/Yellow/Red |
| Active Dispatches | tasks/dispatch | Red |
| Appointments Completed | appointments | Green |
| No-Show Rate | appointments | Yellow |
| Account Health Avg | accounts | Green/Yellow/Red |
| Open Disputes | disputes | Red |

Each MetricCard shows: value, label, trend arrow (up/down/flat), percentage change vs prior period

**Charts:**
- Tickets Over Time (TimeSeriesChart — daily/weekly)
- Disputes by Type (PieChart)
- Top KPIs comparison bar (BarChart)

**Loading:** Skeleton dashboard grid
**Error:** ErrorState + Retry
**Empty State:** "No data available for the selected period"

---

### 11.2 SupportAnalyticsPage (/support) — Support Analytics

**Purpose:** Detailed support ticket metrics for service managers.

**Header:** "Support Analytics"

**Toolbar:** DateRangeNavigator, Channel filter, Type filter, Export button

**Widgets:**
- KPI row: Total Tickets, Avg Response Time, Avg Resolution Time, CSAT Score
- Ticket Volume by Channel (BarChart)
- Ticket Volume by Type (BarChart)
- SLA Compliance Trend (TimeSeriesChart)
- Agent Performance Table: Agent name, tickets resolved, avg handle time, CSAT

**Table:** Agent performance data with sorting by any metric

---

### 11.3 OperationsAnalyticsPage (/operations) — Operations Analytics

**Purpose:** Operations performance metrics.

**Widgets:**
- KPI row: Dispatches Completed, Avg Dispatch Time, Tasks Completed, Tech Utilization %
- Dispatch Volume (TimeSeriesChart)
- Task Completion Rate by Priority (BarChart)
- Technician Load Distribution (BarChart)
- Daily Standup Compliance %

---

### 11.4 AppointmentAnalyticsPage (/appointments) — Appointment Analytics

**Purpose:** Scheduling and appointment performance.

**Widgets:**
- KPI row: Total Appointments, Avg per Day, No-Show Rate, Reschedule Rate
- Appointments by Service Type (PieChart)
- No-Show Rate by Day (BarChart)
- Completion Rate Trend (TimeSeriesChart)
- Avg Appointment Duration by Type (BarChart)

---

### 11.5 AccountAnalyticsPage (/accounts) — Account Analytics

**Purpose:** Account health distribution and churn analysis.

**Widgets:**
- KPI row: Total Accounts, Avg Health Score, At-Risk Count, Critical Count
- Health Score Distribution (BarChart - buckets)
- Health Score Trend (TimeSeriesChart)
- Churn Risk Factors (horizontal bar chart)
- Followup Completion Rate

---

### 11.6 DisputeAnalyticsPage (/disputes) — Dispute Analytics

**Purpose:** Dispute trends and resolution performance.

**Widgets:**
- KPI row: Total Disputes, Avg Resolution Time, Resolved Rate, Escalation Rate
- Disputes by Type (PieChart)
- Resolution Time Trend (TimeSeriesChart)
- Disputes by Technician (BarChart)
- Resolution Outcome Distribution

---

### 11.7 CustomReportsPage (/reports) — Reports List

**Purpose:** Manage saved custom reports.

**Header:** "Custom Reports"

**Toolbar:** "New Report" button, folder/category filter

**List:** Saved reports — name, type, last run, schedule status, actions (Run, Edit, Schedule, Delete)

---

### 11.8 ReportBuilderPage (/reports/builder) — Report Builder

**Purpose:** Create custom reports with drag-and-drop chart configuration.

**Form/Sections:**
- Report Name (required)
- Data Source (dropdown: support/operations/appointments/accounts/disputes)
- Chart Type (dropdown: line, bar, pie, table, metric)
- Metric Selection (checkboxes based on data source)
- Filters (configurable filter panel)
- Date Range (presets + custom)
- Preview (live preview of chart as configured)
- Save / Save & Schedule buttons

**ReportBuilderCanvas Component:**
| Property | Description |
|----------|-------------|
| Props | config, data, loading |
| States | Empty (no config), Configured (preview), Error (invalid config) |
| Actions | Add chart, Remove, Reorder |

**ChartConfigPanel Component:**
| Property | Options |
|----------|---------|
| chartType | line, bar, pie, table, metric |
| xAxis | Date-based fields |
| yAxis | Numeric metric fields |
| groupBy | Categorical fields |
| colorScheme | Default, Monochrome, Vibrant, Pastel |

---

### 11.9 ScheduledReportsPage (/reports/scheduled) — Scheduled Reports

**Purpose:** Manage recurring report delivery.

**Header:** "Scheduled Reports"

**List:** ScheduledReportCard — report name, frequency (daily/weekly/monthly), format (PDF/CSV), recipients, last sent, next send, actions (Edit, Pause, Delete)

**Actions:** Create schedule from existing report, Edit schedule, Pause/Resume, Delete, Send Now

---

## 12. User Journeys

### Journey 1: Director reviews weekly metrics
1. Director opens ExecutiveDashboardPage
2. Sets DateRangeNavigator to "This Week"
3. Sees KPI grid: 45 tickets (↑12%), 92% SLA (↓3%), 87% health avg (→)
4. Notices SLA dip → clicks "Support" tab
5. Support tab shows SLA compliance trend chart — dip on Tuesday
6. Clicks Tuesday data point → drill-down to ticket list for that day
7. Identifies 3 breached tickets due to understaffing
8. Exports dashboard as PDF for management meeting

### Journey 2: Analyst creates scheduled report
1. Analyst opens ReportBuilderPage
2. Names report "Weekly Account Health Summary"
3. Selects data source: accounts
4. Charts: Health Distribution (pie) + Health Trend (line) + At-Risk List (table)
5. Sets date range: last 30 days
6. Clicks "Save & Schedule" → frequency: Weekly, Monday 8 AM
7. Adds recipients: account_managers@company.com
8. Format: PDF
9. Report saved and scheduled

---

## 13. Future Integrations

| Integration | Type | Purpose |
|-------------|------|---------|
| tickets table | DB | Ticket metrics |
| appointments table | DB | Appointment metrics |
| disputes table | DB | Dispute metrics |
| accounts table | DB | Account health |
| followups table | DB | Followup metrics |
| tasks table | DB | Task metrics |
| operations_log table | DB | Event-based analytics |
| notifications_v2 table | DB | Notification metrics |
| technicians table | DB | Tech performance |
| report-generation function | Function | Generate scheduled reports |
| data-export function | Function | Export data to CSV/PDF |
