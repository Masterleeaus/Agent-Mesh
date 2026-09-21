import { useDashboard, useTechnicians } from '../hooks';
import { TodayAppointments, UpcomingAppointments, OverdueAppointments, PendingAssignmentWidget, CompletedTodayWidget, TechnicianAvailabilityWidget } from '../components';
import { Card, Skeleton } from '../../../shared/src/components';

export function DashboardPage() {
  const { stats, todayAppointments, upcomingAppointments, overdueAppointments, pendingAssignmentAppointments, completedTodayAppointments, loading, refetch } = useDashboard();
  const { technicians, loading: techLoading } = useTechnicians();

  if (loading && !stats) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} variant="card" height={100} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>Dashboard</h1>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Overview of today's operations</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <Card variant="bordered" padding="md">
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Total Today</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#e2e8f0' }}>{stats?.stats.totalToday || 0}</div>
        </Card>
        <Card variant="bordered" padding="md">
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Completed</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#4ade80' }}>{stats?.stats.completedToday || 0}</div>
        </Card>
        <Card variant="bordered" padding="md">
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Overdue</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: overdueAppointments.length > 0 ? '#ef4444' : '#4ade80' }}>
            {overdueAppointments.length}
          </div>
        </Card>
        <Card variant="bordered" padding="md">
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Pending Assignment</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: pendingAssignmentAppointments.length > 0 ? '#f59e0b' : '#4ade80' }}>
            {pendingAssignmentAppointments.length}
          </div>
        </Card>
        <Card variant="bordered" padding="md">
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Upcoming</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#60a5fa' }}>{stats?.stats.upcomingCount || 0}</div>
        </Card>
        <Card variant="bordered" padding="md">
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>On-Time Rate</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#41d1c4' }}>{stats?.stats.onTimeRate || 0}%</div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <TodayAppointments
            appointments={todayAppointments}
            loading={loading}
            onAppointmentClick={id => window.location.hash = `#/appointments/${id}`}
          />
          <UpcomingAppointments
            appointments={upcomingAppointments}
            loading={loading}
            onAppointmentClick={id => window.location.hash = `#/appointments/${id}`}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <OverdueAppointments
            appointments={overdueAppointments}
            loading={loading}
            onAppointmentClick={id => window.location.hash = `#/appointments/${id}`}
          />
          <PendingAssignmentWidget
            appointments={pendingAssignmentAppointments}
            loading={loading}
            onAssign={id => window.location.hash = `#/appointments/${id}/assign`}
            onAppointmentClick={id => window.location.hash = `#/appointments/${id}`}
          />
          <CompletedTodayWidget
            appointments={completedTodayAppointments}
            total={todayAppointments.length}
            loading={loading}
            onAppointmentClick={id => window.location.hash = `#/appointments/${id}`}
          />
          <TechnicianAvailabilityWidget
            technicians={technicians}
            loading={techLoading}
            onTechnicianClick={id => window.location.hash = `#/technicians/${id}/schedule`}
          />
        </div>
      </div>
    </div>
  );
}
