import { useState } from 'react';
import { useAPIKeys } from '../hooks/useAPIKeys';
import { Card, Table, Button, StatusBadge, Skeleton, EmptyState, ErrorState, Dialog } from '@resqai/foundation';
import type { APIKeyDTO } from '../models';

const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#e6ecf5' };

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = { active: 'success', revoked: 'error', expired: 'neutral' };

export function APIKeysPage() {
  const { data, loading, error, revoke, refetch } = useAPIKeys();
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const handleRevoke = async (id: string) => {
    setRevoking(true);
    try { await revoke(id); } finally { setRevoking(false); setConfirmRevoke(null); }
  };

  if (error) return <ErrorState title="Failed to load API keys" message={error} onRetry={refetch} />;

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>API Keys</span>
        <Button onClick={() => setShowCreate(true)}>+ New API Key</Button>
      </div>
      {loading && data.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[1,2,3].map(i => <Skeleton key={i} variant="card" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState title="No API keys" description="No API keys have been created." action={<Button onClick={() => setShowCreate(true)}>Create API Key</Button>} />
      ) : (
        <Table
          columns={[
            { key: 'name', header: 'Name', render: (_v: unknown, r: APIKeyDTO) => r.name, sortable: true },
            { key: 'key', header: 'Key', render: (_v: unknown, r: APIKeyDTO) => r.maskedKey, sortable: true },
            { key: 'status', header: 'Status', render: (_v: unknown, r: APIKeyDTO) => <StatusBadge variant={statusVariant[r.status]} size="sm">{r.status}</StatusBadge> },
            { key: 'permissions', header: 'Permissions', render: (_v: unknown, r: APIKeyDTO) => r.permissions.join(', ') },
            { key: 'createdBy', header: 'Created By', render: (_v: unknown, r: APIKeyDTO) => r.createdBy },
            { key: 'lastUsed', header: 'Last Used', render: (_v: unknown, r: APIKeyDTO) => r.lastUsed ? new Date(r.lastUsed).toLocaleString() : 'Never' },
            { key: 'expires', header: 'Expires', render: (_v: unknown, r: APIKeyDTO) => r.expiresAt ? new Date(r.expiresAt).toLocaleDateString() : 'Never' },
            { key: 'actions', header: '', render: (_v: unknown, r: APIKeyDTO) => r.status === 'active' ? (
              <Button size="sm" variant="danger" onClick={() => setConfirmRevoke(r.id)}>Revoke</Button>
            ) : null },
          ]}
          data={data.map(d => ({ ...d, id: d.id }))}
          loading={loading}
          emptyMessage="No API keys"
          sortable
        />
      )}
      <Dialog open={!!confirmRevoke} onClose={() => setConfirmRevoke(null)} title="Revoke API Key" size="sm">
        <div style={{ color: '#c0ccdc', fontSize: 14, marginBottom: 16 }}>This action cannot be undone. Applications using this key will lose access.</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setConfirmRevoke(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => confirmRevoke && handleRevoke(confirmRevoke)} loading={revoking}>Revoke</Button>
        </div>
      </Dialog>
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="Create API Key" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ color: '#8b9bb5', fontSize: 13 }}>Use the Security Center to create new API keys with full permission control.</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Close</Button>
            <Button onClick={() => { window.location.hash = '#/security'; setShowCreate(false); }}>Go to Security Center</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
