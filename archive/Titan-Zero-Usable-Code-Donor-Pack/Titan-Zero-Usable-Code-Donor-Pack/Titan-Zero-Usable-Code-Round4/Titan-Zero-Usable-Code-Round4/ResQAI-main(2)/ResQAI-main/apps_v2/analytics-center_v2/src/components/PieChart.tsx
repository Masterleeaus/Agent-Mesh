import { Card } from '../../../../shared/src/components';
import type { PieChartSliceVM } from '../models/view-models';

interface PieChartProps {
  data: PieChartSliceVM[];
  title?: string;
  size?: number;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
}

export function PieChart({ data, title, size = 180, loading, error, emptyMessage }: PieChartProps) {
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
        <div style={{ width: size, height: size, borderRadius: '50%', background: '#1a2540', margin: '0 auto' }} />
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
        <div style={{ color: '#6b7a95', fontSize: 13, textAlign: 'center', padding: 32 }}>
          {emptyMessage || 'No distribution data available'}
        </div>
      </Card>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  let cumulativePercent = 0;
  const slices = data.map((d) => {
    const percent = (d.value / total) * 100;
    const startPercent = cumulativePercent;
    cumulativePercent += percent;
    return { ...d, startPercent, percent };
  });

  return (
    <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
      {title && <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 12 }}>{title}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <svg width={size} height={size} viewBox="0 0 100 100">
          {slices.map((s, i) => {
            const startAngle = (s.startPercent / 100) * 360;
            const endAngle = ((s.startPercent + s.percent) / 100) * 360;
            const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
            const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
            const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
            const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
            const largeArc = s.percent > 50 ? 1 : 0;
            return (
              <path
                key={i}
                d={`M50,50 L${x1},${y1} A40,40 0 ${largeArc},1 ${x2},${y2} Z`}
                fill={s.color}
                stroke="#0b1220"
                strokeWidth="0.5"
              />
            );
          })}
          <circle cx="50" cy="50" r="20" fill="#131c2f" />
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {slices.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color }} />
              <span style={{ fontSize: 12, color: '#8b9bb5' }}>{s.label}</span>
              <span style={{ fontSize: 12, color: '#e6ecf5', fontWeight: 600 }}>{s.percent.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
