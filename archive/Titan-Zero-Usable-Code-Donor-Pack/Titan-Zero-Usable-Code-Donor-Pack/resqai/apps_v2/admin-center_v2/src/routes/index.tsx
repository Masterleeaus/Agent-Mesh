import { useMemo } from 'react';
import { AppLayout } from '../layouts/AppLayout';
import {
  AdminDashboardPage, UserManagementPage, CreateUserPage, UserDetailPage,
  RoleManagerPage, CreateRolePage, RoleDetailPage, PermissionsPage,
  ApplicationsPage, ApplicationDetailPage,
  WorkflowManagerPage, WorkflowRunsPage,
  FunctionManagerPage, FunctionRunsPage,
  AgentManagerPage, AgentActivityPage,
  DatabaseExplorerPage,
  EventBusMonitorPage, IntegrationsPage, ConnectorConfigPage,
  NotificationCenterPage, FeatureFlagsPage, SystemSettingsPage,
  SecurityCenterPage, AuditLogPage,
  PlatformHealthPage, ErrorCenterPage, MonitoringDashboardPage,
  APIKeysPage, OrganizationsPage, TeamsPage,
} from '../pages';

function matchRoute(hash: string): { route: string; params: Record<string, string> } {
  const path = hash.replace(/^#/, '') || '/';
  const segments = path.split('/').filter(Boolean);

  if (segments.length === 2 && segments[0] === 'users' && segments[1] !== 'new') return { route: '/users/:id', params: { id: segments[1] } };
  if (segments.length === 2 && segments[0] === 'roles' && segments[1] !== 'new') return { route: '/roles/:id', params: { id: segments[1] } };
  if (segments.length === 2 && segments[0] === 'applications' && segments[1]) return { route: '/applications/:id', params: { id: segments[1] } };
  return { route: path, params: {} };
}

export function Routes() {
  const hash = window.location.hash;
  const { route, params } = useMemo(() => matchRoute(hash), [hash]);

  const navigate = (path: string) => { window.location.hash = path; };

  const renderPage = () => {
    switch (route) {
      case '/users': return <UserManagementPage />;
      case '/users/new': return <CreateUserPage />;
      case '/users/:id': return <UserDetailPage userId={params.id} />;
      case '/roles': return <RoleManagerPage />;
      case '/roles/new': return <CreateRolePage />;
      case '/roles/:id': return <RoleDetailPage roleId={params.id} />;
      case '/permissions': return <PermissionsPage />;
      case '/applications': return <ApplicationsPage />;
      case '/applications/:id': return <ApplicationDetailPage appId={params.id} />;
      case '/workflows': return <WorkflowManagerPage />;
      case '/workflow-runs': return <WorkflowRunsPage />;
      case '/functions': return <FunctionManagerPage />;
      case '/function-runs': return <FunctionRunsPage />;
      case '/agents': return <AgentManagerPage />;
      case '/agent-activity': return <AgentActivityPage />;
      case '/database': return <DatabaseExplorerPage />;
      case '/events': return <EventBusMonitorPage />;
      case '/integrations': return <IntegrationsPage />;
      case '/connectors': return <ConnectorConfigPage />;
      case '/notifications': return <NotificationCenterPage />;
      case '/feature-flags': return <FeatureFlagsPage />;
      case '/settings': return <SystemSettingsPage />;
      case '/security': return <SecurityCenterPage />;
      case '/audit': return <AuditLogPage />;
      case '/platform-health': return <PlatformHealthPage />;
      case '/errors': return <ErrorCenterPage />;
      case '/monitoring': return <MonitoringDashboardPage />;
      case '/api-keys': return <APIKeysPage />;
      case '/organizations': return <OrganizationsPage />;
      case '/teams': return <TeamsPage />;
      default: return <AdminDashboardPage />;
    }
  };

  return <AppLayout activeRoute={route} onNavigate={navigate}>{renderPage()}</AppLayout>;
}
