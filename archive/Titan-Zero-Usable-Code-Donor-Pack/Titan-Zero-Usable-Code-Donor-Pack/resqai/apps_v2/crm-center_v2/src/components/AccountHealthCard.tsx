import React from 'react';
import { HealthGauge } from './HealthGauge';

interface Metric {
  label: string;
  value: string;
}

interface AccountHealthCardProps {
  accountName: string;
  health: string;
  healthScore: number;
  metrics?: Metric[];
  onClick?: () => void;
}

const healthColors: Record<string, string> = {
  healthy: '#16a34a',
  watch: '#d97706',
  slipping: '#f97316',
  critical: '#dc2626',
};

export function AccountHealthCard({ accountName, health, healthScore, metrics, onClick }: AccountHealthCardProps) {
  const badgeColor = healthColors[health] || '#64748b';

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 8,
        padding: 20,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = badgeColor;
        e.currentTarget.style.boxShadow = `0 0 0 1px ${badgeColor}33`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#334155';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <HealthGauge score={healthScore} size={80} />
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#e6ecf5' }}>{accountName}</h3>
          <span
            style={{
              display: 'inline-block',
              padding: '2px 10px',
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 600,
              backgroundColor: `${badgeColor}22`,
              color: badgeColor,
              marginTop: 4,
              textTransform: 'capitalize',
            }}
          >
            {health}
          </span>
        </div>
      </div>
      {metrics && metrics.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {metrics.map((m) => (
            <div key={m.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e6ecf5' }}>{m.value}</div>
              <div style={{ fontSize: 11, color: '#8b9bb5' }}>{m.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
