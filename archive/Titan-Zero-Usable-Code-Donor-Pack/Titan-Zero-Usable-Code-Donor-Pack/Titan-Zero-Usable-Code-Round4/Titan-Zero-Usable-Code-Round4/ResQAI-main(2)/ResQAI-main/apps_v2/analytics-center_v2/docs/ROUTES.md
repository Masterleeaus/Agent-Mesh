# Routes

## Hash-Based Routing

All routes use the `#` prefix for hash-based navigation. Route resolution occurs in `src/routes/index.tsx`.

## Route Table

| Route | Page Component | Purpose | Business Objective |
|-------|---------------|---------|-------------------|
| `#/` | ExecutiveDashboardPage | Executive-level KPI overview | Leadership visibility into enterprise health |
| `#/support` | SupportAnalyticsPage | Support ticket metrics and agent performance | Measure and optimize support operations |
| `#/operations` | OperationsAnalyticsPage | Field operations and task analytics | Track dispatch efficiency and completion rates |
| `#/appointments` | AppointmentAnalyticsPage | Appointment booking and fulfillment metrics | Monitor scheduling performance and no-show trends |
| `#/technicians` | TechnicianPerformancePage | Individual and team technician KPIs | Evaluate technician productivity and quality |
| `#/customers` | CustomerAnalyticsPage | Customer-level satisfaction and retention metrics | Understand customer health and churn risk |
| `#/crm` | CRMAnalyticsPage | CRM pipeline and account management analytics | Track account growth and engagement metrics |
| `#/resolution` | ResolutionAnalyticsPage | Dispute and resolution efficiency metrics | Improve resolution velocity and outcomes |
| `#/sla` | SLADashboardPage | SLA compliance monitoring across all domains | Ensure contractual SLA adherence |
| `#/productivity` | ProductivityDashboardPage | Cross-domain productivity benchmarking | Identify efficiency gains and capacity planning |
| `#/trends` | TrendAnalysisPage | Multi-metric trend comparison and correlation | Detect patterns and anomalies over time |
| `#/forecasting` | ForecastingPage | Predictive analytics and forecast projections | Data-driven capacity and resource planning |
| `#/reports` | ReportsPage | Report library and generation hub | Centralized report management and creation |
| `#/reports/builder` | ReportBuilderPage | Custom report builder canvas | Ad-hoc report construction with drag-and-drop |
| `#/reports/scheduled` | ScheduledReportsPage | Scheduled report delivery management | Automated report distribution |
| `#/export` | ExportCenterPage | Data export center with format options | Bulk data export for external analysis |
| `#/audit` | AuditAnalyticsPage | User activity and audit trail analytics | Governance, compliance, and security monitoring |
| `#/health` | SystemHealthPage | System performance and integration health | Technical operational visibility |
| `#/search` | SearchPage | Global analytics search | Cross-dashboard metric and report discovery |

## Route Structure

```
/                          Executive Dashboard
├── /support               Support Analytics
├── /operations            Operations Analytics
├── /appointments          Appointment Analytics
├── /technicians           Technician Performance
├── /customers             Customer Analytics
├── /crm                   CRM Analytics
├── /resolution            Resolution Analytics
├── /sla                   SLA Dashboard
├── /productivity          Productivity Dashboard
├── /trends                Trend Analysis
├── /forecasting           Forecasting
├── /reports               Reports
│   ├── /reports/builder   Report Builder
│   └── /reports/scheduled Scheduled Reports
├── /export                Export Center
├── /audit                 Audit Analytics
├── /health                System Health
└── /search                Search
```

## Navigation

Use `window.location.hash = route` for programmatic navigation:

```typescript
function navigate(route: string): void {
  window.location.hash = route;
}
```

The `AppLayout` component handles sidebar navigation via the `onNavigate` callback.

## Route Detection

Route detection occurs via hash change listener in `Routes` component:

```typescript
const hash = window.location.hash.replace('#', '') || '/';
```

## Active Route

The active route is tracked in `Routes` state and passed to `AppLayout` for sidebar highlighting.

## Permission Mapping

| Route | Required Permission |
|-------|-------------------|
| `#/` | `analytics:view_executive` |
| `#/support` | `analytics:view_support` |
| `#/operations` | `analytics:view_operations` |
| `#/appointments` | `analytics:view_appointments` |
| `#/technicians` | `analytics:view_technicians` |
| `#/customers` | `analytics:view_customers` |
| `#/crm` | `analytics:view_crm` |
| `#/resolution` | `analytics:view_resolution` |
| `#/sla` | `analytics:view_sla` |
| `#/productivity` | `analytics:view_productivity` |
| `#/trends` | `analytics:view_trends` |
| `#/forecasting` | `analytics:view_forecasting` |
| `#/reports` | `analytics:manage_reports` |
| `#/reports/builder` | `analytics:manage_reports` |
| `#/reports/scheduled` | `analytics:manage_schedules` |
| `#/export` | `analytics:export_data` |
| `#/audit` | `analytics:view_audit` |
| `#/health` | `analytics:view_health` |
| `#/search` | `analytics:view_executive` |
