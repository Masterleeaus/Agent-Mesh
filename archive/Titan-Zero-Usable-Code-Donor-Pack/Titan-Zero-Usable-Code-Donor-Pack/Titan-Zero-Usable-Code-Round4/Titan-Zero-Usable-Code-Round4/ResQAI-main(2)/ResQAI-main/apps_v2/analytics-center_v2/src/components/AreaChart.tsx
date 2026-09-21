import { Card } from '../../../../shared/src/components';
import type { TimeSeriesDataPointVM } from '../models/view-models';

interface AreaChartProps {
  data: TimeSeriesDataPointVM[];
  title?: string;
  height?: number;
  color?: string;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
}

export function AreaChart({ data, title, height = 200, color = '#41d1c4', loading, error, emptyMessage }: AreaChartProps) {
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
        <div style={{ color: '#6b7a95', fontSize: 13, textAlign: 'center', padding: 32 }}>{emptyMessage || 'No data available'}</div>
      </Card>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const w = 100; const h = 100;
  const pts = data.map((d, i) => `${(i / (data.length - 1 || 1)) * w},${h - (d.value / maxVal) * 80}`);
  const polyline = pts.join(' ');
  const areaPts = `0,${h} ${polyline} ${w},${h}`;

  return (
    <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
      {title && <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 12 }}>{title}</div>}
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height }}>
        <defs>
          <linearGradient id={`area-grad-${title?.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <polygon fill={`url(#area-grad-${title?.replace(/\s/g, '')})`} points={areaPts} />
        <polyline fill="none" stroke={color} strokeWidth="0.6" points={polyline} vectorEffect="non-scaling-stroke" />
        {pts.map((pt, i) => {
          const [x, y] = pt.split(',');
          return <circle key={i} cx={x} cy={y} r="0.6" fill={color} />;
        })}
      </svg>
    </Card>
  );
}
