import type { UserDTO, RoleDTO, AuditLogEntryDTO, SystemSettingDTO, ConnectorDTO, FeatureFlagDTO, EventBusMetricDTO, SessionDTO, ApplicationDTO, WorkflowDTO, WorkflowRunDTO, FunctionDTO, FunctionRunDTO, AgentDTO, IntegrationDTO, NotificationDTO, APIKeyDTO, OrganizationDTO, TeamDTO, PlatformMetricDTO, ErrorEntryDTO } from './dto';
import type { AdminDashboardVM, UserDetailVM, RoleDetailVM, ConnectorStatusVM, EventBusHealthVM, ApplicationDetailVM, AgentDetailVM } from './view-models';

export interface AdminDashboardResponse { data: AdminDashboardVM; }
export interface UserListResponse { data: UserDTO[]; total: number; page: number; pageSize: number; }
export interface UserDetailResponse { data: UserDetailVM; }
export interface RoleListResponse { data: RoleDTO[]; total: number; }
export interface RoleDetailResponse { data: RoleDetailVM; }
export interface AuditLogResponse { data: AuditLogEntryDTO[]; total: number; page: number; pageSize: number; }
export interface SettingsListResponse { data: SystemSettingDTO[]; total: number; }
export interface ConnectorListResponse { data: ConnectorDTO[]; total: number; }
export interface EventBusMetricsResponse { data: EventBusHealthVM; recentEvents: EventBusMetricDTO[]; }
export interface SessionListResponse { data: SessionDTO[]; total: number; }
export interface ApplicationListResponse { data: ApplicationDTO[]; total: number; }
export interface ApplicationDetailResponse { data: ApplicationDetailVM; }
export interface WorkflowListResponse { data: WorkflowDTO[]; total: number; }
export interface WorkflowRunListResponse { data: WorkflowRunDTO[]; total: number; }
export interface FunctionListResponse { data: FunctionDTO[]; total: number; }
export interface FunctionRunListResponse { data: FunctionRunDTO[]; total: number; }
export interface AgentListResponse { data: AgentDTO[]; total: number; }
export interface AgentDetailResponse { data: AgentDetailVM; }
export interface IntegrationListResponse { data: IntegrationDTO[]; total: number; }
export interface NotificationListResponse { data: NotificationDTO[]; total: number; }
export interface APIKeyListResponse { data: APIKeyDTO[]; total: number; }
export interface OrganizationListResponse { data: OrganizationDTO[]; total: number; }
export interface TeamListResponse { data: TeamDTO[]; total: number; }
export interface PlatformMetricsResponse { data: PlatformMetricDTO[]; total: number; }
export interface ErrorListResponse { data: ErrorEntryDTO[]; total: number; }
