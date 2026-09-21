# API Contracts

## Future Backend API Endpoints

### Executive Dashboard

#### `GET /api/v2/analytics/executive-dashboard`
**Purpose:** Aggregate KPIs for the executive overview page.

**Request Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dateRange.preset` | string | No | Preset date range |
| `dateRange.startDate` | string | No | Custom start date (ISO 8601) |
| `dateRange.endDate` | string | No | Custom end date (ISO 8601) |

**Response:** `ExecutiveDashboardResponse`
```typescript
{
  data: {
    totalTickets: number;
    ticketChange: number;
    openTickets: number;
    avgResolutionTime: number;
    totalAppointments: number;
    appointmentChange: number;
    completionRate: number;
    noShowRate: number;
    activeDisputes: number;
    disputeChange: number;
    avgDisputeResolutionDays: number;
    accountsAtRisk: number;
    accountRiskChange: number;
    healthyAccounts: number;
    lastUpdated: string;
  };
  error: string | null;
}
```

### Support Metrics

#### `GET /api/v2/analytics/support-metrics`
**Purpose:** Support ticket and agent performance metrics.

**Request Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dateRange.preset` | string | No | Preset date range |
| `dateRange.startDate` | string | No | Custom start date |
| `dateRange.endDate` | string | No | Custom end date |
| `agentId` | string | No | Filter by specific agent |

**Response:** `SupportMetricsResponse`
```typescript
{
  data: {
    totalTickets: number;
    resolvedTickets: number;
    avgResponseTime: number;
    avgResolutionTime: number;
    slaComplianceRate: number;
    ticketsByStatus: Array<{ status: string; count: number }>;
    ticketsByPriority: Array<{ priority: string; count: number }>;
    agentMetrics: Array<{
      agentId: string; agentName: string;
      ticketsAssigned: number; ticketsResolved: number;
      avgResponseTime: number; avgResolutionTime: number;
      satisfactionScore: number;
    }>;
    trendData: Array<{ date: string; opened: number; resolved: number }>;
  };
  error: string | null;
}
```

### Operations Metrics

#### `GET /api/v2/analytics/operations-metrics`
**Purpose:** Field operations task and dispatch metrics.

**Response:** `OperationsMetricsResponse`

### Appointment Metrics

#### `GET /api/v2/analytics/appointment-metrics`
**Purpose:** Appointment booking and fulfillment analytics.

**Response:** `AppointmentMetricsResponse`

### Technician Performance

#### `GET /api/v2/analytics/technician-performance`
**Purpose:** Individual technician productivity and quality scores.

**Request Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `technicianId` | string | No | Filter by technician |
| `sortBy` | string | No | Sort field |
| `sortOrder` | string | No | asc or desc |

**Response:**
```typescript
{
  data: Array<{
    technicianId: string;
    technicianName: string;
    appointmentsCompleted: number;
    completionRate: number;
    avgDuration: number;
    customerSatisfaction: number;
    noShowRate: number;
    travelTime: number;
    productivityScore: number;
    trendData: Array<{ date: string; completed: number; satisfaction: number }>;
  }>;
  error: string | null;
}
```

### Customer Analytics

#### `GET /api/v2/analytics/customer-metrics`
**Purpose:** Customer satisfaction, retention, and health metrics.

**Response:** `CustomerMetricsResponse`

### CRM Analytics

#### `GET /api/v2/analytics/crm-metrics`
**Purpose:** Account management and CRM pipeline analytics.

**Response:** `CRMMetricsResponse`

### Resolution Analytics

#### `GET /api/v2/analytics/resolution-metrics`
**Purpose:** Dispute and resolution efficiency metrics.

**Response:** `ResolutionMetricsResponse`

### SLA Dashboard

#### `GET /api/v2/analytics/sla-metrics`
**Purpose:** SLA compliance monitoring across all domains.

**Response:** `SLAMetricsResponse`

### Productivity Dashboard

#### `GET /api/v2/analytics/productivity-metrics`
**Purpose:** Cross-domain productivity and efficiency metrics.

**Response:** `ProductivityMetricsResponse`

### Trend Analysis

#### `GET /api/v2/analytics/trend-analysis`
**Purpose:** Multi-metric trend comparison over custom date ranges.

**Request Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `metrics` | string[] | Yes | Metric identifiers to include |
| `granularity` | string | No | day, week, month |
| `comparePeriod` | string | No | previous_period, year_over_year |

**Response:** `TrendAnalysisResponse`

### Forecasting

#### `GET /api/v2/analytics/forecasts`
**Purpose:** Predictive forecasts for key business metrics.

**Request Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `metric` | string | Yes | Metric to forecast |
| `periods` | number | No | Number of periods to forecast |

**Response:**
```typescript
{
  data: Array<{
    metric: string;
    forecastDate: string;
    predictedValue: number;
    lowerBound: number;
    upperBound: number;
    confidence: number;
  }>;
  error: string | null;
}
```

### Reports

#### `GET /api/v2/analytics/reports`
**Purpose:** List all custom reports.

**Response:** `ReportListResponse`

#### `POST /api/v2/analytics/reports`
**Purpose:** Create a new custom report.

**Request Body:** `CreateReportRequest`
```typescript
{
  name: string;
  description: string;
  chartType: ChartType;
  metrics: string[];
  dimensions: string[];
  filters: Record<string, string[]>;
}
```

#### `PUT /api/v2/analytics/reports/:id`
**Purpose:** Update an existing report.

#### `DELETE /api/v2/analytics/reports/:id`
**Purpose:** Delete a report.

### Scheduled Reports

#### `GET /api/v2/analytics/schedules`
**Purpose:** List all scheduled report deliveries.

#### `POST /api/v2/analytics/schedules`
**Purpose:** Create a new schedule.

#### `PUT /api/v2/analytics/schedules/:id`
**Purpose:** Update a schedule.

#### `DELETE /api/v2/analytics/schedules/:id`
**Purpose:** Delete a schedule.

### Export

#### `POST /api/v2/analytics/export`
**Purpose:** Export analytics data in specified format.

**Request Body:** `ExportDataRequest`
```typescript
{
  reportId?: string;
  format: ExportFormat;
  dateRange: DateRangeRequest;
  filters: Record<string, string[]>;
}
```

#### `GET /api/v2/analytics/export/:id/status`
**Purpose:** Check export generation status.

#### `GET /api/v2/analytics/export/:id/download`
**Purpose:** Download completed export file.

### Export History

#### `GET /api/v2/analytics/export-history`
**Purpose:** List historical export records.

### Audit Analytics

#### `GET /api/v2/analytics/audit-metrics`
**Purpose:** User activity and audit trail analytics.

**Response:** `AuditMetricsResponse`

### System Health

#### `GET /api/v2/analytics/system-health`
**Purpose:** Integration and system performance health.

**Response:** `SystemHealthResponse`

### Search

#### `GET /api/v2/analytics/search`
**Purpose:** Global search across dashboards, reports, and metrics.

**Request Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query |
| `type` | string | No | Filter by result type |

## Future Workflow Trigger Points

| Endpoint | Triggered Workflow | Purpose |
|----------|-------------------|---------|
| `POST /api/v2/analytics/reports` | `analytics.report.generated` | Log report creation audit event |
| `DELETE /api/v2/analytics/reports/:id` | `analytics.report.deleted` | Log report deletion audit event |
| `POST /api/v2/analytics/export` | `analytics.export.requested` | Queue export generation job |
| `POST /api/v2/analytics/schedules` | `analytics.schedule.created` | Register scheduled report cron job |
| `GET /api/v2/analytics/forecasts` | `analytics.forecast.generated` | Trigger forecast model execution |
