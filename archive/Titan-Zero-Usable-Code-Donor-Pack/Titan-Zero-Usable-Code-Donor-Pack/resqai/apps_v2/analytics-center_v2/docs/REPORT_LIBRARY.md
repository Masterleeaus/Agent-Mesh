# Report Library

## Overview

The report system provides custom report creation, scheduled delivery, and multi-format export. Reports are built using the chart library components and can be combined into composite dashboard views.

## Report Types

### 1. KPI Summary Report
**Description:** High-level metric summary across selected domains.
**Default Metrics:** Total Tickets, Resolution Rate, SLA Compliance, Customer Satisfaction, Revenue
**Charts Used:** MetricCard (grid), BarChart (comparison)
**Export Formats:** PDF, CSV

### 2. Trend Analysis Report
**Description:** Time-series trends for selected metrics with period comparison.
**Default Metrics:** Tickets Opened/Resolved, Appointments Completed, Revenue
**Charts Used:** TimeSeriesChart, TrendGraph
**Export Formats:** PDF, CSV, XLSX

### 3. Technician Performance Report
**Description:** Technician rankings with productivity and quality scores.
**Default Metrics:** Completion Rate, Satisfaction, Avg Duration, No-Show Rate
**Charts Used:** Leaderboard, BarChart, KpiDashboardGrid
**Export Formats:** PDF, CSV

### 4. SLA Compliance Report
**Description:** SLA adherence rates across support, operations, and appointments.
**Default Metrics:** SLA Compliance %, Breach Count, Avg Response Time, Avg Resolution Time
**Charts Used:** KpiDashboardGrid, BarChart, TimeSeriesChart
**Export Formats:** PDF, CSV, XLSX

### 5. Customer Health Report
**Description:** Customer satisfaction, retention risk, and account health overview.
**Default Metrics:** CSAT Score, NPS, At-Risk Accounts, Churn Rate, Follow-up Completion
**Charts Used:** PieChart, BarChart, KpiDashboardGrid, Leaderboard
**Export Formats:** PDF, CSV

### 6. Operations Efficiency Report
**Description:** Field operations metrics including dispatch, completion, and resource utilization.
**Default Metrics:** Tasks Completed, Dispatch Time, Completion Rate, Avg Duration
**Charts Used:** BarChart, TimeSeriesChart, KpiDashboardGrid
**Export Formats:** PDF, CSV

### 7. Appointment Fulfillment Report
**Description:** Appointment booking, completion, no-show, and cancellation metrics.
**Default Metrics:** Bookings, Completion Rate, No-Show Rate, Cancellation Rate, Avg Duration
**Charts Used:** PieChart, BarChart, TimeSeriesChart, KpiDashboardGrid
**Export Formats:** PDF, CSV

### 8. Executive Summary Report
**Description:** Comprehensive enterprise-wide KPI summary for leadership.
**Default Metrics:** All executive KPIs, cross-domain comparison
**Charts Used:** KpiDashboardGrid, TimeSeriesChart, BarChart, PieChart, TrendGraph
**Export Formats:** PDF

## Report Builder

Located at `#/reports/builder`.

**Components:**
- `ReportBuilderCanvas` - Drag-and-drop report composition area
- `ChartConfigPanel` - Chart type, metrics, dimensions, filters configuration
- `AnalyticsFilterBar` - Global filter application
- `DateRangeNavigator` - Date range selection

**Steps:**
1. Set report name and description
2. Add chart widgets to canvas
3. Configure each chart (type, metrics, dimensions, filters)
4. Apply global date range and domain filters
5. Save report or generate preview

## Scheduled Reports

Located at `#/reports/scheduled`.

**Frequency Options:**
| Frequency | Cron Equivalent |
|-----------|----------------|
| Daily | `0 6 * * *` |
| Weekly | `0 6 * * 1` |
| Biweekly | `0 6 1,15 * *` |
| Monthly | `0 6 1 * *` |
| Quarterly | `0 6 1 1,4,7,10 *` |

**Delivery Formats:**
- PDF (formatted report with charts)
- CSV (raw data tables)
- JSON (machine-readable data)
- XLSX (Excel workbook with sheets)

**Recipients:** Email distribution list

## Export Center

Located at `#/export`.

**Export Flow:**
1. Select report or data scope
2. Choose format (CSV, PDF, JSON, XLSX)
3. Configure date range and filters
4. Submit export request
5. Monitor progress (pending → processing → completed)
6. Download or share file URL

**Export History:**
- Table of past exports with status, format, date, and download link
- Auto-purging of exports older than retention period

## Report Components

| Component | File | Purpose |
|-----------|------|---------|
| `GenerateReportForm` | `src/components/GenerateReportForm.tsx` | Create new report form |
| `ExportReportForm` | `src/components/ExportReportForm.tsx` | Configure export parameters |
| `ScheduleReportForm` | `src/components/ScheduleReportForm.tsx` | Set up scheduled delivery |
| `FilterAnalyticsForm` | `src/components/FilterAnalyticsForm.tsx` | Advanced filter configuration |
| `ComparePeriodsForm` | `src/components/ComparePeriodsForm.tsx` | Period-over-period comparison |
| `ExportConfirmationDialog` | `src/components/ExportConfirmationDialog.tsx` | Confirm export action |
| `ScheduleConfirmationDialog` | `src/components/ScheduleConfirmationDialog.tsx` | Confirm schedule creation |
| `DeleteReportDialog` | `src/components/DeleteReportDialog.tsx` | Confirm report deletion |

## Data Tables

| Table | File | Purpose |
|-------|------|---------|
| `KpiReportTable` | `src/components/KpiReportTable.tsx` | Tabular KPI breakdown |
| `HistoricalMetricsTable` | `src/components/HistoricalMetricsTable.tsx` | Time-series metric history |
| `TechnicianRankingsTable` | `src/components/TechnicianRankingsTable.tsx` | Ranked technician list |
| `CustomerMetricsTable` | `src/components/CustomerMetricsTable.tsx` | Customer-level metrics |
| `SLAReportsTable` | `src/components/SLAReportsTable.tsx` | SLA per domain/team |
| `ExportHistoryTable` | `src/components/ExportHistoryTable.tsx` | Past export records |
