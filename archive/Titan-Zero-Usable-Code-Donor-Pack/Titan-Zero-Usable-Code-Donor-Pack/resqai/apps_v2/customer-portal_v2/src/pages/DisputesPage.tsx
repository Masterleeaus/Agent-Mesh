import { useState } from 'react';
import { useCustomerDisputes } from '../hooks/useCustomerDisputes';
import { Card, StatusBadge, Table, Skeleton, EmptyState, ErrorState, Pagination } from '../../../shared/src/components';
import { DisputeStatus } from '../models/dto';

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  [DisputeStatus.Filed]: 'neutral',
  [DisputeStatus.UnderReview]: 'info',
  [DisputeStatus.Investigation]: 'warning',
  [DisputeStatus.ResolutionProposed]: 'info',
  [DisputeStatus.Accepted]: 'success',
  [DisputeStatus.Rejected]: 'error',
  [DisputeStatus.Escalated]: 'error',
  [DisputeStatus.Closed]: 'neutral',
};

export function DisputesPage() {
  const [page, setPage] = useState(1);
  const { data, total, loading, error } = useCustomerDisputes(page);

  if (error) {
    return <ErrorState title="Failed to load disputes" message={error} onRetry={() => window.location.reload()} retryLabel="Retry" />;
  }

  const columns = [
    { key: 'id', header: 'ID', width: '100px' },
    { key: 'subject', header: 'Subject', width: 'auto' },
    { key: 'status', header: 'Status', width: '140px', render: (_: unknown, row: Record<string, unknown>) => (
      <StatusBadge variant={statusVariant[String(row.status)]}>{String(row.status).replace(/_/g, ' ')}</StatusBadge>
    )},
    { key: 'filedDate', header: 'Filed Date', width: '120px', render: (_: unknown, row: Record<string, unknown>) => new Date(String(row.filedDate)).toLocaleDateString() },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Disputes</h1>

      <Card padding="md">
        {loading ? (
          <Skeleton variant="table" />
        ) : data.length === 0 ? (
          <EmptyState title="No disputes" description="You don't have any disputes at this time." />
        ) : (
          <Table
            columns={columns}
            data={data.map((d) => ({ ...d, id: d.id }))}
            onRowClick={(row: Record<string, unknown>) => { window.location.hash = `/disputes/${row.id}`; }}
          />
        )}
      </Card>

      {total > 10 && (
        <Pagination currentPage={page} totalPages={Math.ceil(total / 10)} onPageChange={setPage} />
      )}
    </div>
  );
}
