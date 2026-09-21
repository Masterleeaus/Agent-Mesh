import React, { memo } from 'react';
import type { Dispute } from '../types';

interface EvidencePanelProps {
  dispute: Dispute;
}

export const EvidencePanel = memo(function EvidencePanel({ dispute }: EvidencePanelProps) {
  return (
    <div style={styles.grid}>
      <div style={styles.col}>
        <div style={styles.colHeader}>Customer claim</div>
        <div style={styles.colBody}>{dispute.customer_claim}</div>
      </div>
      <div style={styles.col}>
        <div style={styles.colHeader}>Provider claim</div>
        <div style={styles.colBody}>{dispute.provider_claim}</div>
      </div>
      <div style={styles.col}>
        <div style={styles.colHeader}>Evidence summary</div>
        <div style={styles.colBody}>{dispute.evidence_summary ?? 'No evidence summary recorded.'}</div>
      </div>
    </div>
  );
});

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 12,
    marginBottom: 16,
  },
  col: {
    background: 'var(--bg, #0b1220)',
    borderRadius: 6,
    border: '1px solid var(--border, #243049)',
    overflow: 'hidden',
  },
  colHeader: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--muted, #8b9bb5)',
    padding: '8px 12px',
    background: 'var(--panel, #131c2f)',
    borderBottom: '1px solid var(--border, #243049)',
  },
  colBody: {
    fontSize: 13,
    lineHeight: 1.5,
    padding: 12,
    color: 'var(--text, #e6ecf5)',
  },
};
