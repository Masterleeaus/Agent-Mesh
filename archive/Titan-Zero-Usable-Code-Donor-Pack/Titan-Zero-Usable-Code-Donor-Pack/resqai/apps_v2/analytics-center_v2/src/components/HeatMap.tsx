import { Card } from '../../../../shared/src/components';
import type { HeatMapCellVM } from '../models/view-models';

interface HeatMapProps {
  cells: HeatMapCellVM[];
  xLabels: string[];
  yLabels: string[];
  title?: string;
  loading?: boolean;
  error?: string | null;
  height?: number;
}

export function HeatMap({ cells, xLabels, yLabels, title, loading, error, height = 300 }: HeatMapProps) {
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
  if (cells.length === 0 || xLabels.length === 0 || yLabels.length === 0) {
    return (
      <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
        <div style={{ color: '#6b7a95', fontSize: 13, textAlign: 'center', padding: 32 }}>No heat map data available</div>
      </Card>
    );
  }

  const cellSize = Math.min(60, (800 - 80) / xLabels.length);

  return (
    <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
      {title && <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 12 }}>{title}</div>}
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', marginLeft: 80 }}>
          {xLabels.map((label, i) => (
            <div key={i} style={{ width: cellSize, textAlign: 'center', fontSize: 11, color: '#8b9bb5', padding: '4px 0', fontWeight: 500 }}>{label}</div>
          ))}
        </div>
        {yLabels.map((rowLabel, ri) => (
          <div key={ri} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 80, fontSize: 11, color: '#8b9bb5', paddingRight: 8, textAlign: 'right', fontWeight: 500 }}>{rowLabel}</div>
            {xLabels.map((colLabel, ci) => {
              const cell = cells.find((c) => c.row === rowLabel && c.column === colLabel);
              const value = cell?.value ?? 0;
              const cellColor = cell?.color || '#1a2540';
              return (
                <div
                  key={ci}
                  style={{
                    width: cellSize, height: cellSize,
                    background: cellColor, borderRadius: 4,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, color: value > 0.5 ? '#e6ecf5' : '#8b9bb5', fontWeight: 600,
                    margin: 1, transition: 'background 0.2s',
                  }}
                  title={`${rowLabel} / ${colLabel}: ${value}`}
                >
                  {value}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </Card>
  );
}
