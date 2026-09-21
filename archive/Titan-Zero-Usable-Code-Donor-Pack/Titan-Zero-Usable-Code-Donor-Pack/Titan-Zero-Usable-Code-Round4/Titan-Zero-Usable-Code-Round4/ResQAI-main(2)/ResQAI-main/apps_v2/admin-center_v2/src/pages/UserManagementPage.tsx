import { useState } from 'react';
import { useUsers } from '../hooks/useUsers';
import { UserTable } from '../components/UserTable';
import { Button, Skeleton, EmptyState, ErrorState, Pagination } from '@resqai/foundation';

const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#e6ecf5' };

export function UserManagementPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, total, loading, error, refetch } = useUsers(page, 20);
  const totalPages = Math.ceil(total / 20);

  const navigateToCreate = () => { window.location.hash = '#/users/new'; };
  const navigateToUser = (id: string) => { window.location.hash = `#/users/${id}`; };

  if (error) return <ErrorState title="Failed to load users" message={error} onRetry={refetch} />;

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>User Management</span>
        <Button onClick={navigateToCreate}>+ New User</Button>
      </div>
      {loading && data.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[1,2,3,4,5].map(i => <Skeleton key={i} variant="text" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState title="No users" description="No users match the current filters." action={<Button onClick={navigateToCreate}>Create User</Button>} />
      ) : (
        <>
          <UserTable data={data} loading={loading} search={search} onSearch={setSearch} onRowClick={navigateToUser} />
          {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
        </>
      )}
    </div>
  );
}
