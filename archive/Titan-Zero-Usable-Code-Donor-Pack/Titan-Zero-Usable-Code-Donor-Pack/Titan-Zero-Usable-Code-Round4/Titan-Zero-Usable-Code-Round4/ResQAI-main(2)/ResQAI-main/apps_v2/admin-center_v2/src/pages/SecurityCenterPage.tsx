import { useState } from 'react';
import { useAPIKeys } from '../hooks/useAPIKeys';
import { useSessions } from '../hooks/useSessions';
import { Card, Table, Button, Tabs, StatusBadge, Skeleton, EmptyState, ErrorState, Dialog } from '@resqai/foundation';
import type { APIKeyDTO, SessionDTO } from '../models';
import { ActiveSessionList } from '../components/ActiveSessionList';
import { forceLogout } from '../services/admin-service';

const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#e6ecf5' };
const cardStyle: React.CSSProperties = { background: '#131c2f', border: '1px solid #243049', borderRadius: 8, padding: 20 };
const sectionTitle: React.CSSProperties = { fontSize: 16, fontWeight: 600, color: '#e6ecf5', marginBottom: 12 };

const keyStatusVariant: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = { active: 'success', revoked: 'error', expired: 'neutral' };

const securitySettings = [
  { id: 'ss1', name: 'Password Policy', value: 'Min 12 chars, 1 upper, 1 number, 1 special', status: 'Compliant' },
  { id: 'ss2', name: 'MFA Enforcement', value: 'Required for all admin accounts', status: 'Compliant' },
  { id: 'ss3', name: 'Session Timeout', value: '60 minutes of inactivity', status: 'Configured' },
  { id: 'ss4', name: 'Rate Limiting', value: '1000 requests/min per API key', status: 'Active' },
  { id: 'ss5', name: 'IP Whitelist', value: 'Not configured', status: 'Warning' },
  { id: 'ss6', name: 'Audit Logging', value: 'All admin actions logged', status: 'Active' },
];

export function SecurityCenterPage() {
  const [activeTab, setActiveTab] = useState('apikeys');
  const { data: apiKeys, loading: keysLoading, error: keysError, revoke } = useAPIKeys();
  const { data: sessions, loading: sessionsLoading, error: sessionsError } = useSessions();
  const [revoking, setRevoking] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    try { await revoke(id); } finally { setRevoking(null); setConfirmRevoke(null); }
  };

  const handleForceLogout = async (id: string) => {
    await forceLogout(id);
  };

  return (
    <div style={pageStyle}>
      <div style={titleStyle}>Security Center</div>
      <Tabs tabs={[
        { id: 'apikeys', label: 'API Keys', badge: apiKeys.length },
        { id: 'sessions', label: 'Active Sessions', badge: sessions.length },
        { id: 'settings', label: 'Security Settings' },
      ]} activeId={activeTab} onChange={setActiveTab} />
      {activeTab === 'apikeys' && (
        <Card style={cardStyle}>
          <div style={sectionTitle}>API Keys</div>
          {keysLoading ? <Skeleton variant="card" /> : keysError ? <ErrorState title="Failed" message={keysError} /> : apiKeys.length === 0 ? (
            <EmptyState title="No API keys" description="No API keys have been created." />
          ) : (
            <Table
              columns={[
                { key: 'name', header: 'Name', render: (_v: unknown, r: APIKeyDTO) => r.name, sortable: true },
                { key: 'key', header: 'Key', render: (_v: unknown, r: APIKeyDTO) => r.maskedKey },
                { key: 'status', header: 'Status', render: (_v: unknown, r: APIKeyDTO) => <StatusBadge variant={keyStatusVariant[r.status]} size="sm">{r.status}</StatusBadge> },
                { key: 'permissions', header: 'Permissions', render: (_v: unknown, r: APIKeyDTO) => r.permissions.join(', ') },
                { key: 'lastUsed', header: 'Last Used', render: (_v: unknown, r: APIKeyDTO) => r.lastUsed ? new Date(r.lastUsed).toLocaleString() : 'Never' },
                { key: 'actions', header: '', render: (_v: unknown, r: APIKeyDTO) => r.status === 'active' ? (
                  <Button size="sm" variant="danger" onClick={() => setConfirmRevoke(r.id)}>Revoke</Button>
                ) : null },
              ]}
              data={apiKeys.map(d => ({ ...d, id: d.id }))}
              loading={keysLoading}
              emptyMessage="No API keys"
              sortable
            />
          )}
        </Card>
      )}
      {activeTab === 'sessions' && (
        <Card style={cardStyle}>
          <div style={sectionTitle}>Active Sessions</div>
          {sessionsLoading ? <Skeleton variant="card" /> : sessionsError ? <ErrorState title="Failed" message={sessionsError} /> : sessions.length === 0 ? (
            <EmptyState title="No sessions" description="No active sessions." />
          ) : (
            <ActiveSessionList data={sessions} loading={sessionsLoading} onForceLogout={handleForceLogout} />
          )}
        </Card>
      )}
      {activeTab === 'settings' && (
        <Card style={cardStyle}>
          <div style={sectionTitle}>Security Configuration</div>
          <Table
            columns={[
              { key: 'name', header: 'Setting', render: (_v: unknown, r: any) => r.name, sortable: true },
              { key: 'value', header: 'Value', render: (_v: unknown, r: any) => r.value },
              { key: 'status', header: 'Status', render: (_v: unknown, r: any) => <StatusBadge variant={r.status === 'Compliant' ? 'success' : r.status === 'Warning' ? 'warning' : 'neutral'} size="sm">{r.status}</StatusBadge> },
            ]}
            data={securitySettings.map(s => ({ ...s, id: s.id }))}
            emptyMessage="No settings"
          />
        </Card>
      )}
      <Dialog open={!!confirmRevoke} onClose={() => setConfirmRevoke(null)} title="Revoke API Key" size="sm">
        <div style={{ color: '#c0ccdc', fontSize: 14, marginBottom: 16 }}>Are you sure you want to revoke this API key? This action cannot be undone.</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setConfirmRevoke(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => confirmRevoke && handleRevoke(confirmRevoke)} loading={revoking === confirmRevoke}>Revoke</Button>
        </div>
      </Dialog>
    </div>
  );
}
