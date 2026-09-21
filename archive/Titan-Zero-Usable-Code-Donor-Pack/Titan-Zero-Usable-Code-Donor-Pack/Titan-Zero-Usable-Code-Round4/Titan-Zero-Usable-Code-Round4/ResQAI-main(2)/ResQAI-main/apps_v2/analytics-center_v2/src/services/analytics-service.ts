import type {
  ExecutiveDashboardResponse,
  SupportMetricsResponse,
  OperationsMetricsResponse,
  AppointmentMetricsResponse,
  AccountMetricsResponse,
  DisputeMetricsResponse,
  ReportListResponse,
  ScheduledReportListResponse,
  ExportResponse,
  TechnicianPerformanceResponse,
  CustomerMetricsResponse,
  CRMMetricsResponse,
  ResolutionMetricsResponse,
  SLAMetricsResponse,
  ProductivityMetricsResponse,
  TrendAnalysisResponse,
  ForecastResponse,
  ExportHistoryResponse,
  AuditMetricsResponse,
  SystemHealthResponse,
  SearchResponse,
} from '../models/api-responses';
import type {
  CustomReportDTO,
  ScheduledReportDTO,
  TechnicianPerformanceDTO,
  ExportHistoryDTO,
  SearchResultDTO,
  ChartType,
  ReportFrequency,
  ExportFormat,
} from '../models/dto';
import type { CreateReportRequest, UpdateReportRequest, ScheduleReportRequest, ExportDataRequest } from '../models/api-requests';

let reportsStore: CustomReportDTO[] = [
  { id: 'r1', name: 'Weekly Support Summary', description: 'Weekly ticket volume and resolution metrics', chartType: 'line' as ChartType, metrics: ['tickets', 'resolution_time'], dimensions: ['team'], filters: {}, createdBy: 'admin', createdAt: '2026-01-15T08:00:00Z', updatedAt: '2026-06-28T12:00:00Z', lastRunAt: '2026-06-30T06:00:00Z' },
  { id: 'r2', name: 'Technician Leaderboard', description: 'Monthly technician ranking by satisfaction and volume', chartType: 'bar' as ChartType, metrics: ['satisfaction', 'completions'], dimensions: ['technician'], filters: {}, createdBy: 'admin', createdAt: '2026-02-01T10:00:00Z', updatedAt: '2026-06-25T14:00:00Z', lastRunAt: '2026-06-29T07:00:00Z' },
  { id: 'r3', name: 'SLA Compliance Report', description: 'Monthly SLA adherence by domain', chartType: 'pie' as ChartType, metrics: ['compliance'], dimensions: ['domain'], filters: {}, createdBy: 'ops_manager', createdAt: '2026-03-10T09:00:00Z', updatedAt: '2026-06-20T11:00:00Z', lastRunAt: null },
];

let schedulesStore: ScheduledReportDTO[] = [
  { id: 's1', reportId: 'r1', reportName: 'Weekly Support Summary', frequency: 'weekly' as ReportFrequency, recipients: ['support-leads@resqai.io'], format: 'pdf' as ExportFormat, nextRunAt: '2026-07-07T06:00:00Z', lastRunAt: '2026-06-30T06:00:00Z', enabled: true, createdBy: 'admin', createdAt: '2026-01-15T08:00:00Z' },
  { id: 's2', reportId: 'r2', reportName: 'Technician Leaderboard', frequency: 'monthly' as ReportFrequency, recipients: ['ops-managers@resqai.io', 'field-directors@resqai.io'], format: 'pdf' as ExportFormat, nextRunAt: '2026-07-01T06:00:00Z', lastRunAt: '2026-06-01T06:00:00Z', enabled: true, createdBy: 'admin', createdAt: '2026-02-01T10:00:00Z' },
];

let exportHistoryStore: ExportHistoryDTO[] = [
  { id: 'e1', reportName: 'Weekly Support Summary', format: 'pdf' as ExportFormat, status: 'completed', requestedBy: 'admin', requestedAt: '2026-06-30T06:00:00Z', completedAt: '2026-06-30T06:01:00Z', fileUrl: '/exports/e1/support-summary.pdf', fileSize: 245000 },
  { id: 'e2', reportName: 'Technician Leaderboard', format: 'csv' as ExportFormat, status: 'completed', requestedBy: 'ops_manager', requestedAt: '2026-06-29T14:00:00Z', completedAt: '2026-06-29T14:01:00Z', fileUrl: '/exports/e2/tech-leaderboard.csv', fileSize: 12800 },
];

async function delay(ms: number = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const analyticsService = {
  async getExecutiveDashboard(): Promise<ExecutiveDashboardResponse> {
    await delay();
    return {
      data: {
        totalTickets: 1847, ticketChange: 12.3,
        openTickets: 342,
        avgResolutionTime: 4.2,
        totalAppointments: 2891, appointmentChange: 8.7,
        completionRate: 87.4, noShowRate: 5.2,
        activeDisputes: 43, disputeChange: -7.1,
        avgDisputeResolutionDays: 6.8,
        accountsAtRisk: 28, accountRiskChange: 15.2,
        healthyAccounts: 412,
        lastUpdated: new Date().toISOString(),
      },
      error: null,
    };
  },

  async getSupportMetrics(): Promise<SupportMetricsResponse> {
    await delay();
    return {
      data: {
        totalTickets: 1847, resolvedTickets: 1452,
        avgResponseTime: 1.8, avgResolutionTime: 4.2,
        slaComplianceRate: 94.3,
        ticketsByStatus: [
          { status: 'Open', count: 342 }, { status: 'In Progress', count: 215 },
          { status: 'Pending', count: 128 }, { status: 'Resolved', count: 952 },
          { status: 'Closed', count: 500 },
        ],
        ticketsByPriority: [
          { priority: 'Critical', count: 89 }, { priority: 'High', count: 312 },
          { priority: 'Medium', count: 756 }, { priority: 'Low', count: 690 },
        ],
        agentMetrics: [
          { agentId: 'a1', agentName: 'Sarah Chen', ticketsAssigned: 245, ticketsResolved: 218, avgResponseTime: 1.2, avgResolutionTime: 3.1, satisfactionScore: 4.8 },
          { agentId: 'a2', agentName: 'Mike Rodriguez', ticketsAssigned: 210, ticketsResolved: 185, avgResponseTime: 1.5, avgResolutionTime: 3.8, satisfactionScore: 4.6 },
          { agentId: 'a3', agentName: 'Emma Wilson', ticketsAssigned: 198, ticketsResolved: 172, avgResponseTime: 2.1, avgResolutionTime: 4.5, satisfactionScore: 4.5 },
          { agentId: 'a4', agentName: 'James Park', ticketsAssigned: 180, ticketsResolved: 155, avgResponseTime: 2.4, avgResolutionTime: 5.2, satisfactionScore: 4.3 },
        ],
        trendData: [
          { date: '2026-06-01', opened: 58, resolved: 52 },
          { date: '2026-06-05', opened: 63, resolved: 48 },
          { date: '2026-06-10', opened: 72, resolved: 65 },
          { date: '2026-06-15', opened: 55, resolved: 60 },
          { date: '2026-06-20', opened: 68, resolved: 71 },
          { date: '2026-06-25', opened: 61, resolved: 58 },
          { date: '2026-06-30', opened: 45, resolved: 52 },
        ],
      },
      error: null,
    };
  },

  async getOperationsMetrics(): Promise<OperationsMetricsResponse> {
    await delay();
    return {
      data: {
        totalTasks: 1256, completedTasks: 1028, taskCompletionRate: 81.8,
        avgTaskDuration: 3.5, pendingDispatch: 47, dispatchedToday: 38,
        workloadDistribution: [
          { assignee: 'Team Alpha', pending: 12, inProgress: 18, completed: 85 },
          { assignee: 'Team Beta', pending: 8, inProgress: 22, completed: 92 },
          { assignee: 'Team Gamma', pending: 15, inProgress: 14, completed: 78 },
          { assignee: 'Team Delta', pending: 12, inProgress: 20, completed: 88 },
        ],
        tasksByType: [
          { type: 'Installation', count: 420 }, { type: 'Repair', count: 385 },
          { type: 'Maintenance', count: 280 }, { type: 'Inspection', count: 171 },
        ],
        trendData: [
          { date: '2026-06-01', created: 42, completed: 38 },
          { date: '2026-06-05', created: 48, completed: 42 },
          { date: '2026-06-10', created: 55, completed: 50 },
          { date: '2026-06-15', created: 38, completed: 42 },
          { date: '2026-06-20', created: 52, completed: 48 },
          { date: '2026-06-25', created: 45, completed: 50 },
          { date: '2026-06-30', created: 35, completed: 38 },
        ],
      },
      error: null,
    };
  },

  async getAppointmentMetrics(): Promise<AppointmentMetricsResponse> {
    await delay();
    return {
      data: {
        totalBookings: 2891, completedAppointments: 2528, completionRate: 87.4,
        noShowRate: 5.2, cancellationRate: 7.4, avgDuration: 62,
        appointmentsByStatus: [
          { status: 'Scheduled', count: 845 }, { status: 'Completed', count: 2528 },
          { status: 'In Progress', count: 124 }, { status: 'Cancelled', count: 214 },
          { status: 'No Show', count: 150 },
        ],
        appointmentsByType: [
          { type: 'Installation', count: 980 }, { type: 'Repair', count: 750 },
          { type: 'Maintenance', count: 620 }, { type: 'Consultation', count: 541 },
        ],
        trendData: [
          { date: '2026-06-01', scheduled: 95, completed: 82, noShow: 5 },
          { date: '2026-06-05', scheduled: 102, completed: 88, noShow: 6 },
          { date: '2026-06-10', scheduled: 110, completed: 96, noShow: 4 },
          { date: '2026-06-15', scheduled: 88, completed: 78, noShow: 3 },
          { date: '2026-06-20', scheduled: 98, completed: 85, noShow: 7 },
          { date: '2026-06-25', scheduled: 92, completed: 80, noShow: 5 },
          { date: '2026-06-30', scheduled: 78, completed: 70, noShow: 3 },
        ],
      },
      error: null,
    };
  },

  async getAccountMetrics(): Promise<AccountMetricsResponse> {
    await delay();
    return {
      data: {
        totalAccounts: 440, healthyAccounts: 412, atRiskAccounts: 28, churnedAccounts: 15,
        healthDistribution: [
          { tier: 'Healthy', count: 412 }, { tier: 'At Risk', count: 28 },
          { tier: 'Churned', count: 15 }, { tier: 'New', count: 85 },
        ],
        churnRiskFactors: [
          { factor: 'Low Engagement', accounts: 12, percentage: 42.9 },
          { factor: 'Support Tickets', accounts: 8, percentage: 28.6 },
          { factor: 'Payment Issues', accounts: 5, percentage: 17.9 },
          { factor: 'Competitor Offer', accounts: 3, percentage: 10.7 },
        ],
        followupsOverdue: 42, followupsDueSoon: 85, followupCompletionRate: 73.5,
        trendData: [
          { date: '2026-03-01', healthy: 398, atRisk: 22, churned: 10 },
          { date: '2026-04-01', healthy: 405, atRisk: 24, churned: 12 },
          { date: '2026-05-01', healthy: 410, atRisk: 26, churned: 13 },
          { date: '2026-06-01', healthy: 412, atRisk: 28, churned: 15 },
        ],
      },
      error: null,
    };
  },

  async getDisputeMetrics(): Promise<DisputeMetricsResponse> {
    await delay();
    return {
      data: {
        totalDisputes: 43, resolvedDisputes: 28, resolutionRate: 65.1,
        avgResolutionDays: 6.8,
        disputesByStatus: [
          { status: 'Open', count: 15 }, { status: 'Investigation', count: 8 },
          { status: 'Resolved', count: 20 }, { status: 'Escalated', count: 5 },
        ],
        disputesByReason: [
          { reason: 'Billing Error', count: 14 }, { reason: 'Service Quality', count: 12 },
          { reason: 'Scheduling Conflict', count: 9 }, { reason: 'Equipment Issue', count: 8 },
        ],
        disputesByAssignee: [
          { assignee: 'Sarah Chen', open: 3, resolved: 8 },
          { assignee: 'Mike Rodriguez', open: 5, resolved: 6 },
          { assignee: 'Emma Wilson', open: 4, resolved: 7 },
          { assignee: 'James Park', open: 3, resolved: 7 },
        ],
        trendData: [
          { date: '2026-04-01', opened: 14, resolved: 8 },
          { date: '2026-05-01', opened: 18, resolved: 12 },
          { date: '2026-06-01', opened: 11, resolved: 8 },
        ],
      },
      error: null,
    };
  },

  async getTechnicianPerformance(): Promise<TechnicianPerformanceResponse> {
    await delay();
    const data: TechnicianPerformanceDTO[] = [
      { technicianId: 't1', technicianName: 'Alex Johnson', appointmentsCompleted: 142, completionRate: 94.7, avgDuration: 52, customerSatisfaction: 4.9, noShowRate: 1.8, travelTime: 18, productivityScore: 96, trendData: [{ date: '2026-06-01', completed: 22, satisfaction: 4.9 }, { date: '2026-06-15', completed: 25, satisfaction: 4.8 }, { date: '2026-06-30', completed: 20, satisfaction: 5.0 }] },
      { technicianId: 't2', technicianName: 'Maria Garcia', appointmentsCompleted: 128, completionRate: 91.2, avgDuration: 58, customerSatisfaction: 4.7, noShowRate: 2.5, travelTime: 22, productivityScore: 89, trendData: [{ date: '2026-06-01', completed: 20, satisfaction: 4.6 }, { date: '2026-06-15', completed: 22, satisfaction: 4.7 }, { date: '2026-06-30', completed: 18, satisfaction: 4.8 }] },
      { technicianId: 't3', technicianName: 'David Kim', appointmentsCompleted: 115, completionRate: 88.5, avgDuration: 65, customerSatisfaction: 4.5, noShowRate: 3.2, travelTime: 28, productivityScore: 82, trendData: [{ date: '2026-06-01', completed: 18, satisfaction: 4.4 }, { date: '2026-06-15', completed: 20, satisfaction: 4.5 }, { date: '2026-06-30', completed: 16, satisfaction: 4.6 }] },
      { technicianId: 't4', technicianName: 'Lisa Thompson', appointmentsCompleted: 134, completionRate: 93.1, avgDuration: 48, customerSatisfaction: 4.8, noShowRate: 2.0, travelTime: 15, productivityScore: 93, trendData: [{ date: '2026-06-01', completed: 21, satisfaction: 4.8 }, { date: '2026-06-15', completed: 23, satisfaction: 4.8 }, { date: '2026-06-30', completed: 19, satisfaction: 4.9 }] },
      { technicianId: 't5', technicianName: 'Tom Bradley', appointmentsCompleted: 98, completionRate: 84.6, avgDuration: 72, customerSatisfaction: 4.2, noShowRate: 4.5, travelTime: 32, productivityScore: 75, trendData: [{ date: '2026-06-01', completed: 15, satisfaction: 4.1 }, { date: '2026-06-15', completed: 18, satisfaction: 4.2 }, { date: '2026-06-30', completed: 14, satisfaction: 4.3 }] },
    ];
    return { data: data.sort((a, b) => b.productivityScore - a.productivityScore), total: data.length, error: null };
  },

  async getCustomerMetrics(): Promise<CustomerMetricsResponse> {
    await delay();
    return {
      data: {
        totalCustomers: 2850, activeCustomers: 2190, averageSatisfaction: 4.6, npsScore: 72,
        retentionRate: 91.5, churnRate: 8.5, atRiskCustomers: 145,
        customersBySegment: [
          { segment: 'Enterprise', count: 420 }, { segment: 'Mid-Market', count: 890 },
          { segment: 'Small Business', count: 980 }, { segment: 'Individual', count: 560 },
        ],
        satisfactionTrend: [
          { date: '2026-03-01', score: 4.5 }, { date: '2026-04-01', score: 4.5 },
          { date: '2026-05-01', score: 4.6 }, { date: '2026-06-01', score: 4.6 },
        ],
        topFeedback: [
          { customerId: 'c1', customerName: 'Acme Corp', sentiment: 'positive', comment: 'Excellent service response time' },
          { customerId: 'c2', customerName: 'Beta Industries', sentiment: 'neutral', comment: 'Good but scheduling could improve' },
          { customerId: 'c3', customerName: 'Gamma LLC', sentiment: 'negative', comment: 'Billing issue took too long to resolve' },
        ],
      },
      error: null,
    };
  },

  async getCRMMetrics(): Promise<CRMMetricsResponse> {
    await delay();
    return {
      data: {
        totalAccounts: 440, newAccounts: 18, accountGrowthRate: 4.3,
        activeDeals: 52, dealValue: 2840000, conversionRate: 38.5, engagementRate: 72.1,
        accountsByTier: [
          { tier: 'Platinum', count: 45 }, { tier: 'Gold', count: 120 },
          { tier: 'Silver', count: 185 }, { tier: 'Bronze', count: 90 },
        ],
        pipelineByStage: [
          { stage: 'Prospecting', count: 18, value: 540000 },
          { stage: 'Qualification', count: 14, value: 720000 },
          { stage: 'Proposal', count: 12, value: 890000 },
          { stage: 'Negotiation', count: 8, value: 690000 },
        ],
        trendData: [
          { date: '2026-04-01', accounts: 422, deals: 48 },
          { date: '2026-05-01', accounts: 432, deals: 50 },
          { date: '2026-06-01', accounts: 440, deals: 52 },
        ],
      },
      error: null,
    };
  },

  async getResolutionMetrics(): Promise<ResolutionMetricsResponse> {
    await delay();
    return {
      data: {
        totalResolutions: 312, resolvedCount: 245, resolutionRate: 78.5,
        avgResolutionDays: 4.8, escalations: 28, escalationRate: 11.4,
        resolutionsByType: [
          { type: 'Technical', count: 142 }, { type: 'Billing', count: 68 },
          { type: 'Service', count: 58 }, { type: 'Other', count: 44 },
        ],
        resolutionsByAssignee: [
          { assignee: 'Sarah Chen', resolved: 68, escalated: 4 },
          { assignee: 'Mike Rodriguez', resolved: 55, escalated: 6 },
          { assignee: 'Emma Wilson', resolved: 52, escalated: 8 },
          { assignee: 'James Park', resolved: 48, escalated: 10 },
        ],
        trendData: [
          { date: '2026-06-01', opened: 14, resolved: 10 },
          { date: '2026-06-05', opened: 18, resolved: 14 },
          { date: '2026-06-10', opened: 12, resolved: 16 },
          { date: '2026-06-15', opened: 16, resolved: 12 },
          { date: '2026-06-20', opened: 20, resolved: 18 },
          { date: '2026-06-25', opened: 15, resolved: 14 },
          { date: '2026-06-30', opened: 10, resolved: 12 },
        ],
      },
      error: null,
    };
  },

  async getSLAMetrics(): Promise<SLAMetricsResponse> {
    await delay();
    return {
      data: {
        overallCompliance: 93.8, supportSLA: 94.3, operationsSLA: 92.1,
        appointmentSLA: 96.5, resolutionSLA: 90.2, breaches: 24,
        breachTrend: [
          { date: '2026-04-01', breaches: 8 }, { date: '2026-05-01', breaches: 6 },
          { date: '2026-06-01', breaches: 10 },
        ],
        complianceByDomain: [
          { domain: 'Support', compliance: 94.3, target: 95 },
          { domain: 'Operations', compliance: 92.1, target: 90 },
          { domain: 'Appointments', compliance: 96.5, target: 95 },
          { domain: 'Resolution', compliance: 90.2, target: 92 },
        ],
        responseTimeSLA: 95.2, resolutionTimeSLA: 92.4,
      },
      error: null,
    };
  },

  async getProductivityMetrics(): Promise<ProductivityMetricsResponse> {
    await delay();
    return {
      data: {
        overallProductivity: 86.4, ticketThroughput: 42.5, appointmentThroughput: 38.2,
        resolutionThroughput: 8.4, avgTaskCompletion: 81.8, agentUtilization: 78.5,
        productivityByTeam: [
          { team: 'Support', score: 88.2, change: 3.5 },
          { team: 'Field Ops', score: 84.7, change: 2.1 },
          { team: 'Resolution', score: 82.3, change: -1.2 },
          { team: 'Scheduling', score: 90.5, change: 4.8 },
        ],
        throughputTrend: [
          { date: '2026-04-01', tickets: 38, appointments: 35 },
          { date: '2026-05-01', tickets: 41, appointments: 36 },
          { date: '2026-06-01', tickets: 42, appointments: 38 },
        ],
        topPerformers: [
          { name: 'Alex Johnson', role: 'Technician', score: 96 },
          { name: 'Sarah Chen', role: 'Support Agent', score: 94 },
          { name: 'Lisa Thompson', role: 'Technician', score: 93 },
        ],
      },
      error: null,
    };
  },

  async getTrendAnalysis(): Promise<TrendAnalysisResponse> {
    await delay();
    return {
      data: {
        metrics: ['tickets', 'appointments', 'resolutions', 'satisfaction'],
        dateRange: { start: '2026-01-01', end: '2026-06-30' },
        granularity: 'month',
        series: [
          { metric: 'tickets', label: 'Ticket Volume', dataPoints: [
            { date: '2026-01-01', value: 280 }, { date: '2026-02-01', value: 295 },
            { date: '2026-03-01', value: 310 }, { date: '2026-04-01', value: 325 },
            { date: '2026-05-01', value: 340 }, { date: '2026-06-01', value: 297 },
          ], change: 6.1, average: 308, min: 280, max: 340 },
          { metric: 'appointments', label: 'Appointment Volume', dataPoints: [
            { date: '2026-01-01', value: 420 }, { date: '2026-02-01', value: 445 },
            { date: '2026-03-01', value: 460 }, { date: '2026-04-01', value: 480 },
            { date: '2026-05-01', value: 510 }, { date: '2026-06-01', value: 576 },
          ], change: 37.1, average: 482, min: 420, max: 576 },
          { metric: 'resolutions', label: 'Resolution Volume', dataPoints: [
            { date: '2026-01-01', value: 45 }, { date: '2026-02-01', value: 48 },
            { date: '2026-03-01', value: 52 }, { date: '2026-04-01', value: 50 },
            { date: '2026-05-01', value: 58 }, { date: '2026-06-01', value: 59 },
          ], change: 31.1, average: 52, min: 45, max: 59 },
          { metric: 'satisfaction', label: 'Customer Satisfaction', dataPoints: [
            { date: '2026-01-01', value: 4.3 }, { date: '2026-02-01', value: 4.4 },
            { date: '2026-03-01', value: 4.4 }, { date: '2026-04-01', value: 4.5 },
            { date: '2026-05-01', value: 4.5 }, { date: '2026-06-01', value: 4.6 },
          ], change: 7.0, average: 4.5, min: 4.3, max: 4.6 },
        ],
        correlations: [
          { metricA: 'tickets', metricB: 'appointments', coefficient: 0.85 },
          { metricA: 'satisfaction', metricB: 'resolutions', coefficient: 0.62 },
        ],
      },
      error: null,
    };
  },

  async getForecast(metric: string, periods: number = 3): Promise<ForecastResponse> {
    await delay();
    const now = new Date();
    const forecasts: ForecastDTO[] = [];
    const baseValue = metric === 'tickets' ? 310 : metric === 'appointments' ? 500 : metric === 'resolutions' ? 55 : 4.5;
    for (let i = 1; i <= periods; i++) {
      const date = new Date(now); date.setMonth(date.getMonth() + i);
      const predicted = baseValue * (1 + i * 0.03 + (Math.random() - 0.5) * 0.05);
      forecasts.push({
        metric, forecastDate: date.toISOString().slice(0, 10),
        predictedValue: Math.round(predicted * 10) / 10,
        lowerBound: Math.round(predicted * 0.9 * 10) / 10,
        upperBound: Math.round(predicted * 1.1 * 10) / 10,
        confidence: Math.round((85 - i * 5) * 10) / 10,
      });
    }
    return { data: forecasts, error: null };
  },

  async listReports(): Promise<ReportListResponse> {
    await delay();
    return { data: reportsStore, total: reportsStore.length, error: null };
  },

  async getReport(id: string): Promise<{ data: CustomReportDTO; error: string | null }> {
    await delay();
    const report = reportsStore.find((r) => r.id === id);
    if (!report) return { data: null as unknown as CustomReportDTO, error: 'Report not found' };
    return { data: report, error: null };
  },

  async createReport(request: CreateReportRequest): Promise<{ data: CustomReportDTO; error: string | null }> {
    await delay(500);
    const report: CustomReportDTO = {
      id: `r${Date.now()}`,
      name: request.name,
      description: request.description,
      chartType: request.chartType,
      metrics: request.metrics,
      dimensions: request.dimensions,
      filters: request.filters,
      createdBy: 'current_user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastRunAt: null,
    };
    reportsStore.push(report);
    return { data: report, error: null };
  },

  async updateReport(request: UpdateReportRequest): Promise<{ data: CustomReportDTO; error: string | null }> {
    await delay(500);
    const idx = reportsStore.findIndex((r) => r.id === request.id);
    if (idx === -1) return { data: null as unknown as CustomReportDTO, error: 'Report not found' };
    reportsStore[idx] = { ...reportsStore[idx], ...request, updatedAt: new Date().toISOString() };
    return { data: reportsStore[idx], error: null };
  },

  async deleteReport(id: string): Promise<{ error: string | null }> {
    await delay(300);
    const idx = reportsStore.findIndex((r) => r.id === id);
    if (idx === -1) return { error: 'Report not found' };
    reportsStore.splice(idx, 1);
    return { error: null };
  },

  async listScheduledReports(): Promise<ScheduledReportListResponse> {
    await delay();
    return { data: schedulesStore, total: schedulesStore.length, error: null };
  },

  async createSchedule(request: ScheduleReportRequest): Promise<{ data: ScheduledReportDTO; error: string | null }> {
    await delay(500);
    const schedule: ScheduledReportDTO = {
      id: `s${Date.now()}`,
      reportId: request.reportId,
      reportName: reportsStore.find((r) => r.id === request.reportId)?.name || 'Unknown Report',
      frequency: request.frequency,
      recipients: request.recipients,
      format: request.format,
      nextRunAt: new Date(Date.now() + 86400000).toISOString(),
      lastRunAt: null,
      enabled: true,
      createdBy: 'current_user',
      createdAt: new Date().toISOString(),
    };
    schedulesStore.push(schedule);
    return { data: schedule, error: null };
  },

  async updateSchedule(id: string, request: Partial<ScheduleReportRequest>): Promise<{ data: ScheduledReportDTO; error: string | null }> {
    await delay(500);
    const idx = schedulesStore.findIndex((s) => s.id === id);
    if (idx === -1) return { data: null as unknown as ScheduledReportDTO, error: 'Schedule not found' };
    schedulesStore[idx] = { ...schedulesStore[idx], ...request };
    return { data: schedulesStore[idx], error: null };
  },

  async deleteSchedule(id: string): Promise<{ error: string | null }> {
    await delay(300);
    const idx = schedulesStore.findIndex((s) => s.id === id);
    if (idx === -1) return { error: 'Schedule not found' };
    schedulesStore.splice(idx, 1);
    return { error: null };
  },

  async exportData(request: ExportDataRequest): Promise<ExportResponse> {
    await delay(800);
    return {
      url: `/exports/${Date.now()}/download.${request.format}`,
      format: request.format,
      filename: `analytics-export-${Date.now()}.${request.format}`,
      error: null,
    };
  },

  async getExportHistory(): Promise<ExportHistoryResponse> {
    await delay();
    return { data: exportHistoryStore, total: exportHistoryStore.length, error: null };
  },

  async getAuditMetrics(): Promise<AuditMetricsResponse> {
    await delay();
    return {
      data: {
        totalActions: 1842, uniqueUsers: 28,
        actionsByType: [
          { action: 'View Dashboard', count: 820 },
          { action: 'Generate Report', count: 345 },
          { action: 'Export Data', count: 210 },
          { action: 'Create Report', count: 95 },
          { action: 'Delete Report', count: 28 },
          { action: 'Schedule Report', count: 44 },
        ],
        actionsByUser: [
          { userId: 'u1', userName: 'Admin User', actionCount: 421 },
          { userId: 'u2', userName: 'Sarah Chen', actionCount: 285 },
          { userId: 'u3', userName: 'Ops Manager', actionCount: 198 },
          { userId: 'u4', userName: 'Viewer User', actionCount: 156 },
        ],
        recentActions: [
          { id: 'a1', userId: 'u1', userName: 'Admin User', action: 'Generate Report', resource: 'Weekly Support Summary', details: 'PDF format', timestamp: new Date(Date.now() - 3600000).toISOString() },
          { id: 'a2', userId: 'u2', userName: 'Sarah Chen', action: 'View Dashboard', resource: 'Executive Dashboard', details: 'Date range: Last 30 days', timestamp: new Date(Date.now() - 7200000).toISOString() },
          { id: 'a3', userId: 'u1', userName: 'Admin User', action: 'Export Data', resource: 'Technician Performance', details: 'CSV format', timestamp: new Date(Date.now() - 14400000).toISOString() },
          { id: 'a4', userId: 'u3', userName: 'Ops Manager', action: 'Create Report', resource: 'SLA Compliance Report', details: 'Monthly report', timestamp: new Date(Date.now() - 28800000).toISOString() },
        ],
        trendData: [
          { date: '2026-06-01', actions: 42 },
          { date: '2026-06-05', actions: 58 },
          { date: '2026-06-10', actions: 52 },
          { date: '2026-06-15', actions: 65 },
          { date: '2026-06-20', actions: 48 },
          { date: '2026-06-25', actions: 55 },
          { date: '2026-06-30', actions: 38 },
        ],
      },
      error: null,
    };
  },

  async getSystemHealth(): Promise<SystemHealthResponse> {
    await delay();
    return {
      data: {
        status: 'healthy',
        services: [
          { name: 'Analytics API', status: 'healthy', latency: 42, lastChecked: new Date().toISOString() },
          { name: 'Database', status: 'healthy', latency: 8, lastChecked: new Date().toISOString() },
          { name: 'Cache Layer', status: 'healthy', latency: 3, lastChecked: new Date().toISOString() },
          { name: 'Export Service', status: 'healthy', latency: 65, lastChecked: new Date().toISOString() },
          { name: 'Scheduler', status: 'healthy', latency: 12, lastChecked: new Date().toISOString() },
          { name: 'Forecast Engine', status: 'degraded', latency: 380, lastChecked: new Date().toISOString() },
          { name: 'Search Index', status: 'healthy', latency: 25, lastChecked: new Date().toISOString() },
        ],
        uptime: 99.97, avgLatency: 28, errorRate: 0.12,
        activeUsers: 18, cacheHitRate: 87.5, apiRequests: 12580,
      },
      error: null,
    };
  },

  async search(query: string): Promise<SearchResponse> {
    await delay(200);
    const results: SearchResultDTO[] = [
      { id: 's1', type: 'dashboard', title: 'Executive Dashboard', description: 'Enterprise-wide KPI overview', route: '/', relevance: 0.95 },
      { id: 's2', type: 'dashboard', title: 'Support Analytics', description: 'Ticket and agent performance metrics', route: '/support', relevance: 0.88 },
      { id: 's3', type: 'dashboard', title: 'SLA Dashboard', description: 'SLA compliance monitoring', route: '/sla', relevance: 0.82 },
      { id: 's4', type: 'report', title: 'Weekly Support Summary', description: 'Weekly ticket volume and resolution metrics', route: '/reports', relevance: 0.78 },
      { id: 's5', type: 'metric', title: 'Total Tickets', description: '1847 total support tickets', route: '/', relevance: 0.72 },
      { id: 's6', type: 'metric', title: 'SLA Compliance', description: '94.3% overall SLA compliance', route: '/sla', relevance: 0.71 },
      { id: 's7', type: 'chart', title: 'Ticket Trend Chart', description: 'Time-series of ticket volume', route: '/support', relevance: 0.65 },
      { id: 's8', type: 'page', title: 'Export Center', description: 'Data export and download center', route: '/export', relevance: 0.60 },
    ];
    const filtered = results.filter(
      (r) => r.title.toLowerCase().includes(query.toLowerCase()) || r.description.toLowerCase().includes(query.toLowerCase())
    );
    return { data: filtered, total: filtered.length, error: null };
  },
};
