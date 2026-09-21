import type { ChartType, ReportFrequency, ExportFormat, DateRangePreset } from './dto';

export interface DateRangeRequest {
  preset?: DateRangePreset;
  startDate?: string;
  endDate?: string;
}

export interface CreateReportRequest {
  name: string;
  description: string;
  chartType: ChartType;
  metrics: string[];
  dimensions: string[];
  filters: Record<string, string[]>;
}

export interface UpdateReportRequest {
  id: string;
  name?: string;
  description?: string;
  chartType?: ChartType;
  metrics?: string[];
  dimensions?: string[];
  filters?: Record<string, string[]>;
}

export interface ScheduleReportRequest {
  reportId: string;
  frequency: ReportFrequency;
  recipients: string[];
  format: ExportFormat;
}

export interface ExportDataRequest {
  reportId?: string;
  format: ExportFormat;
  dateRange: DateRangeRequest;
  filters: Record<string, string[]>;
}

export interface DashboardConfigRequest {
  dateRange: DateRangeRequest;
  domainFilter?: string;
}
