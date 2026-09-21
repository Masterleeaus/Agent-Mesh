import type { TicketDTO, CustomerDTO, TemplateDTO, MessageDTO, TimelineEventDTO } from './dto';
import type { AgentSLAMetricVM } from './view-models';

export interface TicketListResponse {
  data: TicketDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TicketDetailResponse {
  ticket: TicketDTO;
  customer: CustomerDTO;
  messages: MessageDTO[];
  timeline: TimelineEventDTO[];
  relatedAppointments: unknown[];
  relatedDisputes: unknown[];
}

export interface CustomerSearchResponse {
  data: CustomerDTO[];
  total: number;
}

export interface SLAMetricsResponse {
  compliancePercent: number;
  breached: number;
  total: number;
  avgResponseTimeByChannel: Record<string, number>;
  byAgent: AgentSLAMetricVM[];
}

export interface TemplateListResponse {
  data: TemplateDTO[];
  total: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}
