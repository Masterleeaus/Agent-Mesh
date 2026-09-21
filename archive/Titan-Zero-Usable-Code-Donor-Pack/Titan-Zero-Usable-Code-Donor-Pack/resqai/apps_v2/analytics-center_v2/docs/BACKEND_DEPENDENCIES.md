# Backend Dependencies

## Required Backend Services

### 1. Analytics Data Service
**Endpoints Required:** All `/api/v2/analytics/*` endpoints
**Database Table:** `analytics_metrics`
**Fields Required:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `domain` | string | analytics domain (executive, support, operations, etc.) |
| `metric_name` | string | Metric identifier |
| `metric_value` | numeric | Current value |
| `previous_value` | numeric | Previous period value |
| `percent_change` | numeric | Period-over-period change |
| `dimensions` | JSONB | Dimensional breakdown |
| `recorded_at` | timestamptz | Snapshot timestamp |

### 2. Reports Service
**Database Table:** `analytics_reports`
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `name` | string | Report name |
| `description` | text | Report description |
| `chart_type` | enum | Chart type |
| `metrics` | text[] | Selected metrics |
| `dimensions` | text[] | Group-by dimensions |
| `filters` | JSONB | Filter configuration |
| `created_by` | UUID | User reference |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

### 3. Scheduled Reports Service
**Database Table:** `analytics_schedules`
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `report_id` | UUID | Report reference |
| `frequency` | enum | daily, weekly, monthly, quarterly |
| `recipients` | text[] | Email addresses |
| `format` | enum | csv, pdf, json, xlsx |
| `next_run_at` | timestamptz | Next scheduled execution |
| `last_run_at` | timestamptz | Last execution time |
| `enabled` | boolean | Active schedule flag |

### 4. Export Service
**Database Table:** `analytics_exports`
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `requested_by` | UUID | User reference |
| `format` | enum | csv, pdf, json, xlsx |
| `filters` | JSONB | Export filter config |
| `status` | enum | pending, processing, completed, failed |
| `file_url` | text | Download URL |
| `expires_at` | timestamptz | URL expiration |
| `requested_at` | timestamptz | Request timestamp |

### 5. Audit Trail Service
**Database Table:** `analytics_audit_log`
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | User reference |
| `action` | string | Action performed |
| `resource_type` | string | Report, export, schedule |
| `resource_id` | UUID | Resource reference |
| `details` | JSONB | Action metadata |
| `ip_address` | string | Request origin |
| `created_at` | timestamptz | Audit timestamp |

### 6. System Health Service
**Dependencies:** Integration monitoring endpoints
**Tables:** `integration_status`, `service_health`

### 7. Historical Metrics Service
**Database Table:** `analytics_historical_metrics`
| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `domain` | string | Analytics domain |
| `metric_name` | string | Metric identifier |
| `metric_value` | numeric | Snapshot value |
| `snapshot_date` | date | Date of snapshot |
| `dimensions` | JSONB | Dimensional breakdown |

## Future Database Tables

| Table Name | Purpose |
|-----------|---------|
| `analytics_metrics` | Current period metric snapshots |
| `analytics_historical_metrics` | Historical metric time series |
| `analytics_reports` | Custom report definitions |
| `analytics_schedules` | Scheduled report configurations |
| `analytics_exports` | Export job tracking |
| `analytics_audit_log` | User activity audit trail |
| `analytics_technician_rankings` | Technician performance scores |
| `analytics_customer_metrics` | Customer health and satisfaction |
| `analytics_sla_compliance` | SLA tracking per domain |
| `analytics_forecasts` | Forecast model outputs |
| `analytics_search_index` | Searchable metrics and reports |
| `integration_status` | Integration health checks |
| `service_health` | Service uptime monitoring |

## Future Functions

| Function | Purpose | Input | Output |
|----------|---------|-------|--------|
| `calculate_executive_kpis` | Aggregate executive dashboard metrics | date range | KPI snapshot |
| `calculate_support_metrics` | Compute support analytics | date range, filters | Support metrics |
| `calculate_technician_scores` | Compute technician rankings | date range | Rankings |
| `compute_sla_compliance` | Calculate SLA adherence | domain, date range | SLA metrics |
| `generate_forecast` | Run predictive models | metric, periods | Forecast results |
| `process_export_job` | Generate export file | export ID | File URL |
| `execute_scheduled_report` | Run scheduled report | schedule ID | Delivery status |
| `log_audit_event` | Record audit trail | action details | Audit record |
| `purge_old_exports` | Clean expired exports | retention days | Cleanup count |
| `sync_historical_metrics` | Archive daily metrics | date | Archive status |

## Future Workflows

| Workflow | Trigger | Steps |
|----------|---------|-------|
| `analytics.export.generate` | Export request | Validate → Process → Store → Notify |
| `analytics.report.schedule.execute` | Cron schedule | Generate report → Convert format → Email delivery |
| `analytics.forecast.weekly` | Weekly cron | Aggregate data → Run models → Store results |
| `analytics.audit.report_export` | Report/export action | Capture action → Enrich context → Persist audit |
| `analytics.metrics.daily_snapshot` | Daily cron | Snapshot all metrics → Store historical → Purge old |

## Future Agents

| Agent | Trigger | Input | Output |
|-------|---------|-------|--------|
| `AnalyticsAggregator` | Schedule or on-demand | Date range, domains | Aggregated metric snapshots |
| `ReportGenerator` | Schedule or manual | Report configuration | Generated report file |
| `ForecastEngine` | Weekly schedule | Historical data | Forecast projections |
| `SLAComplianceMonitor` | Real-time / daily | Domain metrics | SLA breach alerts |
| `AuditTrailAgent` | On action | Action details | Audit record |
| `AnomalyDetector` | Real-time | Metric values | Anomaly alerts |
| `InsightEngine` | Daily | All metrics | Natural language insights |

## Future Events

| Event Name | Emitted When | Payload |
|-----------|-------------|---------|
| `analytics.dashboard.refreshed` | Dashboard data refreshed | `{ domain, timestamp }` |
| `analytics.report.generated` | Report created or run | `{ reportId, reportName, generatedBy, format }` |
| `analytics.report.deleted` | Report removed | `{ reportId, reportName, deletedBy }` |
| `analytics.export.completed` | Export job finished | `{ exportId, format, url, expiresAt }` |
| `analytics.export.failed` | Export job failed | `{ exportId, format, error }` |
| `analytics.schedule.created` | Schedule added | `{ scheduleId, reportId, frequency }` |
| `analytics.schedule.executed` | Schedule run completed | `{ scheduleId, reportId, deliveredTo }` |
| `analytics.forecast.generated` | Forecast completed | `{ metric, periods, confidence }` |
| `analytics.sla.breach` | SLA threshold violated | `{ domain, metric, threshold, actual }` |
| `analytics.anomaly.detected` | Metric anomaly found | `{ metric, value, expected, deviation }` |
| `analytics.insight.ready` | Daily insights generated | `{ date, insights, domains }` |

## Infrastructure Dependencies

| Service | Purpose |
|---------|---------|
| PostgreSQL | Primary data warehouse for metrics |
| Redis | Caching for frequent dashboard queries |
| S3 / Blob Storage | Export file storage |
| Email Service | Scheduled report delivery |
| Cron Scheduler | Report schedule execution |
| Queue System | Async export job processing |

## Current Mock Implementation

| Method | Mock Behavior |
|--------|--------------|
| All service methods | `throw new Error('Not implemented')` |
| | Replace with HTTP client calls to real API |

## Integration Checklist

- [ ] Replace service implementation with HTTP client calls
- [ ] Wire Lemma SDK authentication
- [ ] Implement real pagination for report lists
- [ ] Add data caching layer with Redis
- [ ] Configure export file storage
- [ ] Set up scheduled report cron jobs
- [ ] Implement webhook receivers for real-time data
- [ ] Add rate limiting for export endpoints
- [ ] Configure audit log retention policy
- [ ] Set up monitoring alerts for SLA breaches
