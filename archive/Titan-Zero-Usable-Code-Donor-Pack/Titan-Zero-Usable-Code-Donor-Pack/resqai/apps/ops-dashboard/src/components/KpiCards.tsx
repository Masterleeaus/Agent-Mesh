import React, { memo } from 'react';
import type { KpiSummary } from '../types';

const cardStyle: React.CSSProperties = {
  background: 'var(--color-surface, #1e1e2e)',
  borderRadius: 'var(--radius-lg, 12px)',
  padding: '20px 24px',
  border: '1px solid var(--color-border, #2a2a3e)',
  flex: '1 1 220px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--color-text-secondary, #888)',
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const valueStyle: React.CSSProperties = {
  fontSize: '32px',
  fontWeight: 700,
  color: 'var(--color-text, #eee)',
  lineHeight: 1.1,
};

const subStyle: React.CSSProperties = {
  fontSize: '14px',
  color: 'var(--color-text-secondary, #888)',
  marginTop: 6,
};

function badge(count: number, color: string): React.ReactNode {
  if (count === 0) return null;
  return (
    <span
      style={{
        display: 'inline-block',
        background: color,
        color: '#fff',
        fontSize: '12px',
        fontWeight: 600,
        padding: '2px 10px',
        borderRadius: '999px',
        marginLeft: 8,
      }}
    >
      {count}
    </span>
  );
}

function subText(count: number, singular: string, plural: string): string {
  if (count === 0) return `No ${plural}`;
  return `${count} ${count === 1 ? singular : plural}`;
}

interface KpiCardsProps {
  kpi: KpiSummary;
}

export const KpiCards = memo(function KpiCards({ kpi }: KpiCardsProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24,
      }}
    >
      {/* Open Tickets */}
      <div style={cardStyle}>
        <div style={labelStyle}>Open Tickets</div>
        <div style={valueStyle}>{kpi.openTickets}</div>
        <div style={subStyle}>
          {kpi.urgentTickets > 0 ? (
            <>
              <span style={{ color: 'var(--color-danger, #f44336)' }}>
                {kpi.urgentTickets} urgent
              </span>
              {badge(kpi.urgentTickets, 'var(--color-danger, #f44336)')}
            </>
          ) : (
            'No urgent tickets'
          )}
        </div>
      </div>

      {/* Active Appointments */}
      <div style={cardStyle}>
        <div style={labelStyle}>Active Appointments</div>
        <div style={valueStyle}>{kpi.activeAppointments}</div>
        <div style={subStyle}>
          {subText(kpi.inProgressAppointments, 'in-progress', 'in-progress')}
        </div>
      </div>

      {/* Open Disputes */}
      <div style={cardStyle}>
        <div style={labelStyle}>Open Disputes</div>
        <div style={valueStyle}>{kpi.openDisputes}</div>
        <div style={subStyle}>
          {subText(kpi.awaitingApprovalDisputes, 'awaiting approval', 'awaiting approval')}
        </div>
      </div>

      {/* Overdue Tasks */}
      <div style={cardStyle}>
        <div style={labelStyle}>Overdue Tasks</div>
        <div style={valueStyle}>{kpi.overdueTasks}</div>
        <div style={subStyle}>
          {kpi.hasOverdueTasks ? (
            <span style={{ color: 'var(--color-warning, #ff9800)' }}>
              Action required
            </span>
          ) : (
            <span style={{ color: 'var(--color-success, #4caf50)' }}>
              All clear
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
