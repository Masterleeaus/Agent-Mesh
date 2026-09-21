import { type FC, type ReactNode } from 'react';
import { Topbar, Sidebar, NotificationCenter } from '@resqai/foundation';
import type { SidebarItem } from '@resqai/foundation';
import { useAppContext } from '../state/AppContext';

interface AppLayoutProps {
  children: ReactNode;
}

const navItems: SidebarItem[] = [
  { id: 'tickets', label: 'Ticket Queue', href: '#/' },
  { id: 'my-tickets', label: 'My Tickets', href: '#/my-tickets' },
  { id: 'escalations', label: 'Escalations', href: '#/escalations' },
  { id: 'sla', label: 'SLA Dashboard', href: '#/sla' },
  { id: 'templates', label: 'Templates', href: '#/templates' },
  { id: 'settings', label: 'Queue Settings', href: '#/settings' },
];

function getActiveId(): string {
  const hash = window.location.hash.replace('#', '') || '/';
  if (hash === '/' || hash.startsWith('/tickets')) return 'tickets';
  if (hash.startsWith('/my-tickets')) return 'my-tickets';
  if (hash.startsWith('/escalations')) return 'escalations';
  if (hash.startsWith('/sla')) return 'sla';
  if (hash.startsWith('/templates')) return 'templates';
  if (hash.startsWith('/settings')) return 'settings';
  return 'tickets';
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
        left={<span style={{ fontWeight: 800, fontSize: 18, color: '#41d1c4', letterSpacing: '0.02em' }}>Support Center</span>}
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#8b9bb5' }}>{currentUserName || 'Agent'}</span>
            <div role="img" aria-label={`${currentUserName} avatar`} style={{
              width: 32, height: 32, borderRadius: '50%',
              background: '#243049', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#8b9bb5', fontSize: 14, fontWeight: 600,
            }}>
              {(currentUserName || 'A')[0].toUpperCase()}
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
