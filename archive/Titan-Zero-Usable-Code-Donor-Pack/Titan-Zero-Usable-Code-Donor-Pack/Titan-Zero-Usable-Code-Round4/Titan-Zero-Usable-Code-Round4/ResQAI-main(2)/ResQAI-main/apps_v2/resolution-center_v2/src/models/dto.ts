export type CaseType = 'dispute' | 'complaint' | 'technician_report' | 'evidence_review' | 'escalation';
export type CaseStatus = 'pending_review' | 'in_review' | 'evidence_gathering' | 'pending_approval' | 'resolved' | 'closed' | 'escalated';
export type Priority = 'low' | 'normal' | 'high' | 'critical';
export type DisputeReason = 'billing' | 'service_quality' | 'damage' | 'no_show' | 'incomplete_work' | 'other';
export type DisputeStatus = 'open' | 'investigating' | 'pending_resolution' | 'resolved' | 'escalated';
export type EscalationStatus = 'pending_review' | 'under_review' | 'resolved' | 'dismissed';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type ResolutionType = 'full_refund' | 'partial_refund' | 'rework' | 'credit' | 'apology' | 'other';

export interface CaseDTO {
  id: string;
  type: CaseType;
  status: CaseStatus;
  priority: Priority;
  customerId: string;
  customerName: string;
  technicianId?: string;
  technicianName?: string;
  accountId?: string;
  accountName?: string;
  summary: string;
  description: string;
  serviceRequestId?: string;
  appointmentId?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export interface DisputeDTO {
  id: string;
  caseId: string;
  reason: DisputeReason;
  description: string;
  status: DisputeStatus;
  priority: Priority;
  customerId: string;
  customerName: string;
  amount?: number;
  currency?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResolutionDTO {
  id: string;
  caseId: string;
  type: ResolutionType;
  status: CaseStatus;
  createdBy: string;
  createdByName: string;
  assignedTo?: string;
  assignedToName?: string;
  resolution: string;
  notes?: string;
  amount?: number;
  currency?: string;
  createdAt: string;
  completedAt?: string;
}

export interface EvidenceDTO {
  id: string;
  caseId: string;
  type: 'photo' | 'document' | 'signature' | 'video' | 'audio' | 'other';
  title: string;
  description: string;
  url: string;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
}

export interface EscalationDTO {
  id: string;
  caseId: string;
  reason: string;
  status: EscalationStatus;
  escalatedBy: string;
  escalatedByName: string;
  escalatedTo: string;
  escalatedToName: string;
  notes?: string;
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ApprovalDTO {
  id: string;
  caseId: string;
  type: 'resolution' | 'refund' | 'credit' | 'rework' | 'escalation';
  status: ApprovalStatus;
  requestedBy: string;
  requestedByName: string;
  approvedBy?: string;
  approvedByName?: string;
  comments?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface KnowledgeBaseDTO {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface TechnicianReportDTO {
  id: string;
  caseId: string;
  technicianId: string;
  technicianName: string;
  summary: string;
  findings: string;
  actionsTaken: string;
  partsUsed: string[];
  recommendations: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface CustomerComplaintDTO {
  id: string;
  caseId: string;
  customerId: string;
  customerName: string;
  subject: string;
  description: string;
  desiredOutcome: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface TimelineEventDTO {
  id: string;
  caseId: string;
  type: string;
  description: string;
  actorName: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
