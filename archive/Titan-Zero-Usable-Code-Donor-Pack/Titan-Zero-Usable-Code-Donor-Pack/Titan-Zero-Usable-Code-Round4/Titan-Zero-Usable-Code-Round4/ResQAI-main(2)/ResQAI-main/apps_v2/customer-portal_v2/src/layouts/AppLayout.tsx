import { type ReactNode } from 'react';
import { CustomerSidebar } from '../components/CustomerSidebar';

interface AppLayoutProps {
  children: ReactNode;
}

const logoStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 16,
  color: '#e6ecf5',
  letterSpacing: '0.02em',
};

const avatarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '4px 12px',
  borderRadius: 8,
  cursor: 'pointer',
  color: '#e6ecf5',
  fontSize: 13,
  fontWeight: 500,
  background: 'rgba(255,255,255,0.05)',
};

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b1220', color: '#e6ecf5' }}>
      <CustomerSidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{
          height: 56, background: '#131c2f', borderBottom: '1px solid #1a2744',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', position: 'sticky', top: 0, zIndex: 100,
        }}>
          <span style={logoStyle}>ResQAI Customer Portal</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => { window.location.hash = '/notifications'; }}
              style={{ background: 'none', border: 'none', color: '#8b9bb5', fontSize: 18, cursor: 'pointer', padding: 4, position: 'relative' }}
              title="Notifications" aria-label="Notifications">
              🔔
            </button>
            <button onClick={() => { window.location.hash = '/help'; }}
              style={{ background: 'none', border: 'none', color: '#8b9bb5', fontSize: 18, cursor: 'pointer', padding: 4 }}
              title="Help" aria-label="Help">
              ❓
            </button>
            <div style={avatarStyle} onClick={() => { window.location.hash = '/profile'; }} role="button" tabIndex={0} aria-label="Profile">
              <span aria-hidden="true">👤</span>
              <span>Jane Cooper</span>
            </div>
          </div>
        </header>
        <main style={{
          flex: 1, padding: 24, overflow: 'auto',
          maxWidth: 1200, width: '100%', margin: '0 auto',
          boxSizing: 'border-box',
        }}>
          {children}
        </main>
      </div>

      {/* Mobile-first responsive styles injected */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-sidebar-toggle { display: block !important; }
          main { padding: 16px !important; }
        }
        @media (min-width: 769px) {
          .mobile-sidebar-toggle { display: none !important; }
        }
      `}</style>
    </div>
  );
}