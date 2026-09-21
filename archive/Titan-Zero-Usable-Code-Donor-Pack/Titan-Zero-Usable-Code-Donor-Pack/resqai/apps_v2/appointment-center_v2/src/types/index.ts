export type {
  AppointmentDTO, TechnicianDTO, CustomerDTO, ServiceTypeDTO, TimeSlotDTO, AppointmentHistoryEventDTO, AppointmentStatsDTO,
  AppointmentStatus, ServiceCategory, TechnicianSkill, AppointmentType,
} from '../models/dto';
export type {
  AppointmentCardVM, ScheduleDayVM, TechnicianScheduleVM, ServiceTypeListItemVM,
  BookingWizardStepVM, ConflictWarningVM, TechSuggestionVM, DashboardStatsVM,
  AppointmentQueueItemVM, TimelineGroupVM, AppointmentHistoryVM, AppointmentHistoryEventVM,
  ReportStatsVM, AppointmentDetailVM, SearchResultVM,
} from '../models/view-models';
export type {
  CreateAppointmentRequest, UpdateAppointmentRequest, RescheduleRequest,
  AssignTechnicianRequest, CancelAppointmentRequest, CompleteAppointmentRequest,
  CreateServiceTypeRequest, UpdateServiceTypeRequest, AppointmentListFilters, GenerateReportRequest,
} from '../models/api-requests';
export type {
  AppointmentListResponse, AppointmentDetailResponse, TechnicianListResponse,
  TechnicianScheduleResponse, ServiceTypeListResponse, AvailableSlotsResponse,
  AppointmentHistoryResponse, DashboardStatsResponse, ReportResponse, SearchResponse, ApiError,
} from '../models/api-responses';
export type {
  AppointmentCreatedPayload, AppointmentAssignedPayload, AppointmentStatusChangedPayload,
  AppointmentCancelledPayload, AppointmentCompletedPayload, AppointmentRescheduledPayload,
  AppointmentUpdatedPayload, AppointmentNoShowPayload, ConflictDetectedPayload, BatchActionPayload,
} from '../contracts/events';
export type {
  AppointmentPermission,
} from '../contracts/permissions';

