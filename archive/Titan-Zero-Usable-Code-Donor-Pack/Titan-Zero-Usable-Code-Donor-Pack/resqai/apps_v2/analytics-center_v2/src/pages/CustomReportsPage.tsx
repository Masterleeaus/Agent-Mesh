import { Card, Table, Button, EmptyState, Skeleton, ErrorState } from '../../../../shared/src/components';
import type { TableColumn } from '../../../../shared/src/components';
import { useCustomReports } from '../hooks';
import type { ReportListItemVM } from '../models/view-models';

function goTo(path: string) { window.location.hash = path; }

export function CustomReportsPage() {
  const { data, loading, error, refetch } = useCustomReports();

  const columns: TableColumn<ReportListItemVM>[] = [
    { key: 'name', header: 'Report Name' },
    { key: 'description', header: 'Description' },
    { key: 'chartType', header: 'Chart Type' },
    { key: 'createdBy', header: 'Created By' },
    { key: 'lastRunAt', header: 'Last Run', render: (v: unknown) => v ? new Date(v as string).toLocaleDateString() : 'Never' },
  ];

  if (error) {
    return <ErrorState title="Reports Error" message={error} onRetry={refetch} />;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton variant="text" width={200} height={28} />
          <Skeleton variant="rectangular" width={140} height={36} />
        </div>
        <Skeleton variant="rectangular" height={300} />
      </div>
    );
  }

  const reportItems: ReportListItemVM[] = data.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    chartType: r.chartType,
    createdBy: r.createdBy,
    createdAt: r.createdAt,
    lastRunAt: r.lastRunAt,
    isScheduled: false,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Custom Reports</h1>
        <Button variant="primary" size="md" onClick={() => goTo('/reports/builder')}>
          Create Report
        </Button>
      </div>

      {reportItems.length === 0 ? (
        <EmptyState
          title="No custom reports"
          description="Create your first custom report to start tracking the metrics that matter."
          action={<Button variant="primary" onClick={() => goTo('/reports/builder')}>Create Report</Button>}
        />
      ) : (
        <Card padding="none" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <Table columns={columns} data={reportItems} />
        </Card>
      )}
    </div>
  );
}
