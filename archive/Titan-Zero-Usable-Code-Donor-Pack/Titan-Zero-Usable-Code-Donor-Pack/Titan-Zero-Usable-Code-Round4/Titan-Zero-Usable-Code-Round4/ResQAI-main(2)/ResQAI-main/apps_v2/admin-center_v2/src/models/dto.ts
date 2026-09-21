export enum UserStatus { Active = 'active', Inactive = 'inactive', Suspended = 'suspended', Pending = 'pending' }
export enum ConnectorType { Email = 'email', SMS = 'sms', Slack = 'slack', Webhook = 'webhook', Custom = 'custom' }
export enum EventStatus { Success = 'success', Failed = 'failed', Pending = 'pending', Retrying = 'retrying' }
export enum LogAction { Create = 'create', Update = 'update', Delete = 'delete', Login = 'login', Logout = 'logout', Export = 'export', ConfigChange = 'config_change', PermissionChange = 'permission_change' }
export enum SettingType { String = 'string', Number = 'number', Boolean = 'boolean', Json = 'json', Secret = 'secret' }
export enum ApplicationStatus { Active = 'active', Maintenance = 'maintenance', Degraded = 'degraded', Down = 'down' }
export enum WorkflowStatus { Active = 'active', Paused = 'paused', Failed = 'failed', Draft = 'draft' }
export enum WorkflowRunStatus { Running = 'running', Completed = 'completed', Failed = 'failed', Cancelled = 'cancelled' }
export enum FunctionStatus { Active = 'active', Inactive = 'inactive', Error = 'error' }
export enum FunctionRunStatus { Running = 'running', Completed = 'completed', Failed = 'failed', TimedOut = 'timed_out' }
export enum AgentStatus { Online = 'online', Busy = 'busy', Offline = 'offline', Error = 'error' }
export enum IntegrationStatus { Connected = 'connected', Disconnected = 'disconnected', Error = 'error', Pending = 'pending' }
export enum APIKeyStatus { Active = 'active', Revoked = 'revoked', Expired = 'expired' }
export enum NotificationType { Info = 'info', Warning = 'warning', Error = 'error', Success = 'success' }
export enum OrganizationPlan { Free = 'free', Starter = 'starter', Professional = 'professional', Enterprise = 'enterprise' }

export interface UserDTO { id: string; email: string; name: string; role: string; status: UserStatus; appAccess: string[]; avatar?: string; lastLogin?: string; createdAt: string; updatedAt: string; }
export interface RoleDTO { id: string; name: string; description: string; permissions: string[]; appScope: string[]; userCount: number; createdAt: string; updatedAt: string; }
export interface PermissionDTO { id: string; key: string; label: string; description: string; group: string; parentId?: string; children?: PermissionDTO[]; }
export interface AuditLogEntryDTO { id: string; action: LogAction; actorId: string; actorName: string; targetType: string; targetId: string; targetLabel: string; details: string; ipAddress: string; timestamp: string; }
export interface SystemSettingDTO { id: string; key: string; value: string; type: SettingType; label: string; description: string; category: string; isSecret: boolean; updatedAt: string; updatedBy: string; }
export interface ConnectorDTO { id: string; name: string; type: ConnectorType; status: string; config: Record<string, string>; lastTested?: string; lastError?: string; enabled: boolean; createdAt: string; updatedAt: string; }
export interface FeatureFlagDTO { id: string; key: string; label: string; description: string; enabled: boolean; appScope: string[]; updatedAt: string; }
export interface EventBusMetricDTO { id: string; eventType: string; status: EventStatus; source: string; timestamp: string; payloadSize: number; retryCount: number; errorMessage?: string; }
export interface SessionDTO { id: string; userId: string; userName: string; ipAddress: string; userAgent: string; startedAt: string; lastActivity: string; expiresAt: string; }

export interface ApplicationDTO { id: string; name: string; key: string; description: string; status: ApplicationStatus; version: string; url: string; icon: string; category: string; owner: string; userCount: number; uptime: string; lastDeployed: string; createdAt: string; updatedAt: string; }
export interface WorkflowDTO { id: string; name: string; description: string; status: WorkflowStatus; version: string; appId: string; appName: string; steps: number; lastRun?: string; lastRunStatus?: WorkflowRunStatus; createdAt: string; updatedAt: string; }
export interface WorkflowRunDTO { id: string; workflowId: string; workflowName: string; status: WorkflowRunStatus; startedAt: string; completedAt?: string; duration: number; triggeredBy: string; steps: number; stepsCompleted: number; errorMessage?: string; }
export interface FunctionDTO { id: string; name: string; description: string; status: FunctionStatus; runtime: string; appId: string; appName: string; timeout: number; memory: number; lastRun?: string; lastRunStatus?: FunctionRunStatus; createdAt: string; updatedAt: string; }
export interface FunctionRunDTO { id: string; functionId: string; functionName: string; status: FunctionRunStatus; startedAt: string; completedAt?: string; duration: number; triggeredBy: string; inputSize: number; outputSize: number; errorMessage?: string; }
export interface AgentDTO { id: string; name: string; description: string; status: AgentStatus; type: string; model: string; appId: string; appName: string; memory: number; totalConversations: number; lastActive?: string; createdAt: string; updatedAt: string; }
export interface IntegrationDTO { id: string; name: string; type: string; status: IntegrationStatus; category: string; description: string; docs: string; configFields: string[]; enabled: boolean; createdAt: string; updatedAt: string; }
export interface NotificationDTO { id: string; type: NotificationType; title: string; message: string; read: boolean; actionUrl?: string; createdAt: string; }
export interface APIKeyDTO { id: string; name: string; key: string; maskedKey: string; status: APIKeyStatus; permissions: string[]; createdBy: string; lastUsed?: string; expiresAt?: string; createdAt: string; }
export interface OrganizationDTO { id: string; name: string; slug: string; plan: OrganizationPlan; ownerName: string; ownerEmail: string; userCount: number; appCount: number; status: string; createdAt: string; updatedAt: string; }
export interface TeamDTO { id: string; name: string; description: string; organizationId: string; organizationName: string; memberCount: number; appAccess: string[]; createdAt: string; updatedAt: string; }
export interface PlatformMetricDTO { id: string; name: string; value: number; unit: string; trend: 'up' | 'down' | 'stable'; timestamp: string; }
export interface ErrorEntryDTO { id: string; type: string; message: string; source: string; appName: string; severity: 'critical' | 'high' | 'medium' | 'low'; status: 'open' | 'resolved' | 'ignored'; count: number; firstSeen: string; lastSeen: string; assignedTo?: string; }
