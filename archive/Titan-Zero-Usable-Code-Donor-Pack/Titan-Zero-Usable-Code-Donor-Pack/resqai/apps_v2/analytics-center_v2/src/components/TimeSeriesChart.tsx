import { Card } from '../../../../shared/src/components';
import type { TimeSeriesDataPointVM } from '../models/view-models';

interface TimeSeriesChartProps {
  data: TimeSeriesDataPointVM[];
  title?: string;
  height?: number;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
}

export function TimeSeriesChart({ data, title, height = 200, loading, error, emptyMessage }: TimeSeriesChartProps) {
  if (error) {
    return (
      <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
        <div style={{ color: '#ef4444', fontSize: 13, textAlign: 'center', padding: 16 }}>{error}</div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
        {title && <div style={{ width: '40%', height: 14, background: '#243049', borderRadius: 4, marginBottom: 12 }} />}
        <div style={{ width: '100%', height, background: '#1a2540', borderRadius: 6 }} />
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
        <div style={{ color: '#6b7a95', fontSize: 13, textAlign: 'center', padding: 32 }}>
          {emptyMessage || 'No time series data available'}
        </div>
      </Card>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * 100;
    const y = 100 - (d.value / maxVal) * 80;
    return `${x},${y}`;
  });

  return (
    <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
      {title && <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 12 }}>{title}</div>}
      <svg viewBox={`0 0 100 100`} style={{ width: '100%', height }}>
        <polyline
          fill="none"
          stroke="#41d1c4"
          strokeWidth="0.5"
          points={points.join(' ')}
          vectorEffect="non-scaling-stroke"
        />
        {points.map((pt, i) => {
          const [x, y] = pt.split(',');
          return <circle key={i} cx={x} cy={y} r="0.8" fill="#41d1c4" />;
        })}
      </svg>
    </Card>
  );
}
