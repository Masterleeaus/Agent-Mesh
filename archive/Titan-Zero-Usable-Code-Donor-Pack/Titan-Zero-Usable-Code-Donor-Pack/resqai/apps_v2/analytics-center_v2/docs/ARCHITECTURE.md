# Architecture

## Purpose

Consolidated analytics dashboard for ResQAI V2. Provides KPI dashboards, custom reports, and scheduled report delivery across 12 operational domains including support, operations, appointments, technicians, customers, CRM, resolution, SLA, productivity, trends, forecasting, and system health.

## Tech Stack

- **Framework**: React 18 with TypeScript (strict)
- **Build**: Vite
- **Styling**: Inline styles with CSS custom properties (no Tailwind, no CSS modules)
- **Routing**: Hash-based function routing (no React Router)
- **Shared UI**: `@resqai/foundation` (21+ shared components)
- **Charting**: Custom inline SVG components (no Chart.js, Recharts, or D3)

## Folder Structure

```
src/
  components/   - 30+ app-specific components (charts, tables, dialogs, forms)
  contracts/    - Event names (11), permission constants (20)
  hooks/        - 20 data-fetching hooks (loading/error/data pattern)
  layouts/      - App-level layout (Topbar + Sidebar with 20 nav items)
  models/       - DTOs (17), view-models (14), API request/response types
  pages/        - 22 route-level page components
  routes/       - Hash-based route switch (22 routes)
  services/     - Mock API service layer with realistic data
  state/        - React Context for app-wide state
  types/        - Re-exported shared types from packages
```

## Layers

### Models Layer (`src/models/`)
- `dto.ts` - Data Transfer Objects (17 interfaces): ExecutiveDashboard, SupportMetrics, OperationsMetrics, AppointmentMetrics, AccountMetrics, DisputeMetrics, TechnicianPerformance, CustomerMetrics, CRMMetrics, ResolutionMetrics, SLAMetrics, ProductivityMetrics, TrendAnalysis, Forecast, ExportHistory, AuditMetrics, SystemHealth
- `view-models.ts` - Presentation-ready shapes (14 interfaces)
- `api-requests.ts` - Request body types (6 interfaces)
- `api-responses.ts` - Response wrapper types (17 interfaces)

### Contracts Layer (`src/contracts/`)
- `permissions.ts` - 20 permission string constants
- `events.ts` - 11 event name constants with typed payload interfaces

### Services Layer (`src/services/`)
- `analytics-service.ts` - 23 async methods with mock data (all return realistic sample data)

### State Layer (`src/state/`)
- `AppContext.tsx` - React Context with 7 state fields and 7 actions

### Hooks Layer (`src/hooks/`)
- 20 custom hooks, each returning `{ data, loading, error, refetch }`

### Components Layer (`src/components/`)
- 13 original + 18 new = 31 total components
- Charts (7): TimeSeriesChart, BarChart, PieChart, AreaChart, HeatMap, TrendGraph, LiveKPICards
- Tables (6): KpiReportTable, HistoricalMetricsTable, TechnicianRankingsTable, CustomerMetricsTable, SLAReportsTable, ExportHistoryTable
- Dialogs (3): ExportConfirmation, ScheduleConfirmation, DeleteReport
- Forms (5): GenerateReport, ExportReport, ScheduleReport, FilterAnalytics, ComparePeriods
- Other (10): MetricCard, KpiDashboardGrid, Leaderboard, DataExportButton, DrillDownLink, DateRangeNavigator, DataFreshnessIndicator, AnalyticsFilterBar, ReportBuilderCanvas, ChartConfigPanel, ScheduledReportCard

### Pages Layer (`src/pages/`)
- 22 pages across 12 functional areas

### Layouts Layer (`src/layouts/`)
- `AppLayout.tsx` - Topbar + Sidebar (20 nav items) + main content area

### Routes Layer (`src/routes/`)
- `index.tsx` - Hash-based route switch with 22 route mappings

## Key Decisions

- **No router library**: Simple hash-based routing
- **Mock services**: All API calls go through service layer with realistic mock data
- **Shared foundation**: UI primitives from shared library
- **State management**: React Context for app state; data fetching via custom hooks
- **Loading/Empty/Error states**: Every page and component handles all three states
- **Custom charts**: Inline SVG for all chart types (no external dependencies)

## Data Flow

```
User Action → Page Component → Hook → Service → Mock API → State Update → Re-render
```

## UI States

Every data-driven component handles:
- Loading (Skeleton placeholders)
- Error (ErrorState with retry)
- Empty (EmptyState with contextual message)
- Permission Denied (PermissionGuard wrapper)
- No Data (Empty state with filter guidance)
- Export Progress (Progress indicator)
- Report Generation (Loading spinner)

## Dependencies

- `@resqai/foundation` (shared component library)
- `lemma-sdk`
