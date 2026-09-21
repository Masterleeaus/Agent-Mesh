import { Card, Table, StatusBadge, EmptyState, Skeleton } from '../../../shared/src/components';
import type { AppointmentDTO } from '../models/dto';

interface AppointmentQueueTableProps {
  appointments: AppointmentDTO[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onRowClick?: (id: string) => void;
  emptyMessage?: string;
  compact?: boolean;
}

const statusVariantMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  scheduled: 'info', confirmed: 'info', in_progress: 'warning',
  completed: 'success', cancelled: 'error', no_show: 'error', rescheduled: 'warning',
};

export function AppointmentQueueTable({ appointments, loading, error, onRetry, onRowClick, emptyMessage, compact }: AppointmentQueueTableProps) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="text" height={40} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: '#ef4444' }}>
        <p style={{ margin: '0 0 8px', fontSize: 13 }}>{error}</p>
        {onRetry && <button onClick={onRetry} style={{ background: 'none', border: '1px solid #334155', color: '#94a3b8', borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontSize: 12 }}>Retry</button>}
      </div>
    );
  }

  if (!appointments.length) {
    return <EmptyState title="No appointments" description={emptyMessage || 'No appointments match the current filters.'} />;
  }

  const columns = compact
    ? [
        { key: 'customerName', header: 'Customer', width: '1fr' },
        { key: 'timeSlot', header: 'Time', width: '100px' },
        { key: 'status', header: 'Status', width: '110px' },
      ]
    : [
        { key: 'customerName', header: 'Customer', width: '1.5fr' },
        { key: 'serviceTypeName', header: 'Service', width: '1fr' },
        { key: 'technicianName', header: 'Technician', width: '1fr' },
        { key: 'date', header: 'Date', width: '110px' },
        { key: 'timeSlot', header: 'Time', width: '100px' },
        { key: 'status', header: 'Status', width: '110px' },
        { key: 'type', header: 'Type', width: '90px' },
      ];

  const data = appointments.map(a => ({
    id: a.id,
    customerName: a.customerName,
    serviceTypeName: a.serviceTypeName,
    technicianName: a.technicianName || 'Unassigned',
    date: a.date,
    timeSlot: a.timeSlot,
    type: a.type.replace(/_/g, ' '),
    status: <StatusBadge variant={statusVariantMap[a.status] || 'neutral'} size="sm">{a.status.replace(/_/g, ' ')}</StatusBadge>,
  }));

  return (
    <Card variant="bordered" padding="none">
      <Table
        columns={columns}
        data={data}
        onRowClick={(row) => onRowClick?.(row.id as string)}
      />
    </Card>
  );
}
