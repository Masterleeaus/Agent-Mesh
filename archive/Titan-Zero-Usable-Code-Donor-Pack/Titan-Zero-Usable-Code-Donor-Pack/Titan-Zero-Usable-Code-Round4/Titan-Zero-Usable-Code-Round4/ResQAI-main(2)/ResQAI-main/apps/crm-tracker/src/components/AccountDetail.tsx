import React, { memo } from 'react';
import type { Account, Followup } from '../types';
import { FOLLOWUP_STATUS_VARIANTS } from '../../../../packages/config/constants';
import { daysSince } from '../../../../packages/utils/date';
import { formatCurrency } from '../../../../packages/utils/number';

interface AccountDetailProps {
  account: Account;
  followups: Followup[];
}

const FOLLOwUP_BADGE: Record<string, string> = Object.fromEntries(
  Object.entries(FOLLOWUP_STATUS_VARIANTS).map(([k, v]) => [k, `badge ${v}`]),
);

function followupStatus(f: Followup): string {
  if (f.status === 'completed' || f.status === 'cancelled') return 'done';
  if (f.due_date && new Date(f.due_date) < new Date()) return 'overdue';
  if (f.due_date) {
    const diff = new Date(f.due_date).getTime() - Date.now();
    if (diff < 86400000) return 'due';
  }
  return 'future';
}

export const AccountDetail = memo(function AccountDetail({ account, followups }: AccountDetailProps) {
  const acctFollowups = followups.filter((f) => f.account_id === account.id);

  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>{account.name}</h3>

      <div style={styles.summaryGrid}>
        {account.primary_service_type && (
          <div style={styles.field}>
            <span style={styles.label}>Service</span>
            <span className="badge plain">{account.primary_service_type}</span>
          </div>
        )}
        <div style={styles.field}>
          <span style={styles.label}>Last contact</span>
          <span>{daysSince(account.last_contact_date)}</span>
        </div>
        <div style={styles.field}>
          <span style={styles.label}>Lifetime jobs</span>
          <span style={styles.num}>{account.lifetime_jobs ?? '—'}</span>
        </div>
      </div>

      <div style={styles.detailGrid}>
        <div style={styles.detailItem}>
          <span style={styles.detailLabel}>Status</span>
          <span>{account.health ?? '—'}</span>
        </div>
        <div style={styles.detailItem}>
          <span style={styles.detailLabel}>Relationship</span>
          <span>{account.relationship_status ?? '—'}</span>
        </div>
        <div style={styles.detailItem}>
          <span style={styles.detailLabel}>Service type</span>
          <span>{account.primary_service_type ?? '—'}</span>
        </div>
        <div style={styles.detailItem}>
          <span style={styles.detailLabel}>Health score</span>
          <span style={styles.num}>{account.health_score ?? '—'}</span>
        </div>
        <div style={styles.detailItem}>
          <span style={styles.detailLabel}>Last service</span>
          <span>{daysSince(account.last_service_date)}</span>
        </div>
        <div style={styles.detailItem}>
          <span style={styles.detailLabel}>Last contact</span>
          <span>{daysSince(account.last_contact_date)}</span>
        </div>
        <div style={styles.detailItem}>
          <span style={styles.detailLabel}>Open disputes</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', color: account.open_disputes && account.open_disputes > 0 ? 'var(--danger, #a23b3b)' : undefined }}>
            {account.open_disputes ?? 0}
          </span>
        </div>
        <div style={styles.detailItem}>
          <span style={styles.detailLabel}>Overdue follow-ups</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', color: account.overdue_followups && account.overdue_followups > 0 ? 'var(--warn, #c2683f)' : undefined }}>
            {account.overdue_followups ?? 0}
          </span>
        </div>
        <div style={styles.detailItem}>
          <span style={styles.detailLabel}>Open follow-ups</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{account.open_followups ?? 0}</span>
        </div>
        <div style={styles.detailItem}>
          <span style={styles.detailLabel}>Lifetime revenue</span>
            <span style={styles.num}>{formatCurrency(account.lifetime_revenue_cents)}</span>
        </div>
        <div style={styles.detailItem}>
          <span style={styles.detailLabel}>Owner</span>
          <span>{account.owner ?? '—'}</span>
        </div>
      </div>

      {account.notes && (
        <div style={styles.notes}>
          <span style={styles.detailLabel}>Notes</span>
          <p style={styles.notesText}>{account.notes}</p>
        </div>
      )}

      <div style={styles.followupsSection}>
        <h4 style={styles.sectionTitle}>Follow-ups</h4>
        {acctFollowups.length === 0 ? (
          <div style={{ color: 'var(--muted, #6b6353)', fontSize: 13 }}>No follow-ups for this account.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Subject</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Priority</th>
                <th style={styles.th}>Owner</th>
                <th style={styles.th}>Due date</th>
              </tr>
            </thead>
            <tbody>
              {acctFollowups.map((f) => {
                const s = followupStatus(f);
                return (
                  <tr key={f.id} style={styles.tr}>
                    <td style={styles.td}>
                      <span className={FOLLOwUP_BADGE[s] || 'badge plain'}>{s}</span>
                    </td>
                    <td style={styles.td}>{f.subject}</td>
                    <td style={styles.td}>{f.type}</td>
                    <td style={styles.td}>{f.priority}</td>
                    <td style={styles.td}>{f.owner ?? '—'}</td>
                    <td style={styles.td}>{f.due_date ? new Date(f.due_date).toLocaleDateString() : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
});

const styles: Record<string, React.CSSProperties> = {
  panel: {
    background: 'var(--card, #fffefa)',
    border: '1px solid var(--line, #e7e0cf)',
    borderRadius: 10,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
    fontFamily: 'Fraunces, serif',
    color: 'var(--ink, #1a1813)',
  },
  summaryGrid: {
    display: 'flex',
    gap: 20,
    flexWrap: 'wrap',
  },
  field: {
    display: 'flex',
    gap: 6,
    fontSize: 13,
    alignItems: 'center',
  },
  label: {
    fontWeight: 600,
    color: 'var(--muted, #6b6353)',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    minWidth: 80,
  },
  num: {
    fontFamily: 'JetBrains Mono, monospace',
    fontWeight: 600,
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px 20px',
    fontSize: 13,
  },
  detailItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    borderBottom: '1px solid var(--line, #e7e0cf)',
  },
  detailLabel: {
    fontWeight: 600,
    color: 'var(--muted, #6b6353)',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  notes: {
    background: 'var(--paper, #f8f5ee)',
    borderRadius: 6,
    padding: 12,
  },
  notesText: {
    margin: '4px 0 0 0',
    fontSize: 13,
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    color: 'var(--ink, #1a1813)',
  },
  followupsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    margin: 0,
    color: 'var(--ink, #1a1813)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 12,
  },
  th: {
    textAlign: 'left',
    padding: '8px 8px',
    color: 'var(--muted, #6b6353)',
    fontWeight: 600,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    borderBottom: '1px solid var(--line, #e7e0cf)',
  },
  tr: {
    borderBottom: '1px solid var(--line, #e7e0cf)',
  },
  td: {
    padding: '8px 8px',
    verticalAlign: 'middle',
  },
};
