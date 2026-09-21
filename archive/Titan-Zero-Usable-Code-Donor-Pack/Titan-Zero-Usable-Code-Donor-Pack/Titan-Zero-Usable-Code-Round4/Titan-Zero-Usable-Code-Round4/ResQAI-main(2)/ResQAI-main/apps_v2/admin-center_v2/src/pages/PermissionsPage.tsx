import { useRoles } from '../hooks/useRoles';
import { Card, Table, Button, Skeleton, EmptyState, ErrorState, Dialog } from '@resqai/foundation';
import type { RoleDTO } from '../models';
import { useState } from 'react';
import { RolePermissionTree } from '../components/RolePermissionTree';
import type { PermissionTreeNodeVM } from '../models';

const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#e6ecf5' };

export function PermissionsPage() {
  const { data, loading, error, refetch } = useRoles();
  const [selectedRole, setSelectedRole] = useState<RoleDTO | null>(null);

  if (error) return <ErrorState title="Failed to load permissions" message={error} onRetry={refetch} />;

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>Permission Management</span>
      </div>
      {loading && data.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[1,2,3].map(i => <Skeleton key={i} variant="card" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState title="No roles defined" description="Create roles to manage permissions." />
      ) : (
        <Table
          columns={[
            { key: 'name', header: 'Role', render: (_v: unknown, r: RoleDTO) => r.name, sortable: true },
            { key: 'count', header: 'Permissions', render: (_v: unknown, r: RoleDTO) => `${r.permissions.length} permissions` },
            { key: 'actions', header: '', render: (_v: unknown, r: RoleDTO) => <Button size="sm" variant="secondary" onClick={() => setSelectedRole(r)}>View Permissions</Button> },
          ]}
          data={data.map(d => ({ ...d, id: d.id }))}
          loading={loading}
          emptyMessage="No roles"
        />
      )}
      <Dialog open={!!selectedRole} onClose={() => setSelectedRole(null)} title={`Permissions: ${selectedRole?.name}`} size="lg">
        {selectedRole && (
          <RolePermissionTree
            permissions={selectedRole.permissions.map(p => ({ id: p, key: p, label: p, description: '', group: 'custom', checked: true } as PermissionTreeNodeVM))}
          />
        )}
      </Dialog>
    </div>
  );
}
