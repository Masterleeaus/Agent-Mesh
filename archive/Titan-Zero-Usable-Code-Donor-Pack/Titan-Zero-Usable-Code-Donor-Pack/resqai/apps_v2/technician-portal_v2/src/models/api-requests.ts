import type { JobStatus, ServiceType, JobPriority, EvidenceType } from './dto';

export interface JobListFilters {
  status?: JobStatus[];
  serviceType?: ServiceType[];
  priority?: JobPriority[];
  technicianId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  isEscalated?: boolean;
  page?: number;
  pageSize?: number;
}

export interface UpdateJobStatusRequest {
  status: JobStatus;
  notes?: string;
}

export interface AddNotesRequest {
  content: string;
  category: 'observation' | 'diagnosis' | 'resolution' | 'recommendation' | 'customer_request' | 'other';
}

export interface UploadEvidenceRequest {
  type: EvidenceType;
  fileName: string;
  fileSize: number;
  mimeType: string;
  data: string;
  caption?: string;
  latitude?: number;
  longitude?: number;
}

export interface RequestPartsRequest {
  name: string;
  sku: string;
  quantity: number;
  urgency: JobPriority;
}

export interface EscalateJobRequest {
  reason: string;
  escalateTo?: string;
}

export interface CompleteJobRequest {
  completionNotes: string;
  signatureData?: string;
  signatureCustomerName?: string;
  partsUsed?: { partId: string; quantity: number }[];
}

export interface PauseJobRequest {
  reason: string;
}

export interface ResumeJobRequest {
  notes?: string;
}

export interface UpdateChecklistItemRequest {
  itemId: string;
  completed: boolean;
  notes?: string;
}

export interface SendMessageRequest {
  body: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  skills?: string[];
}

export interface UpdateSettingsRequest {
  notificationsEnabled?: boolean;
  autoAcceptJobs?: boolean;
  defaultView?: 'list' | 'calendar';
  language?: string;
}
