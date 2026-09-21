import React, { memo } from 'react';
import type { Dispute } from '../types';
import { RESOLUTION_LABELS, type ResolutionType } from '../types';

interface RecommendationCardProps {
  dispute: Dispute;
}

export const RecommendationCard = memo(function RecommendationCard({ dispute }: RecommendationCardProps) {
  const hasRecommendation = dispute.status === 'recommendation_ready' || dispute.status === 'approved';
  const resolutionLabel = dispute.recommended_resolution
    ? RESOLUTION_LABELS[dispute.recommended_resolution as ResolutionType] ?? dispute.recommended_resolution
    : '—';
  const confidencePct = dispute.confidence != null ? Math.round(dispute.confidence * 100) : null;

  const barColor =
    dispute.confidence != null
      ? dispute.confidence < 0.6
        ? '#e74c3c'
        : dispute.confidence < 0.85
          ? '#f0ad4e'
          : 'var(--accent, #41d1c4)'
      : 'var(--muted, #8b9bb5)';

  const confidenceLabel =
    dispute.confidence != null
      ? dispute.confidence < 0.6
        ? 'Low confidence'
        : dispute.confidence < 0.85
          ? 'Uncertain'
          : 'High confidence'
      : null;

  if (!hasRecommendation || !dispute.recommended_resolution) {
    return (
      <div style={styles.warning}>
        <strong>No AI recommendation yet.</strong>
        <br />
        Run analysis to generate a recommended resolution for this dispute.
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>AI Recommendation</div>
      <div style={styles.resolutionType}>{resolutionLabel}</div>

      <div style={styles.confidenceSection}>
        <div style={styles.confidenceRow}>
          <span style={styles.confidenceLabel}>Confidence</span>
          <span style={{ ...styles.confidenceValue, color: barColor }}>
            {confidencePct}%{confidenceLabel ? ` — ${confidenceLabel}` : ''}
          </span>
        </div>
        <div style={styles.barBg}>
          <div
            style={{
              ...styles.barFill,
              width: `${confidencePct}%`,
              background: barColor,
            }}
          />
        </div>
      </div>

      {dispute.resolution_reason && (
        <div style={styles.reason}>
          <div style={styles.reasonLabel}>Reason</div>
          <div style={styles.reasonText}>{dispute.resolution_reason}</div>
        </div>
      )}
    </div>
  );
});

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: 'var(--panel, #131c2f)',
    borderRadius: 8,
    border: '1px solid var(--border, #243049)',
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--muted, #8b9bb5)',
    marginBottom: 12,
  },
  resolutionType: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--accent, #41d1c4)',
    marginBottom: 12,
  },
  confidenceSection: {
    marginBottom: 12,
  },
  confidenceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  confidenceLabel: {
    fontSize: 12,
    color: 'var(--muted, #8b9bb5)',
  },
  confidenceValue: {
    fontSize: 13,
    fontWeight: 600,
  },
  barBg: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    background: 'var(--bg, #0b1220)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.3s',
  },
  reason: {
    borderTop: '1px solid var(--border, #243049)',
    paddingTop: 12,
  },
  reasonLabel: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--muted, #8b9bb5)',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 13,
    lineHeight: 1.5,
    color: 'var(--text, #e6ecf5)',
  },
  warning: {
    background: 'rgba(240, 173, 78, 0.1)',
    border: '1px solid rgba(240, 173, 78, 0.3)',
    borderRadius: 8,
    padding: 16,
    fontSize: 13,
    lineHeight: 1.5,
    color: '#f0ad4e',
    marginBottom: 16,
  },
};
