import React, { memo } from 'react';
import type { Dispute, Appointment, Customer } from '../types';
import { RESOLUTION_LABELS, type ResolutionType } from '../types';
import { DISPUTE_STATUS_VARIANTS } from '../../../../packages/config/constants';
import { age } from '../../../../packages/utils/date';

interface DisputeListProps {
  disputes: Dispute[];
  appointments: Appointment[];
  customers: Customer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const DISPUTE_BADGE: Record<string, string> = Object.fromEntries(
  Object.entries(DISPUTE_STATUS_VARIANTS).map(([k, v]) => [k, `badge ${v}`]),
);

export const DisputeList = memo(function DisputeList({ disputes, appointments, customers, selectedId, onSelect }: DisputeListProps) {
  if (disputes.length === 0) {
    return (
      <div style={{ padding: 24, color: 'var(--muted, #8b9bb5)', textAlign: 'center' }}>
        No disputes found.
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Customer / Service</th>
            <th style={styles.th}>Recommendation</th>
            <th style={styles.th}>Confidence</th>
            <th style={styles.th}>Age</th>
          </tr>
        </thead>
        <tbody>
          {disputes.map((d) => {
            const appt = appointments.find((a) => a.id === d.appointment_id);
            const cust = appt ? customers.find((c) => c.id === appt.customer_id) : undefined;
            const resolutionLabel = d.recommended_resolution
              ? RESOLUTION_LABELS[d.recommended_resolution as ResolutionType] ?? d.recommended_resolution
              : '—';
            const confidencePct = d.confidence != null ? Math.round(d.confidence * 100) : null;

            return (
              <tr
                key={d.id}
                onClick={() => onSelect(d.id)}
                style={{
                  ...styles.tr,
                  background: d.id === selectedId ? 'var(--panel-2, #1a2238)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <td style={styles.td}>
                  <span className={DISPUTE_BADGE[d.status] || 'badge plain'}>{d.status}</span>
                </td>
                <td style={styles.td}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{cust?.name ?? '—'}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted, #8b9bb5)' }}>
                    {appt?.service_type ?? '—'} &middot; {appt?.date ? new Date(appt.date).toLocaleDateString() : '—'}
                  </div>
                </td>
                <td style={styles.td}>{resolutionLabel}</td>
                <td style={styles.td}>
                  {confidencePct != null ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={styles.barBg}>
                        <div
                          style={{
                            ...styles.barFill,
                            width: `${confidencePct}%`,
                            background:
                              confidencePct < 60
                                ? '#e74c3c'
                                : confidencePct < 85
                                  ? '#f0ad4e'
                                  : 'var(--accent, #41d1c4)',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{confidencePct}%</span>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--muted, #8b9bb5)', fontSize: 12 }}>—</span>
                  )}
                </td>
                <td style={styles.td}>{age(d.created_at)}</td>
              </tr>
            );
          })}
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
  barBg: {
    width: 80,
    height: 6,
    borderRadius: 3,
    background: 'var(--bg, #0b1220)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s',
  },
};
