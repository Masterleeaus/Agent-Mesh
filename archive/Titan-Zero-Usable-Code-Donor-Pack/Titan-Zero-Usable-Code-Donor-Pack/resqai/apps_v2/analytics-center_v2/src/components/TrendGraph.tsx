import { Card } from '../../../../shared/src/components';
import type { TrendGraphDataVM } from '../models/view-models';

interface TrendGraphProps {
  data: TrendGraphDataVM;
  title?: string;
  height?: number;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
}

export function TrendGraph({ data, title, height = 200, loading, error, emptyMessage }: TrendGraphProps) {
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
  if (data.primary.length === 0) {
    return (
      <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
        <div style={{ color: '#6b7a95', fontSize: 13, textAlign: 'center', padding: 32 }}>{emptyMessage || 'No trend data available'}</div>
      </Card>
    );
  }

  const allValues = [...data.primary.map((d) => d.value), ...(data.comparison?.map((d) => d.value) || [])];
  const maxVal = Math.max(...allValues, 1);
  const minVal = Math.min(...allValues, 0);
  const range = maxVal - minVal || 1;
  const w = 100;
  const h = 100;

  const buildLine = (points: Array<{ date: string; value: number }>) =>
    points.map((d, i) => `${(i / (points.length - 1 || 1)) * w},${h - ((d.value - minVal) / range) * 80}`).join(' ');

  const primaryLine = buildLine(data.primary);
  const comparisonLine = data.comparison ? buildLine(data.comparison) : null;

  return (
    <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
      {title && <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 12 }}>{title}</div>}
      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 12, height: 3, background: '#41d1c4', borderRadius: 1 }} />
          <span style={{ fontSize: 11, color: '#8b9bb5' }}>Current Period</span>
        </div>
        {data.comparison && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 12, height: 3, background: '#7c3aed', borderRadius: 1 }} />
            <span style={{ fontSize: 11, color: '#8b9bb5' }}>Previous Period</span>
          </div>
        )}
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height }}>
        {comparisonLine && <polyline fill="none" stroke="#7c3aed" strokeWidth="0.4" strokeDasharray="2,1.5" points={comparisonLine} vectorEffect="non-scaling-stroke" />}
        <polyline fill="none" stroke="#41d1c4" strokeWidth="0.6" points={primaryLine} vectorEffect="non-scaling-stroke" />
        {data.primary.map((d, i) => {
          const x = (i / (data.primary.length - 1 || 1)) * w;
          const y = h - ((d.value - minVal) / range) * 80;
          return <circle key={i} cx={x} cy={y} r="0.6" fill="#41d1c4" />;
        })}
      </svg>
    </Card>
  );
}
