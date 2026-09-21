import { useState } from 'react';
import { usePayments } from '../hooks/usePayments';
import { Card, StatusBadge, Table, Skeleton, EmptyState, ErrorState, Pagination } from '../../../shared/src/components';
import { PaymentStatus } from '../models/dto';

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  [PaymentStatus.Paid]: 'success', [PaymentStatus.Pending]: 'warning', [PaymentStatus.Refunded]: 'info',
  [PaymentStatus.Cancelled]: 'neutral',
};

export function PaymentsPage() {
  const [page, setPage] = useState(1);
  const { data, total, loading, error } = usePayments(page);

  if (error) {
    return <ErrorState title="Failed to load payments" message={error} onRetry={() => window.location.reload()} retryLabel="Retry" />;
  }

  const columns = [
    { key: 'invoiceNumber', header: 'Invoice', width: '120px' },
    { key: 'amount', header: 'Amount', width: '100px', render: (_: unknown, row: Record<string, unknown>) => `$${Number(row.amount).toFixed(2)}` },
    { key: 'method', header: 'Method', width: '140px', render: (_: unknown, row: Record<string, unknown>) => String(row.method).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) },
    { key: 'status', header: 'Status', width: '100px', render: (_: unknown, row: Record<string, unknown>) => (
      <StatusBadge variant={statusVariant[String(row.status)] ?? 'neutral'}>{String(row.status).replace(/_/g, ' ')}</StatusBadge>
    )},
    { key: 'paidAt', header: 'Paid On', width: '120px', render: (_: unknown, row: Record<string, unknown>) => new Date(String(row.paidAt)).toLocaleDateString() },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Payment History</h1>

      <Card padding="md">
        {loading ? (
          <Skeleton variant="table" />
        ) : data.length === 0 ? (
          <EmptyState title="No payments" description="No payment history found for your account." />
        ) : (
          <Table
            columns={columns}
            data={data.map((p) => ({ ...p, id: p.id }))}
            onRowClick={(row: Record<string, unknown>) => { window.location.hash = `/invoices/${row.invoiceId || row.id}`; }}
          />
        )}
      </Card>

      {total > 10 && (
        <Pagination currentPage={page} totalPages={Math.ceil(total / 10)} onPageChange={setPage} />
      )}
    </div>
  );
}