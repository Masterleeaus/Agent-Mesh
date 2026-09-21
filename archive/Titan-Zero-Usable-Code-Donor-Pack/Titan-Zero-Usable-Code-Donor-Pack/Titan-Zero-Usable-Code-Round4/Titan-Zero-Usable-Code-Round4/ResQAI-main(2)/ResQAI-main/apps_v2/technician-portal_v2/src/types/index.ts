export type {
  JobDTO, CustomerDTO, TechnicianDTO, ChecklistDTO, ChecklistItemDTO,
  ServiceNoteDTO, PartDTO, EvidenceDTO, SignatureDTO, MessageDTO,
  NotificationDTO, TimelineEventDTO,
  JobStatus, JobPriority, ServiceType, EvidenceType, SyncStatus,
} from '../models/dto';
export type {
  JobListItemVM, JobDetailVM, DashboardVM, MessageVM, NotificationVM, TechnicianProfileVM,
} from '../models/view-models';
export type {
  JobListFilters, UpdateJobStatusRequest, AddNotesRequest, UploadEvidenceRequest,
  RequestPartsRequest, EscalateJobRequest, CompleteJobRequest, PauseJobRequest,
  ResumeJobRequest, UpdateChecklistItemRequest, SendMessageRequest,
  UpdateProfileRequest, UpdateSettingsRequest,
} from '../models/api-requests';
export type {
  JobListResponse, JobDetailResponse, DashboardResponse, CustomerDetailResponse,
  EvidenceUploadResponse, ApiError, SyncStatusResponse,
} from '../models/api-responses';
export type {
  TechnicianPortalEventName, TechnicianPortalEventPayload, TechnicianPortalEvent,
  JobAcceptedPayload, JobRejectedPayload, JobStatusChangedPayload,
  JobPausedPayload, JobResumedPayload, JobEscalatedPayload,
  JobCompletedPayload, JobProgressUpdatedPayload, NotesAddedPayload,
  EvidenceUploadedPayload, SignatureCapturedPayload, PartsUsedPayload,
  InventoryRequestedPayload, MessageSentPayload,
  OfflineSyncStartedPayload, OfflineSyncCompletedPayload, OfflineSyncFailedPayload,
  NetworkStatusChangedPayload, GpsStatusChangedPayload,
} from '../contracts/events';
export type {
  TechnicianPortalPermission,
} from '../contracts/permissions';
