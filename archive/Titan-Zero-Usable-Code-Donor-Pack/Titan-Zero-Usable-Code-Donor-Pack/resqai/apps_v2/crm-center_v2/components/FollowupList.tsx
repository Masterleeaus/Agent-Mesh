import type { FC } from 'react';
import { Table, StatusBadge } from '../../../shared/src/components';
import type { TableColumn } from '../../../shared/src/components';
import type { FollowupListItemVM } from '../models/view-models';
import type { FollowupStatus, FollowupPriority } from '../models/dto';

function priorityColor(priority: FollowupPriority): string {
  switch (priority) {
    case 'urgent': return '#ef4444';
    case 'high': return '#f97316';
    case 'medium': return '#f59e0b';
    case 'low': return '#6b7280';
    default: return '#6b7280';
  }
}

function statusVariant(status: FollowupStatus): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (status) {
    case 'completed': return 'success';
    case 'in_progress': return 'info';
    case 'open': return 'warning';
    case 'waiting': return 'neutral';
    case 'cancelled': return 'neutral';
    default: return 'neutral';
  }
}

interface FollowupListProps {
  data: FollowupListItemVM[];
  loading?: boolean;
  onRowClick?: (row: FollowupListItemVM) => void;
}

export const FollowupList: FC<FollowupListProps> = ({ data, loading, onRowClick }) => {
  const columns: TableColumn<FollowupListItemVM>[] = [
    { key: 'subject', header: 'Subject', sortable: true },
    { key: 'accountName', header: 'Account', sortable: true },
    { key: 'customerName', header: 'Customer' },
    {
      key: 'priority',
      header: 'Priority',
      render: (_, row) => (
        <span style={{ color: priorityColor(row.priority), fontWeight: 600, fontSize: 12 }}>
          {row.priority.toUpperCase()}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (_, row) => (
        <StatusBadge variant={statusVariant(row.status)} size="sm">
          {row.status.replace('_', ' ')}
        </StatusBadge>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (_, row) => (
        <span style={{ color: row.isOverdue ? '#ef4444' : '#e6ecf5', fontWeight: row.isOverdue ? 600 : 400 }}>
          {row.dueDate}
          {row.isOverdue && ` (${Math.abs(row.daysUntilDue)}d overdue)`}
        </span>
      ),
      sortable: true,
    },
    { key: 'owner', header: 'Owner' },
  ];

  return (
    <Table
      columns={columns}
      data={data}
      loading={loading}
      emptyMessage="No followups found"
      onRowClick={onRowClick}
      sortable
      compact
    />
  );
};
