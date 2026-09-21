import { type FC } from 'react';
import { Card, StatusBadge } from '@resqai/foundation';
import type { ApplicationDTO } from '../models';

const cardStyle: React.CSSProperties = { background: '#131c2f', border: '1px solid #243049', borderRadius: 8, padding: 16, cursor: 'pointer', transition: 'border-color 0.2s' };
const cardHover: React.CSSProperties = { ...cardStyle, borderColor: '#41d1c4' };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' };
const nameStyle: React.CSSProperties = { color: '#e6ecf5', fontSize: 15, fontWeight: 600 };
const versionStyle: React.CSSProperties = { color: '#8b9bb5', fontSize: 11, marginTop: 2 };
const descStyle: React.CSSProperties = { color: '#8b9bb5', fontSize: 12, marginTop: 8 };
const metaStyle: React.CSSProperties = { color: '#8b9bb5', fontSize: 11, display: 'flex', gap: 16, marginTop: 12, paddingTop: 12, borderTop: '1px solid #243049' };
const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = { active: 'success', maintenance: 'warning', degraded: 'error', down: 'error' };

export const ApplicationCard: FC<{ app: ApplicationDTO; onClick: (id: string) => void }> = ({ app, onClick }) => (
  <Card style={cardStyle} onClick={() => onClick(app.id)}>
    <div style={headerStyle}>
      <div><div style={nameStyle}>{app.icon} {app.name}</div><div style={versionStyle}>v{app.version}</div></div>
      <StatusBadge variant={statusVariant[app.status] || 'neutral'} size="sm">{app.status}</StatusBadge>
    </div>
    <div style={descStyle}>{app.description}</div>
    <div style={metaStyle}><span>👥 {app.userCount}</span><span>⏱ {app.uptime}</span><span>📅 {new Date(app.lastDeployed).toLocaleDateString()}</span></div>
  </Card>
);
