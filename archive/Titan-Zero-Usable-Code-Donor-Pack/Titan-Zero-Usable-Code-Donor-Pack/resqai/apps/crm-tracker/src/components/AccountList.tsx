import React, { memo } from 'react';
import type { Account } from '../types';
import { HEALTH_LABELS } from '../../../../packages/config/constants';
import { daysSince } from '../../../../packages/utils/date';

interface AccountListProps {
  accounts: Account[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const HEALTH_BADGE: Record<string, { label: string; cls: string }> = {
  healthy: { label: HEALTH_LABELS.healthy, cls: 'badge good' },
  watch: { label: HEALTH_LABELS.watch, cls: 'badge high' },
  slipping: { label: HEALTH_LABELS.slipping, cls: 'badge urgent' },
  critical: { label: HEALTH_LABELS.critical, cls: 'badge urgent' },
};

export const AccountList = memo(function AccountList({ accounts, selectedId, onSelect }: AccountListProps) {
  if (accounts.length === 0) {
    return (
      <div style={{ padding: 24, color: 'var(--muted, #6b6353)', textAlign: 'center', fontSize: 13 }}>
        No accounts match this filter.
      </div>
    );
  }

  const badge = (h: string | undefined) => {
    const b = HEALTH_BADGE[h ?? ''] ?? { label: h ?? '—', cls: 'badge plain' };
    return <span className={b.cls}>{b.label}</span>;
  };

  return (
    <div style={styles.list}>
      {accounts.map((a) => (
        <div
          key={a.id}
          onClick={() => onSelect(a.id)}
          style={{
            ...styles.card,
            ...(a.id === selectedId ? styles.cardSelected : {}),
          }}
        >
          <div style={styles.cardTop}>
            <span style={styles.name}>{a.name}</span>
            <span style={styles.score}>{a.health_score ?? '—'}</span>
          </div>
          <div style={styles.badges}>
            {a.primary_service_type && <span className="badge plain">{a.primary_service_type}</span>}
            {a.relationship_status && <span className="badge plain">{a.relationship_status}</span>}
            {badge(a.health)}
          </div>
          <div style={styles.meta}>
            <span>Contact: {daysSince(a.last_contact_date)}</span>
            {a.open_disputes && a.open_disputes > 0 && (
              <span style={{ color: 'var(--danger, #a23b3b)' }}>{a.open_disputes} disputes</span>
            )}
            {a.overdue_followups && a.overdue_followups > 0 && (
              <span style={{ color: 'var(--warn, #c2683f)' }}>{a.overdue_followups} overdue</span>
            )}
            {a.open_followups && a.open_followups > 0 && (
              <span>{a.open_followups} open</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});

const styles: Record<string, React.CSSProperties> = {
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  card: {
    background: 'var(--card, #fffefa)',
    border: '1px solid var(--line, #e7e0cf)',
    borderRadius: 8,
    padding: '12px 14px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    transition: 'border-color 0.15s',
  },
  cardSelected: {
    borderColor: 'var(--ink, #1a1813)',
    boxShadow: '0 0 0 1px var(--ink, #1a1813)',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontWeight: 700,
    fontSize: 14,
    color: 'var(--ink, #1a1813)',
  },
  score: {
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--muted, #6b6353)',
  },
  badges: {
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap',
  },
  meta: {
    display: 'flex',
    gap: 12,
    fontSize: 11,
    color: 'var(--muted, #6b6353)',
    flexWrap: 'wrap',
  },
};
