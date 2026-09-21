export interface CreateUserRequest { email: string; name: string; role: string; appAccess: string[]; sendInvite: boolean; }
export interface UpdateUserRequest { email?: string; name?: string; role?: string; appAccess?: string[]; status?: string; }
export interface CreateRoleRequest { name: string; description: string; permissions: string[]; appScope: string[]; }
export interface UpdateRoleRequest { name?: string; description?: string; permissions?: string[]; appScope?: string[]; }
export interface UpdateSettingRequest { key: string; value: string; }
export interface CreateConnectorRequest { name: string; type: string; config: Record<string, string>; }
export interface UpdateConnectorRequest { name?: string; config?: Record<string, string>; enabled?: boolean; }
export interface ToggleFeatureFlagRequest { key: string; enabled: boolean; }
export interface AuditLogFilterRequest { action?: string; actorId?: string; targetType?: string; dateFrom?: string; dateTo?: string; search?: string; page?: number; pageSize?: number; }
export interface CreateTeamRequest { name: string; description: string; organizationId: string; appAccess: string[]; }
export interface UpdateTeamRequest { name?: string; description?: string; appAccess?: string[]; }
export interface CreateAPIKeyRequest { name: string; permissions: string[]; expiresInDays?: number; }
export interface UpdateOrganizationRequest { name?: string; plan?: string; status?: string; }
export interface WorkflowActionRequest { action: 'pause' | 'resume' | 'restart' | 'stop'; }
export interface FunctionActionRequest { action: 'restart' | 'stop'; }
export interface AgentActionRequest { action: 'restart' | 'disable' | 'enable'; }
export interface CreateIntegrationRequest { name: string; type: string; category: string; description: string; config: Record<string, string>; }
export interface NotificationFilterRequest { read?: boolean; type?: string; limit?: number; }
export interface PlatformHealthFilterRequest { status?: string; appName?: string; }
