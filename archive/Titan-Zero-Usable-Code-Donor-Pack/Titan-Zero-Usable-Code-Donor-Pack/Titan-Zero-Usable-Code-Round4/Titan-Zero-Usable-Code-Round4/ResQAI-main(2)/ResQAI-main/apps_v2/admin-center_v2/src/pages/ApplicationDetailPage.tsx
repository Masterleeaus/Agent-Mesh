import { useApplicationDetail } from '../hooks/useApplicationDetail';
import { Card, StatusBadge, Tabs, Skeleton, EmptyState, ErrorState } from '@resqai/foundation';
import { useState } from 'react';

const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#e6ecf5' };
const backStyle: React.CSSProperties = { color: '#41d1c4', fontSize: 13, cursor: 'pointer', textDecoration: 'none' };
const cardStyle: React.CSSProperties = { background: '#131c2f', border: '1px solid #243049', borderRadius: 8, padding: 20 };
const infoRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #243049' };
const infoLabel: React.CSSProperties = { color: '#8b9bb5', fontSize: 13 };
const infoValue: React.CSSProperties = { color: '#e6ecf5', fontSize: 13 };
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 };

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = { active: 'success', maintenance: 'warning', degraded: 'error', down: 'error' };

export function ApplicationDetailPage({ appId }: { appId: string }) {
  const { data, loading, error } = useApplicationDetail(appId);
  const [activeTab, setActiveTab] = useState('overview');

  if (loading) return <div style={pageStyle}><Skeleton variant="card" /><Skeleton variant="card" /></div>;
  if (error) return <ErrorState title="Failed to load application" message={error} />;
  if (!data) return <EmptyState title="Application not found" description={`No application found with ID: ${appId}`} />;

  return (
    <div style={pageStyle}>
      <div><a style={backStyle} onClick={() => { window.location.hash = '#/applications'; }}>← Back to Applications</a></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 28 }}>{data.icon}</span>
        <div>
          <div style={titleStyle}>{data.name}</div>
          <div style={{ color: '#8b9bb5', fontSize: 13 }}>{data.key} · v{data.version}</div>
        </div>
        <StatusBadge variant={statusVariant[data.status] || 'neutral'}>{data.status}</StatusBadge>
      </div>
      <Tabs tabs={[
        { id: 'overview', label: 'Overview' },
        { id: 'workflows', label: 'Workflows', badge: data.workflows },
        { id: 'functions', label: 'Functions', badge: data.functions },
        { id: 'agents', label: 'Agents', badge: data.agents },
      ]} activeId={activeTab} onChange={setActiveTab} />
      {activeTab === 'overview' && (
        <Card style={cardStyle}>
          <div style={{ color: '#e6ecf5', fontSize: 14, marginBottom: 12 }}>{data.description}</div>
          <div style={gridStyle}>
            <div><div style={infoLabel}>Category</div><div style={infoValue}>{data.category}</div></div>
            <div><div style={infoLabel}>Owner</div><div style={infoValue}>{data.owner}</div></div>
            <div><div style={infoLabel}>Users</div><div style={infoValue}>{data.userCount}</div></div>
            <div><div style={infoLabel}>Uptime</div><div style={infoValue}>{data.uptime}</div></div>
            <div><div style={infoLabel}>URL</div><div style={infoValue}>{data.url}</div></div>
            <div><div style={infoLabel}>Last Deployed</div><div style={infoValue}>{new Date(data.lastDeployed).toLocaleString()}</div></div>
            <div><div style={infoLabel}>Created</div><div style={infoValue}>{new Date(data.createdAt).toLocaleDateString()}</div></div>
          </div>
        </Card>
      )}
      {activeTab === 'workflows' && (
        <Card style={cardStyle}><div style={{ color: '#8b9bb5' }}>{data.workflows} workflows configured for this application.</div></Card>
      )}
      {activeTab === 'functions' && (
        <Card style={cardStyle}><div style={{ color: '#8b9bb5' }}>{data.functions} functions deployed for this application.</div></Card>
      )}
      {activeTab === 'agents' && (
        <Card style={cardStyle}><div style={{ color: '#8b9bb5' }}>{data.agents} AI agents associated with this application.</div></Card>
      )}
    </div>
  );
}
