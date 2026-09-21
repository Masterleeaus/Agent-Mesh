import { Card } from '../../../../shared/src/components';
import type { BarChartDataVM } from '../models/view-models';

interface BarChartProps {
  data: BarChartDataVM[];
  title?: string;
  height?: number;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
}

export function BarChart({ data, title, height = 200, loading, error, emptyMessage }: BarChartProps) {
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
          {emptyMessage || 'No chart data available'}
        </div>
      </Card>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
      {title && <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 12 }}>{title}</div>}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height, padding: '0 4px' }}>
        {data.map((d, i) => {
          const barHeight = (d.value / maxVal) * 100;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 10, color: '#8b9bb5' }}>{d.value}</span>
              <div
                style={{
                  width: '100%',
                  height: `${barHeight}%`,
                  background: d.color || '#41d1c4',
                  borderRadius: '3px 3px 0 0',
                  minHeight: 4,
                  transition: 'height 0.3s ease',
                }}
              />
              <span style={{ fontSize: 10, color: '#6b7a95', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 60 }}>
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
