import React from 'react';
import { SupportQueueRoutes } from './routes';

const NAV_ITEMS = [
  { label: 'Appointment Board', href: '/appointment-board' },
  { label: 'CRM Tracker', href: '/crm-tracker' },
  { label: 'Ops Dashboard', href: '/ops-dashboard' },
  { label: 'Resolution Center', href: '/resolution-center' },
  { label: 'Support Queue', href: '/support-queue', active: true },
];

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #0b1220)', color: 'var(--text, #e6ecf5)' }}>
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <span style={styles.brand}>ResQAI</span>
          <div style={styles.links}>
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                style={{
                  ...styles.link,
                  ...(item.active ? styles.linkActive : {}),
                }}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </nav>
      <main>
        <SupportQueueRoutes />
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    background: 'var(--panel, #131c2f)',
    borderBottom: '1px solid var(--border, #243049)',
    padding: '0 24px',
  },
  navInner: {
    display: 'flex',
    alignItems: 'center',
    height: 52,
    gap: 32,
    maxWidth: 1440,
    margin: '0 auto',
  },
  brand: {
    fontWeight: 800,
    fontSize: 18,
    color: 'var(--accent, #41d1c4)',
    letterSpacing: '0.02em',
  },
  links: {
    display: 'flex',
    gap: 4,
  },
  link: {
    padding: '6px 14px',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--muted, #8b9bb5)',
    textDecoration: 'none',
    transition: 'background 0.15s',
  },
  linkActive: {
    background: 'rgba(65, 209, 196, 0.1)',
    color: 'var(--accent, #41d1c4)',
  },
};
