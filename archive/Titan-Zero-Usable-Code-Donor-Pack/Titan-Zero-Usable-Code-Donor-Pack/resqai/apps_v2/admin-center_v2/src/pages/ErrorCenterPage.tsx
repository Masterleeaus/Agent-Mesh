import { useState } from 'react';
import { useErrors } from '../hooks/useErrors';
import { Card, Table, Button, Skeleton, EmptyState, ErrorState, Pagination, Dialog } from '@resqai/foundation';
import type { ErrorEntryDTO } from '../models';
import { ErrorSeverityBadge, ErrorStatusBadge } from '../components/ErrorSeverityBadge';

const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#e6ecf5' };
const detailLabel: React.CSSProperties = { color: '#8b9bb5', fontSize: 12 };
const detailValue: React.CSSProperties = { color: '#e6ecf5', fontSize: 13 };

export function ErrorCenterPage() {
  const { data, total, loading, error, resolve, refetch } = useErrors();
  const [page, setPage] = useState(1);
  const [selectedError, setSelectedError] = useState<ErrorEntryDTO | null>(null);
  const totalPages = Math.ceil(total / 20);
  const [resolving, setResolving] = useState<string | null>(null);

  const handleResolve = async (id: string) => {
    setResolving(id);
    try { await resolve(id); } finally { setResolving(null); }
  };

  if (error) return <ErrorState title="Failed to load errors" message={error} onRetry={refetch} />;

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>Error Center</span>
      </div>
      {loading && data.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[1,2,3,4,5].map(i => <Skeleton key={i} variant="text" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState title="No errors" description="No errors have been recorded. The platform is healthy." />
      ) : (
        <>
          <Table
            columns={[
              { key: 'type', header: 'Type', render: (_v: unknown, r: ErrorEntryDTO) => r.type, sortable: true },
              { key: 'severity', header: 'Severity', render: (_v: unknown, r: ErrorEntryDTO) => <ErrorSeverityBadge severity={r.severity} /> },
              { key: 'status', header: 'Status', render: (_v: unknown, r: ErrorEntryDTO) => <ErrorStatusBadge status={r.status} /> },
              { key: 'message', header: 'Message', render: (_v: unknown, r: ErrorEntryDTO) => r.message.length > 50 ? r.message.substring(0, 50) + '...' : r.message },
              { key: 'source', header: 'Source', render: (_v: unknown, r: ErrorEntryDTO) => r.source },
              { key: 'app', header: 'App', render: (_v: unknown, r: ErrorEntryDTO) => r.appName },
              { key: 'count', header: 'Count', render: (_v: unknown, r: ErrorEntryDTO) => r.count, sortable: true },
              { key: 'lastSeen', header: 'Last Seen', render: (_v: unknown, r: ErrorEntryDTO) => new Date(r.lastSeen).toLocaleString() },
              { key: 'actions', header: '', render: (_v: unknown, r: ErrorEntryDTO) => (
                <div style={{ display: 'flex', gap: 4 }}>
                  <Button size="sm" variant="secondary" onClick={() => setSelectedError(r)}>Details</Button>
                  {r.status === 'open' && (
                    <Button size="sm" variant="primary" onClick={() => handleResolve(r.id)} loading={resolving === r.id} disabled={resolving === r.id}>Resolve</Button>
                  )}
                </div>
              )},
            ]}
            data={data.map(d => ({ ...d, id: d.id }))}
            loading={loading}
            emptyMessage="No errors"
            sortable
          />
          {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
        </>
      )}
      <Dialog open={!!selectedError} onClose={() => setSelectedError(null)} title="Error Details" size="md">
        {selectedError && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><div style={detailLabel}>Message</div><div style={detailValue}>{selectedError.message}</div></div>
            <div><div style={detailLabel}>Type</div><div style={detailValue}>{selectedError.type}</div></div>
            <div><div style={detailLabel}>Source</div><div style={{ ...detailValue, fontFamily: 'monospace' }}>{selectedError.source}</div></div>
            <div><div style={detailLabel}>Application</div><div style={detailValue}>{selectedError.appName}</div></div>
            <div><div style={detailLabel}>Count</div><div style={detailValue}>{selectedError.count} occurrences</div></div>
            <div><div style={detailLabel}>First Seen</div><div style={detailValue}>{new Date(selectedError.firstSeen).toLocaleString()}</div></div>
            <div><div style={detailLabel}>Last Seen</div><div style={detailValue}>{new Date(selectedError.lastSeen).toLocaleString()}</div></div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
