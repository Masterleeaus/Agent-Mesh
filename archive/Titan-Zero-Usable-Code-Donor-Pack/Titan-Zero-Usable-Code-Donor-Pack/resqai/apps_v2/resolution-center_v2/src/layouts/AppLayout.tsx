import { type FC, type ReactNode } from 'react';
import { Topbar, Sidebar, NotificationCenter } from '@resqai/foundation';
import type { SidebarItem } from '@resqai/foundation';
import { useAppContext } from '../state/AppContext';

interface AppLayoutProps {
  children: ReactNode;
}

const navItems: SidebarItem[] = [
  { id: 'dashboard', label: 'Resolution Dashboard', href: '#/' },
  { id: 'pending', label: 'Pending Resolutions', href: '#/pending' },
  { id: 'disputes', label: 'Dispute Queue', href: '#/disputes' },
  { id: 'approvals', label: 'Approval Queue', href: '#/approvals' },
  { id: 'escalations', label: 'Escalations', href: '#/escalations' },
  { id: 'history', label: 'Resolution History', href: '#/history' },
  { id: 'closed', label: 'Closed Cases', href: '#/closed' },
  { id: 'knowledge-base', label: 'Knowledge Base', href: '#/knowledge-base' },
  { id: 'reports', label: 'Reports', href: '#/reports' },
  { id: 'search', label: 'Search', href: '#/search' },
];

function getActiveId(): string {
  const hash = window.location.hash.replace('#', '') || '/';
  if (hash === '/' || hash === '') return 'dashboard';
  if (hash.startsWith('/pending')) return 'pending';
  if (hash.startsWith('/disputes')) return 'disputes';
  if (hash.startsWith('/approvals')) return 'approvals';
  if (hash.startsWith('/escalations')) return 'escalations';
  if (hash.startsWith('/history')) return 'history';
  if (hash.startsWith('/closed')) return 'closed';
  if (hash.startsWith('/knowledge-base')) return 'knowledge-base';
  if (hash.startsWith('/reports')) return 'reports';
  if (hash.startsWith('/search')) return 'search';
  return 'dashboard';
}

export const AppLayout: FC<AppLayoutProps> = ({ children }) => {
  const { currentUserName, notifications, dismissNotification, clearNotifications } = useAppContext();

  const handleNavigate = (item: SidebarItem) => {
    if (item.href) {
      window.location.hash = item.href.startsWith('#') ? item.href.slice(1) : item.href;
    }
  };

  const mappedNotifications = notifications.map(n => ({
    id: n.id,
    type: n.type as 'info' | 'error' | 'success' | 'warning',
    title: n.title,
    message: n.message || '',
    timestamp: n.timestamp,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0b1220' }}>
      <Topbar
        left={<span style={{ fontWeight: 800, fontSize: 18, color: '#41d1c4', letterSpacing: '0.02em' }}>Resolution Center</span>}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#8b9bb5' }}>{currentUserName || 'Specialist'}</span>
            <div role="img" aria-label={`${currentUserName} avatar`} style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#243049', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#8b9bb5', fontSize: 14, fontWeight: 600,
            }}>
              {(currentUserName || 'S')[0].toUpperCase()}
            </div>
          </div>
        }
        style={{ background: '#131c2f', borderBottom: '1px solid #243049' }}
      />
      <div style={{ display: 'flex', flex: 1 }}>
        <nav aria-label="Main navigation">
          <Sidebar
            items={navItems}
            activeId={getActiveId()}
            onNavigate={handleNavigate}
            width={220}
            style={{ background: '#0f1729', borderRight: '1px solid #1a2744', height: '100%' }}
            activeItemStyle={{ background: 'rgba(65, 209, 196, 0.1)', color: '#41d1c4' }}
          />
        </nav>
        <main style={{ flex: 1, overflow: 'auto' }} role="main">
          {children}
        </main>
      </div>
      <NotificationCenter
        notifications={mappedNotifications}
        onDismiss={(id) => dismissNotification(id)}
      />
    </div>
  );
};
