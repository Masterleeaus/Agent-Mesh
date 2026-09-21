# Navigation

## Route Map

| Route | Page Component | Description | Required Permission |
|-------|---------------|-------------|-------------------|
| `#/` | ExecutiveDashboardPage | Enterprise-wide KPI overview | `analytics:view_executive` |
| `#/support` | SupportAnalyticsPage | Ticket and agent performance | `analytics:view_support` |
| `#/operations` | OperationsAnalyticsPage | Task and dispatch metrics | `analytics:view_operations` |
| `#/appointments` | AppointmentAnalyticsPage | Booking and fulfillment | `analytics:view_appointments` |
| `#/technicians` | TechnicianPerformancePage | Technician productivity | `analytics:view_technicians` |
| `#/customers` | CustomerAnalyticsPage | Customer satisfaction and retention | `analytics:view_customers` |
| `#/crm` | CRMAnalyticsPage | Account growth and pipeline | `analytics:view_crm` |
| `#/resolution` | ResolutionAnalyticsPage | Resolution efficiency | `analytics:view_resolution` |
| `#/sla` | SLADashboardPage | SLA compliance monitoring | `analytics:view_sla` |
| `#/productivity` | ProductivityDashboardPage | Cross-domain productivity | `analytics:view_productivity` |
| `#/trends` | TrendAnalysisPage | Multi-metric trend comparison | `analytics:view_trends` |
| `#/forecasting` | ForecastingPage | Predictive analytics | `analytics:view_forecasting` |
| `#/reports` | ReportsPage | Report library hub | `analytics:manage_reports` |
| `#/reports/custom` | CustomReportsPage | User-defined report management | `analytics:manage_reports` |
| `#/reports/builder` | ReportBuilderPage | Report creation canvas | `analytics:manage_reports` |
| `#/reports/scheduled` | ScheduledReportsPage | Schedule management | `analytics:manage_schedules` |
| `#/export` | ExportCenterPage | Data export center | `analytics:export_data` |
| `#/audit` | AuditAnalyticsPage | Audit trail analytics | `analytics:view_audit` |
| `#/health` | SystemHealthPage | System performance health | `analytics:view_health` |
| `#/search` | SearchPage | Global analytics search | `analytics:view_executive` |

## Sidebar Structure

```
Analytics Center
├── Executive Dashboard    (/)          - Enterprise KPI overview
├── Support Analytics      (/support)   - Ticket and agent metrics
├── Operations Analytics   (/operations) - Task and dispatch metrics
├── Appointment Analytics  (/appointments) - Booking and fulfillment
├── Technician Performance (/technicians) - Technician KPIs
├── Customer Analytics     (/customers)  - Customer satisfaction
├── CRM Analytics          (/crm)        - Account growth pipeline
├── Resolution Analytics   (/resolution) - Resolution efficiency
├── SLA Dashboard          (/sla)        - Compliance monitoring
├── Productivity Dashboard (/productivity) - Team productivity
├── Trend Analysis         (/trends)     - Metric trend comparison
├── Forecasting            (/forecasting) - Predictive projections
├── Reports                (/reports)    - Report library hub
├── Custom Reports         (/reports/custom) - Saved user reports
├── Report Builder         (/reports/builder) - Create new reports
├── Scheduled Reports      (/reports/scheduled) - Delivery schedules
├── Export Center          (/export)     - Data export and download
├── Audit Analytics        (/audit)      - User activity trail
├── System Health          (/health)     - Service status monitoring
└── Search                 (/search)     - Global search
```

## Hash-based Routing

All routes use the `#` prefix for hash-based navigation via `window.location.hash`.

```typescript
function navigate(route: string): void {
  window.location.hash = route;
}
```

## Active Route Detection

Active route is determined by parsing `window.location.hash` in the `Routes` component. The active route ID is passed to `AppLayout` for sidebar highlighting.

## Breadcrumb Structure

For nested routes under `/reports/*`, breadcrumb navigation is implied:
- Reports > Custom Reports
- Reports > Report Builder
- Reports > Scheduled Reports
