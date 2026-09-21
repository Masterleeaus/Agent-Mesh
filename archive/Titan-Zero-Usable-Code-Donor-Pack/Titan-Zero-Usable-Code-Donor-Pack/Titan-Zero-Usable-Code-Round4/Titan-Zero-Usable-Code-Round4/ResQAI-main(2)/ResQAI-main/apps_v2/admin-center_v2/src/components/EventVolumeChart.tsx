import { type FC } from 'react';
import { Card } from '@resqai/foundation';

const cardStyle: React.CSSProperties = { background: '#131c2f', border: '1px solid #243049', borderRadius: 8, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200 };
const titleStyle: React.CSSProperties = { color: '#8b9bb5', fontSize: 13, marginBottom: 8 };
const barContainer: React.CSSProperties = { display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, paddingTop: 16 };
const barStyle = (h: number): React.CSSProperties => ({ width: 32, height: h, background: '#41d1c4', borderRadius: '4px 4px 0 0', opacity: 0.8, transition: 'height 0.3s' });

export const EventVolumeChart: FC<{ data?: { hour: string; count: number }[] }> = ({ data }) => {
  const points = data || [
    { hour: '00', count: 120 }, { hour: '04', count: 80 }, { hour: '08', count: 210 },
    { hour: '12', count: 340 }, { hour: '16', count: 290 }, { hour: '20', count: 180 },
  ];
  const max = Math.max(...points.map(p => p.count), 1);

  return (
    <Card style={cardStyle}>
      <div style={titleStyle}>Event Volume (Last 24h)</div>
      <div style={barContainer}>
        {points.map(p => (
          <div key={p.hour} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={barStyle((p.count / max) * 100)} />
            <span style={{ color: '#6a7a94', fontSize: 10 }}>{p.hour}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};
