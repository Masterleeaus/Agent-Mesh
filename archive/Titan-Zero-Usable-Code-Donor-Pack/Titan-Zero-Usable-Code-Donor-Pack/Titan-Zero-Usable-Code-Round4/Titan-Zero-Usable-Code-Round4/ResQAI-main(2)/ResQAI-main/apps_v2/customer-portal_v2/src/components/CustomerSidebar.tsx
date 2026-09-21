import { useState } from 'react';
import { Sidebar } from '../../../shared/src/components';
import type { SidebarItem } from '../../../shared/src/components';

const mainNavItems: SidebarItem[] = [
  { id: '/', label: 'Dashboard', icon: '📊' },
  { id: '/tickets', label: 'My Tickets', icon: '🎫' },
  { id: '/appointments', label: 'Appointments', icon: '📅' },
  { id: '/appointments/calendar', label: 'Calendar', icon: '🗓️' },
  { id: '/track-technician', label: 'Track Technician', icon: '📍' },
  { id: '/messages', label: 'Messages', icon: '💬' },
  { id: '/notifications', label: 'Notifications', icon: '🔔' },
];

const serviceNavItems: SidebarItem[] = [
  { id: '/invoices', label: 'Invoices', icon: '💳' },
  { id: '/payments', label: 'Payments', icon: '💰' },
  { id: '/service-history', label: 'Service History', icon: '📋' },
  { id: '/feedback', label: 'Feedback', icon: '⭐' },
];

const resourceNavItems: SidebarItem[] = [
  { id: '/knowledge-base', label: 'Knowledge Base', icon: '📚' },
  { id: '/downloads', label: 'Downloads', icon: '📄' },
  { id: '/help', label: 'Help Center', icon: '❓' },
];

const accountNavItems: SidebarItem[] = [
  { id: '/profile', label: 'Profile', icon: '👤' },
  { id: '/settings', label: 'Settings', icon: '⚙️' },
  { id: '/security', label: 'Security', icon: '🔒' },
];

export function CustomerSidebar() {
  const currentHash = window.location.hash.replace('#', '') || '/';
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (itemId: string): boolean => {
    if (itemId === '/') return currentHash === '/';
    return currentHash.startsWith(itemId);
  };

  const allItems = [...mainNavItems, ...serviceNavItems, ...resourceNavItems, ...accountNavItems];
  const activeItem = allItems.find((item) => isActive(item.id));

  const handleNavigate = (item: SidebarItem) => {
    window.location.hash = item.id;
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px 16px 8px', borderBottom: '1px solid #1a2744' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#41d1c4', letterSpacing: '0.02em' }}>ResQAI</div>
        <div style={{ fontSize: 10, color: '#6b7b95', marginTop: 2 }}>Customer Portal</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
        <div style={{ padding: '4px 16px', fontSize: 10, fontWeight: 600, color: '#6b7b95', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Main</div>
        <Sidebar items={mainNavItems} activeId={activeItem?.id ?? '/'} onNavigate={handleNavigate} />

        <div style={{ padding: '12px 16px 4px', fontSize: 10, fontWeight: 600, color: '#6b7b95', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Services</div>
        <Sidebar items={serviceNavItems} activeId={activeItem?.id ?? '/'} onNavigate={handleNavigate} />

        <div style={{ padding: '12px 16px 4px', fontSize: 10, fontWeight: 600, color: '#6b7b95', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resources</div>
        <Sidebar items={resourceNavItems} activeId={activeItem?.id ?? '/'} onNavigate={handleNavigate} />
      </div>

      <div style={{ borderTop: '1px solid #1a2744', padding: '8px 0' }}>
        <div style={{ padding: '4px 16px', fontSize: 10, fontWeight: 600, color: '#6b7b95', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account</div>
        <Sidebar items={accountNavItems} activeId={activeItem?.id ?? '/'} onNavigate={handleNavigate} />
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <div style={{ display: 'none' }} className="mobile-sidebar-toggle">
        <button onClick={() => setMobileOpen(!mobileOpen)}
          style={{ position: 'fixed', top: 12, left: 12, zIndex: 1100, background: '#131c2f', border: '1px solid #243049', borderRadius: 8, padding: '8px 12px', color: '#e6ecf5', cursor: 'pointer', fontSize: 18 }}>
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Desktop sidebar */}
      <div style={{ width: 220, height: '100vh', background: '#0f172a', borderRight: '1px solid #1a2744', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        className="desktop-sidebar">
        {sidebarContent}
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
          onClick={() => setMobileOpen(false)}>
          <div style={{ width: 260, height: '100%', background: '#0f172a', borderRight: '1px solid #1a2744', overflow: 'auto' }}
            onClick={(e) => e.stopPropagation()}>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}