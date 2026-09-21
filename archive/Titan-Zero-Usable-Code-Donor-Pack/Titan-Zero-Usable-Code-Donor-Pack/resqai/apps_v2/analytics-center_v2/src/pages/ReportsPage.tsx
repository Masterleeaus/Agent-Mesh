import { useState } from 'react';
import { useCustomReports } from '../hooks/useCustomReports';
import { KpiReportTable, GenerateReportForm, DeleteReportDialog, DataFreshnessIndicator } from '../components';
import { Card, Button, ErrorState, EmptyState, Table as SharedTable } from '../../../../shared/src/components';
import { analyticsService } from '../services/analytics-service';
import type { CustomReportDTO } from '../models/dto';

export function ReportsPage() {
  const { data: reports, loading, error, refetch } = useCustomReports();
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomReportDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleGenerate = async (formData: { name: string; description: string; chartType: any }) => {
    setGenerating(true);
    try {
      await analyticsService.createReport(formData);
      setShowForm(false);
      refetch();
    } catch {} finally { setGenerating(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await analyticsService.deleteReport(deleteTarget.id);
      setDeleteTarget(null);
      refetch();
    } catch {} finally { setDeleting(false); }
  };

  if (error) return <ErrorState title="Failed to load reports" message={error} onRetry={refetch} />;

  const columns = [
    { key: 'name', label: 'Name', width: '25%' },
    { key: 'chartType', label: 'Type', width: '12%' },
    { key: 'createdAt', label: 'Created', width: '18%' },
    { key: 'lastRunAt', label: 'Last Run', width: '18%' },
    { key: 'actions', label: '', width: '27%' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Reports</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <DataFreshnessIndicator lastUpdated={new Date().toISOString()} loading={loading} />
          <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Create Report'}
          </Button>
        </div>
      </div>

      {showForm && (
        <div style={{ marginBottom: 16, maxWidth: 480 }}>
          <GenerateReportForm onSubmit={handleGenerate} loading={generating} />
        </div>
      )}

      <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, padding: '8px 0' }}>
                <div style={{ flex: 2, height: 12, background: '#243049', borderRadius: 4 }} />
                <div style={{ flex: 1, height: 12, background: '#243049', borderRadius: 4 }} />
                <div style={{ flex: 1, height: 12, background: '#243049', borderRadius: 4 }} />
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <EmptyState title="No Reports" message="Create your first report to start tracking analytics" />
        ) : (
          <>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 12 }}>All Reports</div>
            <SharedTable
              columns={columns}
              rows={reports.map((r) => ({
                name: r.name,
                chartType: r.chartType.charAt(0).toUpperCase() + r.chartType.slice(1),
                createdAt: new Date(r.createdAt).toLocaleDateString(),
                lastRunAt: r.lastRunAt ? new Date(r.lastRunAt).toLocaleDateString() : 'Never',
                actions: (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Button variant="ghost" size="sm" onClick={() => window.location.hash = '/reports/builder'}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(r)}>Delete</Button>
                  </div>
                ),
              }))}
            />
          </>
        )}
      </Card>

      <DeleteReportDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        reportName={deleteTarget?.name || ''}
        loading={deleting}
      />
    </div>
  );
}
