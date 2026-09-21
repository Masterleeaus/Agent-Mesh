import type { AdminDashboardResponse, UserListResponse, UserDetailResponse, RoleListResponse, RoleDetailResponse, AuditLogResponse, SettingsListResponse, ConnectorListResponse, EventBusMetricsResponse, SessionListResponse, ApplicationListResponse, ApplicationDetailResponse, WorkflowListResponse, WorkflowRunListResponse, FunctionListResponse, FunctionRunListResponse, AgentListResponse, AgentDetailResponse, IntegrationListResponse, NotificationListResponse, APIKeyListResponse, OrganizationListResponse, TeamListResponse, PlatformMetricsResponse, ErrorListResponse } from '../models/api-responses';
import type { CreateUserRequest, UpdateUserRequest, CreateRoleRequest, UpdateRoleRequest, UpdateSettingRequest, CreateConnectorRequest, UpdateConnectorRequest, ToggleFeatureFlagRequest, AuditLogFilterRequest, CreateTeamRequest, CreateAPIKeyRequest, NotificationFilterRequest, PlatformHealthFilterRequest } from '../models/api-requests';
import type { UserDTO, RoleDTO, AuditLogEntryDTO, SystemSettingDTO, ConnectorDTO, FeatureFlagDTO, EventBusMetricDTO, SessionDTO, ApplicationDTO, WorkflowDTO, WorkflowRunDTO, FunctionDTO, FunctionRunDTO, AgentDTO, IntegrationDTO, NotificationDTO, APIKeyDTO, OrganizationDTO, TeamDTO, PlatformMetricDTO, ErrorEntryDTO } from '../models/dto';
import type { AdminDashboardVM, UserDetailVM, RoleDetailVM, EventBusHealthVM, SystemHealthVM, ActivityVM, SessionVM, ApplicationDetailVM, AgentDetailVM } from '../models/view-models';
import { UserStatus, ConnectorType, EventStatus, LogAction, SettingType, ApplicationStatus, WorkflowStatus, WorkflowRunStatus, FunctionStatus, FunctionRunStatus, AgentStatus, IntegrationStatus, APIKeyStatus, NotificationType, OrganizationPlan } from '../models/dto';

function delay(ms = 600): Promise<void> { return new Promise(r => setTimeout(r, ms)); }

function mockDashboard(): AdminDashboardResponse {
  return {
    data: {
      totalUsers: 142, activeUsers: 89, totalRoles: 7, eventVolume24h: 3452, failedEvents24h: 23,
      systemHealth: [
        { appName: 'API Gateway', status: 'healthy', uptime: '14d 7h', version: '2.1.0' },
        { appName: 'Auth Service', status: 'healthy', uptime: '14d 7h', version: '1.8.3' },
        { appName: 'Event Bus', status: 'degraded', uptime: '3d 2h', version: '2.0.1' },
        { appName: 'Database', status: 'healthy', uptime: '30d 12h', version: '15.4' },
        { appName: 'Cache Layer', status: 'healthy', uptime: '14d 7h', version: '6.2' },
      ],
      recentAlerts: ['Event bus retry queue above threshold (142)', 'Auth service response time > 500ms for 3m', 'Certificate renewal pending for API Gateway'],
    },
  };
}

function mockUsers(page = 1, pageSize = 20): UserListResponse {
  const all: UserDTO[] = [
    { id: 'u1', email: 'admin@resqai.com', name: 'Alex Admin', role: 'Super Admin', status: UserStatus.Active, appAccess: ['admin', 'support', 'analytics'], lastLogin: '2026-06-28T14:30:00Z', createdAt: '2025-01-15T08:00:00Z', updatedAt: '2026-06-28T14:30:00Z' },
    { id: 'u2', email: 'jane@resqai.com', name: 'Jane Cooper', role: 'Support Manager', status: UserStatus.Active, appAccess: ['support', 'analytics'], lastLogin: '2026-06-28T10:15:00Z', createdAt: '2025-03-20T09:00:00Z', updatedAt: '2026-06-28T10:15:00Z' },
    { id: 'u3', email: 'bob@resqai.com', name: 'Bob Smith', role: 'Technician', status: UserStatus.Active, appAccess: ['technician'], lastLogin: '2026-06-27T16:45:00Z', createdAt: '2025-06-10T11:00:00Z', updatedAt: '2026-06-27T16:45:00Z' },
    { id: 'u4', email: 'sarah@resqai.com', name: 'Sarah Chen', role: 'Analyst', status: UserStatus.Pending, appAccess: ['analytics'], lastLogin: undefined, createdAt: '2026-06-25T09:00:00Z', updatedAt: '2026-06-25T09:00:00Z' },
    { id: 'u5', email: 'mike@resqai.com', name: 'Mike Johnson', role: 'Technician', status: UserStatus.Suspended, appAccess: ['technician'], lastLogin: '2026-06-20T08:30:00Z', createdAt: '2025-09-05T14:00:00Z', updatedAt: '2026-06-22T11:00:00Z' },
    { id: 'u6', email: 'lisa@resqai.com', name: 'Lisa Wang', role: 'Support Agent', status: UserStatus.Active, appAccess: ['support'], lastLogin: '2026-06-28T12:00:00Z', createdAt: '2026-01-10T10:00:00Z', updatedAt: '2026-06-28T12:00:00Z' },
    { id: 'u7', email: 'tom@resqai.com', name: 'Tom Brown', role: 'Viewer', status: UserStatus.Inactive, appAccess: ['analytics'], lastLogin: '2026-05-15T09:00:00Z', createdAt: '2025-11-01T08:00:00Z', updatedAt: '2026-05-15T09:00:00Z' },
    { id: 'u8', email: 'emma@resqai.com', name: 'Emma Davis', role: 'Super Admin', status: UserStatus.Active, appAccess: ['admin', 'support', 'analytics', 'crm'], lastLogin: '2026-06-28T09:30:00Z', createdAt: '2025-02-28T12:00:00Z', updatedAt: '2026-06-28T09:30:00Z' },
  ];
  const total = all.length;
  const start = (page - 1) * pageSize;
  const data = all.slice(start, start + pageSize);
  return { data: data as UserDTO[], total, page, pageSize };
}

function mockUserDetail(id: string): UserDetailResponse | null {
  if (id === 'u1') return {
    data: {
      id: 'u1', email: 'admin@resqai.com', name: 'Alex Admin', role: 'Super Admin', status: UserStatus.Active,
      appAccess: ['admin', 'support', 'analytics'], lastLogin: '2026-06-28T14:30:00Z', createdAt: '2025-01-15T08:00:00Z', updatedAt: '2026-06-28T14:30:00Z',
      sessions: [
        { id: 's1', ipAddress: '192.168.1.100', userAgent: 'Mozilla/5.0 Chrome/120', startedAt: '2026-06-28T14:30:00Z', lastActivity: '2026-06-28T15:00:00Z' },
        { id: 's2', ipAddress: '10.0.0.50', userAgent: 'Mozilla/5.0 Firefox/121', startedAt: '2026-06-27T09:00:00Z', lastActivity: '2026-06-27T17:30:00Z' },
      ],
      activity: [
        { id: 'a1', action: 'Login', target: 'Admin Center', timestamp: '2026-06-28T14:30:00Z' },
        { id: 'a2', action: 'Update', target: 'User bob@resqai.com', timestamp: '2026-06-27T16:00:00Z' },
        { id: 'a3', action: 'Config Change', target: 'System Settings', timestamp: '2026-06-27T14:30:00Z' },
      ],
    } as UserDetailVM,
  };
  return null;
}

function mockRoles(): RoleListResponse {
  return {
    total: 7, data: [
      { id: 'r1', name: 'Super Admin', description: 'Full system access', permissions: ['admin:*', 'support:*', 'analytics:*'], appScope: ['admin', 'support', 'analytics', 'crm', 'technician'], userCount: 2, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
      { id: 'r2', name: 'Support Manager', description: 'Manage support team and tickets', permissions: ['support:tickets:*', 'support:team:read', 'analytics:dashboard:read'], appScope: ['support', 'analytics'], userCount: 1, createdAt: '2025-01-15T00:00:00Z', updatedAt: '2026-05-20T00:00:00Z' },
      { id: 'r3', name: 'Support Agent', description: 'Handle support tickets', permissions: ['support:tickets:read', 'support:tickets:write'], appScope: ['support'], userCount: 5, createdAt: '2025-01-15T00:00:00Z', updatedAt: '2026-04-10T00:00:00Z' },
      { id: 'r4', name: 'Technician', description: 'Field service technician', permissions: ['technician:tasks:read', 'technician:tasks:write'], appScope: ['technician'], userCount: 12, createdAt: '2025-02-01T00:00:00Z', updatedAt: '2026-03-15T00:00:00Z' },
      { id: 'r5', name: 'Analyst', description: 'View analytics dashboards', permissions: ['analytics:dashboard:read', 'analytics:reports:read'], appScope: ['analytics'], userCount: 3, createdAt: '2025-03-01T00:00:00Z', updatedAt: '2026-02-20T00:00:00Z' },
      { id: 'r6', name: 'Viewer', description: 'Read-only access', permissions: ['admin:dashboard:read'], appScope: ['admin'], userCount: 1, createdAt: '2025-04-01T00:00:00Z', updatedAt: '2026-01-10T00:00:00Z' },
    ] as RoleDTO[],
  };
}

function mockRoleDetail(id: string): RoleDetailResponse | null {
  if (id === 'r1') return {
    data: {
      id: 'r1', name: 'Super Admin', description: 'Full system access', appScope: ['admin', 'support', 'analytics', 'crm', 'technician'], userCount: 2, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z',
      permissions: [
        { id: 'p1', key: 'admin:*', label: 'Admin Center', description: 'Full admin access', group: 'admin', checked: true, children: [
          { id: 'p1a', key: 'admin:dashboard:read', label: 'View Dashboard', description: '', group: 'admin', checked: true },
          { id: 'p1b', key: 'admin:users:*', label: 'Manage Users', description: '', group: 'admin', checked: true },
          { id: 'p1c', key: 'admin:roles:*', label: 'Manage Roles', description: '', group: 'admin', checked: true },
        ] },
        { id: 'p2', key: 'support:*', label: 'Support Center', description: 'Full support access', group: 'support', checked: true },
        { id: 'p3', key: 'analytics:*', label: 'Analytics Center', description: 'Full analytics access', group: 'analytics', checked: true },
      ],
    },
  };
  return null;
}

function mockAuditLog(filter?: AuditLogFilterRequest, page = 1, pageSize = 20): AuditLogResponse {
  const entries: AuditLogEntryDTO[] = [
    { id: 'a1', action: LogAction.Login, actorId: 'u1', actorName: 'Alex Admin', targetType: 'session', targetId: 's3', targetLabel: 'Admin Login', details: 'Successful login from 192.168.1.100', ipAddress: '192.168.1.100', timestamp: '2026-06-28T14:30:00Z' },
    { id: 'a2', action: LogAction.Create, actorId: 'u1', actorName: 'Alex Admin', targetType: 'user', targetId: 'u4', targetLabel: 'Sarah Chen', details: 'Created user account', ipAddress: '192.168.1.100', timestamp: '2026-06-25T09:00:00Z' },
    { id: 'a3', action: LogAction.Update, actorId: 'u1', actorName: 'Alex Admin', targetType: 'user', targetId: 'u3', targetLabel: 'Bob Smith', details: 'Updated role from Viewer to Technician', ipAddress: '192.168.1.100', timestamp: '2026-06-24T11:30:00Z' },
    { id: 'a4', action: LogAction.ConfigChange, actorId: 'u1', actorName: 'Alex Admin', targetType: 'config', targetId: 'c1', targetLabel: 'Session Timeout', details: 'Changed from 30m to 60m', ipAddress: '10.0.0.1', timestamp: '2026-06-23T16:00:00Z' },
    { id: 'a5', action: LogAction.Delete, actorId: 'u8', actorName: 'Emma Davis', targetType: 'user', targetId: 'u9', targetLabel: 'Deleted User', details: 'Deleted inactive user account', ipAddress: '192.168.1.50', timestamp: '2026-06-22T10:15:00Z' },
    { id: 'a6', action: LogAction.PermissionChange, actorId: 'u1', actorName: 'Alex Admin', targetType: 'role', targetId: 'r3', targetLabel: 'Support Agent', details: 'Added support:tickets:delete permission', ipAddress: '192.168.1.100', timestamp: '2026-06-21T14:00:00Z' },
    { id: 'a7', action: LogAction.Export, actorId: 'u4', actorName: 'Sarah Chen', targetType: 'report', targetId: 'rpt1', targetLabel: 'Q2 Analytics Report', details: 'Exported report as PDF', ipAddress: '10.0.0.100', timestamp: '2026-06-20T09:45:00Z' },
    { id: 'a8', action: LogAction.Logout, actorId: 'u2', actorName: 'Jane Cooper', targetType: 'session', targetId: 's4', targetLabel: 'Session End', details: 'Manual logout', ipAddress: '192.168.1.200', timestamp: '2026-06-19T17:30:00Z' },
  ];
  const filtered = filter?.search ? entries.filter(e => e.actorName.toLowerCase().includes(filter.search!.toLowerCase()) || e.targetLabel.toLowerCase().includes(filter.search!.toLowerCase())) : entries;
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);
  return { data, total, page, pageSize };
}

function mockSettings(): SettingsListResponse {
  return {
    total: 6, data: [
      { id: 's1', key: 'session.timeout', value: '60', type: SettingType.Number, label: 'Session Timeout', description: 'User session timeout in minutes', category: 'security', isSecret: false, updatedAt: '2026-06-23T16:00:00Z', updatedBy: 'Alex Admin' },
      { id: 's2', key: 'max.login.attempts', value: '5', type: SettingType.Number, label: 'Max Login Attempts', description: 'Maximum failed login attempts before lockout', category: 'security', isSecret: false, updatedAt: '2026-06-01T00:00:00Z', updatedBy: 'Alex Admin' },
      { id: 's3', key: 'maintenance.mode', value: 'false', type: SettingType.Boolean, label: 'Maintenance Mode', description: 'Enable maintenance mode', category: 'system', isSecret: false, updatedAt: '2026-05-15T00:00:00Z', updatedBy: 'Alex Admin' },
      { id: 's4', key: 'analytics.retention.days', value: '90', type: SettingType.Number, label: 'Analytics Retention', description: 'Days to retain analytics data', category: 'analytics', isSecret: false, updatedAt: '2026-04-10T00:00:00Z', updatedBy: 'Emma Davis' },
      { id: 's5', key: 'smtp.host', value: 'smtp.resqai.com', type: SettingType.String, label: 'SMTP Host', description: 'Outgoing mail server', category: 'email', isSecret: false, updatedAt: '2026-03-01T00:00:00Z', updatedBy: 'Alex Admin' },
      { id: 's6', key: 'api.rate.limit', value: '1000', type: SettingType.Number, label: 'API Rate Limit', description: 'Requests per minute per API key', category: 'api', isSecret: false, updatedAt: '2026-06-15T00:00:00Z', updatedBy: 'Emma Davis' },
    ] as SystemSettingDTO[],
  };
}

function mockConnectors(): ConnectorListResponse {
  return {
    total: 4, data: [
      { id: 'c1', name: 'Slack Notifications', type: ConnectorType.Slack, status: 'connected', config: { webhook: 'https://hooks.slack.com/xxx' }, lastTested: '2026-06-28T12:00:00Z', enabled: true, createdAt: '2025-03-01T00:00:00Z', updatedAt: '2026-06-28T12:00:00Z' },
      { id: 'c2', name: 'Twilio SMS', type: ConnectorType.SMS, status: 'error', config: { phone: '+15551234567', accountSid: 'AC***' }, lastTested: '2026-06-27T09:00:00Z', lastError: 'Rate limit exceeded', enabled: true, createdAt: '2025-04-15T00:00:00Z', updatedAt: '2026-06-27T09:00:00Z' },
      { id: 'c3', name: 'SendGrid Email', type: ConnectorType.Email, status: 'connected', config: { apiKey: 'SG.***', fromAddress: 'noreply@resqai.com' }, lastTested: '2026-06-28T08:00:00Z', enabled: true, createdAt: '2025-01-20T00:00:00Z', updatedAt: '2026-06-28T08:00:00Z' },
      { id: 'c4', name: 'Custom Webhook', type: ConnectorType.Webhook, status: 'disconnected', config: { url: 'https://example.com/webhook', headers: '{}' }, lastTested: undefined, enabled: false, createdAt: '2026-02-10T00:00:00Z', updatedAt: '2026-02-10T00:00:00Z' },
    ] as ConnectorDTO[],
  };
}

function mockEventBusMetrics(): EventBusMetricsResponse {
  return {
    data: { totalEvents: 3452, successRate: 99.3, failedCount: 23, retryQueueSize: 142, eventsByType: [{ type: 'user.created', count: 45, failed: 0 }, { type: 'user.role.changed', count: 128, failed: 2 }, { type: 'system.config.changed', count: 67, failed: 0 }, { type: 'ticket.created', count: 2145, failed: 12 }, { type: 'ticket.updated', count: 1067, failed: 9 }] },
    recentEvents: [
      { id: 'e1', eventType: 'ticket.created', status: EventStatus.Success, source: 'support-center', timestamp: '2026-06-28T14:35:00Z', payloadSize: 2048, retryCount: 0 },
      { id: 'e2', eventType: 'user.role.changed', status: EventStatus.Failed, source: 'admin-center', timestamp: '2026-06-28T14:30:00Z', payloadSize: 512, retryCount: 3, errorMessage: 'Timeout processing role change' },
      { id: 'e3', eventType: 'ticket.updated', status: EventStatus.Retrying, source: 'support-center', timestamp: '2026-06-28T14:28:00Z', payloadSize: 1024, retryCount: 5, errorMessage: 'Consumer not available' },
      { id: 'e4', eventType: 'system.config.changed', status: EventStatus.Success, source: 'admin-center', timestamp: '2026-06-28T14:00:00Z', payloadSize: 256, retryCount: 0 },
    ] as EventBusMetricDTO[],
  };
}

function mockSessions(): SessionListResponse {
  return {
    total: 3, data: [
      { id: 's1', userId: 'u1', userName: 'Alex Admin', ipAddress: '192.168.1.100', userAgent: 'Mozilla/5.0 Chrome/120', startedAt: '2026-06-28T14:30:00Z', lastActivity: '2026-06-28T15:00:00Z', expiresAt: '2026-06-28T16:30:00Z' },
      { id: 's2', userId: 'u2', userName: 'Jane Cooper', ipAddress: '10.0.0.50', userAgent: 'Mozilla/5.0 Firefox/121', startedAt: '2026-06-28T10:15:00Z', lastActivity: '2026-06-28T14:45:00Z', expiresAt: '2026-06-28T16:15:00Z' },
      { id: 's3', userId: 'u8', userName: 'Emma Davis', ipAddress: '192.168.1.50', userAgent: 'Mozilla/5.0 Safari/17', startedAt: '2026-06-28T09:30:00Z', lastActivity: '2026-06-28T15:00:00Z', expiresAt: '2026-06-28T16:30:00Z' },
    ] as SessionDTO[],
  };
}

function mockApplications(): ApplicationListResponse {
  return { total: 9, data: [
    { id: 'a1', name: 'Support Center', key: 'support-center', description: 'Customer support ticket management', status: ApplicationStatus.Active, version: '2.1.0', url: '/support', icon: '🎫', category: 'Operations', owner: 'Alex Admin', userCount: 24, uptime: '99.9%', lastDeployed: '2026-06-25T10:00:00Z', createdAt: '2025-01-15T00:00:00Z', updatedAt: '2026-06-25T10:00:00Z' },
    { id: 'a2', name: 'Analytics Center', key: 'analytics-center', description: 'Business intelligence and reporting', status: ApplicationStatus.Active, version: '2.0.0', url: '/analytics', icon: '📊', category: 'Intelligence', owner: 'Emma Davis', userCount: 18, uptime: '99.8%', lastDeployed: '2026-06-20T08:00:00Z', createdAt: '2025-02-01T00:00:00Z', updatedAt: '2026-06-20T08:00:00Z' },
    { id: 'a3', name: 'Admin Center', key: 'admin-center', description: 'Platform administration console', status: ApplicationStatus.Active, version: '2.0.0', url: '/admin', icon: '🛡️', category: 'Administration', owner: 'Alex Admin', userCount: 6, uptime: '99.9%', lastDeployed: '2026-06-28T12:00:00Z', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2026-06-28T12:00:00Z' },
    { id: 'a4', name: 'CRM Center', key: 'crm-center', description: 'Customer relationship management', status: ApplicationStatus.Active, version: '2.0.0', url: '/crm', icon: '🤝', category: 'Sales', owner: 'Jane Cooper', userCount: 12, uptime: '99.7%', lastDeployed: '2026-06-18T14:00:00Z', createdAt: '2025-03-01T00:00:00Z', updatedAt: '2026-06-18T14:00:00Z' },
    { id: 'a5', name: 'Technician Portal', key: 'technician-portal', description: 'Field service technician mobile app', status: ApplicationStatus.Active, version: '2.1.0', url: '/technician', icon: '🔧', category: 'Operations', owner: 'Bob Smith', userCount: 35, uptime: '99.6%', lastDeployed: '2026-06-22T09:00:00Z', createdAt: '2025-04-01T00:00:00Z', updatedAt: '2026-06-22T09:00:00Z' },
    { id: 'a6', name: 'Operations Center', key: 'operations-center', description: 'Operational dashboard and management', status: ApplicationStatus.Active, version: '2.0.0', url: '/ops', icon: '⚙️', category: 'Operations', owner: 'Mike Johnson', userCount: 15, uptime: '99.5%', lastDeployed: '2026-06-15T11:00:00Z', createdAt: '2025-02-15T00:00:00Z', updatedAt: '2026-06-15T11:00:00Z' },
    { id: 'a7', name: 'Customer Portal', key: 'customer-portal', description: 'Self-service customer portal', status: ApplicationStatus.Maintenance, version: '2.0.0', url: '/customer', icon: '🌐', category: 'Customer', owner: 'Lisa Wang', userCount: 0, uptime: '97.2%', lastDeployed: '2026-06-10T08:00:00Z', createdAt: '2025-05-01T00:00:00Z', updatedAt: '2026-06-10T08:00:00Z' },
    { id: 'a8', name: 'Resolution Center', key: 'resolution-center', description: 'Dispute and resolution management', status: ApplicationStatus.Degraded, version: '1.9.0', url: '/resolution', icon: '⚖️', category: 'Operations', owner: 'Sarah Chen', userCount: 8, uptime: '94.3%', lastDeployed: '2026-05-28T10:00:00Z', createdAt: '2025-06-01T00:00:00Z', updatedAt: '2026-05-28T10:00:00Z' },
    { id: 'a9', name: 'Appointment Center', key: 'appointment-center', description: 'Scheduling and appointment management', status: ApplicationStatus.Active, version: '2.0.0', url: '/appointment', icon: '📅', category: 'Operations', owner: 'Tom Brown', userCount: 20, uptime: '99.8%', lastDeployed: '2026-06-12T14:00:00Z', createdAt: '2025-04-15T00:00:00Z', updatedAt: '2026-06-12T14:00:00Z' },
  ] as ApplicationDTO[] };
}

function mockApplicationDetail(id: string): ApplicationDetailResponse | null {
  const apps = mockApplications().data;
  const app = apps.find(a => a.id === id);
  if (!app) return null;
  return { data: { ...app, workflows: 12, functions: 8, agents: 3, createdAt: app.createdAt, updatedAt: app.updatedAt } as ApplicationDetailVM };
}

function mockWorkflows(): WorkflowListResponse {
  return { total: 8, data: [
    { id: 'w1', name: 'Ticket Escalation', description: 'Auto-escalate tickets based on SLA', status: WorkflowStatus.Active, version: '1.2.0', appId: 'a1', appName: 'Support Center', steps: 5, lastRun: '2026-06-28T14:30:00Z', lastRunStatus: WorkflowRunStatus.Completed, createdAt: '2025-03-10T00:00:00Z', updatedAt: '2026-06-28T00:00:00Z' },
    { id: 'w2', name: 'New User Onboarding', description: 'Provision accounts and send welcome', status: WorkflowStatus.Active, version: '1.0.0', appId: 'a3', appName: 'Admin Center', steps: 7, lastRun: '2026-06-28T12:00:00Z', lastRunStatus: WorkflowRunStatus.Completed, createdAt: '2025-01-20T00:00:00Z', updatedAt: '2026-06-28T00:00:00Z' },
    { id: 'w3', name: 'SLA Breach Notification', description: 'Notify stakeholders on SLA breach', status: WorkflowStatus.Active, version: '1.1.0', appId: 'a1', appName: 'Support Center', steps: 3, lastRun: '2026-06-28T14:25:00Z', lastRunStatus: WorkflowRunStatus.Running, createdAt: '2025-03-15T00:00:00Z', updatedAt: '2026-06-28T00:00:00Z' },
    { id: 'w4', name: 'Weekly Analytics Report', description: 'Generate and distribute weekly reports', status: WorkflowStatus.Paused, version: '2.0.0', appId: 'a2', appName: 'Analytics Center', steps: 4, lastRun: '2026-06-22T00:00:00Z', lastRunStatus: WorkflowRunStatus.Completed, createdAt: '2025-04-01T00:00:00Z', updatedAt: '2026-06-22T00:00:00Z' },
    { id: 'w5', name: 'Customer Feedback Loop', description: 'Process and route customer feedback', status: WorkflowStatus.Active, version: '1.0.0', appId: 'a4', appName: 'CRM Center', steps: 4, lastRun: '2026-06-28T10:00:00Z', lastRunStatus: WorkflowRunStatus.Failed, createdAt: '2025-05-10T00:00:00Z', updatedAt: '2026-06-28T00:00:00Z' },
    { id: 'w6', name: 'Technician Route Optimization', description: 'Optimize daily technician routes', status: WorkflowStatus.Draft, version: '0.5.0', appId: 'a5', appName: 'Technician Portal', steps: 6, createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
    { id: 'w7', name: 'Invoice Generation', description: 'Generate and send monthly invoices', status: WorkflowStatus.Active, version: '1.0.0', appId: 'a6', appName: 'Operations Center', steps: 8, lastRun: '2026-06-28T00:00:00Z', lastRunStatus: WorkflowRunStatus.Completed, createdAt: '2025-06-15T00:00:00Z', updatedAt: '2026-06-28T00:00:00Z' },
    { id: 'w8', name: 'Dispute Resolution', description: 'Process customer disputes', status: WorkflowStatus.Active, version: '1.0.0', appId: 'a8', appName: 'Resolution Center', steps: 9, lastRun: '2026-06-28T13:00:00Z', lastRunStatus: WorkflowRunStatus.Failed, createdAt: '2025-07-01T00:00:00Z', updatedAt: '2026-06-28T00:00:00Z' },
  ] as WorkflowDTO[] };
}

function mockWorkflowRuns(workflowId?: string): WorkflowRunListResponse {
  const all: WorkflowRunDTO[] = [
    { id: 'wr1', workflowId: 'w1', workflowName: 'Ticket Escalation', status: WorkflowRunStatus.Completed, startedAt: '2026-06-28T14:30:00Z', completedAt: '2026-06-28T14:31:15Z', duration: 75000, triggeredBy: 'SLA Monitor', steps: 5, stepsCompleted: 5 },
    { id: 'wr2', workflowId: 'w3', workflowName: 'SLA Breach Notification', status: WorkflowRunStatus.Running, startedAt: '2026-06-28T14:25:00Z', duration: 300000, triggeredBy: 'SLA Monitor', steps: 3, stepsCompleted: 1 },
    { id: 'wr3', workflowId: 'w5', workflowName: 'Customer Feedback Loop', status: WorkflowRunStatus.Failed, startedAt: '2026-06-28T10:00:00Z', completedAt: '2026-06-28T10:02:30Z', duration: 150000, triggeredBy: 'Feedback Handler', steps: 4, stepsCompleted: 2, errorMessage: 'Timeout connecting to CRM API' },
    { id: 'wr4', workflowId: 'w2', workflowName: 'New User Onboarding', status: WorkflowRunStatus.Completed, startedAt: '2026-06-28T12:00:00Z', completedAt: '2026-06-28T12:05:00Z', duration: 300000, triggeredBy: 'Admin: Alex Admin', steps: 7, stepsCompleted: 7 },
    { id: 'wr5', workflowId: 'w7', workflowName: 'Invoice Generation', status: WorkflowRunStatus.Completed, startedAt: '2026-06-28T00:00:00Z', completedAt: '2026-06-28T00:15:00Z', duration: 900000, triggeredBy: 'Scheduler', steps: 8, stepsCompleted: 8 },
    { id: 'wr6', workflowId: 'w8', workflowName: 'Dispute Resolution', status: WorkflowRunStatus.Failed, startedAt: '2026-06-28T13:00:00Z', completedAt: '2026-06-28T13:01:00Z', duration: 60000, triggeredBy: 'Customer Portal', steps: 9, stepsCompleted: 1, errorMessage: 'Missing required evidence document' },
    { id: 'wr7', workflowId: 'w1', workflowName: 'Ticket Escalation', status: WorkflowRunStatus.Completed, startedAt: '2026-06-27T14:30:00Z', completedAt: '2026-06-27T14:31:00Z', duration: 60000, triggeredBy: 'SLA Monitor', steps: 5, stepsCompleted: 5 },
    { id: 'wr8', workflowId: 'w4', workflowName: 'Weekly Analytics Report', status: WorkflowRunStatus.Cancelled, startedAt: '2026-06-22T00:00:00Z', completedAt: '2026-06-22T00:05:00Z', duration: 300000, triggeredBy: 'Scheduler', steps: 4, stepsCompleted: 2 },
  ];
  const filtered = workflowId ? all.filter(r => r.workflowId === workflowId) : all;
  return { total: filtered.length, data: filtered };
}

function mockFunctions(): FunctionListResponse {
  return { total: 6, data: [
    { id: 'f1', name: 'classifyTicket', description: 'Classify incoming tickets by category', status: FunctionStatus.Active, runtime: 'node18', appId: 'a1', appName: 'Support Center', timeout: 30, memory: 256, lastRun: '2026-06-28T14:35:00Z', lastRunStatus: FunctionRunStatus.Completed, createdAt: '2025-03-10T00:00:00Z', updatedAt: '2026-06-28T00:00:00Z' },
    { id: 'f2', name: 'sendEmailNotification', description: 'Send transactional email notifications', status: FunctionStatus.Active, runtime: 'node18', appId: 'a3', appName: 'Admin Center', timeout: 15, memory: 128, lastRun: '2026-06-28T14:30:00Z', lastRunStatus: FunctionRunStatus.Completed, createdAt: '2025-01-20T00:00:00Z', updatedAt: '2026-06-28T00:00:00Z' },
    { id: 'f3', name: 'generateReport', description: 'Generate analytics reports', status: FunctionStatus.Active, runtime: 'python3.11', appId: 'a2', appName: 'Analytics Center', timeout: 120, memory: 1024, lastRun: '2026-06-28T12:00:00Z', lastRunStatus: FunctionRunStatus.Completed, createdAt: '2025-04-01T00:00:00Z', updatedAt: '2026-06-28T00:00:00Z' },
    { id: 'f4', name: 'syncCRMData', description: 'Sync customer data to CRM', status: FunctionStatus.Error, runtime: 'node18', appId: 'a4', appName: 'CRM Center', timeout: 60, memory: 512, lastRun: '2026-06-28T10:00:00Z', lastRunStatus: FunctionRunStatus.Failed, createdAt: '2025-05-10T00:00:00Z', updatedAt: '2026-06-28T00:00:00Z' },
    { id: 'f5', name: 'optimizeRoutes', description: 'Optimize technician daily routes', status: FunctionStatus.Inactive, runtime: 'python3.11', appId: 'a5', appName: 'Technician Portal', timeout: 300, memory: 2048, createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
    { id: 'f6', name: 'processDispute', description: 'Process dispute resolution steps', status: FunctionStatus.Active, runtime: 'node18', appId: 'a8', appName: 'Resolution Center', timeout: 45, memory: 256, lastRun: '2026-06-28T13:00:00Z', lastRunStatus: FunctionRunStatus.Failed, createdAt: '2025-07-01T00:00:00Z', updatedAt: '2026-06-28T00:00:00Z' },
  ] as FunctionDTO[] };
}

function mockFunctionRuns(functionId?: string): FunctionRunListResponse {
  const all: FunctionRunDTO[] = [
    { id: 'fr1', functionId: 'f1', functionName: 'classifyTicket', status: FunctionRunStatus.Completed, startedAt: '2026-06-28T14:35:00Z', completedAt: '2026-06-28T14:35:02Z', duration: 2000, triggeredBy: 'Event: ticket.created', inputSize: 2048, outputSize: 512 },
    { id: 'fr2', functionId: 'f2', functionName: 'sendEmailNotification', status: FunctionRunStatus.Completed, startedAt: '2026-06-28T14:30:00Z', completedAt: '2026-06-28T14:30:01Z', duration: 1000, triggeredBy: 'Workflow: New User Onboarding', inputSize: 1024, outputSize: 128 },
    { id: 'fr3', functionId: 'f4', functionName: 'syncCRMData', status: FunctionRunStatus.Failed, startedAt: '2026-06-28T10:00:00Z', completedAt: '2026-06-28T10:01:00Z', duration: 60000, triggeredBy: 'Schedule: hourly', inputSize: 65536, outputSize: 0, errorMessage: 'Connection timeout to CRM API' },
    { id: 'fr4', functionId: 'f3', functionName: 'generateReport', status: FunctionRunStatus.Completed, startedAt: '2026-06-28T12:00:00Z', completedAt: '2026-06-28T12:02:00Z', duration: 120000, triggeredBy: 'Workflow: Weekly Analytics Report', inputSize: 1048576, outputSize: 524288 },
    { id: 'fr5', functionId: 'f6', functionName: 'processDispute', status: FunctionRunStatus.Failed, startedAt: '2026-06-28T13:00:00Z', completedAt: '2026-06-28T13:00:30Z', duration: 30000, triggeredBy: 'Workflow: Dispute Resolution', inputSize: 8192, outputSize: 0, errorMessage: 'Evidence document not found' },
    { id: 'fr6', functionId: 'f1', functionName: 'classifyTicket', status: FunctionRunStatus.TimedOut, startedAt: '2026-06-28T12:00:00Z', completedAt: '2026-06-28T12:00:31Z', duration: 31000, triggeredBy: 'Event: ticket.created', inputSize: 4096, outputSize: 0, errorMessage: 'Execution time exceeded 30s limit' },
  ];
  const filtered = functionId ? all.filter(r => r.functionId === functionId) : all;
  return { total: filtered.length, data: filtered };
}

function mockAgents(): AgentListResponse {
  return { total: 5, data: [
    { id: 'ag1', name: 'Ticket Classifier', description: 'AI agent that classifies and routes support tickets', status: AgentStatus.Online, type: 'classifier', model: 'gpt-4o', appId: 'a1', appName: 'Support Center', memory: 512, totalConversations: 12450, lastActive: '2026-06-28T14:35:00Z', createdAt: '2025-03-10T00:00:00Z', updatedAt: '2026-06-28T00:00:00Z' },
    { id: 'ag2', name: 'Sentiment Analyzer', description: 'Analyzes customer sentiment from feedback and messages', status: AgentStatus.Busy, type: 'analyzer', model: 'gpt-4o-mini', appId: 'a4', appName: 'CRM Center', memory: 256, totalConversations: 8920, lastActive: '2026-06-28T14:30:00Z', createdAt: '2025-04-15T00:00:00Z', updatedAt: '2026-06-28T00:00:00Z' },
    { id: 'ag3', name: 'Route Optimizer', description: 'Optimizes technician routes based on real-time conditions', status: AgentStatus.Offline, type: 'optimizer', model: 'custom-rl', appId: 'a5', appName: 'Technician Portal', memory: 2048, totalConversations: 0, lastActive: '2026-06-25T00:00:00Z', createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-25T00:00:00Z' },
    { id: 'ag4', name: 'Response Generator', description: 'Generates draft replies for support tickets', status: AgentStatus.Online, type: 'generator', model: 'gpt-4o', appId: 'a1', appName: 'Support Center', memory: 1024, totalConversations: 3450, lastActive: '2026-06-28T14:20:00Z', createdAt: '2025-05-01T00:00:00Z', updatedAt: '2026-06-28T00:00:00Z' },
    { id: 'ag5', name: 'Anomaly Detector', description: 'Detects unusual patterns in system metrics', status: AgentStatus.Error, type: 'detector', model: 'isolation-forest', appId: 'a2', appName: 'Analytics Center', memory: 1024, totalConversations: 0, lastActive: '2026-06-27T16:00:00Z', createdAt: '2025-06-01T00:00:00Z', updatedAt: '2026-06-27T16:00:00Z' },
  ] as AgentDTO[] };
}

function mockAgentDetail(id: string): AgentDetailResponse | null {
  const agents = mockAgents().data;
  const agent = agents.find(a => a.id === id);
  if (!agent) return null;
  return { data: agent as AgentDetailVM };
}

function mockIntegrations(): IntegrationListResponse {
  return { total: 6, data: [
    { id: 'i1', name: 'Slack', type: 'messaging', status: IntegrationStatus.Connected, category: 'Communication', description: 'Send notifications and alerts to Slack channels', docs: 'https://api.slack.com', configFields: ['webhook_url', 'channel', 'bot_token'], enabled: true, createdAt: '2025-03-01T00:00:00Z', updatedAt: '2026-06-28T00:00:00Z' },
    { id: 'i2', name: 'Twilio SMS', type: 'sms', status: IntegrationStatus.Error, category: 'Communication', description: 'Send SMS notifications and alerts', docs: 'https://www.twilio.com/docs', configFields: ['account_sid', 'auth_token', 'from_number'], enabled: true, createdAt: '2025-04-15T00:00:00Z', updatedAt: '2026-06-27T00:00:00Z' },
    { id: 'i3', name: 'SendGrid Email', type: 'email', status: IntegrationStatus.Connected, category: 'Communication', description: 'Transactional email delivery service', docs: 'https://docs.sendgrid.com', configFields: ['api_key', 'from_address', 'template_id'], enabled: true, createdAt: '2025-01-20T00:00:00Z', updatedAt: '2026-06-28T00:00:00Z' },
    { id: 'i4', name: 'Salesforce CRM', type: 'crm', status: IntegrationStatus.Connected, category: 'CRM', description: 'Sync customer data with Salesforce', docs: 'https://developer.salesforce.com/docs', configFields: ['client_id', 'client_secret', 'instance_url'], enabled: true, createdAt: '2025-05-10T00:00:00Z', updatedAt: '2026-06-28T00:00:00Z' },
    { id: 'i5', name: 'HubSpot', type: 'crm', status: IntegrationStatus.Disconnected, category: 'CRM', description: 'Bidirectional sync with HubSpot CRM', docs: 'https://developers.hubspot.com', configFields: ['api_key', 'portal_id'], enabled: false, createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z' },
    { id: 'i6', name: 'Jira', type: 'project-management', status: IntegrationStatus.Pending, category: 'Development', description: 'Create and update Jira issues from support tickets', docs: 'https://developer.atlassian.com/cloud/jira/platform', configFields: ['base_url', 'email', 'api_token', 'project_key'], enabled: false, createdAt: '2026-06-20T00:00:00Z', updatedAt: '2026-06-20T00:00:00Z' },
  ] as IntegrationDTO[] };
}

function mockNotifications(): NotificationListResponse {
  return { total: 8, data: [
    { id: 'n1', type: NotificationType.Warning, title: 'Event Bus Retry Queue', message: 'Retry queue has 142 pending events. Review failed events.', read: false, actionUrl: '#/events', createdAt: '2026-06-28T14:00:00Z' },
    { id: 'n2', type: NotificationType.Error, title: 'Auth Service Slow', message: 'Auth service response time exceeded 500ms for 3 minutes.', read: false, createdAt: '2026-06-28T13:45:00Z' },
    { id: 'n3', type: NotificationType.Info, title: 'Certificate Expiry', message: 'API Gateway SSL certificate expires in 7 days.', read: false, createdAt: '2026-06-28T09:00:00Z' },
    { id: 'n4', type: NotificationType.Success, title: 'Backup Complete', message: 'Daily database backup completed successfully.', read: true, createdAt: '2026-06-28T03:00:00Z' },
    { id: 'n5', type: NotificationType.Warning, title: 'Storage Warning', message: 'Database storage is at 78% capacity. Plan upgrade soon.', read: true, createdAt: '2026-06-27T12:00:00Z' },
    { id: 'n6', type: NotificationType.Info, title: 'New Version Available', message: 'Support Center v2.2.0 is ready for deployment.', read: false, actionUrl: '#/applications/a1', createdAt: '2026-06-27T10:00:00Z' },
    { id: 'n7', type: NotificationType.Error, title: 'CRM Sync Failed', message: 'CRM data sync failed due to connection timeout.', read: false, actionUrl: '#/functions/f4', createdAt: '2026-06-28T10:01:00Z' },
    { id: 'n8', type: NotificationType.Info, title: 'User Invitation', message: 'Sarah Chen has accepted their invitation.', read: true, createdAt: '2026-06-25T14:00:00Z' },
  ] as NotificationDTO[] };
}

function mockAPIKeys(): APIKeyListResponse {
  return { total: 5, data: [
    { id: 'k1', name: 'Production API Key', key: 'resq_prod_xxxxxxxxxxxx', maskedKey: 'resq_prod_****', status: APIKeyStatus.Active, permissions: ['read', 'write', 'admin'], createdBy: 'Alex Admin', lastUsed: '2026-06-28T14:30:00Z', expiresAt: '2027-06-28T00:00:00Z', createdAt: '2025-06-28T00:00:00Z' },
    { id: 'k2', name: 'Staging API Key', key: 'resq_staging_xxxxxxxx', maskedKey: 'resq_staging_****', status: APIKeyStatus.Active, permissions: ['read', 'write'], createdBy: 'Alex Admin', lastUsed: '2026-06-28T12:00:00Z', expiresAt: '2027-06-28T00:00:00Z', createdAt: '2025-06-28T00:00:00Z' },
    { id: 'k3', name: 'Analytics Service Key', key: 'resq_analytics_xxxx', maskedKey: 'resq_analytics_****', status: APIKeyStatus.Active, permissions: ['read'], createdBy: 'Emma Davis', lastUsed: '2026-06-28T10:00:00Z', createdAt: '2026-01-15T00:00:00Z' },
    { id: 'k4', name: 'Legacy Integration Key', key: 'resq_legacy_xxxxxxxx', maskedKey: 'resq_legacy_****', status: APIKeyStatus.Revoked, permissions: ['read', 'write'], createdBy: 'Alex Admin', lastUsed: '2026-05-01T00:00:00Z', createdAt: '2025-01-01T00:00:00Z' },
    { id: 'k5', name: 'Partner API Key', key: 'resq_partner_xxxxxx', maskedKey: 'resq_partner_****', status: APIKeyStatus.Expired, permissions: ['read'], createdBy: 'Jane Cooper', lastUsed: '2026-03-15T00:00:00Z', expiresAt: '2026-03-15T00:00:00Z', createdAt: '2025-03-15T00:00:00Z' },
  ] as APIKeyDTO[] };
}

function mockOrganizations(): OrganizationListResponse {
  return { total: 4, data: [
    { id: 'org1', name: 'ResQAI Inc.', slug: 'resqai', plan: OrganizationPlan.Enterprise, ownerName: 'Alex Admin', ownerEmail: 'admin@resqai.com', userCount: 142, appCount: 9, status: 'active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2026-06-28T00:00:00Z' },
    { id: 'org2', name: 'Acme Corp', slug: 'acme', plan: OrganizationPlan.Professional, ownerName: 'John Doe', ownerEmail: 'john@acme.com', userCount: 45, appCount: 4, status: 'active', createdAt: '2025-03-15T00:00:00Z', updatedAt: '2026-06-15T00:00:00Z' },
    { id: 'org3', name: 'TechStart LLC', slug: 'techstart', plan: OrganizationPlan.Starter, ownerName: 'Jane Smith', ownerEmail: 'jane@techstart.io', userCount: 8, appCount: 2, status: 'active', createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-05-20T00:00:00Z' },
    { id: 'org4', name: 'Free User', slug: 'free-user', plan: OrganizationPlan.Free, ownerName: 'Bob Wilson', ownerEmail: 'bob@email.com', userCount: 1, appCount: 1, status: 'trialing', createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
  ] as OrganizationDTO[] };
}

function mockTeams(): TeamListResponse {
  return { total: 6, data: [
    { id: 't1', name: 'Support Team', description: 'Customer support representatives', organizationId: 'org1', organizationName: 'ResQAI Inc.', memberCount: 15, appAccess: ['support'], createdAt: '2025-01-15T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
    { id: 't2', name: 'Engineering', description: 'Platform engineering team', organizationId: 'org1', organizationName: 'ResQAI Inc.', memberCount: 8, appAccess: ['admin', 'analytics'], createdAt: '2025-01-15T00:00:00Z', updatedAt: '2026-05-20T00:00:00Z' },
    { id: 't3', name: 'Field Technicians', description: 'Field service technicians', organizationId: 'org1', organizationName: 'ResQAI Inc.', memberCount: 35, appAccess: ['technician'], createdAt: '2025-02-01T00:00:00Z', updatedAt: '2026-04-15T00:00:00Z' },
    { id: 't4', name: 'Sales Team', description: 'Sales and account management', organizationId: 'org2', organizationName: 'Acme Corp', memberCount: 6, appAccess: ['crm', 'analytics'], createdAt: '2025-03-20T00:00:00Z', updatedAt: '2026-03-20T00:00:00Z' },
    { id: 't5', name: 'Operations', description: 'Operations team', organizationId: 'org2', organizationName: 'Acme Corp', memberCount: 4, appAccess: ['operations', 'support'], createdAt: '2025-04-01T00:00:00Z', updatedAt: '2026-02-10T00:00:00Z' },
    { id: 't6', name: 'Admin Team', description: 'System administrators', organizationId: 'org1', organizationName: 'ResQAI Inc.', memberCount: 3, appAccess: ['admin'], createdAt: '2025-01-20T00:00:00Z', updatedAt: '2026-01-20T00:00:00Z' },
  ] as TeamDTO[] };
}

function mockPlatformMetrics(): PlatformMetricsResponse {
  return { total: 8, data: [
    { id: 'm1', name: 'CPU Usage', value: 62.5, unit: '%', trend: 'up', timestamp: '2026-06-28T14:30:00Z' },
    { id: 'm2', name: 'Memory Usage', value: 74.2, unit: '%', trend: 'stable', timestamp: '2026-06-28T14:30:00Z' },
    { id: 'm3', name: 'Storage Used', value: 2.4, unit: 'TB', trend: 'up', timestamp: '2026-06-28T14:30:00Z' },
    { id: 'm4', name: 'Requests/min', value: 1250, unit: 'req/min', trend: 'down', timestamp: '2026-06-28T14:30:00Z' },
    { id: 'm5', name: 'Error Rate', value: 0.8, unit: '%', trend: 'down', timestamp: '2026-06-28T14:30:00Z' },
    { id: 'm6', name: 'Avg Response Time', value: 245, unit: 'ms', trend: 'stable', timestamp: '2026-06-28T14:30:00Z' },
    { id: 'm7', name: 'Active Sessions', value: 42, unit: 'sessions', trend: 'up', timestamp: '2026-06-28T14:30:00Z' },
    { id: 'm8', name: 'Database Connections', value: 18, unit: 'conns', trend: 'stable', timestamp: '2026-06-28T14:30:00Z' },
  ] as PlatformMetricDTO[] };
}

function mockErrors(): ErrorListResponse {
  return { total: 6, data: [
    { id: 'e1', type: 'ConnectionTimeout', message: 'Connection timeout to CRM API at https://crm.example.com/api/v2', source: 'syncCRMData', appName: 'CRM Center', severity: 'high', status: 'open', count: 12, firstSeen: '2026-06-28T08:00:00Z', lastSeen: '2026-06-28T10:01:00Z' },
    { id: 'e2', type: 'ExecutionTimeout', message: 'Function execution exceeded 30s timeout limit', source: 'classifyTicket', appName: 'Support Center', severity: 'medium', status: 'open', count: 3, firstSeen: '2026-06-28T12:00:00Z', lastSeen: '2026-06-28T12:00:31Z' },
    { id: 'e3', type: 'ValidationError', message: 'Missing required field: evidence_document_id in dispute submission', source: 'processDispute', appName: 'Resolution Center', severity: 'medium', status: 'open', count: 8, firstSeen: '2026-06-28T09:00:00Z', lastSeen: '2026-06-28T13:01:00Z' },
    { id: 'e4', type: 'AuthFailure', message: 'Authentication failed for SMTP server: Invalid credentials', source: 'Email Service', appName: 'Admin Center', severity: 'critical', status: 'open', count: 45, firstSeen: '2026-06-27T00:00:00Z', lastSeen: '2026-06-28T14:30:00Z' },
    { id: 'e5', type: 'RateLimit', message: 'Twilio API rate limit exceeded (429 Too Many Requests)', source: 'SMS Service', appName: 'Admin Center', severity: 'low', status: 'resolved', count: 23, firstSeen: '2026-06-27T09:00:00Z', lastSeen: '2026-06-27T09:00:00Z' },
    { id: 'e6', type: 'OutOfMemory', message: 'Agent process killed: out of memory (2048MB limit)', source: 'Route Optimizer', appName: 'Technician Portal', severity: 'high', status: 'ignored', count: 2, firstSeen: '2026-06-25T12:00:00Z', lastSeen: '2026-06-25T12:05:00Z' },
  ] as ErrorEntryDTO[] };
}

export async function getDashboard(): Promise<AdminDashboardResponse> { await delay(); return mockDashboard(); }
export async function listUsers(page = 1, pageSize = 20): Promise<UserListResponse> { await delay(); return mockUsers(page, pageSize); }
export async function getUser(id: string): Promise<UserDetailResponse | null> { await delay(); return mockUserDetail(id); }
export async function createUser(_req: CreateUserRequest): Promise<UserDTO> { await delay(300); return { id: 'u-new', email: _req.email, name: _req.name, role: _req.role, status: UserStatus.Pending, appAccess: _req.appAccess, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; }
export async function updateUser(_id: string, _req: UpdateUserRequest): Promise<UserDTO> { await delay(300); return { id: _id, email: _req.email || '', name: _req.name || '', role: _req.role || '', status: (_req.status as UserStatus) || UserStatus.Active, appAccess: [], createdAt: '', updatedAt: new Date().toISOString() }; }
export async function deleteUser(_id: string): Promise<void> { await delay(300); }
export async function listRoles(): Promise<RoleListResponse> { await delay(); return mockRoles(); }
export async function getRole(id: string): Promise<RoleDetailResponse | null> { await delay(); return mockRoleDetail(id); }
export async function createRole(_req: CreateRoleRequest): Promise<RoleDTO> { await delay(300); return { id: 'r-new', name: _req.name, description: _req.description, permissions: _req.permissions, appScope: _req.appScope, userCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; }
export async function updateRole(_id: string, _req: UpdateRoleRequest): Promise<RoleDTO> { await delay(300); return { id: _id, name: _req.name || '', description: _req.description || '', permissions: _req.permissions || [], appScope: _req.appScope || [], userCount: 0, createdAt: '', updatedAt: new Date().toISOString() }; }
export async function deleteRole(_id: string): Promise<void> { await delay(300); }
export async function listAuditLog(filter?: AuditLogFilterRequest, page = 1, pageSize = 20): Promise<AuditLogResponse> { await delay(); return mockAuditLog(filter, page, pageSize); }
export async function exportAuditLog(_filter?: AuditLogFilterRequest): Promise<Blob> { await delay(1000); return new Blob(['id,action,actor,target,timestamp'], { type: 'text/csv' }); }
export async function listSettings(): Promise<SettingsListResponse> { await delay(); return mockSettings(); }
export async function updateSetting(_key: string, _req: UpdateSettingRequest): Promise<SystemSettingDTO> { await delay(300); return { id: 's-upd', key: _req.key, value: _req.value, type: SettingType.String, label: '', description: '', category: '', isSecret: false, updatedAt: new Date().toISOString(), updatedBy: 'Admin' }; }
export async function listConnectors(): Promise<ConnectorListResponse> { await delay(); return mockConnectors(); }
export async function getConnector(_id: string): Promise<ConnectorDTO | null> { await delay(); return mockConnectors().data.find(c => c.id === _id) || null; }
export async function createConnector(_req: CreateConnectorRequest): Promise<ConnectorDTO> { await delay(300); return { id: 'c-new', name: _req.name, type: _req.type as ConnectorType, status: 'pending', config: _req.config, enabled: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; }
export async function updateConnector(_id: string, _req: UpdateConnectorRequest): Promise<ConnectorDTO> { await delay(300); return { id: _id, name: _req.name || '', type: ConnectorType.Custom, status: 'connected', config: _req.config || {}, enabled: _req.enabled ?? true, createdAt: '', updatedAt: new Date().toISOString() }; }
export async function deleteConnector(_id: string): Promise<void> { await delay(300); }
export async function getEventBusMetrics(): Promise<EventBusMetricsResponse> { await delay(); return mockEventBusMetrics(); }
export async function listSessions(): Promise<SessionListResponse> { await delay(); return mockSessions(); }
export async function forceLogout(_sessionId: string): Promise<void> { await delay(300); }
export async function listApplications(): Promise<ApplicationListResponse> { await delay(); return mockApplications(); }
export async function getApplication(id: string): Promise<ApplicationDetailResponse | null> { await delay(); return mockApplicationDetail(id); }
export async function listWorkflows(): Promise<WorkflowListResponse> { await delay(); return mockWorkflows(); }
export async function listWorkflowRuns(workflowId?: string): Promise<WorkflowRunListResponse> { await delay(); return mockWorkflowRuns(workflowId); }
export async function restartWorkflow(_id: string): Promise<void> { await delay(300); }
export async function listFunctions(): Promise<FunctionListResponse> { await delay(); return mockFunctions(); }
export async function listFunctionRuns(functionId?: string): Promise<FunctionRunListResponse> { await delay(); return mockFunctionRuns(functionId); }
export async function restartFunction(_id: string): Promise<void> { await delay(300); }
export async function listAgents(): Promise<AgentListResponse> { await delay(); return mockAgents(); }
export async function getAgent(id: string): Promise<AgentDetailResponse | null> { await delay(); return mockAgentDetail(id); }
export async function restartAgent(_id: string): Promise<void> { await delay(300); }
export async function listIntegrations(): Promise<IntegrationListResponse> { await delay(); return mockIntegrations(); }
export async function listNotifications(filter?: NotificationFilterRequest): Promise<NotificationListResponse> { await delay(); return mockNotifications(); }
export async function markNotificationRead(_id: string): Promise<void> { await delay(200); }
export async function dismissNotification(_id: string): Promise<void> { await delay(200); }
export async function listAPIKeys(): Promise<APIKeyListResponse> { await delay(); return mockAPIKeys(); }
export async function revokeAPIKey(_id: string): Promise<void> { await delay(300); }
export async function listOrganizations(): Promise<OrganizationListResponse> { await delay(); return mockOrganizations(); }
export async function listTeams(): Promise<TeamListResponse> { await delay(); return mockTeams(); }
export async function createTeam(_req: CreateTeamRequest): Promise<TeamDTO> { await delay(300); return { id: 't-new', name: _req.name, description: _req.description, organizationId: _req.organizationId, organizationName: '', memberCount: 0, appAccess: _req.appAccess, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; }
export async function getPlatformMetrics(): Promise<PlatformMetricsResponse> { await delay(); return mockPlatformMetrics(); }
export async function listErrors(): Promise<ErrorListResponse> { await delay(); return mockErrors(); }
export async function resolveError(_id: string): Promise<void> { await delay(300); }
