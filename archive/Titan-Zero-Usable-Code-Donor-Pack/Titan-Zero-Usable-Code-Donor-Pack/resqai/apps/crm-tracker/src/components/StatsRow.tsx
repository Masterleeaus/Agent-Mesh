import React, { memo } from 'react';

interface StatsRowProps {
  critical: number;
  slipping: number;
  watch: number;
  healthy: number;
  overdueFollowups: number;
  openFollowups: number;
}

const STATS: { label: string; key: keyof StatsRowProps; color: string }[] = [
  { label: 'Critical', key: 'critical', color: 'var(--critical, #a23b3b)' },
  { label: 'Slipping', key: 'slipping', color: 'var(--slipping, #c2683f)' },
  { label: 'watch', key: 'watch', color: 'var(--watch, #c9a227)' },
  { label: 'Healthy', key: 'healthy', color: 'var(--healthy, #5c7a53)' },
  { label: 'Overdue follow-ups', key: 'overdueFollowups', color: 'var(--danger, #a23b3b)' },
  { label: 'Open follow-ups', key: 'openFollowups', color: 'var(--gold, #c9a227)' },
];

export const StatsRow = memo(function StatsRow(props: StatsRowProps) {
  return (
    <div style={styles.row}>
      {STATS.map((s) => (
        <div key={s.key} style={styles.card}>
          <span style={{ ...styles.num, color: s.color }}>{props[s.key]}</span>
          <span style={styles.label}>{s.label}</span>
        </div>
      ))}
    </div>
  );
});

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: 12,
  },
  card: {
    background: 'var(--card, #fffefa)',
    border: '1px solid var(--line, #e7e0cf)',
    borderRadius: 10,
    padding: '16px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  num: {
    fontSize: 28,
    fontWeight: 700,
    fontFamily: 'JetBrains Mono, monospace',
    lineHeight: 1,
  },
  label: {
    fontSize: 12,
    color: 'var(--muted, #6b6353)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
};
