import type { FC } from 'react';

interface HealthCategoryBarProps {
  healthy: number;
  warning: number;
  critical: number;
  unknown: number;
  total: number;
}

export const HealthCategoryBar: FC<HealthCategoryBarProps> = ({ healthy, warning, critical, unknown, total }) => {
  if (total === 0) {
    return <div style={{ height: 24, background: '#1a2439', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#8b9bb5' }}>No data</div>;
  }

  const sections = [
    { value: healthy, color: '#41d1c4', label: 'Healthy' },
    { value: warning, color: '#f59e0b', label: 'Warning' },
    { value: critical, color: '#ef4444', label: 'Critical' },
    { value: unknown, color: '#6b7280', label: 'Unknown' },
  ].filter(s => s.value > 0);

  return (
    <div>
      <div style={{ display: 'flex', height: 24, borderRadius: 4, overflow: 'hidden' }}>
        {sections.map((s) => (
          <div
            key={s.label}
            style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color, minWidth: 4 }}
            title={`${s.label}: ${s.value}`}
          />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
        {sections.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8b9bb5' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color }} />
            <span>{s.label}: {s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
