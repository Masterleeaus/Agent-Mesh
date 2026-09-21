import type { CaseType, CaseStatus, Priority, ResolutionType, DisputeReason } from './dto';

export interface CaseListFilters {
  type?: CaseType[];
  status?: CaseStatus[];
  priority?: Priority[];
  customerId?: string;
  technicianId?: string;
  search?: string;
  isUrgent?: boolean;
  isEscalated?: boolean;
  page?: number;
  pageSize?: number;
}

export interface DisputeListFilters {
  reason?: DisputeReason[];
  status?: import('./dto').DisputeStatus[];
  priority?: Priority[];
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateResolutionRequest {
  caseId: string;
  type: ResolutionType;
  resolution: string;
  notes?: string;
  amount?: number;
  currency?: string;
  assignedTo?: string;
}

export interface ApproveResolutionRequest {
  resolutionId: string;
  comments?: string;
}

export interface RejectResolutionRequest {
  resolutionId: string;
  reason: string;
  comments?: string;
}

export interface RequestMoreInfoRequest {
  caseId: string;
  questions: string[];
  requestedBy: string;
}

export interface EscalateCaseRequest {
  caseId: string;
  reason: string;
  escalateTo: string;
  notes?: string;
}

export interface CloseCaseRequest {
  caseId: string;
  resolution: string;
  notes?: string;
}

export interface CreateEvidenceRequest {
  caseId: string;
  type: 'photo' | 'document' | 'signature' | 'video' | 'audio' | 'other';
  title: string;
  description: string;
  url: string;
}

export interface SearchRequest {
  query: string;
  types?: string[];
  page?: number;
  pageSize?: number;
}

export interface KnowledgeBaseFilters {
  category?: string;
  tags?: string[];
  search?: string;
  page?: number;
  pageSize?: number;
}
