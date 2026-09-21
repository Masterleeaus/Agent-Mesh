import type { AppointmentDTO, TechnicianDTO, ServiceTypeDTO, TimeSlotDTO, AppointmentHistoryEventDTO, AppointmentStatsDTO } from './dto';
import type { ReportStatsVM, SearchResultVM } from './view-models';

export interface AppointmentListResponse {
  appointments: AppointmentDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AppointmentDetailResponse {
  appointment: AppointmentDTO;
  timeline: AppointmentHistoryEventDTO[];
}

export interface TechnicianListResponse {
  technicians: TechnicianDTO[];
  total: number;
}

export interface TechnicianScheduleResponse {
  technician: TechnicianDTO;
  date: string;
  slots: { time: string; appointment: AppointmentDTO | null }[];
}

export interface ServiceTypeListResponse {
  services: ServiceTypeDTO[];
  total: number;
}

export interface AvailableSlotsResponse {
  date: string;
  serviceTypeId: string;
  slots: TimeSlotDTO[];
}

export interface AppointmentHistoryResponse {
  events: AppointmentHistoryEventDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DashboardStatsResponse {
  stats: AppointmentStatsDTO;
}

export interface ReportResponse {
  report: ReportStatsVM;
}

export interface SearchResponse {
  results: SearchResultVM[];
  total: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}
