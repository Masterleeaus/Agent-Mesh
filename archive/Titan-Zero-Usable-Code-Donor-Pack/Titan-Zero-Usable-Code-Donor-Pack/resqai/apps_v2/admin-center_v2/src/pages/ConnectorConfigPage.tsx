import { useState } from 'react';
import { useConnectors } from '../hooks/useConnectors';
import { Button, Dialog, Input, Skeleton, EmptyState, ErrorState } from '@resqai/foundation';
import { ConnectorCard } from '../components/ConnectorCard';

const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#e6ecf5' };
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 };

export function ConnectorConfigPage() {
  const { data, loading, error, refetch } = useConnectors();
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [connType, setConnType] = useState('');

  const handleTest = async (id: string) => { alert(`Testing connector ${id}...`); };
  const handleEdit = (id: string) => { alert(`Editing connector ${id}...`); };

  if (error) return <ErrorState title="Failed to load connectors" message={error} onRetry={refetch} />;

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>Connector Configuration</span>
        <Button onClick={() => setAddOpen(true)}>+ Add Connector</Button>
      </div>
      {loading && data.length === 0 ? (
        <div style={gridStyle}>{[1,2,3].map(i => <Skeleton key={i} variant="card" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState title="No connectors configured" description="No third-party connectors have been configured yet." action={<Button onClick={() => setAddOpen(true)}>Add Connector</Button>} />
      ) : (
        <div style={gridStyle}>{data.map(c => <ConnectorCard key={c.id} connector={c} onEdit={handleEdit} onTest={handleTest} />)}</div>
      )}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} title="Add Connector" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder="Connector name" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ color: '#8b9bb5', fontSize: 12 }}>Type</span>
            <select value={connType} onChange={e => setConnType(e.target.value)} style={{ height: 40, padding: '0 12px', background: '#0b1220', border: '1px solid #243049', borderRadius: 6, color: '#e6ecf5', fontSize: 13 }}>
              <option value="">Select type</option>
              <option value="slack">Slack</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="webhook">Webhook</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={() => { setAddOpen(false); alert('Connector creation requested (mock)'); }}>Create</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
