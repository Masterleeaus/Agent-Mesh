import { memo, type FC } from 'react';
import type { AppointmentwithDetails } from '../types';
import { formatServiceType, STATUS_VARIANTS, STATUS_COLOR_MAP } from '../../../../packages/config/constants';

interface AppointmentGroupProps {
  title: string;
  items: AppointmentwithDetails[];
  selectedId: string | null;
  onSelect: (apt: AppointmentwithDetails) => void;
}

const AppointmentGroup: FC<AppointmentGroupProps> = ({
  title,
  items,
  selectedId,
  onSelect,
}) => (
  <div style={{ marginBottom: 28 }}>
    <h3
      style={{
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        margin: '0 0 10px 0',
      }}
    >
      {title}{' '}
      <span style={{ color: 'var(--text-muted)' }}>({items.length})</span>
    </h3>
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['when', 'Service', 'Customer', 'Status', 'Technician'].map(
              (h) => (
                <th
                  key={h}
                  style={{
                    padding: '10px 12px',
                    textAlign: 'left',
                    color: 'var(--text-muted)',
                    fontWeight: 500,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((apt) => {
            const selected = apt.id === selectedId;
            const variant = STATUS_VARIANTS[apt.status] || 'plain';
            return (
              <tr
                key={apt.id}
                onClick={() => onSelect(apt)}
                style={{
                  borderBottom: '1px solid var(--border)',
                  background: selected
                    ? 'rgba(79,195,247,0.08)'
                    : undefined,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!selected)
                    (
                      e.currentTarget as HTMLElement
                    ).style.background = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!selected)
                    (e.currentTarget as HTMLElement).style.background = '';
                }}
              >
                <td
                  style={{
                    padding: '10px 12px',
                    whiteSpace: 'nowrap',
                    color: 'var(--text-primary)',
                  }}
                >
                  {new Date(apt.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--text-primary)' }}>
                  {formatServiceType(apt.service_type)}
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--text-primary)' }}>
                  {apt.customer_name || '\u2014'}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      background: `${STATUS_COLOR_MAP[variant]}20`,
                      color: STATUS_COLOR_MAP[variant],
                    }}
                  >
                    {apt.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td
                  style={{
                    padding: '10px 12px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {apt.technician_name || '\u2014'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

export default memo(AppointmentGroup);
