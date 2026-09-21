import type { ReactNode } from 'react';
import { Topbar, Sidebar } from '../../../../shared/src/components';
import type { SidebarItem } from '../../../../shared/src/components';

interface AppLayoutProps {
  children: ReactNode;
  activeRoute: string;
  onNavigate: (route: string) => void;
}

const sidebarItems: SidebarItem[] = [
  { id: '/', label: 'Executive Dashboard' },
  { id: '/support', label: 'Support Analytics' },
  { id: '/operations', label: 'Operations Analytics' },
  { id: '/appointments', label: 'Appointment Analytics' },
  { id: '/technicians', label: 'Technician Performance' },
  { id: '/customers', label: 'Customer Analytics' },
  { id: '/crm', label: 'CRM Analytics' },
  { id: '/resolution', label: 'Resolution Analytics' },
  { id: '/sla', label: 'SLA Dashboard' },
  { id: '/productivity', label: 'Productivity Dashboard' },
  { id: '/trends', label: 'Trend Analysis' },
  { id: '/forecasting', label: 'Forecasting' },
  { id: '/reports', label: 'Reports' },
  { id: '/reports/custom', label: 'Custom Reports' },
  { id: '/reports/builder', label: 'Report Builder' },
  { id: '/reports/scheduled', label: 'Scheduled Reports' },
  { id: '/export', label: 'Export Center' },
  { id: '/audit', label: 'Audit Analytics' },
  { id: '/health', label: 'System Health' },
  { id: '/search', label: 'Search' },
];

export default function AppLayout({ children, activeRoute, onNavigate }: AppLayoutProps) {
  const handleSidebarNav = (item: SidebarItem) => {
    if (item.href) onNavigate(item.href);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0b1220', color: '#e6ecf5' }}>
      <Topbar left={<span style={{ fontSize: 16, fontWeight: 700, color: '#41d1c4' }}>Analytics Center</span>} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          items={sidebarItems}
          activeId={activeRoute}
          onNavigate={handleSidebarNav}
          title="Analytics"
          width={240}
        />
        <main style={{ flex: 1, overflow: 'auto', padding: '24px 32px' }}>{children}</main>
      </div>
    </div>
  );
}
