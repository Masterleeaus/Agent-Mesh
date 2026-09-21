export const EVENTS = {
  USER_CREATED: 'user.created',
  USER_ROLE_CHANGED: 'user.role.changed',
  USER_DISABLED: 'user.disabled',
  SYSTEM_CONFIG_CHANGED: 'system.config.changed',
  APPLICATION_DEPLOYED: 'application.deployed',
  APPLICATION_STATUS_CHANGED: 'application.status.changed',
  WORKFLOW_STARTED: 'workflow.started',
  WORKFLOW_COMPLETED: 'workflow.completed',
  WORKFLOW_FAILED: 'workflow.failed',
  WORKFLOW_RESTARTED: 'workflow.restarted',
  FUNCTION_STARTED: 'function.started',
  FUNCTION_COMPLETED: 'function.completed',
  FUNCTION_FAILED: 'function.failed',
  AGENT_STARTED: 'agent.started',
  AGENT_STOPPED: 'agent.stopped',
  AGENT_ERROR: 'agent.error',
  INTEGRATION_CONNECTED: 'integration.connected',
  INTEGRATION_DISCONNECTED: 'integration.disconnected',
  INTEGRATION_ERROR: 'integration.error',
  API_KEY_CREATED: 'api_key.created',
  API_KEY_REVOKED: 'api_key.revoked',
  ORGANIZATION_CREATED: 'organization.created',
  ORGANIZATION_UPDATED: 'organization.updated',
  TEAM_CREATED: 'team.created',
  TEAM_UPDATED: 'team.updated',
  ERROR_RESOLVED: 'error.resolved',
} as const;

export interface UserCreatedPayload { userId: string; email: string; name: string; role: string; }
export interface UserRoleChangedPayload { userId: string; previousRole: string; newRole: string; changedBy: string; }
export interface UserDisabledPayload { userId: string; disabledBy: string; reason?: string; }
export interface SystemConfigChangedPayload { key: string; previousValue?: string; newValue: string; changedBy: string; }
export interface ApplicationDeployedPayload { appId: string; appName: string; version: string; deployedBy: string; }
export interface ApplicationStatusChangedPayload { appId: string; appName: string; previousStatus: string; newStatus: string; }
export interface WorkflowStartedPayload { workflowId: string; workflowName: string; triggeredBy: string; }
export interface WorkflowCompletedPayload { workflowId: string; runId: string; duration: number; }
export interface WorkflowFailedPayload { workflowId: string; runId: string; errorMessage: string; }
export interface FunctionStartedPayload { functionId: string; functionName: string; triggeredBy: string; }
export interface FunctionCompletedPayload { functionId: string; runId: string; duration: number; }
export interface FunctionFailedPayload { functionId: string; runId: string; errorMessage: string; }
export interface AgentErrorPayload { agentId: string; agentName: string; errorMessage: string; }
export interface IntegrationConnectedPayload { integrationId: string; name: string; type: string; }
export interface IntegrationErrorPayload { integrationId: string; name: string; errorMessage: string; }
export interface APIKeyCreatedPayload { keyId: string; name: string; createdBy: string; }
export interface APIKeyRevokedPayload { keyId: string; name: string; revokedBy: string; }
export interface OrganizationCreatedPayload { orgId: string; name: string; plan: string; }
export interface TeamCreatedPayload { teamId: string; name: string; organizationId: string; }
export interface ErrorResolvedPayload { errorId: string; errorType: string; resolvedBy: string; }

export type EventPayloadMap = {
  [EVENTS.USER_CREATED]: UserCreatedPayload;
  [EVENTS.USER_ROLE_CHANGED]: UserRoleChangedPayload;
  [EVENTS.USER_DISABLED]: UserDisabledPayload;
  [EVENTS.SYSTEM_CONFIG_CHANGED]: SystemConfigChangedPayload;
  [EVENTS.APPLICATION_DEPLOYED]: ApplicationDeployedPayload;
  [EVENTS.APPLICATION_STATUS_CHANGED]: ApplicationStatusChangedPayload;
  [EVENTS.WORKFLOW_STARTED]: WorkflowStartedPayload;
  [EVENTS.WORKFLOW_COMPLETED]: WorkflowCompletedPayload;
  [EVENTS.WORKFLOW_FAILED]: WorkflowFailedPayload;
  [EVENTS.WORKFLOW_RESTARTED]: WorkflowStartedPayload;
  [EVENTS.FUNCTION_STARTED]: FunctionStartedPayload;
  [EVENTS.FUNCTION_COMPLETED]: FunctionCompletedPayload;
  [EVENTS.FUNCTION_FAILED]: FunctionFailedPayload;
  [EVENTS.AGENT_STARTED]: { agentId: string; agentName: string; };
  [EVENTS.AGENT_STOPPED]: { agentId: string; agentName: string; };
  [EVENTS.AGENT_ERROR]: AgentErrorPayload;
  [EVENTS.INTEGRATION_CONNECTED]: IntegrationConnectedPayload;
  [EVENTS.INTEGRATION_DISCONNECTED]: { integrationId: string; name: string; };
  [EVENTS.INTEGRATION_ERROR]: IntegrationErrorPayload;
  [EVENTS.API_KEY_CREATED]: APIKeyCreatedPayload;
  [EVENTS.API_KEY_REVOKED]: APIKeyRevokedPayload;
  [EVENTS.ORGANIZATION_CREATED]: OrganizationCreatedPayload;
  [EVENTS.ORGANIZATION_UPDATED]: { orgId: string; name: string; };
  [EVENTS.TEAM_CREATED]: TeamCreatedPayload;
  [EVENTS.TEAM_UPDATED]: { teamId: string; name: string; };
  [EVENTS.ERROR_RESOLVED]: ErrorResolvedPayload;
};
