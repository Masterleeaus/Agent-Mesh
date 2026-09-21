import { useAgents } from '../hooks/useAgents';
import { Card, Table, Skeleton, EmptyState, ErrorState } from '@resqai/foundation';
import type { AgentDTO } from '../models';
import { AgentStatusBadge } from '../components/AgentStatusBadge';

const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#e6ecf5' };
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 };
const statCardStyle: React.CSSProperties = { background: '#131c2f', border: '1px solid #243049', borderRadius: 8, padding: 20, display: 'flex', flexDirection: 'column', gap: 4 };
const statValueStyle: React.CSSProperties = { fontSize: 28, fontWeight: 700, color: '#e6ecf5' };
const statLabelStyle: React.CSSProperties = { fontSize: 13, color: '#8b9bb5' };

export function AgentActivityPage() {
  const { data, loading, error, refetch } = useAgents();

  const online = data.filter(a => a.status === 'online' || a.status === 'busy').length;
  const totalConversations = data.reduce((s, a) => s + a.totalConversations, 0);

  if (error) return <ErrorState title="Failed to load agent activity" message={error} onRetry={refetch} />;

  return (
    <div style={pageStyle}>
      <div style={titleStyle}>Agent Activity</div>
      {loading && data.length === 0 ? (
        <div style={gridStyle}>{[1,2,3,4].map(i => <Skeleton key={i} variant="card" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState title="No agents" description="No AI agents are active." />
      ) : (
        <>
          <div style={gridStyle}>
            <Card style={statCardStyle}><span style={statValueStyle}>{data.length}</span><span style={statLabelStyle}>Total Agents</span></Card>
            <Card style={statCardStyle}><span style={statValueStyle}>{online}</span><span style={statLabelStyle}>Active Now</span></Card>
            <Card style={statCardStyle}><span style={statValueStyle}>{totalConversations.toLocaleString()}</span><span style={statLabelStyle}>Total Conversations</span></Card>
            <Card style={statCardStyle}><span style={statValueStyle}>{data.filter(a => a.status === 'error').length}</span><span style={statLabelStyle}>In Error</span></Card>
          </div>
          <Table
            columns={[
              { key: 'name', header: 'Agent', render: (_v: unknown, r: AgentDTO) => r.name, sortable: true },
              { key: 'status', header: 'Status', render: (_v: unknown, r: AgentDTO) => <AgentStatusBadge status={r.status} /> },
              { key: 'lastActive', header: 'Last Active', render: (_v: unknown, r: AgentDTO) => r.lastActive ? new Date(r.lastActive).toLocaleString() : 'Never' },
              { key: 'conversations', header: 'Conversations', render: (_v: unknown, r: AgentDTO) => r.totalConversations.toLocaleString(), sortable: true },
              { key: 'app', header: 'App', render: (_v: unknown, r: AgentDTO) => r.appName },
            ]}
            data={data.map(d => ({ ...d, id: d.id }))}
            loading={loading}
            emptyMessage="No agents"
            sortable
          />
        </>
      )}
    </div>
  );
}
