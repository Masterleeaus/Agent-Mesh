import { useState } from 'react';
import { Card, Tabs, StatusBadge, Button, Skeleton } from '../../../shared/src/components';
import { DetailLayout } from '../../../shared/src/layouts';
import { AppointmentTimeline, AppointmentHistoryTable, CancelAppointmentDialog } from '../components';
import { useAppointmentDetail } from '../hooks';
import { useAppointmentHistory } from '../hooks/useAppointmentHistory';
import { appointmentService } from '../services';

interface AppointmentDetailPageProps {
  id?: string;
}

export function AppointmentDetailPage({ id }: AppointmentDetailPageProps) {
  const { appointment, loading, error, refetch } = useAppointmentDetail(id);
  const { history: timelineHistory } = useAppointmentHistory(id);
  const [activeTab, setActiveTab] = useState('details');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'customer', label: 'Customer' },
    { id: 'technician', label: 'Technician' },
    { id: 'activity', label: 'Activity' },
    { id: 'history', label: 'History' },
  ];

  const handleCancel = async (reason: string) => {
    if (!id) return;
    setCancelSubmitting(true);
    try {
      await appointmentService.cancel(id, { reason, cancelledBy: 'Admin' });
      setCancelOpen(false);
      refetch();
    } finally {
      setCancelSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    const notes = window.prompt('Completion notes:');
    if (notes === null) return;
    try {
      await appointmentService.complete(id, { notes, completedBy: 'Admin' });
      refetch();
    } catch {}
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Skeleton variant="text" height={40} width="60%" />
        <Skeleton variant="text" height={200} />
      </div>
    );
  }

  if (error) {
    if (error.includes('not found')) {
      return (
        <Card padding="lg" style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#e2e8f0', marginBottom: 8 }}>Appointment not found</h2>
          <p style={{ color: '#94a3b8', marginBottom: 16 }}>The appointment you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => window.location.hash = '#/'}>Back to Schedule</Button>
        </Card>
      );
    }
    return (
      <Card padding="lg" style={{ textAlign: 'center' }}>
        <h2 style={{ color: '#ef4444', marginBottom: 8 }}>Error</h2>
        <p style={{ color: '#94a3b8' }}>{error}</p>
      </Card>
    );
  }

  if (!appointment) return null;

  const a = appointment;

  const statusVariantMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    scheduled: 'info', confirmed: 'info', in_progress: 'warning', completed: 'success', cancelled: 'error', no_show: 'error', rescheduled: 'warning',
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: '#e2e8f0' }}>
            <div><span style={{ color: '#64748b', width: 140, display: 'inline-block' }}>Status</span> <StatusBadge variant={statusVariantMap[a.status] || 'neutral'}>{a.status.replace(/_/g, ' ')}</StatusBadge></div>
            <div><span style={{ color: '#64748b', width: 140, display: 'inline-block' }}>Date</span> {a.date}</div>
            <div><span style={{ color: '#64748b', width: 140, display: 'inline-block' }}>Time</span> {a.timeSlot}</div>
            <div><span style={{ color: '#64748b', width: 140, display: 'inline-block' }}>Duration</span> {a.durationMinutes} min</div>
            <div><span style={{ color: '#64748b', width: 140, display: 'inline-block' }}>Service</span> {a.serviceTypeName}</div>
            <div><span style={{ color: '#64748b', width: 140, display: 'inline-block' }}>Type</span> {a.type.replace(/_/g, ' ')}</div>
            <div><span style={{ color: '#64748b', width: 140, display: 'inline-block' }}>Technician</span> {a.technicianName || 'Unassigned'}</div>
            {a.notes && <div><span style={{ color: '#64748b', width: 140, display: 'inline-block' }}>Notes</span> {a.notes}</div>}
            {a.reason && <div><span style={{ color: '#64748b', width: 140, display: 'inline-block' }}>Reason</span> {a.reason}</div>}
            {a.completedNotes && <div><span style={{ color: '#64748b', width: 140, display: 'inline-block' }}>Completed Notes</span> {a.completedNotes}</div>}
            {a.rescheduledFrom && <div><span style={{ color: '#64748b', width: 140, display: 'inline-block' }}>Rescheduled From</span> {a.rescheduledFrom}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              <Button size="sm" variant="outline" onClick={() => window.location.hash = `#/appointments/${a.id}/reschedule`}>Reschedule</Button>
              <Button size="sm" variant="outline" onClick={() => window.location.hash = `#/appointments/${a.id}/assign`}>Assign Technician</Button>
              {a.status !== 'completed' && a.status !== 'cancelled' && (
                <Button size="sm" variant="primary" onClick={handleComplete}>Mark Complete</Button>
              )}
              {a.status !== 'cancelled' && (
                <Button size="sm" variant="danger" onClick={() => setCancelOpen(true)}>Cancel Appointment</Button>
              )}
            </div>
          </div>
        );
      case 'customer':
        return (
          <div style={{ fontSize: 14, color: '#e2e8f0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><span style={{ color: '#64748b', display: 'block', fontSize: 12 }}>Name</span><span>{a.customerName}</span></div>
              <div><span style={{ color: '#64748b', display: 'block', fontSize: 12 }}>Phone</span><span>{a.customerPhone || 'N/A'}</span></div>
              <div><span style={{ color: '#64748b', display: 'block', fontSize: 12 }}>Email</span><span>{a.customerEmail || 'N/A'}</span></div>
              <div><span style={{ color: '#64748b', display: 'block', fontSize: 12 }}>Address</span><span>{a.customerAddress || 'N/A'}</span></div>
            </div>
          </div>
        );
      case 'technician':
        return (
          <div style={{ fontSize: 14, color: '#e2e8f0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><span style={{ color: '#64748b', display: 'block', fontSize: 12 }}>Name</span><span>{a.technicianName || 'Unassigned'}</span></div>
              <div><span style={{ color: '#64748b', display: 'block', fontSize: 12 }}>ID</span><span>{a.technicianId || '—'}</span></div>
            </div>
            {!a.technicianId && (
              <Button size="sm" variant="outline" onClick={() => window.location.hash = `#/appointments/${a.id}/assign`} style={{ marginTop: 16 }}>
                Assign Technician
              </Button>
            )}
          </div>
        );
      case 'activity':
        return (
          <AppointmentTimeline events={[
            { status: a.status as any, timestamp: a.createdAt, label: 'Appointment created' },
            ...(a.assignedAt ? [{ status: 'confirmed' as any, timestamp: a.assignedAt, label: `Assigned to ${a.technicianName}` }] : []),
            ...(a.status === 'in_progress' ? [{ status: a.status as any, timestamp: a.updatedAt, label: 'Service started' }] : []),
            ...(a.status === 'completed' && a.completedAt ? [{ status: 'completed' as any, timestamp: a.completedAt, label: 'Service completed' }] : []),
            ...(a.status === 'cancelled' && a.cancelledAt ? [{ status: 'cancelled' as any, timestamp: a.cancelledAt, label: `Cancelled: ${a.reason}` }] : []),
          ]} />
        );
      case 'history':
        return (
          <AppointmentHistoryTable
            events={timelineHistory?.events || []}
            loading={false}
          />
        );
    }
  };

  return (
    <>
      <DetailLayout
        topbar={null}
        breadcrumbs={null}
        header={
          <div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>{a.serviceTypeName} · #{a.id}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>{a.customerName}</div>
          </div>
        }
        metadata={
          <div style={{ display: 'flex', gap: 16, padding: '8px 0', alignItems: 'center' }}>
            <StatusBadge variant={statusVariantMap[a.status] || 'neutral'}>{a.status.replace(/_/g, ' ')}</StatusBadge>
            <span style={{ fontSize: 13, color: '#64748b' }}>{a.date} · {a.timeSlot}</span>
            <span style={{ fontSize: 13, color: '#64748b' }}>{a.durationMinutes} min</span>
          </div>
        }
        tabs={<Tabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} />}
      >
        {renderTabContent()}
      </DetailLayout>

      <CancelAppointmentDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancel}
        customerName={a.customerName}
        submitting={cancelSubmitting}
      />
    </>
  );
}
