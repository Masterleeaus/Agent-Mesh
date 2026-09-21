import { useState } from 'react';
import { useAuditLog } from '../hooks/useAuditLog';
import { AuditLogTable } from '../components/AuditLogTable';
import { Pagination, Button, Skeleton, EmptyState, ErrorState } from '@resqai/foundation';
import { exportAuditLog } from '../services/admin-service';

const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#e6ecf5' };

export function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, total, loading, error, refetch } = useAuditLog(search ? { search } : undefined, page, 20);
  const totalPages = Math.ceil(total / 20);

  const handleExport = async () => {
    const blob = await exportAuditLog(search ? { search } : undefined);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'audit-log.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (error) return <ErrorState title="Failed to load audit log" message={error} onRetry={refetch} />;

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>Audit Log</span>
        <Button variant="secondary" onClick={handleExport}>Export CSV</Button>
      </div>
      {loading && data.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[1,2,3,4,5].map(i => <Skeleton key={i} variant="text" />)}</div>
      ) : data.length === 0 ? (
        <EmptyState title="No audit entries" description="No audit log entries match the current filters." />
      ) : (
        <>
          <AuditLogTable data={data} loading={loading} search={search} onSearch={setSearch} />
          {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
        </>
      )}
    </div>
  );
}
