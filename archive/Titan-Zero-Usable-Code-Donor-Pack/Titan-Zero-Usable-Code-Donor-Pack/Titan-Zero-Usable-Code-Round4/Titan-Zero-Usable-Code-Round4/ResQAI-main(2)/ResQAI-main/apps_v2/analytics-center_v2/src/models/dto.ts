export enum MetricType {
  Count = 'count',
  Percentage = 'percentage',
  Duration = 'duration',
  Currency = 'currency',
  Ratio = 'ratio',
  Rate = 'rate',
}

export enum ChartType {
  Line = 'line',
  Area = 'area',
  Bar = 'bar',
  Pie = 'pie',
  Doughnut = 'doughnut',
  HorizontalBar = 'horizontalBar',
  Scatter = 'scatter',
}

export enum ReportFrequency {
  Daily = 'daily',
  Weekly = 'weekly',
  Biweekly = 'biweekly',
  Monthly = 'monthly',
  Quarterly = 'quarterly',
}

export enum DateRangePreset {
  Today = 'today',
  Yesterday = 'yesterday',
  Last7Days = 'last7Days',
  Last30Days = 'last30Days',
  Last90Days = 'last90Days',
  ThisMonth = 'thisMonth',
  LastMonth = 'lastMonth',
  ThisQuarter = 'thisQuarter',
  LastQuarter = 'lastQuarter',
  ThisYear = 'thisYear',
  Custom = 'custom',
}

export enum ExportFormat {
  CSV = 'csv',
  PDF = 'pdf',
  JSON = 'json',
  XLSX = 'xlsx',
}

export interface ExecutiveDashboardDTO {
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
}

export interface SupportMetricsDTO {
  totalTickets: number;
  resolvedTickets: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  slaComplianceRate: number;
  ticketsByStatus: Array<{ status: string; count: number }>;
  ticketsByPriority: Array<{ priority: string; count: number }>;
  agentMetrics: Array<{
    agentId: string;
    agentName: string;
    ticketsAssigned: number;
    ticketsResolved: number;
    avgResponseTime: number;
    avgResolutionTime: number;
    satisfactionScore: number;
  }>;
  trendData: Array<{ date: string; opened: number; resolved: number }>;
}

export interface OperationsMetricsDTO {
  totalTasks: number;
  completedTasks: number;
  taskCompletionRate: number;
  avgTaskDuration: number;
  pendingDispatch: number;
  dispatchedToday: number;
  workloadDistribution: Array<{ assignee: string; pending: number; inProgress: number; completed: number }>;
  tasksByType: Array<{ type: string; count: number }>;
  trendData: Array<{ date: string; created: number; completed: number }>;
}

export interface AppointmentMetricsDTO {
  totalBookings: number;
  completedAppointments: number;
  completionRate: number;
  noShowRate: number;
  cancellationRate: number;
  avgDuration: number;
  appointmentsByStatus: Array<{ status: string; count: number }>;
  appointmentsByType: Array<{ type: string; count: number }>;
  trendData: Array<{ date: string; scheduled: number; completed: number; noShow: number }>;
}

export interface AccountMetricsDTO {
  totalAccounts: number;
  healthyAccounts: number;
  atRiskAccounts: number;
  churnedAccounts: number;
  healthDistribution: Array<{ tier: string; count: number }>;
  churnRiskFactors: Array<{ factor: string; accounts: number; percentage: number }>;
  followupsOverdue: number;
  followupsDueSoon: number;
  followupCompletionRate: number;
  trendData: Array<{ date: string; healthy: number; atRisk: number; churned: number }>;
}

export interface DisputeMetricsDTO {
  totalDisputes: number;
  resolvedDisputes: number;
  resolutionRate: number;
  avgResolutionDays: number;
  disputesByStatus: Array<{ status: string; count: number }>;
  disputesByReason: Array<{ reason: string; count: number }>;
  disputesByAssignee: Array<{ assignee: string; open: number; resolved: number }>;
  trendData: Array<{ date: string; opened: number; resolved: number }>;
}

export interface CustomReportDTO {
  id: string;
  name: string;
  description: string;
  chartType: ChartType;
  metrics: string[];
  dimensions: string[];
  filters: Record<string, string[]>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt: string | null;
}

export interface ScheduledReportDTO {
  id: string;
  reportId: string;
  reportName: string;
  frequency: ReportFrequency;
  recipients: string[];
  format: ExportFormat;
  nextRunAt: string;
  lastRunAt: string | null;
  enabled: boolean;
  createdBy: string;
  createdAt: string;
}

export interface ChartConfigDTO {
  chartType: ChartType;
  title: string;
  xAxis: string;
  yAxis: string;
  groupBy: string;
  filters: Record<string, string[]>;
  showLegend: boolean;
  showGrid: boolean;
}

export interface TechnicianPerformanceDTO {
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
}

export interface CustomerMetricsDTO {
  totalCustomers: number;
  activeCustomers: number;
  averageSatisfaction: number;
  npsScore: number;
  retentionRate: number;
  churnRate: number;
  atRiskCustomers: number;
  customersBySegment: Array<{ segment: string; count: number }>;
  satisfactionTrend: Array<{ date: string; score: number }>;
  topFeedback: Array<{ customerId: string; customerName: string; sentiment: string; comment: string }>;
}

export interface CRMMetricsDTO {
  totalAccounts: number;
  newAccounts: number;
  accountGrowthRate: number;
  activeDeals: number;
  dealValue: number;
  conversionRate: number;
  engagementRate: number;
  accountsByTier: Array<{ tier: string; count: number }>;
  pipelineByStage: Array<{ stage: string; count: number; value: number }>;
  trendData: Array<{ date: string; accounts: number; deals: number }>;
}

export interface ResolutionMetricsDTO {
  totalResolutions: number;
  resolvedCount: number;
  resolutionRate: number;
  avgResolutionDays: number;
  escalations: number;
  escalationRate: number;
  resolutionsByType: Array<{ type: string; count: number }>;
  resolutionsByAssignee: Array<{ assignee: string; resolved: number; escalated: number }>;
  trendData: Array<{ date: string; opened: number; resolved: number }>;
}

export interface SLAMetricsDTO {
  overallCompliance: number;
  supportSLA: number;
  operationsSLA: number;
  appointmentSLA: number;
  resolutionSLA: number;
  breaches: number;
  breachTrend: Array<{ date: string; breaches: number }>;
  complianceByDomain: Array<{ domain: string; compliance: number; target: number }>;
  responseTimeSLA: number;
  resolutionTimeSLA: number;
}

export interface ProductivityMetricsDTO {
  overallProductivity: number;
  ticketThroughput: number;
  appointmentThroughput: number;
  resolutionThroughput: number;
  avgTaskCompletion: number;
  agentUtilization: number;
  productivityByTeam: Array<{ team: string; score: number; change: number }>;
  throughputTrend: Array<{ date: string; tickets: number; appointments: number }>;
  topPerformers: Array<{ name: string; role: string; score: number }>;
}

export interface TrendAnalysisDTO {
  metrics: string[];
  dateRange: { start: string; end: string };
  granularity: string;
  series: Array<{
    metric: string;
    label: string;
    dataPoints: Array<{ date: string; value: number }>;
    change: number;
    average: number;
    min: number;
    max: number;
  }>;
  correlations: Array<{ metricA: string; metricB: string; coefficient: number }>;
}

export interface ForecastDTO {
  metric: string;
  forecastDate: string;
  predictedValue: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

export interface ExportHistoryDTO {
  id: string;
  reportName: string;
  format: ExportFormat;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedBy: string;
  requestedAt: string;
  completedAt: string | null;
  fileUrl: string | null;
  fileSize: number | null;
}

export interface AuditMetricsDTO {
  totalActions: number;
  uniqueUsers: number;
  actionsByType: Array<{ action: string; count: number }>;
  actionsByUser: Array<{ userId: string; userName: string; actionCount: number }>;
  recentActions: Array<{
    id: string;
    userId: string;
    userName: string;
    action: string;
    resource: string;
    details: string;
    timestamp: string;
  }>;
  trendData: Array<{ date: string; actions: number }>;
}

export interface SystemHealthDTO {
  status: 'healthy' | 'degraded' | 'down';
  services: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'down';
    latency: number;
    lastChecked: string;
  }>;
  uptime: number;
  avgLatency: number;
  errorRate: number;
  activeUsers: number;
  cacheHitRate: number;
  apiRequests: number;
}

export interface SearchResultDTO {
  id: string;
  type: 'dashboard' | 'report' | 'metric' | 'chart' | 'page';
  title: string;
  description: string;
  route: string;
  relevance: number;
}
