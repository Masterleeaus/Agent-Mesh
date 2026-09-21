import type { CaseDTO, DisputeDTO, ResolutionDTO, EvidenceDTO, EscalationDTO, ApprovalDTO, KnowledgeBaseDTO, TechnicianReportDTO, CustomerComplaintDTO, TimelineEventDTO } from './dto';

export interface CaseListResponse {
  data: CaseDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CaseDetailResponse {
  case: CaseDTO;
  dispute?: DisputeDTO;
  resolution?: ResolutionDTO;
  evidence: EvidenceDTO[];
  escalations: EscalationDTO[];
  approvals: ApprovalDTO[];
  technicianReport?: TechnicianReportDTO;
  customerComplaint?: CustomerComplaintDTO;
  timeline: TimelineEventDTO[];
}

export interface DisputeListResponse {
  data: DisputeDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ResolutionListResponse {
  data: ResolutionDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface EscalationListResponse {
  data: EscalationDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApprovalListResponse {
  data: ApprovalDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface EvidenceListResponse {
  data: EvidenceDTO[];
  total: number;
}

export interface KnowledgeBaseListResponse {
  data: KnowledgeBaseDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DashboardResponse {
  totalPending: number;
  totalDisputes: number;
  pendingApprovals: number;
  highPriorityCases: number;
  slaCompliancePercent: number;
  averageResolutionTimeHours: number;
  recentlyClosedCount: number;
  pendingReviews: number;
}

export interface SearchResponse {
  cases: CaseDTO[];
  disputes: DisputeDTO[];
  knowledge: KnowledgeBaseDTO[];
  total: number;
}

export interface TechnicianReportListResponse {
  data: TechnicianReportDTO[];
  total: number;
}

export interface CustomerComplaintListResponse {
  data: CustomerComplaintDTO[];
  total: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}
