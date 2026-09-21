import { Card } from '../../../../shared/src/components';
import type { KpiCardVM } from '../models/view-models';

interface MetricCardProps {
  metric: KpiCardVM;
  loading?: boolean;
  onClick?: () => void;
}

const arrowUp = '\u2191';
const arrowDown = '\u2193';
const arrowFlat = '\u2192';

export function MetricCard({ metric, loading, onClick }: MetricCardProps) {
  if (loading) {
    return (
      <Card padding="md" variant="bordered" style={{ minWidth: 200, minHeight: 120, background: '#131c2f', border: '1px solid #243049' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ width: '60%', height: 12, background: '#243049', borderRadius: 4 }} />
          <div style={{ width: '40%', height: 28, background: '#243049', borderRadius: 4 }} />
          <div style={{ width: '50%', height: 10, background: '#243049', borderRadius: 4 }} />
        </div>
      </Card>
    );
  }

  const trendColor = metric.trend.direction === 'up' ? '#22c55e' : metric.trend.direction === 'down' ? '#ef4444' : '#8b9bb5';
  const trendArrow = metric.trend.direction === 'up' ? arrowUp : metric.trend.direction === 'down' ? arrowDown : arrowFlat;

  return (
    <Card
      padding="md"
      variant="bordered"
      clickable={!!onClick}
      onClick={onClick}
      style={{ background: '#131c2f', border: '1px solid #243049', cursor: onClick ? 'pointer' : 'default' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, color: '#8b9bb5', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {metric.label}
        </span>
        <span style={{ fontSize: 28, fontWeight: 700, color: '#e6ecf5', lineHeight: 1.2 }}>
          {metric.value}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: trendColor, fontSize: 13, fontWeight: 600 }}>
            {trendArrow} {Math.abs(metric.trend.percentChange).toFixed(1)}%
          </span>
          <span style={{ color: '#6b7a95', fontSize: 12 }}>
            vs previous period
          </span>
        </div>
        <div style={{ marginTop: 4, height: 2, background: '#243049', borderRadius: 1 }}>
          <div style={{ width: '70%', height: '100%', background: trendColor, borderRadius: 1 }} />
        </div>
      </div>
    </Card>
  );
}
