import { useState } from 'react';
import { Card, Form, Button, Input } from '@resqai/foundation';
import type { CreateRoleRequest } from '../models';
import { createRole } from '../services/admin-service';
import { PermissionCheckboxTree } from '../components/PermissionCheckboxTree';

const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#e6ecf5' };
const backStyle: React.CSSProperties = { color: '#41d1c4', fontSize: 13, cursor: 'pointer', textDecoration: 'none' };
const cardStyle: React.CSSProperties = { background: '#131c2f', border: '1px solid #243049', borderRadius: 8, padding: 24, maxWidth: 640 };

interface TreeNode { id: string; label: string; checked: boolean; children?: TreeNode[]; }

export function CreateRolePage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [appScope, setAppScope] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<TreeNode[]>([
    { id: 'p1', label: 'Admin Center', checked: false, children: [
      { id: 'p1a', label: 'View Dashboard', checked: false }, { id: 'p1b', label: 'Manage Users', checked: false }, { id: 'p1c', label: 'Manage Roles', checked: false }, { id: 'p1d', label: 'View Audit', checked: false },
    ]},
    { id: 'p2', label: 'Support Center', checked: false, children: [
      { id: 'p2a', label: 'View Tickets', checked: false }, { id: 'p2b', label: 'Manage Tickets', checked: false }, { id: 'p2c', label: 'Team Management', checked: false },
    ]},
    { id: 'p3', label: 'Analytics Center', checked: false, children: [
      { id: 'p3a', label: 'View Dashboards', checked: false }, { id: 'p3b', label: 'Export Reports', checked: false },
    ]},
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const collectChecked = (nodes: TreeNode[]): string[] => {
    const result: string[] = [];
    for (const n of nodes) { if (n.checked) result.push(n.label); if (n.children) result.push(...collectChecked(n.children)); }
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createRole({ name, description, permissions: collectChecked(permissions), appScope });
      setSuccess(true);
    } finally { setSubmitting(false); }
  };

  if (success) {
    return (
      <div style={pageStyle}>
        <Card style={{ ...cardStyle, textAlign: 'center' }}>
          <div style={{ color: '#41d1c4', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Role Created</div>
          <div style={{ color: '#8b9bb5', fontSize: 14, marginBottom: 16 }}>The role has been created successfully.</div>
          <Button onClick={() => { window.location.hash = '#/roles'; }}>Back to Roles</Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div><a style={backStyle} onClick={() => { window.location.hash = '#/roles'; }}>← Back to Roles</a></div>
      <div style={titleStyle}>Create Role</div>
      <Card style={cardStyle}>
        <Form onSubmit={handleSubmit}>
          <Form.Field label="Role Name" required><Input value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} placeholder="e.g., Support Manager" /></Form.Field>
          <Form.Field label="Description"><Input value={description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)} placeholder="Describe the role's purpose" /></Form.Field>
          <Form.Field label="App Scope">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[['admin', 'Admin Center'], ['support', 'Support Center'], ['analytics', 'Analytics Center'], ['technician', 'Technician Portal'], ['crm', 'CRM Center']].map(([val, label]) => (
                <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#e6ecf5', fontSize: 13 }}>
                  <input type="checkbox" checked={appScope.includes(val)} onChange={() => setAppScope(appScope.includes(val) ? appScope.filter(a => a !== val) : [...appScope, val])} style={{ accentColor: '#41d1c4' }} />
                  {label}
                </label>
              ))}
            </div>
          </Form.Field>
          <Form.Field label="Permissions">
            <PermissionCheckboxTree nodes={permissions} onChange={setPermissions} />
          </Form.Field>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <Button type="submit" loading={submitting} disabled={submitting || !name}>Create Role</Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
