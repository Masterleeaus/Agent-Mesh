import { useState } from 'react';
import { useFunctions } from '../hooks/useFunctions';
import { useFunctionRuns } from '../hooks/useFunctionRuns';
import { Card, Table, Button, Skeleton, EmptyState, ErrorState, Dialog } from '@resqai/foundation';
import type { FunctionDTO } from '../models';
import { restartFunction } from '../services/admin-service';
import { FunctionStatusBadge, FunctionRunStatusBadge } from '../components/FunctionStatusBadge';

const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#e6ecf5' };

export function FunctionManagerPage() {
  const { data, loading, error, refetch } = useFunctions();
  const [selectedFn, setSelectedFn] = useState<FunctionDTO | null>(null);
  const [showRuns, setShowRuns] = useState(false);
  const { data: runs, loading: runsLoading } = useFunctionRuns(selectedFn?.id);
  const [restarting, setRestarting] = useState<string | null>(null);

  const handleRestart = async (id: string) => {
    setRestarting(id);
    try { await restartFunction(id); refetch(); } finally { setRestarting(null); }
  };

  if (error) return <ErrorState title="Failed to load functions" message={error} onRetry={refetch} />;

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>Function Manager</span>
      </div>
      {loading && data.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[1,2,3].map(i => <Skeleton key={i} variant="card" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState title="No functions" description="No functions have been deployed." />
      ) : (
        <Table
          columns={[
            { key: 'name', header: 'Function', render: (_v: unknown, r: FunctionDTO) => r.name, sortable: true },
            { key: 'app', header: 'App', render: (_v: unknown, r: FunctionDTO) => r.appName },
            { key: 'status', header: 'Status', render: (_v: unknown, r: FunctionDTO) => <FunctionStatusBadge status={r.status} /> },
            { key: 'runtime', header: 'Runtime', render: (_v: unknown, r: FunctionDTO) => r.runtime },
            { key: 'timeout', header: 'Timeout', render: (_v: unknown, r: FunctionDTO) => `${r.timeout}s` },
            { key: 'memory', header: 'Memory', render: (_v: unknown, r: FunctionDTO) => `${r.memory}MB` },
            { key: 'lastRun', header: 'Last Run', render: (_v: unknown, r: FunctionDTO) => r.lastRun ? new Date(r.lastRun).toLocaleString() : '—' },
            { key: 'actions', header: '', render: (_v: unknown, r: FunctionDTO) => (
              <div style={{ display: 'flex', gap: 4 }}>
                <Button size="sm" variant="secondary" onClick={() => { setSelectedFn(r); setShowRuns(true); }}>Runs</Button>
                <Button size="sm" variant="secondary" onClick={() => handleRestart(r.id)} loading={restarting === r.id} disabled={restarting === r.id}>Restart</Button>
              </div>
            )},
          ]}
          data={data.map(d => ({ ...d, id: d.id }))}
          loading={loading}
          emptyMessage="No functions"
          sortable
        />
      )}
      <Dialog open={showRuns && !!selectedFn} onClose={() => setShowRuns(false)} title={`Runs: ${selectedFn?.name}`} size="lg">
        {runsLoading ? <Skeleton variant="card" /> : runs.length === 0 ? (
          <EmptyState title="No runs" description="No function runs recorded." />
        ) : (
          <Table
            columns={[
              { key: 'started', header: 'Started', render: (_v: unknown, r: any) => new Date(r.startedAt).toLocaleString() },
              { key: 'status', header: 'Status', render: (_v: unknown, r: any) => <FunctionRunStatusBadge status={r.status} /> },
              { key: 'duration', header: 'Duration', render: (_v: unknown, r: any) => `${(r.duration / 1000).toFixed(1)}s` },
              { key: 'trigger', header: 'Trigger', render: (_v: unknown, r: any) => r.triggeredBy },
              { key: 'input', header: 'Input', render: (_v: unknown, r: any) => `${(r.inputSize / 1024).toFixed(1)}KB` },
              { key: 'output', header: 'Output', render: (_v: unknown, r: any) => `${(r.outputSize / 1024).toFixed(1)}KB` },
            ]}
            data={runs.map(r => ({ ...r, id: r.id }))}
            emptyMessage="No runs"
          />
        )}
      </Dialog>
    </div>
  );
}
