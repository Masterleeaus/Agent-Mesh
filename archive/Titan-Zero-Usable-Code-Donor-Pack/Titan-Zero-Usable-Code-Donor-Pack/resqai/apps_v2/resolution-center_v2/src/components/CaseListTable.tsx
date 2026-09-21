import { type FC } from 'react';
import { Table, Skeleton, EmptyState, ErrorState, StatusBadge, Button } from '@resqai/foundation';
import type { TableColumn } from '@resqai/foundation';
import type { CaseListItemVM } from '../models/view-models';

interface CaseListTableProps {
  cases: CaseListItemVM[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onCaseClick: (id: string) => void;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
}

const columns: TableColumn[] = [
  { id: 'summary', label: 'Summary', sortable: true },
  { id: 'customer', label: 'Customer' },
  { id: 'type', label: 'Type' },
  { id: 'priority', label: 'Priority' },
  { id: 'status', label: 'Status' },
];

export const CaseListTable: FC<CaseListTableProps> = ({ cases, loading, error, onRetry, onCaseClick, selectedIds, onToggleSelect }) => {
  if (error) {
    return <ErrorState title="Failed to load cases" message={error} onRetry={onRetry} />;
  }

  if (loading) {
    return (
      <div role="status" aria-label="Loading cases">
        <Skeleton variant="rectangular" height={40} style={{ marginBottom: 8 }} />
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={48} style={{ marginBottom: 8 }} />)}
      </div>
    );
  }

  if (!cases || cases.length === 0) {
    return <EmptyState title="No cases found" description="No cases match the current filters." />;
  }

  const rows = cases.map(c => ({
    id: c.id,
    summary: c.summary,
    customer: c.customerName,
    type: c.type.replace(/_/g, ' '),
    priority: (
      <StatusBadge variant={c.priority === 'critical' ? 'error' : c.priority === 'high' ? 'warning' : 'info'}>
        {c.priority}
      </StatusBadge>
    ),
    status: (
      <StatusBadge variant={c.status === 'closed' || c.status === 'resolved' ? 'success' : c.status === 'escalated' ? 'error' : 'info'}>
        {c.status.replace(/_/g, ' ')}
      </StatusBadge>
    ),
  }));

  return (
    <Table
      columns={columns}
      rows={rows}
      onRowClick={(row) => onCaseClick(row.id)}
      selectedIds={selectedIds}
      onToggleSelect={onToggleSelect}
      selectable={!!onToggleSelect}
    />
  );
};
