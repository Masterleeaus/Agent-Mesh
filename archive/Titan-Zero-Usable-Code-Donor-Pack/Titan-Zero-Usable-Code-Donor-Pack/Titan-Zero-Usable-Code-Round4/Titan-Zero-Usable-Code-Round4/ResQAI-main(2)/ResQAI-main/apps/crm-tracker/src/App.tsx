import React from 'react';
import { CrmTrackerRoutes } from './routes';

const NAV_ITEMS = [
  { label: 'Appointment Board', href: '/appointment-board' },
  { label: 'CRM Tracker', href: '/crm-tracker', active: true },
  { label: 'Ops Dashboard', href: '/ops-dashboard' },
  { label: 'Resolution Center', href: '/resolution-center' },
  { label: 'Support Queue', href: '/support-queue' },
];

export default function App() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--paper, #f8f5ee)',
        color: 'var(--ink, #1a1813)',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <span style={styles.brand}>
            <span style={styles.brandRes}>ResQAI</span>
            <span style={styles.brandSep}>·</span>
            <span style={styles.brandApp}>CRM Tracker</span>
          </span>
          <div style={styles.tagline}>Relationship health and follow-ups.</div>
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
        <CrmTrackerRoutes />
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    background: 'var(--card, #fffefa)',
    borderBottom: '1px solid var(--line, #e7e0cf)',
    padding: '0 24px',
  },
  navInner: {
    display: 'flex',
    alignItems: 'center',
    height: 56,
    gap: 12,
    maxWidth: 1440,
    margin: '0 auto',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontWeight: 800,
    fontSize: 18,
    fontFamily: 'Fraunces, serif',
    whiteSpace: 'nowrap',
  },
  brandRes: {
    color: 'var(--ink, #1a1813)',
  },
  brandSep: {
    color: 'var(--muted, #6b6353)',
  },
  brandApp: {
    color: 'var(--gold, #c9a227)',
  },
  tagline: {
    fontSize: 12,
    color: 'var(--muted, #6b6353)',
    fontStyle: 'italic',
    whiteSpace: 'nowrap',
    display: 'none',
  },
  links: {
    display: 'flex',
    gap: 2,
    marginLeft: 'auto',
  },
  link: {
    padding: '6px 12px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--muted, #6b6353)',
    textDecoration: 'none',
    transition: 'all 0.15s',
  },
  linkActive: {
    background: 'var(--ink, #1a1813)',
    color: 'var(--card, #fffefa)',
  },
};
