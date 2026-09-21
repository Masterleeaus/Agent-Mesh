import { useState } from 'react';
import { useIntegrations } from '../hooks/useIntegrations';
import { Card, Table, Button, StatusBadge, Skeleton, EmptyState, ErrorState, Dialog, Input } from '@resqai/foundation';
import type { IntegrationDTO } from '../models';

const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#e6ecf5' };

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = { connected: 'success', error: 'error', disconnected: 'neutral', pending: 'warning' };

export function IntegrationsPage() {
  const { data, loading, error, refetch } = useIntegrations();
  const [selected, setSelected] = useState<IntegrationDTO | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  if (error) return <ErrorState title="Failed to load integrations" message={error} onRetry={refetch} />;

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>Integrations</span>
        <Button onClick={() => setAddOpen(true)}>+ Add Integration</Button>
      </div>
      {loading && data.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[1,2,3].map(i => <Skeleton key={i} variant="card" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState title="No integrations" description="No third-party integrations configured." action={<Button onClick={() => setAddOpen(true)}>Add Integration</Button>} />
      ) : (
        <Table
          columns={[
            { key: 'name', header: 'Integration', render: (_v: unknown, r: IntegrationDTO) => r.name, sortable: true },
            { key: 'type', header: 'Type', render: (_v: unknown, r: IntegrationDTO) => r.type },
            { key: 'category', header: 'Category', render: (_v: unknown, r: IntegrationDTO) => r.category },
            { key: 'status', header: 'Status', render: (_v: unknown, r: IntegrationDTO) => <StatusBadge variant={statusVariant[r.status]} size="sm">{r.status}</StatusBadge> },
            { key: 'description', header: 'Description', render: (_v: unknown, r: IntegrationDTO) => r.description },
            { key: 'actions', header: '', render: (_v: unknown, r: IntegrationDTO) => (
              <Button size="sm" variant="secondary" onClick={() => setSelected(r)}>Configure</Button>
            )},
          ]}
          data={data.map(d => ({ ...d, id: d.id }))}
          loading={loading}
          emptyMessage="No integrations"
          onRowClick={r => setSelected(r as IntegrationDTO)}
          sortable
        />
      )}
      <Dialog open={!!selected} onClose={() => setSelected(null)} title={`Integration: ${selected?.name}`} size="md">
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><span style={{ color: '#8b9bb5', fontSize: 12 }}>Description</span><div style={{ color: '#e6ecf5', fontSize: 13 }}>{selected.description}</div></div>
            <div><span style={{ color: '#8b9bb5', fontSize: 12 }}>Docs</span><div style={{ color: '#41d1c4', fontSize: 13 }}>{selected.docs}</div></div>
            <div><span style={{ color: '#8b9bb5', fontSize: 12 }}>Config Fields</span><div style={{ color: '#e6ecf5', fontSize: 13 }}>{selected.configFields.join(', ')}</div></div>
          </div>
        )}
      </Dialog>
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} title="Add Integration" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input value="" placeholder="Integration name" onChange={() => {}} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={() => { setAddOpen(false); }}>Create</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
