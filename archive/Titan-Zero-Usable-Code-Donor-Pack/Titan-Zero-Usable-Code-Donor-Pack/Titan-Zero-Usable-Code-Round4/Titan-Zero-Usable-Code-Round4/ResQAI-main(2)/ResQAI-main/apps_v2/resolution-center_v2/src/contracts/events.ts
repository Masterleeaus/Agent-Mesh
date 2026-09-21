import type { CaseDTO, ResolutionDTO, EscalationDTO, ApprovalDTO } from '../models/dto';

export const RESOLUTION_CENTER_EVENTS = {
  CASE_CREATED: 'resolution.case.created',
  CASE_STATUS_CHANGED: 'resolution.case.status.changed',
  CASE_CLOSED: 'resolution.case.closed',
  DISPUTE_CREATED: 'resolution.dispute.created',
  DISPUTE_RESOLVED: 'resolution.dispute.resolved',
  RESOLUTION_CREATED: 'resolution.resolution.created',
  RESOLUTION_APPROVED: 'resolution.resolution.approved',
  RESOLUTION_REJECTED: 'resolution.resolution.rejected',
  ESCALATION_CREATED: 'resolution.escalation.created',
  ESCALATION_RESOLVED: 'resolution.escalation.resolved',
  APPROVAL_CREATED: 'resolution.approval.created',
  APPROVAL_GRANTED: 'resolution.approval.granted',
  APPROVAL_DENIED: 'resolution.approval.denied',
  EVIDENCE_UPLOADED: 'resolution.evidence.uploaded',
} as const;

export type ResolutionCenterEventName = typeof RESOLUTION_CENTER_EVENTS[keyof typeof RESOLUTION_CENTER_EVENTS];

export interface CaseCreatedPayload { case: CaseDTO; }
export interface CaseStatusChangedPayload { caseId: string; previousStatus: string; newStatus: string; }
export interface CaseClosedPayload { caseId: string; resolution: string; }
export interface DisputeCreatedPayload { caseId: string; disputeId: string; reason: string; }
export interface DisputeResolvedPayload { caseId: string; disputeId: string; resolution: string; }
export interface ResolutionCreatedPayload { resolution: ResolutionDTO; }
export interface ResolutionApprovedPayload { resolutionId: string; caseId: string; approvedBy: string; }
export interface ResolutionRejectedPayload { resolutionId: string; caseId: string; reason: string; }
export interface EscalationCreatedPayload { escalation: EscalationDTO; }
export interface EscalationResolvedPayload { escalationId: string; caseId: string; resolution: string; }
export interface ApprovalCreatedPayload { approval: ApprovalDTO; }
export interface ApprovalGrantedPayload { approvalId: string; caseId: string; approvedBy: string; }
export interface ApprovalDeniedPayload { approvalId: string; caseId: string; reason: string; }
export interface EvidenceUploadedPayload { caseId: string; evidenceId: string; type: string; }

export type ResolutionCenterEventPayload =
  | CaseCreatedPayload | CaseStatusChangedPayload | CaseClosedPayload
  | DisputeCreatedPayload | DisputeResolvedPayload
  | ResolutionCreatedPayload | ResolutionApprovedPayload | ResolutionRejectedPayload
  | EscalationCreatedPayload | EscalationResolvedPayload
  | ApprovalCreatedPayload | ApprovalGrantedPayload | ApprovalDeniedPayload
  | EvidenceUploadedPayload;

export type ResolutionCenterEvent = {
  [K in ResolutionCenterEventName]: { type: K; payload: Extract<ResolutionCenterEventPayload, Record<string, unknown>> };
}[ResolutionCenterEventName];
