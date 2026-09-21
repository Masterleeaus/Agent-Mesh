import { useState } from 'react';
import { useWorkflows } from '../hooks/useWorkflows';
import { useWorkflowRuns } from '../hooks/useWorkflowRuns';
import { Card, Table, Button, Skeleton, EmptyState, ErrorState, Dialog, Tabs } from '@resqai/foundation';
import type { WorkflowDTO } from '../models';
import { restartWorkflow } from '../services/admin-service';
import { WorkflowStatusBadge, WorkflowRunStatusBadge } from '../components/WorkflowStatusBadge';

const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#e6ecf5' };

export function WorkflowManagerPage() {
  const { data, loading, error, refetch } = useWorkflows();
  const [selectedWf, setSelectedWf] = useState<WorkflowDTO | null>(null);
  const [showRuns, setShowRuns] = useState(false);
  const { data: runs, loading: runsLoading } = useWorkflowRuns(selectedWf?.id);
  const [restarting, setRestarting] = useState<string | null>(null);

  const handleRestart = async (id: string) => {
    setRestarting(id);
    try { await restartWorkflow(id); refetch(); } finally { setRestarting(null); }
  };

  if (error) return <ErrorState title="Failed to load workflows" message={error} onRetry={refetch} />;

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>Workflow Manager</span>
      </div>
      {loading && data.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[1,2,3].map(i => <Skeleton key={i} variant="card" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState title="No workflows" description="No workflows have been defined." />
      ) : (
        <Table
          columns={[
            { key: 'name', header: 'Workflow', render: (_v: unknown, r: WorkflowDTO) => r.name, sortable: true },
            { key: 'app', header: 'App', render: (_v: unknown, r: WorkflowDTO) => r.appName },
            { key: 'status', header: 'Status', render: (_v: unknown, r: WorkflowDTO) => <WorkflowStatusBadge status={r.status} /> },
            { key: 'steps', header: 'Steps', render: (_v: unknown, r: WorkflowDTO) => r.steps },
            { key: 'lastRun', header: 'Last Run', render: (_v: unknown, r: WorkflowDTO) => r.lastRun ? new Date(r.lastRun).toLocaleString() : '—' },
            { key: 'lastStatus', header: 'Last Status', render: (_v: unknown, r: WorkflowDTO) => r.lastRunStatus ? <WorkflowRunStatusBadge status={r.lastRunStatus} /> : '—' },
            { key: 'actions', header: '', render: (_v: unknown, r: WorkflowDTO) => (
              <div style={{ display: 'flex', gap: 4 }}>
                <Button size="sm" variant="secondary" onClick={() => { setSelectedWf(r); setShowRuns(true); }}>Runs</Button>
                <Button size="sm" variant="secondary" onClick={() => handleRestart(r.id)} loading={restarting === r.id} disabled={restarting === r.id}>Restart</Button>
              </div>
            )},
          ]}
          data={data.map(d => ({ ...d, id: d.id }))}
          loading={loading}
          emptyMessage="No workflows"
          onRowClick={r => setSelectedWf(r as WorkflowDTO)}
          sortable
        />
      )}
      <Dialog open={showRuns && !!selectedWf} onClose={() => setShowRuns(false)} title={`Runs: ${selectedWf?.name}`} size="lg">
        {runsLoading ? <Skeleton variant="card" /> : runs.length === 0 ? (
          <EmptyState title="No runs" description="No workflow runs recorded." />
        ) : (
          <Table
            columns={[
              { key: 'started', header: 'Started', render: (_v: unknown, r: any) => new Date(r.startedAt).toLocaleString() },
              { key: 'status', header: 'Status', render: (_v: unknown, r: any) => <WorkflowRunStatusBadge status={r.status} /> },
              { key: 'duration', header: 'Duration', render: (_v: unknown, r: any) => `${(r.duration / 1000).toFixed(1)}s` },
              { key: 'triggeredBy', header: 'Trigger', render: (_v: unknown, r: any) => r.triggeredBy },
              { key: 'progress', header: 'Progress', render: (_v: unknown, r: any) => `${r.stepsCompleted}/${r.steps}` },
            ]}
            data={runs.map(r => ({ ...r, id: r.id }))}
            emptyMessage="No runs"
          />
        )}
      </Dialog>
    </div>
  );
}
