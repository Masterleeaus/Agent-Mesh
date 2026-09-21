import type { CaseDTO, DisputeDTO, ResolutionDTO, EvidenceDTO, EscalationDTO, ApprovalDTO, KnowledgeBaseDTO, TechnicianReportDTO, CustomerComplaintDTO, TimelineEventDTO, CaseStatus, Priority, ResolutionType, DisputeReason, CaseType } from './dto';

export interface CaseListItemVM {
  id: string;
  type: CaseType;
  status: CaseStatus;
  priority: Priority;
  customerName: string;
  technicianName?: string;
  summary: string;
  age: number;
  isUrgent: boolean;
  hasEvidence: boolean;
  isEscalated: boolean;
}

export interface CaseDetailVM {
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

export interface DisputeListItemVM {
  id: string;
  caseId: string;
  reason: DisputeReason;
  customerName: string;
  priority: Priority;
  status: import('./dto').DisputeStatus;
  amount?: number;
  age: number;
  isUrgent: boolean;
}

export interface ResolutionListItemVM {
  id: string;
  caseId: string;
  type: ResolutionType;
  customerName: string;
  createdByName: string;
  assignedToName?: string;
  status: CaseStatus;
  age: number;
  isUrgent: boolean;
}

export interface EscalationListItemVM {
  id: string;
  caseId: string;
  escalatedByName: string;
  escalatedToName: string;
  reason: string;
  status: import('./dto').EscalationStatus;
  age: number;
  isUrgent: boolean;
}

export interface ApprovalListItemVM {
  id: string;
  caseId: string;
  type: string;
  requestedByName: string;
  status: import('./dto').ApprovalStatus;
  age: number;
  isUrgent: boolean;
}

export interface EvidenceListItemVM {
  id: string;
  caseId: string;
  type: string;
  title: string;
  uploadedByName: string;
  createdAt: string;
}

export interface TechnicianReportVM {
  id: string;
  caseId: string;
  technicianName: string;
  summary: string;
  findings: string;
  actionsTaken: string;
  partsUsed: string[];
  recommendations: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerComplaintVM {
  id: string;
  caseId: string;
  customerName: string;
  subject: string;
  description: string;
  desiredOutcome: string;
  status: string;
  createdAt: string;
}

export interface KnowledgeBaseArticleVM {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  authorName: string;
  updatedAt: string;
}

export interface ResolutionDashboardVM {
  totalPending: number;
  totalDisputes: number;
  pendingApprovals: number;
  highPriorityCases: number;
  slaCompliancePercent: number;
  averageResolutionTimeHours: number;
  recentlyClosedCount: number;
  pendingReviews: number;
}

export interface TimelineEventVM {
  id: string;
  type: string;
  description: string;
  actorName: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CaseClosedVM {
  id: string;
  caseId: string;
  type: CaseType;
  customerName: string;
  status: CaseStatus;
  resolution: string;
  closedAt: string;
  closedByName: string;
}
