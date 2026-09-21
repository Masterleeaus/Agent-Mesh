import React, { memo } from 'react';
import type { AccountHealthScanResult, AccountHealthRow } from '../types';

interface HealthScanPanelProps {
  scanResult: AccountHealthScanResult | null;
  scanLoading: boolean;
  onRunScan: () => void;
}

export const HealthScanPanel = memo(function HealthScanPanel({ scanResult, scanLoading, onRunScan }: HealthScanPanelProps) {
  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <h3 style={styles.title}>Account Health Monitor</h3>
        <button
          className="btn btn-primary"
          onClick={onRunScan}
          disabled={scanLoading}
        >
          {scanLoading ? 'Scanning...' : 'Run health scan'}
        </button>
      </div>

      {scanLoading && (
        <div style={{ color: 'var(--muted, #6b6353)', fontSize: 13, padding: '8px 0' }}>
          Running health scan and flagging slipping follow-ups...
        </div>
      )}

      {scanResult && !scanLoading && (
        <div style={styles.result}>
          <div style={styles.resultGrid}>
            <div style={styles.stat}>
              <span style={styles.statNum}>{scanResult.totals.scanned}</span>
              <span style={styles.statLabel}>Scanned</span>
            </div>
            <div style={styles.stat}>
              <span style={styles.statNum}>{scanResult.totals.wrote_back}</span>
              <span style={styles.statLabel}>wrote back</span>
            </div>
            <div style={{ ...styles.stat, color: 'var(--healthy, #5c7a53)' }}>
              <span style={styles.statNum}>{scanResult.by_health.healthy}</span>
              <span style={styles.statLabel}>Healthy</span>
            </div>
            <div style={{ ...styles.stat, color: 'var(--watch, #c9a227)' }}>
              <span style={styles.statNum}>{scanResult.by_health.watch}</span>
              <span style={styles.statLabel}>watch</span>
            </div>
            <div style={{ ...styles.stat, color: 'var(--slipping, #c2683f)' }}>
              <span style={styles.statNum}>{scanResult.by_health.slipping}</span>
              <span style={styles.statLabel}>Slipping</span>
            </div>
            <div style={{ ...styles.stat, color: 'var(--critical, #a23b3b)' }}>
              <span style={styles.statNum}>{scanResult.by_health.critical}</span>
              <span style={styles.statLabel}>Critical</span>
            </div>
          </div>

          {scanResult.top_risk && scanResult.top_risk.length > 0 && (
            <div style={styles.topRisk}>
              <div style={styles.topRiskTitle}>Top risk accounts</div>
              {scanResult.top_risk.slice(0, 5).map((row: AccountHealthRow) => (
                <div key={row.account_id} style={styles.riskRow}>
                  <span style={styles.riskName}>{row.name}</span>
                  <span style={styles.riskScore}>{row.new_score}</span>
                  <span
                    style={{
                      ...styles.riskDelta,
                      color: row.score_delta < 0 ? 'var(--danger, #a23b3b)' : 'var(--good, #5c7a53)',
                    }}
                  >
                    {row.score_delta > 0 ? '+' : ''}{row.score_delta}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!scanResult && !scanLoading && (
        <div style={{ color: 'var(--muted, #6b6353)', fontSize: 13, padding: '8px 0' }}>
          No scan results yet. Run a health scan to get started.
        </div>
      )}
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
    gap: 12,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    margin: 0,
    fontFamily: 'Fraunces, serif',
    color: 'var(--ink, #1a1813)',
  },
  result: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  resultGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 10,
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  statNum: {
    fontSize: 22,
    fontWeight: 700,
    fontFamily: 'JetBrains Mono, monospace',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: 11,
    color: 'var(--muted, #6b6353)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  topRisk: {
    background: 'var(--paper, #f8f5ee)',
    borderRadius: 6,
    padding: 12,
  },
  topRiskTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 6,
    color: 'var(--ink, #1a1813)',
  },
  riskRow: {
    display: 'flex',
    gap: 8,
    fontSize: 12,
    padding: '3px 0',
    alignItems: 'center',
  },
  riskName: {
    flex: 1,
    fontWeight: 600,
  },
  riskScore: {
    fontFamily: 'JetBrains Mono, monospace',
    fontWeight: 600,
  },
  riskDelta: {
    fontFamily: 'JetBrains Mono, monospace',
    fontWeight: 600,
    width: 40,
    textAlign: 'right',
  },
};
