import type { UserStatus, ConnectorType, EventStatus, LogAction, ApplicationStatus, WorkflowStatus, WorkflowRunStatus, FunctionStatus, FunctionRunStatus, AgentStatus, IntegrationStatus, APIKeyStatus, NotificationType, OrganizationPlan } from './dto';

export interface AdminDashboardVM { totalUsers: number; activeUsers: number; totalRoles: number; eventVolume24h: number; failedEvents24h: number; systemHealth: SystemHealthVM[]; recentAlerts: string[]; }
export interface UserListItemVM { id: string; email: string; name: string; role: string; status: UserStatus; lastLogin?: string; }
export interface UserDetailVM { id: string; email: string; name: string; role: string; status: UserStatus; appAccess: string[]; avatar?: string; lastLogin?: string; createdAt: string; updatedAt: string; sessions: SessionVM[]; activity: ActivityVM[]; }
export interface RoleDetailVM { id: string; name: string; description: string; permissions: PermissionTreeNodeVM[]; appScope: string[]; userCount: number; createdAt: string; updatedAt: string; }
export interface PermissionTreeNodeVM { id: string; key: string; label: string; description: string; group: string; checked: boolean; children?: PermissionTreeNodeVM[]; }
export interface AuditLogEntryVM { id: string; action: LogAction; actorName: string; targetLabel: string; details: string; ipAddress: string; timestamp: string; }
export interface ConnectorStatusVM { id: string; name: string; type: ConnectorType; status: string; enabled: boolean; lastTested?: string; }
export interface EventBusHealthVM { totalEvents: number; successRate: number; failedCount: number; retryQueueSize: number; eventsByType: { type: string; count: number; failed: number }[]; }
export interface SystemHealthVM { appName: string; status: 'healthy' | 'degraded' | 'down'; uptime: string; version: string; }
export interface SessionVM { id: string; ipAddress: string; userAgent: string; startedAt: string; lastActivity: string; }
export interface ActivityVM { id: string; action: string; target: string; timestamp: string; }
export interface ApplicationVM { id: string; name: string; key: string; description: string; status: ApplicationStatus; version: string; category: string; owner: string; userCount: number; uptime: string; lastDeployed: string; }
export interface ApplicationDetailVM { id: string; name: string; key: string; description: string; status: ApplicationStatus; version: string; url: string; icon: string; category: string; owner: string; userCount: number; uptime: string; lastDeployed: string; workflows: number; functions: number; agents: number; createdAt: string; updatedAt: string; }
export interface WorkflowVM { id: string; name: string; description: string; status: WorkflowStatus; version: string; appName: string; steps: number; lastRun?: string; lastRunStatus?: WorkflowRunStatus; }
export interface WorkflowRunVM { id: string; workflowName: string; status: WorkflowRunStatus; startedAt: string; completedAt?: string; duration: number; triggeredBy: string; progress: string; }
export interface FunctionVM { id: string; name: string; description: string; status: FunctionStatus; runtime: string; appName: string; timeout: number; memory: number; lastRun?: string; lastRunStatus?: FunctionRunStatus; }
export interface FunctionRunVM { id: string; functionName: string; status: FunctionRunStatus; startedAt: string; completedAt?: string; duration: number; triggeredBy: string; inputSize: number; outputSize: number; }
export interface AgentVM { id: string; name: string; description: string; status: AgentStatus; type: string; model: string; appName: string; totalConversations: number; lastActive?: string; }
export interface AgentDetailVM { id: string; name: string; description: string; status: AgentStatus; type: string; model: string; appName: string; memory: number; totalConversations: number; lastActive?: string; createdAt: string; updatedAt: string; }
export interface IntegrationVM { id: string; name: string; type: string; status: IntegrationStatus; category: string; description: string; enabled: boolean; }
export interface NotificationVM { id: string; type: NotificationType; title: string; message: string; read: boolean; actionUrl?: string; createdAt: string; }
export interface APIKeyVM { id: string; name: string; maskedKey: string; status: APIKeyStatus; permissions: string[]; createdBy: string; lastUsed?: string; expiresAt?: string; }
export interface OrganizationVM { id: string; name: string; slug: string; plan: OrganizationPlan; ownerName: string; userCount: number; appCount: number; status: string; }
export interface TeamVM { id: string; name: string; description: string; organizationName: string; memberCount: number; appAccess: string[]; }
export interface PlatformMetricVM { id: string; name: string; value: number; unit: string; trend: 'up' | 'down' | 'stable'; }
export interface ErrorEntryVM { id: string; type: string; message: string; source: string; appName: string; severity: 'critical' | 'high' | 'medium' | 'low'; status: 'open' | 'resolved' | 'ignored'; count: number; firstSeen: string; lastSeen: string; }
