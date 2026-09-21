import type { JobDTO, CustomerDTO, TechnicianDTO, ChecklistDTO, ServiceNoteDTO, PartDTO, EvidenceDTO, SignatureDTO, MessageDTO, NotificationDTO, TimelineEventDTO } from './dto';

export interface JobListResponse {
  data: JobDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface JobDetailResponse {
  job: JobDTO;
  customer: CustomerDTO;
  checklist?: ChecklistDTO;
  notes: ServiceNoteDTO[];
  parts: PartDTO[];
  evidence: EvidenceDTO[];
  signature?: SignatureDTO;
  messages: MessageDTO[];
  timeline: TimelineEventDTO[];
}

export interface DashboardResponse {
  todayJobs: JobDTO[];
  currentJob?: JobDTO;
  nextAppointment?: JobDTO;
  urgentJobs: JobDTO[];
  completionRate: number;
  totalJobsToday: number;
  completedJobsToday: number;
  unreadMessages: number;
  unreadNotifications: number;
  travelStatus?: {
    distance: number;
    duration: number;
    destination: string;
  };
}

export interface CustomerDetailResponse {
  customer: CustomerDTO;
  jobHistory: JobDTO[];
}

export interface EvidenceUploadResponse {
  id: string;
  url: string;
  thumbnailUrl?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface SyncStatusResponse {
  pendingUploads: number;
  pendingDownloads: number;
  lastSyncAt?: string;
  isSyncing: boolean;
}
