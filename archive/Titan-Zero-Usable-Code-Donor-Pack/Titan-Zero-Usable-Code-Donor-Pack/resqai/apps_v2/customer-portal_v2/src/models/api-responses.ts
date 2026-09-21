import {
  TicketDTO, AppointmentDTO, DisputeDTO, AccountDTO, FollowupDTO,
  NotificationPreferenceDTO, InvoiceDTO, PaymentDTO, MessageDTO,
  NotificationDTO, FeedbackDTO, KnowledgeBaseArticleDTO, DownloadDTO,
  TechnicianTrackingDTO, ServiceRecordDTO, SecuritySettingDTO,
} from './dto';
import {
  HomeDashboardVM, TicketListItemVM, AppointmentListItemVM,
  DisputeListItemVM, AccountHealthVM, ProfileVM, InvoiceListItemVM,
  PaymentListItemVM, MessageListItemVM, NotificationListItemVM,
  FeedbackListItemVM, KnowledgeBaseListItemVM, DownloadListItemVM,
  ServiceHistoryListItemVM, TechnicianTrackingVM, AppointmentCalendarVM,
} from './view-models';

export interface HomeDashboardResponse {
  dashboard: HomeDashboardVM;
}

export interface TicketListResponse {
  tickets: TicketDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TicketDetailResponse {
  ticket: TicketDTO;
  messages: MessageDTO[];
}

export interface AppointmentListResponse {
  appointments: AppointmentDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AppointmentCalendarResponse {
  weeks: AppointmentCalendarVM[][];
}

export interface DisputeListResponse {
  disputes: DisputeDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AccountHealthResponse {
  account: AccountDTO;
  health: AccountHealthVM;
  followups: FollowupDTO[];
}

export interface ProfileResponse {
  profile: ProfileVM;
  preferences: NotificationPreferenceDTO;
}

export interface AvailableSlotsResponse {
  date: string;
  slots: string[];
}

export interface InvoiceListResponse {
  invoices: InvoiceListItemVM[];
  total: number;
  page: number;
  pageSize: number;
}

export interface InvoiceDetailResponse {
  invoice: InvoiceDTO;
}

export interface PaymentListResponse {
  payments: PaymentListItemVM[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MessageListResponse {
  messages: MessageListItemVM[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MessageThreadResponse {
  messages: MessageDTO[];
}

export interface NotificationListResponse {
  notifications: NotificationListItemVM[];
  total: number;
  page: number;
  pageSize: number;
  unreadCount: number;
}

export interface FeedbackListResponse {
  feedback: FeedbackListItemVM[];
  total: number;
  page: number;
  pageSize: number;
}

export interface KnowledgeBaseSearchResponse {
  articles: KnowledgeBaseListItemVM[];
  total: number;
}

export interface KnowledgeBaseArticleResponse {
  article: KnowledgeBaseArticleDTO;
}

export interface DownloadListResponse {
  downloads: DownloadListItemVM[];
  total: number;
}

export interface ServiceHistoryResponse {
  services: ServiceHistoryListItemVM[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TechnicianTrackingResponse {
  tracking: TechnicianTrackingVM | null;
}

export interface SecuritySettingsResponse {
  settings: SecuritySettingDTO;
}

export interface CustomerSatisfactionResponse {
  satisfaction: { averageRating: number; totalReviews: number; ratingDistribution: Record<number, number> };
}