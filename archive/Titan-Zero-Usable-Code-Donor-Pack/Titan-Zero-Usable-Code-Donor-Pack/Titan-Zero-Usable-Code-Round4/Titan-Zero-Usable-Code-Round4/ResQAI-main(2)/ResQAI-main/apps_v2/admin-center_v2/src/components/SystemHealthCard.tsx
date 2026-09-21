import { type FC } from 'react';
import { Card, StatusBadge } from '@resqai/foundation';
import type { SystemHealthVM } from '../models';

const cardStyle: React.CSSProperties = { background: '#131c2f', border: '1px solid #243049', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 4 };
const nameStyle: React.CSSProperties = { color: '#e6ecf5', fontSize: 14, fontWeight: 600 };
const metaStyle: React.CSSProperties = { color: '#8b9bb5', fontSize: 12 };
const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };

const statusVariant: Record<string, 'success' | 'warning' | 'error'> = { healthy: 'success', degraded: 'warning', down: 'error' };

export const SystemHealthCard: FC<{ service: SystemHealthVM }> = ({ service }) => (
  <Card style={cardStyle}>
    <div style={rowStyle}>
      <span style={nameStyle}>{service.appName}</span>
      <StatusBadge variant={statusVariant[service.status] || 'neutral'} size="sm">{service.status}</StatusBadge>
    </div>
    <div style={rowStyle}>
      <span style={metaStyle}>Uptime: {service.uptime}</span>
      <span style={metaStyle}>v{service.version}</span>
    </div>
  </Card>
);
