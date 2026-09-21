import React from 'react';
import { DashboardPage } from './pages/DashboardPage';

const navStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 24,
  padding: '12px 32px',
  background: 'var(--color-surface, #1e1e2e)',
  borderBottom: '1px solid var(--color-border, #2a2a3e)',
};

const brandStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--color-text, #eee)',
  textDecoration: 'none',
};

const linkStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  color: 'var(--color-text-secondary, #888)',
  textDecoration: 'none',
  transition: 'color 0.15s',
};

export default function App() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg, #0f0f1a)',
        color: 'var(--color-text, #eee)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <nav style={navStyle}>
        <a href="/" style={brandStyle}>
          ResQAI
        </a>
        <a href="/ops-dashboard" style={linkStyle}>
          Operations Dashboard
        </a>
        <a href="/support-queue" style={linkStyle}>
          Support Queue
        </a>
        <a href="/appointment-board" style={linkStyle}>
          Appointments
        </a>
        <a href="/crm-tracker" style={linkStyle}>
          CRM Tracker
        </a>
        <a href="/resolution-center" style={linkStyle}>
          Resolution Center
        </a>
      </nav>

      <DashboardPage />
    </div>
  );
}
