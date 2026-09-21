import { type FC } from 'react';
import { Table, Skeleton, EmptyState, ErrorState } from '@resqai/foundation';
import type { TableColumn } from '@resqai/foundation';
import type { TicketListItem } from '../models/view-models';

interface TicketListProps {
  tickets: TicketListItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onTicketClick: (id: string) => void;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
}

const columns: TableColumn<TicketListItem>[] = [
  { key: 'subject', header: 'Subject', sortable: true },
  { key: 'customerName', header: 'Customer', sortable: true },
  { key: 'requestType', header: 'Type' },
  { key: 'channel', header: 'Channel' },
  { key: 'urgency', header: 'Urgency', sortable: true },
  { key: 'status', header: 'Status', sortable: true },
  { key: 'ownerName', header: 'Owner' },
  { key: 'age', header: 'Age (hrs)', sortable: true },
];

export const TicketList: FC<TicketListProps> = ({ tickets, loading, error, onRetry, onTicketClick, selectedIds, onToggleSelect }) => {
  if (loading) {
    return (
      <div role="status" aria-label="Loading tickets">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={48} style={{ marginBottom: 8 }} />)}
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Failed to load tickets" message={error} onRetry={onRetry} />;
  }

  if (tickets.length === 0) {
    return <EmptyState title="No tickets found" description="Try adjusting your filters or create a new ticket." />;
  }

  const data = tickets.map(t => ({
    ...t,
    urgency: t.urgency,
    requestType: t.requestType,
  }));

  return (
    <div role="region" aria-label="Ticket list">
      <Table
        columns={columns}
        data={data}
        onRowClick={(row) => onTicketClick((row as unknown as TicketListItem).id)}
        selectedRowId={selectedIds.length === 1 ? selectedIds[0] : undefined}
      />
    </div>
  );
};
