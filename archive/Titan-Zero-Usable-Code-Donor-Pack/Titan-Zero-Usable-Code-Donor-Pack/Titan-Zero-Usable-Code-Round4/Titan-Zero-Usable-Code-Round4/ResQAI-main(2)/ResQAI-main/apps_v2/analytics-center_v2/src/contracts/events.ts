export const ANALYTICS_EVENTS = {
  DASHBOARD_REFRESHED: 'analytics:dashboard.refreshed',
  REPORT_GENERATED: 'analytics:report.generated',
  REPORT_DELETED: 'analytics:report.deleted',
  EXPORT_COMPLETED: 'analytics:export.completed',
  EXPORT_FAILED: 'analytics:export.failed',
  SCHEDULE_CREATED: 'analytics:schedule.created',
  SCHEDULE_EXECUTED: 'analytics:schedule.executed',
  FORECAST_GENERATED: 'analytics:forecast.generated',
  SLA_BREACH: 'analytics:sla.breach',
  ANOMALY_DETECTED: 'analytics:anomaly.detected',
  INSIGHT_READY: 'analytics:insight.ready',
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export interface DashboardRefreshedPayload {
  domain: string;
  timestamp: string;
}

export interface ReportGeneratedPayload {
  reportId: string;
  reportName: string;
  generatedBy: string;
  generatedAt: string;
  format: string;
}

export interface ReportDeletedPayload {
  reportId: string;
  reportName: string;
  deletedBy: string;
}

export interface ExportCompletedPayload {
  exportId: string;
  format: string;
  url: string;
  expiresAt: string;
}

export interface ExportFailedPayload {
  exportId: string;
  format: string;
  error: string;
}

export interface ScheduleCreatedPayload {
  scheduleId: string;
  reportId: string;
  frequency: string;
}

export interface ScheduleExecutedPayload {
  scheduleId: string;
  reportId: string;
  deliveredTo: string[];
}

export interface ForecastGeneratedPayload {
  metric: string;
  periods: number;
  confidence: number;
}

export interface SLABreachPayload {
  domain: string;
  metric: string;
  threshold: number;
  actual: number;
}

export interface AnomalyDetectedPayload {
  metric: string;
  value: number;
  expected: number;
  deviation: number;
}

export interface InsightReadyPayload {
  date: string;
  insights: string[];
  domains: string[];
}

export type AnalyticsEventPayloads = {
  [ANALYTICS_EVENTS.DASHBOARD_REFRESHED]: DashboardRefreshedPayload;
  [ANALYTICS_EVENTS.REPORT_GENERATED]: ReportGeneratedPayload;
  [ANALYTICS_EVENTS.REPORT_DELETED]: ReportDeletedPayload;
  [ANALYTICS_EVENTS.EXPORT_COMPLETED]: ExportCompletedPayload;
  [ANALYTICS_EVENTS.EXPORT_FAILED]: ExportFailedPayload;
  [ANALYTICS_EVENTS.SCHEDULE_CREATED]: ScheduleCreatedPayload;
  [ANALYTICS_EVENTS.SCHEDULE_EXECUTED]: ScheduleExecutedPayload;
  [ANALYTICS_EVENTS.FORECAST_GENERATED]: ForecastGeneratedPayload;
  [ANALYTICS_EVENTS.SLA_BREACH]: SLABreachPayload;
  [ANALYTICS_EVENTS.ANOMALY_DETECTED]: AnomalyDetectedPayload;
  [ANALYTICS_EVENTS.INSIGHT_READY]: InsightReadyPayload;
};
