import { type FC } from 'react';
import { Card, Skeleton } from '@resqai/foundation';
import type { LiveMetricVM } from '../models/view-models';

interface LiveMetricsWidgetProps {
  metrics: LiveMetricVM[];
  loading: boolean;
}

export const LiveMetricsWidget: FC<LiveMetricsWidgetProps> = ({ metrics, loading }) => {
  if (loading) {
    return (
      <Card variant="bordered" style={{ padding: 20 }}>
        <Skeleton variant="text" height={16} width="60%" style={{ marginBottom: 12 }} />
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="text" height={20} style={{ marginBottom: 8 }} />)}
      </Card>
    );
  }
  return (
    <Card variant="bordered" style={{ padding: 20 }} role="region" aria-label="Live metrics">
      <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Live Metrics</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {metrics.map((m) => (
          <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#8b9bb5' }}>{m.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#e6ecf5' }}>
                {m.value}{m.unit}
              </span>
              <span style={{
                fontSize: 11,
                color: m.trend === 'up' ? '#4ade80' : m.trend === 'down' ? '#f87171' : '#8b9bb5',
              }}>
                {m.trend === 'up' ? '\u2191' : m.trend === 'down' ? '\u2193' : '\u2192'} {m.changePercent}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
