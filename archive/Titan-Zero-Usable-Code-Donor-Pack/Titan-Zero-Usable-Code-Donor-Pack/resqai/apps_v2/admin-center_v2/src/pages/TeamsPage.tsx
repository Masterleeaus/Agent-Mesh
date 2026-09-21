import { useState } from 'react';
import { useTeams } from '../hooks/useTeams';
import { Card, Table, Button, Skeleton, EmptyState, ErrorState, Dialog, Input } from '@resqai/foundation';
import type { TeamDTO } from '../models';
import { createTeam } from '../services/admin-service';

const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#e6ecf5' };

export function TeamsPage() {
  const { data, loading, error, refetch } = useTeams();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await createTeam({ name, description, organizationId: 'org1', appAccess: [] });
      setShowCreate(false); setName(''); setDescription(''); refetch();
    } finally { setCreating(false); }
  };

  if (error) return <ErrorState title="Failed to load teams" message={error} onRetry={refetch} />;

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>Teams</span>
        <Button onClick={() => setShowCreate(true)}>+ Create Team</Button>
      </div>
      {loading && data.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[1,2,3].map(i => <Skeleton key={i} variant="card" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState title="No teams" description="No teams have been created." action={<Button onClick={() => setShowCreate(true)}>Create Team</Button>} />
      ) : (
        <Table
          columns={[
            { key: 'name', header: 'Team', render: (_v: unknown, r: TeamDTO) => r.name, sortable: true },
            { key: 'description', header: 'Description', render: (_v: unknown, r: TeamDTO) => r.description },
            { key: 'org', header: 'Organization', render: (_v: unknown, r: TeamDTO) => r.organizationName },
            { key: 'members', header: 'Members', render: (_v: unknown, r: TeamDTO) => r.memberCount, sortable: true },
            { key: 'apps', header: 'App Access', render: (_v: unknown, r: TeamDTO) => r.appAccess.join(', ') },
          ]}
          data={data.map(d => ({ ...d, id: d.id }))}
          loading={loading}
          emptyMessage="No teams"
          sortable
        />
      )}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="Create Team" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input value={name} onChange={(e: any) => setName(e.target.value)} placeholder="Team name" />
          <Input value={description} onChange={(e: any) => setDescription(e.target.value)} placeholder="Description" />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating} disabled={creating || !name.trim()}>Create</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
