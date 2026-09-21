import { useState, useEffect } from 'react';
import { useRoleDetail } from '../hooks/useRoleDetail';
import { Card, Form, Button, Input, StatusBadge, Skeleton, EmptyState, ErrorState } from '@resqai/foundation';
import { PermissionCheckboxTree } from '../components/PermissionCheckboxTree';
import type { UpdateRoleRequest } from '../models';
import { updateRole } from '../services/admin-service';

const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#e6ecf5' };
const backStyle: React.CSSProperties = { color: '#41d1c4', fontSize: 13, cursor: 'pointer', textDecoration: 'none' };
const cardStyle: React.CSSProperties = { background: '#131c2f', border: '1px solid #243049', borderRadius: 8, padding: 24, maxWidth: 640 };
const infoRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #243049' };
const infoLabel: React.CSSProperties = { color: '#8b9bb5', fontSize: 13 };
const infoValue: React.CSSProperties = { color: '#e6ecf5', fontSize: 13 };

export function RoleDetailPage({ roleId }: { roleId: string }) {
  const { data, loading, error } = useRoleDetail(roleId);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (data) { setName(data.name); setDescription(data.description); } }, [data]);

  const handleSave = async () => {
    setSaving(true);
    try { await updateRole(roleId, { name, description } as UpdateRoleRequest); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={pageStyle}><Skeleton variant="card" /><Skeleton variant="card" /></div>;
  if (error) return <ErrorState title="Failed to load role" message={error} />;
  if (!data) return <EmptyState title="Role not found" description={`No role found with ID: ${roleId}`} />;

  return (
    <div style={pageStyle}>
      <div><a style={backStyle} onClick={() => { window.location.hash = '#/roles'; }}>← Back to Roles</a></div>
      <div style={titleStyle}>{data.name}</div>
      <Card style={cardStyle}>
        <div style={infoRow}><span style={infoLabel}>Role ID</span><span style={infoValue}>{data.id}</span></div>
        <div style={infoRow}><span style={infoLabel}>Users</span><span style={infoValue}>{data.userCount}</span></div>
        <div style={infoRow}><span style={infoLabel}>App Scope</span><span style={infoValue}>{data.appScope.join(', ')}</span></div>
        <div style={infoRow}><span style={infoLabel}>Created</span><span style={infoValue}>{new Date(data.createdAt).toLocaleDateString()}</span></div>
      </Card>
      <Card style={cardStyle}>
        <Form>
          <Form.Field label="Role Name"><Input value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} /></Form.Field>
          <Form.Field label="Description"><Input value={description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)} /></Form.Field>
          <Form.Field label="Permissions">
            <PermissionCheckboxTree
              nodes={data.permissions.map(p => ({ id: p.id, label: p.label, checked: p.checked, children: p.children?.map(c => ({ id: c.id, label: c.label, checked: c.checked })) }))}
              onChange={() => {}}
            />
          </Form.Field>
          <div style={{ display: 'flex', gap: 12, marginTop: 16, alignItems: 'center' }}>
            <Button onClick={handleSave} loading={saving} disabled={saving}>Save Changes</Button>
            {saved && <StatusBadge variant="success">Saved</StatusBadge>}
          </div>
        </Form>
      </Card>
    </div>
  );
}
