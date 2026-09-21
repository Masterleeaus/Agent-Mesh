import { type FC } from 'react';
import { Card, StatusBadge, Button } from '@resqai/foundation';
import type { ConnectorDTO } from '../models';

const cardStyle: React.CSSProperties = { background: '#131c2f', border: '1px solid #243049', borderRadius: 8, padding: 16 };
const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const nameStyle: React.CSSProperties = { color: '#e6ecf5', fontSize: 15, fontWeight: 600 };
const typeStyle: React.CSSProperties = { color: '#8b9bb5', fontSize: 12, marginTop: 2 };
const detailStyle: React.CSSProperties = { color: '#8b9bb5', fontSize: 12 };
const footerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid #243049' };

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = { connected: 'success', error: 'error', disconnected: 'neutral', pending: 'warning' };

export const ConnectorCard: FC<{ connector: ConnectorDTO; onEdit: (id: string) => void; onTest: (id: string) => void; }> = ({ connector, onEdit, onTest }) => (
  <Card style={cardStyle}>
    <div style={rowStyle}>
      <div>
        <div style={nameStyle}>{connector.name}</div>
        <div style={typeStyle}>{connector.type.toUpperCase()}</div>
      </div>
      <StatusBadge variant={statusVariant[connector.status] || 'neutral'} size="sm">{connector.status}</StatusBadge>
    </div>
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {Object.entries(connector.config).slice(0, 2).map(([k, v]) => (
        <div key={k} style={detailStyle}>{k}: {v.length > 30 ? v.substring(0, 30) + '...' : v}</div>
      ))}
      {connector.lastTested && <div style={detailStyle}>Last tested: {new Date(connector.lastTested).toLocaleString()}</div>}
      {connector.lastError && <div style={{ ...detailStyle, color: '#ef5350' }}>Error: {connector.lastError}</div>}
    </div>
    <div style={footerStyle}>
      <Button size="sm" variant="ghost" onClick={() => onEdit(connector.id)}>Edit</Button>
      <Button size="sm" variant="outline" onClick={() => onTest(connector.id)}>Test</Button>
    </div>
  </Card>
);
