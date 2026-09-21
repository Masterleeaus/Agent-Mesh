import React from 'react';

interface HealthCategoryBarProps {
  distribution: {
    healthy: number;
    watch: number;
    slipping: number;
    critical: number;
  };
}

const segments = [
  { key: 'healthy' as const, color: '#16a34a', label: 'Healthy' },
  { key: 'watch' as const, color: '#d97706', label: 'Watch' },
  { key: 'slipping' as const, color: '#f97316', label: 'Slipping' },
  { key: 'critical' as const, color: '#dc2626', label: 'Critical' },
];

export function HealthCategoryBar({ distribution }: HealthCategoryBarProps) {
  const total = distribution.healthy + distribution.watch + distribution.slipping + distribution.critical;
  if (total === 0) {
    return <div style={{ fontSize: 13, color: '#8b9bb5', padding: 8 }}>No accounts</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', height: 24 }}>
        {segments.map((seg) => {
          const count = distribution[seg.key];
          if (count === 0) return null;
          const pct = (count / total) * 100;
          return (
            <div
              key={seg.key}
              style={{
                flex: `${pct} 0 auto`,
                minWidth: 4,
                backgroundColor: seg.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: '#fff',
                transition: 'flex 0.3s ease',
              }}
              title={`${seg.label}: ${count}`}
            >
              {pct > 15 ? `${Math.round(pct)}%` : ''}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
        {segments.map((seg) => {
          const count = distribution[seg.key];
          return (
            <div key={seg.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: seg.color }} />
              <span style={{ fontSize: 12, color: '#cbd5e1' }}>{seg.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#e6ecf5' }}>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
