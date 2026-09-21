import { useRoles } from '../hooks/useRoles';
import { Card, Table, Button, Skeleton, EmptyState, ErrorState } from '@resqai/foundation';
import type { RoleDTO } from '../models';

const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#e6ecf5' };

export function RoleManagerPage() {
  const { data, loading, error, refetch } = useRoles();

  const navigateToCreate = () => { window.location.hash = '#/roles/new'; };
  const navigateToRole = (id: string) => { window.location.hash = `#/roles/${id}`; };

  if (error) return <ErrorState title="Failed to load roles" message={error} onRetry={refetch} />;

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>Role Manager</span>
        <Button onClick={navigateToCreate}>+ New Role</Button>
      </div>
      {loading && data.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[1,2,3].map(i => <Skeleton key={i} variant="card" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState title="No roles" description="No roles have been defined yet." action={<Button onClick={navigateToCreate}>Create Role</Button>} />
      ) : (
        <Table
          columns={[
            { key: 'name', header: 'Name', render: (_v: unknown, r: RoleDTO) => r.name, sortable: true },
            { key: 'description', header: 'Description', render: (_v: unknown, r: RoleDTO) => r.description },
            { key: 'users', header: 'Users', render: (_v: unknown, r: RoleDTO) => r.userCount, sortable: true },
            { key: 'permissions', header: 'Permissions', render: (_v: unknown, r: RoleDTO) => `${r.permissions.length} permissions` },
            { key: 'updated', header: 'Updated', render: (_v: unknown, r: RoleDTO) => new Date(r.updatedAt).toLocaleDateString() },
          ]}
          data={data.map(d => ({ ...d, id: d.id }))}
          loading={loading}
          emptyMessage="No roles"
          onRowClick={r => navigateToRole(r.id as string)}
          sortable
        />
      )}
    </div>
  );
}
