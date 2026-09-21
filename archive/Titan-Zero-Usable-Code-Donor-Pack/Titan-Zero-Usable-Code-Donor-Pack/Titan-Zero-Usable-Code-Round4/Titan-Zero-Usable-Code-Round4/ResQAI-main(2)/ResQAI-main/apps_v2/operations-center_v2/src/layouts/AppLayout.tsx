import { type FC, type ReactNode } from 'react';
import { Topbar, Sidebar, NotificationCenter } from '@resqai/foundation';
import type { SidebarItem } from '@resqai/foundation';
import { useAppContext } from '../state/AppContext';

interface AppLayoutProps {
  children: ReactNode;
}

const navItems: SidebarItem[] = [
  { id: 'dashboard', label: 'Operations Dashboard', href: '#/' },
  { id: 'dispatch-queue', label: 'Dispatch Queue', href: '#/dispatch-queue' },
  { id: 'live-board', label: 'Live Operations Board', href: '#/live-board' },
  { id: 'assignments', label: 'Assignment Board', href: '#/assignments' },
  { id: 'technicians', label: 'Technician Monitoring', href: '#/technicians' },
  { id: 'pending', label: 'Pending Assignments', href: '#/pending-assignments' },
  { id: 'escalations', label: 'Escalation Queue', href: '#/escalations' },
  { id: 'timeline', label: 'Operations Timeline', href: '#/timeline' },
  { id: 'daily', label: 'Daily Operations', href: '#/daily' },
  { id: 'regional', label: 'Regional Operations', href: '#/regional' },
  { id: 'completed', label: 'Completed Operations', href: '#/completed' },
  { id: 'reports', label: 'Operations Reports', href: '#/reports' },
  { id: 'search', label: 'Search', href: '#/search' },
];

function getActiveId(): string {
  const hash = window.location.hash.replace('#', '') || '/';
  if (hash === '/' || hash.startsWith('/dashboard')) return 'dashboard';
  if (hash.startsWith('/dispatch')) return 'dispatch-queue';
  if (hash.startsWith('/live')) return 'live-board';
  if (hash.startsWith('/assignment')) return 'assignments';
  if (hash.startsWith('/technician')) return 'technicians';
  if (hash.startsWith('/pending')) return 'pending';
  if (hash.startsWith('/escalation')) return 'escalations';
  if (hash.startsWith('/timeline')) return 'timeline';
  if (hash.startsWith('/daily')) return 'daily';
  if (hash.startsWith('/regional')) return 'regional';
  if (hash.startsWith('/completed')) return 'completed';
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
        left={<span style={{ fontWeight: 800, fontSize: 18, color: '#41d1c4', letterSpacing: '0.02em' }}>Operations Center</span>}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#8b9bb5' }}>{currentUserName || 'Operator'}</span>
            <div role="img" aria-label={`${currentUserName} avatar`} style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#243049', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#8b9bb5', fontSize: 14, fontWeight: 600,
            }}>
              {(currentUserName || 'O')[0].toUpperCase()}
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
