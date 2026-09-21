# Analytics Center v2

Enterprise analytics and business intelligence platform for ResQAI V2. Provides operational dashboards, executive KPIs, technician analytics, customer analytics, SLA monitoring, forecasting, reporting, and business insights across all operational domains.

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `#/` | Executive Dashboard | Enterprise-wide KPI overview |
| `#/support` | Support Analytics | Ticket and agent performance metrics |
| `#/operations` | Operations Analytics | Task and dispatch metrics |
| `#/appointments` | Appointment Analytics | Booking and fulfillment analytics |
| `#/technicians` | Technician Performance | Individual technician productivity and quality |
| `#/customers` | Customer Analytics | Satisfaction, retention, and churn metrics |
| `#/crm` | CRM Analytics | Account growth and pipeline analytics |
| `#/resolution` | Resolution Analytics | Dispute and resolution efficiency |
| `#/sla` | SLA Dashboard | SLA compliance monitoring |
| `#/productivity` | Productivity Dashboard | Cross-domain productivity benchmarking |
| `#/trends` | Trend Analysis | Multi-metric trend comparison |
| `#/forecasting` | Forecasting | Predictive analytics projections |
| `#/reports` | Reports | Report library and generation hub |
| `#/reports/custom` | Custom Reports | User-defined report management |
| `#/reports/builder` | Report Builder | Custom report builder canvas |
| `#/reports/scheduled` | Scheduled Reports | Automated report delivery management |
| `#/export` | Export Center | Data export with multiple format options |
| `#/audit` | Audit Analytics | User activity and audit trail |
| `#/health` | System Health | Integration and performance monitoring |
| `#/search` | Search | Global analytics search |

## Tech Stack

- React 18 + TypeScript (strict)
- Vite (build tool)
- Inline styles (CSS custom properties)
- Hash-based function routing (no React Router)
- `@resqai/foundation` shared component library
- Custom inline SVG chart library (no external charting)

## Setup

```bash
cd ../../ && npm install
cd apps_v2/analytics-center_v2 && npm run dev
npm run build
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_LEMMA_TOKEN` | Lemma API token |
| `VITE_LEMMA_POD_ID` | Lemma pod identifier |
| `VITE_LEMMA_API_URL` | Lemma API base URL |

## Project Structure

```
src/
  App.tsx               — Root shell with AppProvider
  main.tsx              — Entry point with Lemma SDK
  components/           — 30+ reusable UI components
  contracts/            — Event and permission constants (11 events, 20 permissions)
  hooks/                — 20 data-fetching hooks
  layouts/              — App layout (Topbar + Sidebar)
  models/               — DTOs, view-models, request/response types
  pages/                — 22 route-level page components
  routes/               — Hash-based routing
  services/             — Mock typed API service (all endpoints return data)
  state/                — React context for app state
  types/                — Re-exported global types
docs/
  ARCHITECTURE.md
  NAVIGATION.md
  COMPONENT_TREE.md
  ROUTES.md
  STATE.md
  API_CONTRACTS.md
  BACKEND_DEPENDENCIES.md
  CHART_LIBRARY.md
  REPORT_LIBRARY.md
charts/                 — Chart component library documentation
```

## State Management

- **React Context**: App-level state (current user, filters, date range, report editing, export progress)
- **Custom Hooks**: Data fetching with loading/error/data state pattern (20 hooks)

## Mock Services

All API calls go through `src/services/analytics-service.ts`. All endpoints return mock data with realistic sample values.

## Charts

Custom inline SVG chart library with 6 chart types:
- Line Chart (TimeSeriesChart)
- Bar Chart (BarChart)
- Pie Chart (PieChart)
- Area Chart (AreaChart)
- Heat Map (HeatMap)
- Trend Graph (TrendGraph)

Plus: KPI Cards, Dashboard Grid, Leaderboard, Live KPI Cards

## Permissions

| Permission | Description |
|-----------|-------------|
| `analytics:view_executive` | View executive dashboard |
| `analytics:view_support` | View support analytics |
| `analytics:view_operations` | View operations analytics |
| `analytics:view_appointments` | View appointment analytics |
| `analytics:view_technicians` | View technician performance |
| `analytics:view_customers` | View customer analytics |
| `analytics:view_crm` | View CRM analytics |
| `analytics:view_resolution` | View resolution analytics |
| `analytics:view_sla` | View SLA dashboard |
| `analytics:view_productivity` | View productivity dashboard |
| `analytics:view_trends` | View trend analysis |
| `analytics:view_forecasting` | View forecasting |
| `analytics:view_accounts` | View account analytics |
| `analytics:view_disputes` | View dispute analytics |
| `analytics:view_audit` | View audit analytics |
| `analytics:view_health` | View system health |
| `analytics:manage_reports` | Create/edit/delete reports |
| `analytics:manage_schedules` | Manage scheduled reports |
| `analytics:export_data` | Export analytics data |
| `analytics:view_all` | View all analytics |

## Future Integration Points

- Real-time dashboard updates via EventBus
- AI-powered anomaly detection and insights
- Automated forecast model execution
- Scheduled report delivery via email service
- Cross-app drill-down navigation
