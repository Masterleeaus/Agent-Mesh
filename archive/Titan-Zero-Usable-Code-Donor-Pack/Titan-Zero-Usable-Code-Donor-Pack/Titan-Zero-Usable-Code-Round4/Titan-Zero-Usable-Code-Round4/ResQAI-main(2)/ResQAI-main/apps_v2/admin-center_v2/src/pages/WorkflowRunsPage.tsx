import { useState } from 'react';
import { useWorkflowRuns } from '../hooks/useWorkflowRuns';
import { useWorkflows } from '../hooks/useWorkflows';
import { Card, Table, Button, Skeleton, EmptyState, ErrorState, Pagination } from '@resqai/foundation';
import { WorkflowRunStatusBadge } from '../components/WorkflowStatusBadge';
import { restartWorkflow } from '../services/admin-service';

const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#e6ecf5' };

export function WorkflowRunsPage() {
  const [page, setPage] = useState(1);
  const [selectedWf, setSelectedWf] = useState<string | undefined>(undefined);
  const { data: workflows } = useWorkflows();
  const { data, total, loading, error, refetch } = useWorkflowRuns(selectedWf);
  const totalPages = Math.ceil(total / 20);
  const [restarting, setRestarting] = useState<string | null>(null);

  const handleRestart = async (id: string) => {
    setRestarting(id);
    try { await restartWorkflow(id); refetch(); } finally { setRestarting(null); }
  };

  if (error) return <ErrorState title="Failed to load workflow runs" message={error} onRetry={refetch} />;

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>Workflow Runs</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: '#8b9bb5', fontSize: 13 }}>Filter by workflow:</span>
          <select value={selectedWf || ''} onChange={e => setSelectedWf(e.target.value || undefined)} style={{ height: 36, padding: '0 12px', background: '#0b1220', border: '1px solid #243049', borderRadius: 6, color: '#e6ecf5', fontSize: 13 }}>
            <option value="">All Workflows</option>
            {workflows.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
      </div>
      {loading && data.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[1,2,3,4,5].map(i => <Skeleton key={i} variant="text" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState title="No workflow runs" description="No workflow runs recorded." />
      ) : (
        <>
          <Table
            columns={[
              { key: 'name', header: 'Workflow', render: (_v: unknown, r: any) => r.workflowName, sortable: true },
              { key: 'started', header: 'Started', render: (_v: unknown, r: any) => new Date(r.startedAt).toLocaleString() },
              { key: 'status', header: 'Status', render: (_v: unknown, r: any) => <WorkflowRunStatusBadge status={r.status} /> },
              { key: 'duration', header: 'Duration', render: (_v: unknown, r: any) => `${(r.duration / 1000).toFixed(1)}s` },
              { key: 'trigger', header: 'Trigger', render: (_v: unknown, r: any) => r.triggeredBy },
              { key: 'progress', header: 'Progress', render: (_v: unknown, r: any) => `${r.stepsCompleted}/${r.steps}` },
              { key: 'actions', header: '', render: (_v: unknown, r: any) => (
                <Button size="sm" variant="secondary" onClick={() => handleRestart(r.workflowId)} loading={restarting === r.id} disabled={restarting === r.id}>Restart</Button>
              )},
            ]}
            data={data.map(d => ({ ...d, id: d.id }))}
            loading={loading}
            emptyMessage="No runs"
          />
          {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
        </>
      )}
    </div>
  );
}
