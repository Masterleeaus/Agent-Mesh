import { type FC, type ReactNode } from 'react';
import { Sidebar, Topbar } from '@resqai/foundation';

const sidebarItems = [
  { id: '/', label: 'Dashboard', icon: '📊', group: 'Overview' },
  { id: '/users', label: 'User Management', icon: '👥', group: 'Administration' },
  { id: '/roles', label: 'Role Manager', icon: '🔐', group: 'Administration' },
  { id: '/permissions', label: 'Permissions', icon: '🛡️', group: 'Administration' },
  { id: '/organizations', label: 'Organizations', icon: '🏢', group: 'Administration' },
  { id: '/teams', label: 'Teams', icon: '👪', group: 'Administration' },
  { id: '/applications', label: 'Applications', icon: '📦', group: 'Platform' },
  { id: '/workflows', label: 'Workflow Manager', icon: '⚡', group: 'Platform' },
  { id: '/workflow-runs', label: 'Workflow Runs', icon: '🔄', group: 'Platform' },
  { id: '/functions', label: 'Function Manager', icon: '🔧', group: 'Platform' },
  { id: '/function-runs', label: 'Function Runs', icon: '⚙️', group: 'Platform' },
  { id: '/agents', label: 'Agent Manager', icon: '🤖', group: 'Platform' },
  { id: '/agent-activity', label: 'Agent Activity', icon: '📈', group: 'Platform' },
  { id: '/database', label: 'Database Explorer', icon: '🗄️', group: 'Platform' },
  { id: '/events', label: 'Event Bus', icon: '📡', group: 'Monitoring' },
  { id: '/monitoring', label: 'Monitoring', icon: '📊', group: 'Monitoring' },
  { id: '/platform-health', label: 'Platform Health', icon: '❤️', group: 'Monitoring' },
  { id: '/errors', label: 'Error Center', icon: '⚠️', group: 'Monitoring' },
  { id: '/audit', label: 'Audit Log', icon: '📋', group: 'Security' },
  { id: '/security', label: 'Security Center', icon: '🔒', group: 'Security' },
  { id: '/api-keys', label: 'API Keys', icon: '🔑', group: 'Security' },
  { id: '/integrations', label: 'Integrations', icon: '🔗', group: 'Configuration' },
  { id: '/connectors', label: 'Connectors', icon: '🔌', group: 'Configuration' },
  { id: '/notifications', label: 'Notifications', icon: '🔔', group: 'Configuration' },
  { id: '/feature-flags', label: 'Feature Flags', icon: '🚩', group: 'Configuration' },
  { id: '/settings', label: 'System Settings', icon: '⚙️', group: 'Configuration' },
];

const topbarStyle: React.CSSProperties = { background: '#0f1a2e', borderBottom: '1px solid #1e2d45', height: 52 };
const topbarTitleStyle: React.CSSProperties = { color: '#e6ecf5', fontSize: 16, fontWeight: 700, letterSpacing: '0.01em' };

export const AppLayout: FC<{ children: ReactNode; activeRoute: string; onNavigate: (path: string) => void }> = ({ children, activeRoute, onNavigate }) => {
  const currentPath = '/' + activeRoute.split('/').filter(Boolean)[0] || '/';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0b1220' }}>
      <Sidebar
        items={sidebarItems.map(item => ({ ...item, id: item.id }))}
        activeId={currentPath}
        onNavigate={item => onNavigate(item.id)}
        collapsed={false}
        style={{ background: '#0c1628', borderRight: '1px solid #1e2d45' }}
        title="Admin Center"
        logo="🛡️"
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar style={topbarStyle} left={<span style={topbarTitleStyle}>Admin Center</span>} />
        <main style={{ flex: 1, overflow: 'auto', padding: 24 }}>{children}</main>
      </div>
    </div>
  );
};
