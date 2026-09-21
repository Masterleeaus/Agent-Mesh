import { useState } from 'react';
import { Card, Table, Filter, StatusBadge, Skeleton, EmptyState, ErrorState, Button } from '../../../shared/src/components';
import { TechnicianDayView } from '../components';
import { useTechnicianSchedule } from '../hooks';

interface TechnicianSchedulePageProps {
  id?: string;
}

const statusVariantMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  scheduled: 'info', confirmed: 'info', in_progress: 'warning', completed: 'success', cancelled: 'error', no_show: 'error',
};

export function TechnicianSchedulePage({ id }: TechnicianSchedulePageProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const { schedule, loading, error, refetch } = useTechnicianSchedule(id, date);

  if (error) {
    return <ErrorState title="Failed to load schedule" message={error} onRetry={refetch} />;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Skeleton variant="text" height={40} width="40%" />
        <Skeleton variant="text" height={200} />
      </div>
    );
  }

  if (!schedule) {
    return <EmptyState title="No schedule data" description="Select a technician and date to view their schedule." />;
  }

  const columns = [
    { key: 'time', header: 'Time', width: '80px' },
    { key: 'customer', header: 'Customer', width: '1fr' },
    { key: 'service', header: 'Service', width: '1fr' },
    { key: 'status', header: 'Status', width: '120px' },
  ];

  const data = schedule.slots
    .filter(s => s.appointment)
    .map(s => ({
      id: s.appointment!.id,
      time: s.time,
      customer: s.appointment!.customerName,
      service: s.appointment!.serviceTypeName,
      status: <StatusBadge variant={statusVariantMap[s.appointment!.status] || 'neutral'} size="sm">{s.appointment!.status}</StatusBadge>,
    }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card padding="md" variant="elevated">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{schedule.technician.name}</h2>
            <div style={{ fontSize: 13, color: '#64748b' }}>Rating: ★ {schedule.technician.rating} · Skills: {schedule.technician.skills.join(', ')}</div>
          </div>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{
              padding: '8px 12px', borderRadius: 6, border: '1px solid #334155',
              background: '#1a2332', color: '#e2e8f0', fontSize: 13,
            }}
          />
        </div>
        {data.length === 0 ? (
          <EmptyState title="No appointments for this technician" description="No appointments scheduled for the selected date." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <TechnicianDayView schedule={schedule} />
            <Table columns={columns} data={data} />
          </div>
        )}
      </Card>
    </div>
  );
}
