import { useState } from 'react';
import { useAgents } from '../hooks/useAgents';
import { Card, Table, Button, Skeleton, EmptyState, ErrorState, Dialog } from '@resqai/foundation';
import type { AgentDTO } from '../models';
import { restartAgent } from '../services/admin-service';
import { AgentStatusBadge } from '../components/AgentStatusBadge';
import { useAgentDetail } from '../hooks/useAgentDetail';

const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#e6ecf5' };

export function AgentManagerPage() {
  const { data, loading, error, refetch } = useAgents();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: agentDetail } = useAgentDetail(selectedId || '');
  const [restarting, setRestarting] = useState<string | null>(null);

  const handleRestart = async (id: string) => {
    setRestarting(id);
    try { await restartAgent(id); refetch(); } finally { setRestarting(null); }
  };

  if (error) return <ErrorState title="Failed to load agents" message={error} onRetry={refetch} />;

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>Agent Manager</span>
      </div>
      {loading && data.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[1,2,3].map(i => <Skeleton key={i} variant="card" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState title="No agents" description="No AI agents have been deployed." />
      ) : (
        <Table
          columns={[
            { key: 'name', header: 'Agent', render: (_v: unknown, r: AgentDTO) => r.name, sortable: true },
            { key: 'app', header: 'App', render: (_v: unknown, r: AgentDTO) => r.appName },
            { key: 'status', header: 'Status', render: (_v: unknown, r: AgentDTO) => <AgentStatusBadge status={r.status} /> },
            { key: 'type', header: 'Type', render: (_v: unknown, r: AgentDTO) => r.type },
            { key: 'model', header: 'Model', render: (_v: unknown, r: AgentDTO) => r.model },
            { key: 'conversations', header: 'Conversations', render: (_v: unknown, r: AgentDTO) => r.totalConversations.toLocaleString(), sortable: true },
            { key: 'lastActive', header: 'Last Active', render: (_v: unknown, r: AgentDTO) => r.lastActive ? new Date(r.lastActive).toLocaleString() : '—' },
            { key: 'actions', header: '', render: (_v: unknown, r: AgentDTO) => (
              <div style={{ display: 'flex', gap: 4 }}>
                <Button size="sm" variant="secondary" onClick={() => setSelectedId(r.id)}>Details</Button>
                <Button size="sm" variant="secondary" onClick={() => handleRestart(r.id)} loading={restarting === r.id} disabled={restarting === r.id}>Restart</Button>
              </div>
            )},
          ]}
          data={data.map(d => ({ ...d, id: d.id }))}
          loading={loading}
          emptyMessage="No agents"
          sortable
        />
      )}
      <Dialog open={!!selectedId && !!agentDetail} onClose={() => setSelectedId(null)} title={`Agent: ${agentDetail?.name}`} size="md">
        {agentDetail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><span style={{ color: '#8b9bb5', fontSize: 12 }}>Description</span><div style={{ color: '#e6ecf5', fontSize: 13 }}>{agentDetail.description}</div></div>
            <div><span style={{ color: '#8b9bb5', fontSize: 12 }}>Type</span><div style={{ color: '#e6ecf5', fontSize: 13 }}>{agentDetail.type}</div></div>
            <div><span style={{ color: '#8b9bb5', fontSize: 12 }}>Model</span><div style={{ color: '#e6ecf5', fontSize: 13 }}>{agentDetail.model}</div></div>
            <div><span style={{ color: '#8b9bb5', fontSize: 12 }}>Memory</span><div style={{ color: '#e6ecf5', fontSize: 13 }}>{agentDetail.memory}MB</div></div>
            <div><span style={{ color: '#8b9bb5', fontSize: 12 }}>Created</span><div style={{ color: '#e6ecf5', fontSize: 13 }}>{new Date(agentDetail.createdAt).toLocaleDateString()}</div></div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
