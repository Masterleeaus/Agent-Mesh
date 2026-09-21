import type { AccountDTO, FollowupDTO, HealthScanDTO, RiskSignalDTO, InteractionDTO, NoteDTO, TaskDTO, FeedbackDTO, SatisfactionDTO, OpportunityDTO, CustomerDTO } from './dto';
import type { AccountDashboardVM, AccountListItemVM, AccountDetailVM, FollowupListItemVM, HealthScanResultVM, RiskSignalVM, InteractionVM, NoteVM, TaskVM, FeedbackVM, SatisfactionVM, OpportunityVM, CRMDashboardVM, CustomerProfileVM, RetentionDashboardVM, CommunicationCenterVM } from './view-models';

export interface AccountDashboardResponse {
  dashboard: AccountDashboardVM;
}

export interface AccountListResponse {
  data: AccountDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AccountDetailResponse {
  data: AccountDetailVM;
}

export interface FollowupListResponse {
  data: FollowupDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface HealthScanListResponse {
  data: HealthScanDTO[];
  total: number;
}

export interface RiskSignalListResponse {
  data: RiskSignalDTO[];
  total: number;
}

export interface CreateFollowupResponse {
  data: FollowupDTO;
}

export interface InteractionListResponse {
  data: InteractionDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface NoteListResponse {
  data: NoteDTO[];
  total: number;
}

export interface CreateNoteResponse {
  data: NoteDTO;
}

export interface TaskListResponse {
  data: TaskDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateTaskResponse {
  data: TaskDTO;
}

export interface FeedbackListResponse {
  data: FeedbackDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateFeedbackResponse {
  data: FeedbackDTO;
}

export interface SatisfactionListResponse {
  data: SatisfactionDTO[];
  total: number;
}

export interface OpportunityListResponse {
  data: OpportunityDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateOpportunityResponse {
  data: OpportunityDTO;
}

export interface CRMDashboardResponse {
  data: CRMDashboardVM;
}

export interface CustomerProfileResponse {
  data: CustomerProfileVM;
}

export interface RetentionDashboardResponse {
  data: RetentionDashboardVM;
}

export interface CommunicationCenterResponse {
  data: CommunicationCenterVM;
}

export interface CustomerListResponse {
  data: CustomerDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SearchResponse {
  accounts: AccountDTO[];
  customers: CustomerDTO[];
  followups: FollowupDTO[];
  tasks: TaskDTO[];
  interactions: InteractionDTO[];
  total: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}
