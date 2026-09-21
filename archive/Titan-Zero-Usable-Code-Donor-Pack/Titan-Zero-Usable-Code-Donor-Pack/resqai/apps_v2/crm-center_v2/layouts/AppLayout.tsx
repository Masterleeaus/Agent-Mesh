import { useMemo, type ReactNode } from 'react';
import { DashboardLayout } from '../../../shared/src/layouts';
import { Topbar } from '../../../shared/src/components';
import { Sidebar } from '../../../shared/src/navigation';
import type { SidebarItem } from '../../../shared/src/components';

interface AppLayoutProps {
  children: ReactNode;
}

const navItems: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '#/' },
  { id: 'accounts', label: 'Accounts', href: '#/accounts' },
  { id: 'followups', label: 'Follow-up Queue', href: '#/followups' },
  { id: 'timeline', label: 'Timeline', href: '#/timeline' },
  { id: 'interactions', label: 'Interactions', href: '#/interactions' },
  { id: 'feedback', label: 'Feedback', href: '#/feedback' },
  { id: 'satisfaction', label: 'Satisfaction', href: '#/satisfaction' },
  { id: 'renewals', label: 'Renewals', href: '#/renewals' },
  { id: 'upsells', label: 'Upsells', href: '#/upsells' },
  { id: 'retention', label: 'Retention', href: '#/retention' },
  { id: 'communications', label: 'Communications', href: '#/communications' },
  { id: 'notes', label: 'Notes', href: '#/notes' },
  { id: 'tasks', label: 'Tasks', href: '#/tasks' },
  { id: 'scans', label: 'Health Scans', href: '#/scans' },
  { id: 'risks', label: 'Risk Signals', href: '#/risks' },
  { id: 'reports', label: 'Reports', href: '#/reports' },
  { id: 'search', label: 'Search', href: '#/search' },
];

export function AppLayout({ children }: AppLayoutProps) {
  const activeId = useMemo(() => {
    const hash = window.location.hash.slice(1) || '/';
    if (hash === '/') return 'dashboard';
    if (hash.startsWith('/accounts')) return 'accounts';
    if (hash.startsWith('/followups') || hash.startsWith('/calls')) return 'followups';
    if (hash.startsWith('/timeline')) return 'timeline';
    if (hash.startsWith('/interactions')) return 'interactions';
    if (hash.startsWith('/feedback')) return 'feedback';
    if (hash.startsWith('/satisfaction')) return 'satisfaction';
    if (hash.startsWith('/renewals')) return 'renewals';
    if (hash.startsWith('/upsells')) return 'upsells';
    if (hash.startsWith('/retention')) return 'retention';
    if (hash.startsWith('/communications')) return 'communications';
    if (hash.startsWith('/notes')) return 'notes';
    if (hash.startsWith('/tasks')) return 'tasks';
    if (hash.startsWith('/scans')) return 'scans';
    if (hash.startsWith('/risks')) return 'risks';
    if (hash.startsWith('/reports')) return 'reports';
    if (hash.startsWith('/search')) return 'search';
    return 'dashboard';
  }, []);

  const handleNavigate = (item: SidebarItem) => {
    if (item.href) {
      window.location.hash = item.href.replace('#', '');
    }
  };

  return (
    <DashboardLayout
      topbar={
        <Topbar left={<span style={{ fontWeight: 700, fontSize: 16, color: '#e6ecf5' }}>CRM Center</span>} />
      }
      sidebar={
        <Sidebar
          items={navItems}
          activeId={activeId}
          onNavigate={handleNavigate}
        />
      }
      contentStyle={{ background: '#0b1220' }}
    >
      {children}
    </DashboardLayout>
  );
}
