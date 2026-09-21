import type { OperationDTO, TechnicianDTO, DispatchDTO, EscalationDTO, TimelineEventDTO, RegionDTO } from './dto';
import type { DashboardMetricsVM, LiveMetricVM, RegionalStatusVM } from './view-models';

export interface OperationsListResponse {
  data: OperationDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface OperationDetailResponse {
  operation: OperationDTO;
  technician?: TechnicianDTO;
  dispatches: DispatchDTO[];
  timeline: TimelineEventDTO[];
  escalations: EscalationDTO[];
}

export interface TechniciansListResponse {
  data: TechnicianDTO[];
  total: number;
}

export interface DispatchQueueResponse {
  data: DispatchDTO[];
  total: number;
  pendingCount: number;
}

export interface EscalationsListResponse {
  data: EscalationDTO[];
  total: number;
  openCount: number;
}

export interface TimelineResponse {
  data: TimelineEventDTO[];
  total: number;
}

export interface RegionsListResponse {
  data: RegionDTO[];
}

export interface DashboardMetricsResponse {
  metrics: DashboardMetricsVM;
  liveMetrics: LiveMetricVM[];
  regionalStatus: RegionalStatusVM[];
}

export interface TechniciansStatusResponse {
  data: TechnicianDTO[];
  total: number;
  available: number;
  enRoute: number;
  onSite: number;
  offline: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}
