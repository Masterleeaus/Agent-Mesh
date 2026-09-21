import React, { memo } from 'react';

interface KpiCardsProps {
  awaitingApproval: number;
  totalOpen: number;
  resolved: number;
}

export const KpiCards = memo(function KpiCards({ awaitingApproval, totalOpen, resolved }: KpiCardsProps) {
  return (
    <div style={styles.row}>
      <div style={{ ...styles.card, borderLeft: '4px solid var(--accent, #41d1c4)' }}>
        <div style={styles.label}>Awaiting approval</div>
        <div style={styles.value}>{awaitingApproval}</div>
      </div>
      <div style={{ ...styles.card, borderLeft: '4px solid #f0ad4e' }}>
        <div style={styles.label}>Total open</div>
        <div style={styles.value}>{totalOpen}</div>
      </div>
      <div style={{ ...styles.card, borderLeft: '4px solid #5cb85c' }}>
        <div style={styles.label}>Resolved</div>
        <div style={styles.value}>{resolved}</div>
      </div>
    </div>
  );
});

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
    marginBottom: 20,
  },
  card: {
    background: 'var(--panel, #131c2f)',
    borderRadius: 8,
    padding: '16px 20px',
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--muted, #8b9bb5)',
    marginBottom: 4,
  },
  value: {
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--text, #e6ecf5)',
  },
};
