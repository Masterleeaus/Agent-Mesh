import { useState, type FC } from 'react';
import { Card, SearchBar, Pagination, Skeleton, EmptyState, ErrorState, StatusBadge } from '@resqai/foundation';
import { useCases } from '../hooks/useCases';
import { PermissionGuard } from '../components/PermissionGuard';
import { RESOLUTION_CENTER_PERMISSIONS } from '../contracts/permissions';

export const ClosedCasesPage: FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { cases, total, loading, error, refetch } = useCases({ status: ['closed'], page, pageSize: 25, search } as Parameters<typeof useCases>[0]);
  const totalPages = Math.max(1, Math.ceil(total / 25));

  const handleNavigate = (id: string) => { window.location.hash = `#/disputes/${id}`; };

  return (
    <PermissionGuard permission={RESOLUTION_CENTER_PERMISSIONS.VIEW_CLOSED}>
      <div style={{ padding: 24 }}>
        <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Closed Cases</h1>
        <div style={{ marginBottom: 16 }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search closed cases..." aria-label="Search closed cases" />
        </div>

        {loading && (
          <div role="status" aria-label="Loading">
            <Skeleton variant="rectangular" height={40} style={{ marginBottom: 8 }} />
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={48} style={{ marginBottom: 8 }} />)}
          </div>
        )}
        {error && <ErrorState title="Failed to load closed cases" message={error} onRetry={refetch} />}
        {!loading && !error && cases.length === 0 && <EmptyState title="No closed cases" description="There are no closed cases matching your criteria." />}

        {!loading && !error && cases.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cases.map(c => (
              <Card key={c.id} variant="bordered" style={{ padding: 12, cursor: 'pointer' }} onClick={() => handleNavigate(c.id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, color: '#e6ecf5', fontSize: 14 }}>{c.summary}</p>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#8b9bb5' }}>{c.customerName} | {c.type.replace(/_/g, ' ')}</p>
                  </div>
                  <StatusBadge variant="success">Closed</StatusBadge>
                </div>
              </Card>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </PermissionGuard>
  );
};
