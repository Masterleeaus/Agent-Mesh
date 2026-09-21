import { type FC } from 'react';
import { Table, Skeleton, EmptyState, ErrorState, StatusBadge } from '@resqai/foundation';
import type { TableColumn } from '@resqai/foundation';
import type { DisputeListItemVM } from '../models/view-models';

interface DisputeListTableProps {
  disputes: DisputeListItemVM[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onDisputeClick: (id: string) => void;
}

const columns: TableColumn[] = [
  { id: 'customer', label: 'Customer', sortable: true },
  { id: 'reason', label: 'Reason' },
  { id: 'amount', label: 'Amount' },
  { id: 'priority', label: 'Priority' },
  { id: 'status', label: 'Status' },
];

export const DisputeListTable: FC<DisputeListTableProps> = ({ disputes, loading, error, onRetry, onDisputeClick }) => {
  if (error) {
    return <ErrorState title="Failed to load disputes" message={error} onRetry={onRetry} />;
  }

  if (loading) {
    return (
      <div role="status" aria-label="Loading disputes">
        <Skeleton variant="rectangular" height={40} style={{ marginBottom: 8 }} />
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={48} style={{ marginBottom: 8 }} />)}
      </div>
    );
  }

  if (!disputes || disputes.length === 0) {
    return <EmptyState title="No disputes found" description="No disputes match the current filters." />;
  }

  const rows = disputes.map(d => ({
    id: d.id,
    customer: d.customerName,
    reason: d.reason.replace(/_/g, ' '),
    amount: d.amount ? `$${d.amount}` : '-',
    priority: (
      <StatusBadge variant={d.priority === 'critical' ? 'error' : d.priority === 'high' ? 'warning' : 'info'}>
        {d.priority}
      </StatusBadge>
    ),
    status: (
      <StatusBadge variant={d.status === 'resolved' ? 'success' : d.status === 'open' ? 'info' : 'warning'}>
        {d.status.replace(/_/g, ' ')}
      </StatusBadge>
    ),
  }));

  return <Table columns={columns} rows={rows} onRowClick={(row) => onDisputeClick(row.id)} />;
};
