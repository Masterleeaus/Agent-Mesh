import React, { memo } from 'react';
import type { Ticket } from '../types';

const sectionStyle: React.CSSProperties = {
  background: 'var(--color-surface, #1e1e2e)',
  borderRadius: 'var(--radius-lg, 12px)',
  padding: '20px 24px',
  border: '1px solid var(--color-danger-transparent, rgba(244,67,54,0.3))',
  marginBottom: 24,
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 16,
};

const iconStyle: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: '50%',
  background: '#f44336',
  display: 'inline-block',
  animation: 'pulse 2s infinite',
};

const listStyle: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
};

const linkStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 12px',
  borderRadius: 8,
  color: 'var(--color-text, #eee)',
  textDecoration: 'none',
  transition: 'background 0.15s',
};

const badgeStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  padding: '2px 8px',
  borderRadius: 999,
  background: 'rgba(244,67,54,0.2)',
  color: '#f44336',
};

interface UrgentDispatchProps {
  tickets: Ticket[];
}

export const UrgentDispatch = memo(function UrgentDispatch({ tickets }: UrgentDispatchProps) {
  if (tickets.length === 0) return null;

  return (
    <div style={sectionStyle}>
      <div style={headerStyle}>
        <span style={iconStyle} />
        <h3
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--color-text, #eee)',
          }}
        >
          Urgent Dispatch — {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} need immediate attention
        </h3>
      </div>

      <ul style={listStyle}>
        {tickets.map((t) => (
          <li key={t.id}>
            <a
              href={`/support-queue?focus=${t.id}`}
              style={linkStyle}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              <span>
                <strong>{t.subject}</strong>
                {t.customer_name && (
                  <span style={{ color: 'var(--color-text-secondary, #888)', marginLeft: 8, fontSize: 13 }}>
                    — {t.customer_name}
                  </span>
                )}
              </span>
              <span style={badgeStyle}>{t.channel}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
});
