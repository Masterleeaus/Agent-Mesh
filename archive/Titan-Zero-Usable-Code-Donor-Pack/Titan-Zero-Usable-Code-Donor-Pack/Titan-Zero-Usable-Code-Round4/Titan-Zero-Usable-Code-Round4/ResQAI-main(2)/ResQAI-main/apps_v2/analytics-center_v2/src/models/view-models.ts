export interface MetricTrendVM {
  value: number;
  previousValue: number;
  percentChange: number;
  direction: 'up' | 'down' | 'flat';
}

export interface KpiCardVM {
  id: string;
  label: string;
  value: string;
  trend: MetricTrendVM;
  icon?: string;
  tooltip?: string;
  drillDownRoute?: string;
}

export interface TimeSeriesDataPointVM {
  date: string;
  value: number;
  secondaryValue?: number;
  label?: string;
}

export interface BarChartDataVM {
  label: string;
  value: number;
  secondaryValue?: number;
  color?: string;
}

export interface PieChartSliceVM {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

export interface ReportListItemVM {
  id: string;
  name: string;
  description: string;
  chartType: string;
  createdBy: string;
  createdAt: string;
  lastRunAt: string | null;
  isScheduled: boolean;
}

export interface ScheduledReportVM {
  id: string;
  reportId: string;
  reportName: string;
  frequency: string;
  recipients: string[];
  format: string;
  nextRunAt: string;
  lastRunAt: string | null;
  enabled: boolean;
}

export interface HeatMapCellVM {
  row: string;
  column: string;
  value: number;
  color: string;
}

export interface TrendGraphDataVM {
  primary: TimeSeriesDataPointVM[];
  comparison?: TimeSeriesDataPointVM[];
}

export interface LeaderboardEntryVM {
  rank: number;
  name: string;
  value: number;
  change: number;
  avatar?: string;
  trend: 'up' | 'down' | 'flat';
}

export interface TechnicianListItemVM {
  id: string;
  name: string;
  appointmentsCompleted: number;
  completionRate: number;
  satisfactionScore: number;
  productivityScore: number;
  trend: 'up' | 'down' | 'flat';
}

export interface CustomerSegmentVM {
  segment: string;
  count: number;
  percentage: number;
  color: string;
}

export interface PipelineStageVM {
  stage: string;
  count: number;
  value: number;
  color: string;
}

export interface SLAStatusVM {
  domain: string;
  compliance: number;
  target: number;
  status: 'compliant' | 'warning' | 'breached';
}

export interface ExportHistoryItemVM {
  id: string;
  reportName: string;
  format: string;
  status: string;
  requestedBy: string;
  requestedAt: string;
  completedAt: string | null;
  fileUrl: string | null;
  fileSize: string | null;
}

export interface AuditActionVM {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  timestamp: string;
}

export interface ServiceHealthVM {
  name: string;
  status: string;
  latency: number;
  lastChecked: string;
}

export interface SearchResultVM {
  id: string;
  type: string;
  title: string;
  description: string;
  route: string;
  relevance: number;
}
