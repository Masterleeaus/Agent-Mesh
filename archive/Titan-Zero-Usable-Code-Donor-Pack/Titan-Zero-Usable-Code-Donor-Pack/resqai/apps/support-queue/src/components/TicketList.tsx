import React, { memo } from 'react';
import type { Ticket } from '../types';
import { URGENCY_VARIANTS, TICKET_STATUS_VARIANTS } from '../../../../packages/config/constants';
import { age } from '../../../../packages/utils/date';

interface TicketListProps {
  tickets: Ticket[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const URGENCY_BADGE: Record<string, string> = Object.fromEntries(
  Object.entries(URGENCY_VARIANTS).map(([k, v]) => [k, `badge ${v}`]),
);

const STATUS_BADGE: Record<string, string> = Object.fromEntries(
  Object.entries(TICKET_STATUS_VARIANTS).map(([k, v]) => [k, `badge ${v}`]),
);

export const TicketList = memo(function TicketList({ tickets, selectedId, onSelect }: TicketListProps) {
  if (tickets.length === 0) {
    return (
      <div style={{ padding: 24, color: 'var(--muted, #8b9bb5)', textAlign: 'center' }}>
        No tickets match this filter.
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Urgency</th>
            <th style={styles.th}>Subject / Customer</th>
            <th style={styles.th}>Type</th>
            <th style={styles.th}>Owner</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Age</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr
              key={t.id}
              onClick={() => onSelect(t.id)}
              style={{
                ...styles.tr,
                background: t.id === selectedId ? 'var(--panel-2, #1a2238)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              <td style={styles.td}>
                <span className={URGENCY_BADGE[t.urgency ?? 'normal'] || 'badge normal'}>
                  {t.urgency ?? 'normal'}
                </span>
              </td>
              <td style={styles.td}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{t.subject}</div>
                <div style={{ fontSize: 12, color: 'var(--muted, #8b9bb5)' }}>{t.customer_name ?? '—'}</div>
              </td>
              <td style={styles.td}>{t.request_type ?? '—'}</td>
              <td style={styles.td}>{t.owner ?? t.suggested_owner ?? '—'}</td>
              <td style={styles.td}>
                <span className={STATUS_BADGE[t.status] || 'badge plain'}>{t.status}</span>
              </td>
              <td style={styles.td}>{age(t.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

const styles: Record<string, React.CSSProperties> = {
  container: {
    overflowX: 'auto',
    borderRadius: 8,
    border: '1px solid var(--border, #243049)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    background: 'var(--panel, #131c2f)',
    color: 'var(--muted, #8b9bb5)',
    fontWeight: 600,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid var(--border, #243049)',
  },
  tr: {
    borderBottom: '1px solid var(--border, #243049)',
  },
  td: {
    padding: '10px 12px',
    verticalAlign: 'middle',
    borderBottom: '1px solid var(--border, #243049)',
  },
};
