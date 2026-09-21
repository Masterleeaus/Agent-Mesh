import React, { memo } from 'react';
import type { SlippingFollowupItem } from '../types';
import { SEVERITY_COLORS, BUCKET_LABELS } from '../../../../packages/config/constants';

interface SlippingAlertsProps {
  alerts: SlippingFollowupItem[];
  onSelectAccount: (accountId: string) => void;
}

export const SlippingAlerts = memo(function SlippingAlerts({ alerts, onSelectAccount }: SlippingAlertsProps) {
  if (alerts.length === 0) {
    return (
      <div style={{ padding: 20, color: 'var(--muted, #6b6353)', textAlign: 'center', fontSize: 13 }}>
        All follow-ups are on track.
      </div>
    );
  }

  return (
    <div style={styles.list}>
      {alerts.map((a, i) => (
        <div
          key={a.followup_id || i}
          onClick={() => onSelectAccount(a.account_id)}
          style={styles.alert}
        >
          <div
            style={{
              ...styles.severityBar,
              background: SEVERITY_COLORS[a.severity] ?? '#6b6353',
            }}
          />
          <div style={styles.alertBody}>
            <div style={styles.alertTop}>
              <span style={styles.customer}>{a.customer_name}</span>
              <span
                className={
                  a.severity === 'critical' ? 'badge urgent' :
                  a.severity === 'high' ? 'badge high' :
                  a.severity === 'medium' ? 'badge normal' : 'badge good'
                }
              >
                {a.severity}
              </span>
            </div>
            <div style={styles.subject}>{a.subject}</div>
            <div style={styles.alertMeta}>
              <span className="badge plain">{a.type}</span>
              <span className="badge plain">{a.priority}</span>
              {a.owner && <span style={styles.owner}>{a.owner}</span>}
              <span
                style={{
                  ...styles.bucket,
                  color: a.bucket === 'overdue' ? 'var(--danger, #a23b3b)' :
                         a.bucket === 'due_today' ? 'var(--warn, #c2683f)' :
                         'var(--gold, #c9a227)',
                }}
              >
                {BUCKET_LABELS[a.bucket] ?? a.bucket}
                {a.days_overdue ? ` · ${a.days_overdue}d` : ''}
              </span>
            </div>
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
    gap: 6,
  },
  alert: {
    display: 'flex',
    background: 'var(--card, #fffefa)',
    border: '1px solid var(--line, #e7e0cf)',
    borderRadius: 8,
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'border-color 0.15s',
  },
  severityBar: {
    width: 4,
    minHeight: '100%',
    flexShrink: 0,
  },
  alertBody: {
    flex: 1,
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  alertTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customer: {
    fontWeight: 700,
    fontSize: 13,
    color: 'var(--ink, #1a1813)',
  },
  subject: {
    fontSize: 12,
    color: 'var(--muted, #6b6353)',
  },
  alertMeta: {
    display: 'flex',
    gap: 4,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  owner: {
    fontSize: 11,
    color: 'var(--muted, #6b6353)',
  },
  bucket: {
    fontSize: 11,
    fontWeight: 600,
    marginLeft: 'auto',
  },
};
