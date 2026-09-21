import { useState } from 'react';
import { useInvoices } from '../hooks/useInvoices';
import { Card, StatusBadge, Table, Skeleton, EmptyState, ErrorState, Pagination, Button } from '../../../shared/src/components';
import { PaymentStatus } from '../models/dto';

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  [PaymentStatus.Paid]: 'success',
  [PaymentStatus.Pending]: 'warning',
  [PaymentStatus.Overdue]: 'error',
  [PaymentStatus.Cancelled]: 'neutral',
  [PaymentStatus.Refunded]: 'info',
};

export function InvoicesPage() {
  const [page, setPage] = useState(1);
  const { data, total, loading, error } = useInvoices(page);

  if (error) {
    return <ErrorState title="Failed to load invoices" message={error} onRetry={() => window.location.reload()} retryLabel="Retry" />;
  }

  const columns = [
    { key: 'invoiceNumber', header: 'Invoice', width: '120px' },
    { key: 'amount', header: 'Amount', width: '100px', render: (_: unknown, row: Record<string, unknown>) => `$${Number(row.amount).toFixed(2)}` },
    { key: 'status', header: 'Status', width: '100px', render: (_: unknown, row: Record<string, unknown>) => (
      <StatusBadge variant={statusVariant[String(row.status)] ?? 'neutral'}>{String(row.status).replace(/_/g, ' ')}</StatusBadge>
    )},
    { key: 'issuedDate', header: 'Issued', width: '100px', render: (_: unknown, row: Record<string, unknown>) => new Date(String(row.issuedDate)).toLocaleDateString() },
    { key: 'dueDate', header: 'Due', width: '100px', render: (_: unknown, row: Record<string, unknown>) => new Date(String(row.dueDate)).toLocaleDateString() },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Invoices</h1>

      <Card padding="md">
        {loading ? (
          <Skeleton variant="table" />
        ) : data.length === 0 ? (
          <EmptyState title="No invoices" description="No invoices have been generated for your account yet." />
        ) : (
          <Table
            columns={columns}
            data={data.map((inv) => ({ ...inv, id: inv.id }))}
            onRowClick={(row: Record<string, unknown>) => { window.location.hash = `/invoices/${row.id}`; }}
          />
        )}
      </Card>

      {total > 10 && (
        <Pagination currentPage={page} totalPages={Math.ceil(total / 10)} onPageChange={setPage} />
      )}
    </div>
  );
}