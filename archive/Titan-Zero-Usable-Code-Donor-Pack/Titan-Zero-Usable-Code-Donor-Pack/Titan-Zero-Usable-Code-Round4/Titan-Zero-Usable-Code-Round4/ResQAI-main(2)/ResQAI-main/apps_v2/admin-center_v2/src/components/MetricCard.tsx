import { type FC } from 'react';
import { Card } from '@resqai/foundation';
import type { PlatformMetricDTO } from '../models';

const cardStyle: React.CSSProperties = { background: '#131c2f', border: '1px solid #243049', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 4 };
const valueStyle: React.CSSProperties = { fontSize: 24, fontWeight: 700, color: '#e6ecf5' };
const labelStyle: React.CSSProperties = { fontSize: 12, color: '#8b9bb5' };
const unitStyle: React.CSSProperties = { fontSize: 13, color: '#6a7a94', fontWeight: 400 };
const trendUp: React.CSSProperties = { color: '#ef5350', fontSize: 12 };
const trendDown: React.CSSProperties = { color: '#41d1c4', fontSize: 12 };
const trendStable: React.CSSProperties = { color: '#8b9bb5', fontSize: 12 };

export const MetricCard: FC<{ metric: PlatformMetricDTO }> = ({ metric }) => {
  const trendStyle = metric.trend === 'up' ? trendUp : metric.trend === 'down' ? trendDown : trendStable;
  const trendIcon = metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→';
  return (
    <Card style={cardStyle}>
      <div style={labelStyle}>{metric.name}</div>
      <div style={valueStyle}>{metric.value}<span style={unitStyle}> {metric.unit}</span></div>
      <div style={trendStyle}>{trendIcon} {metric.trend}</div>
    </Card>
  );
};
