import type {
  ExecutiveDashboardDTO,
  SupportMetricsDTO,
  OperationsMetricsDTO,
  AppointmentMetricsDTO,
  AccountMetricsDTO,
  DisputeMetricsDTO,
  CustomReportDTO,
  ScheduledReportDTO,
  TechnicianPerformanceDTO,
  CustomerMetricsDTO,
  CRMMetricsDTO,
  ResolutionMetricsDTO,
  SLAMetricsDTO,
  ProductivityMetricsDTO,
  TrendAnalysisDTO,
  ForecastDTO,
  ExportHistoryDTO,
  AuditMetricsDTO,
  SystemHealthDTO,
  SearchResultDTO,
} from './dto';

export interface ExecutiveDashboardResponse {
  data: ExecutiveDashboardDTO;
  error: string | null;
}

export interface SupportMetricsResponse {
  data: SupportMetricsDTO;
  error: string | null;
}

export interface OperationsMetricsResponse {
  data: OperationsMetricsDTO;
  error: string | null;
}

export interface AppointmentMetricsResponse {
  data: AppointmentMetricsDTO;
  error: string | null;
}

export interface AccountMetricsResponse {
  data: AccountMetricsDTO;
  error: string | null;
}

export interface DisputeMetricsResponse {
  data: DisputeMetricsDTO;
  error: string | null;
}

export interface ReportListResponse {
  data: CustomReportDTO[];
  total: number;
  error: string | null;
}

export interface ScheduledReportListResponse {
  data: ScheduledReportDTO[];
  total: number;
  error: string | null;
}

export interface ExportResponse {
  url: string;
  format: string;
  filename: string;
  error: string | null;
}

export interface TechnicianPerformanceResponse {
  data: TechnicianPerformanceDTO[];
  total: number;
  error: string | null;
}

export interface CustomerMetricsResponse {
  data: CustomerMetricsDTO;
  error: string | null;
}

export interface CRMMetricsResponse {
  data: CRMMetricsDTO;
  error: string | null;
}

export interface ResolutionMetricsResponse {
  data: ResolutionMetricsDTO;
  error: string | null;
}

export interface SLAMetricsResponse {
  data: SLAMetricsDTO;
  error: string | null;
}

export interface ProductivityMetricsResponse {
  data: ProductivityMetricsDTO;
  error: string | null;
}

export interface TrendAnalysisResponse {
  data: TrendAnalysisDTO;
  error: string | null;
}

export interface ForecastResponse {
  data: ForecastDTO[];
  error: string | null;
}

export interface ExportHistoryResponse {
  data: ExportHistoryDTO[];
  total: number;
  error: string | null;
}

export interface AuditMetricsResponse {
  data: AuditMetricsDTO;
  error: string | null;
}

export interface SystemHealthResponse {
  data: SystemHealthDTO;
  error: string | null;
}

export interface SearchResponse {
  data: SearchResultDTO[];
  total: number;
  error: string | null;
}
