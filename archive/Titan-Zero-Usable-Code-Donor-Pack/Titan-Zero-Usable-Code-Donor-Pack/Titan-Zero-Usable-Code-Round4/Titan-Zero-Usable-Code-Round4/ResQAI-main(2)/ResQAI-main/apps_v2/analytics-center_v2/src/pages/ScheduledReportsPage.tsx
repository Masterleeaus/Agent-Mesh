import { Button, EmptyState, Skeleton, ErrorState } from '../../../../shared/src/components';
import { ScheduledReportCard } from '../components';
import { useScheduledReports } from '../hooks';
import type { ScheduledReportVM } from '../models/view-models';

export function ScheduledReportsPage() {
  const { data, loading, error, refetch } = useScheduledReports();

  if (error) {
    return <ErrorState title="Scheduled Reports Error" message={error} onRetry={refetch} />;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton variant="text" width={240} height={28} />
          <Skeleton variant="rectangular" width={140} height={36} />
        </div>
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="card" height={120} />)}
      </div>
    );
  }

  const scheduleItems: ScheduledReportVM[] = data.map((r) => ({
    id: r.id,
    reportId: r.reportId,
    reportName: r.reportName,
    frequency: r.frequency,
    recipients: r.recipients,
    format: r.format,
    nextRunAt: r.nextRunAt,
    lastRunAt: r.lastRunAt,
    enabled: r.enabled,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Scheduled Reports</h1>
        <Button variant="primary" size="md" onClick={() => {}}>
          New Schedule
        </Button>
      </div>

      {scheduleItems.length === 0 ? (
        <EmptyState
          title="No scheduled reports"
          description="Schedule automated report delivery to keep your team informed."
          action={<Button variant="primary" onClick={() => {}}>New Schedule</Button>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {scheduleItems.map((s) => (
            <ScheduledReportCard
              key={s.id}
              report={s}
              onEdit={(id) => console.log('Edit', id)}
              onDelete={(id) => console.log('Delete', id)}
              onToggle={(id, enabled) => console.log('Toggle', id, enabled)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
