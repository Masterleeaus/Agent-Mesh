import { useState } from 'react';
import { useFunctionRuns } from '../hooks/useFunctionRuns';
import { useFunctions } from '../hooks/useFunctions';
import { Table, Button, Skeleton, EmptyState, ErrorState, Pagination } from '@resqai/foundation';
import { FunctionRunStatusBadge } from '../components/FunctionStatusBadge';
import { restartFunction } from '../services/admin-service';

const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#e6ecf5' };

export function FunctionRunsPage() {
  const [page, setPage] = useState(1);
  const [selectedFn, setSelectedFn] = useState<string | undefined>(undefined);
  const { data: functions } = useFunctions();
  const { data, total, loading, error, refetch } = useFunctionRuns(selectedFn);
  const totalPages = Math.ceil(total / 20);
  const [restarting, setRestarting] = useState<string | null>(null);

  const handleRestart = async (id: string) => {
    setRestarting(id);
    try { await restartFunction(id); refetch(); } finally { setRestarting(null); }
  };

  if (error) return <ErrorState title="Failed to load function runs" message={error} onRetry={refetch} />;

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>Function Runs</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: '#8b9bb5', fontSize: 13 }}>Filter by function:</span>
          <select value={selectedFn || ''} onChange={e => setSelectedFn(e.target.value || undefined)} style={{ height: 36, padding: '0 12px', background: '#0b1220', border: '1px solid #243049', borderRadius: 6, color: '#e6ecf5', fontSize: 13 }}>
            <option value="">All Functions</option>
            {functions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
      </div>
      {loading && data.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[1,2,3,4,5].map(i => <Skeleton key={i} variant="text" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState title="No function runs" description="No function runs recorded." />
      ) : (
        <>
          <Table
            columns={[
              { key: 'name', header: 'Function', render: (_v: unknown, r: any) => r.functionName, sortable: true },
              { key: 'started', header: 'Started', render: (_v: unknown, r: any) => new Date(r.startedAt).toLocaleString() },
              { key: 'status', header: 'Status', render: (_v: unknown, r: any) => <FunctionRunStatusBadge status={r.status} /> },
              { key: 'duration', header: 'Duration', render: (_v: unknown, r: any) => `${(r.duration / 1000).toFixed(1)}s` },
              { key: 'trigger', header: 'Trigger', render: (_v: unknown, r: any) => r.triggeredBy },
              { key: 'error', header: 'Error', render: (_v: unknown, r: any) => r.errorMessage || '—' },
              { key: 'actions', header: '', render: (_v: unknown, r: any) => r.status === 'failed' ? (
                <Button size="sm" variant="secondary" onClick={() => handleRestart(r.functionId)} loading={restarting === r.id} disabled={restarting === r.id}>Restart</Button>
              ) : null },
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
