import { type FC, type ReactNode } from 'react';
import { Topbar, Sidebar, NotificationCenter } from '@resqai/foundation';
import type { SidebarItem } from '@resqai/foundation';
import { useAppContext } from '../state/AppContext';

interface AppLayoutProps {
  children: ReactNode;
}

const navItems: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '#/' },
  { id: 'today', label: "Today's Jobs", href: '#/today' },
  { id: 'assigned', label: 'Assigned Jobs', href: '#/assigned' },
  { id: 'upcoming', label: 'Upcoming Jobs', href: '#/upcoming' },
  { id: 'completed', label: 'Completed Jobs', href: '#/completed' },
  { id: 'history', label: 'Job History', href: '#/history' },
  { id: 'messages', label: 'Messages', href: '#/messages' },
  { id: 'notifications', label: 'Notifications', href: '#/notifications' },
  { id: 'profile', label: 'Profile', href: '#/profile' },
  { id: 'settings', label: 'Settings', href: '#/settings' },
];

function getActiveId(): string {
  const hash = window.location.hash.replace('#', '') || '/';
  if (hash === '/' || hash.startsWith('/dashboard')) return 'dashboard';
  if (hash.startsWith('/today')) return 'today';
  if (hash.startsWith('/assigned')) return 'assigned';
  if (hash.startsWith('/upcoming')) return 'upcoming';
  if (hash.startsWith('/completed')) return 'completed';
  if (hash.startsWith('/history')) return 'history';
  if (hash.startsWith('/messages')) return 'messages';
  if (hash.startsWith('/notifications')) return 'notifications';
  if (hash.startsWith('/profile')) return 'profile';
  if (hash.startsWith('/settings')) return 'settings';
  if (hash.startsWith('/jobs')) return 'assigned';
  return 'dashboard';
}

export const AppLayout: FC<AppLayoutProps> = ({ children }) => {
  const { currentUserName, notifications, dismissNotification, clearNotifications, networkStatus, isSyncing } = useAppContext();

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

  const networkIndicator = networkStatus === 'offline' ? (
    <span style={{ fontSize: 11, color: '#ff6b6b', background: 'rgba(255,107,107,0.1)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
      Offline
    </span>
  ) : isSyncing ? (
    <span style={{ fontSize: 11, color: '#f0c040', background: 'rgba(240,192,64,0.1)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
      Syncing...
    </span>
  ) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0b1220' }}>
      <Topbar
        left={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 800, fontSize: 18, color: '#41d1c4', letterSpacing: '0.02em' }}>Technician Portal</span>
            {networkIndicator}
          </div>
        }
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#8b9bb5' }}>{currentUserName || 'Technician'}</span>
            <div role="img" aria-label={`${currentUserName} avatar`} style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#243049', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#8b9bb5', fontSize: 14, fontWeight: 600,
            }}>
              {(currentUserName || 'T')[0].toUpperCase()}
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
