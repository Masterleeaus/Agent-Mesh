import { useHealthScans } from '../../hooks/useHealthScans';
import { Card, StatusBadge, Button, Skeleton, EmptyState, ErrorState } from '../../../../shared/src/components';
import { HealthScanResultCard } from '../../components';
import { navigate } from '../../state/AppContext';
import type { HealthStatus } from '../../models/dto';

function statusVariant(s: HealthStatus): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (s) { case 'healthy': return 'success'; case 'warning': return 'warning'; case 'critical': return 'error'; case 'unknown': return 'neutral'; default: return 'neutral'; }
}

export default function HealthScansPage() {
  const { data, loading, error, refetch, runScan } = useHealthScans();

  if (loading && data.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton variant="rectangular" height={40} width={300} />
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {[1, 2, 3].map(i => <Skeleton key={i} variant="card" height={100} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return <div style={{ padding: 24 }}><ErrorState error={error} onRetry={refetch} title="Failed to load health scans" /></div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Health Scans</h1>
        <Button variant="secondary" size="sm" onClick={refetch}>Refresh</Button>
      </div>
      {data.length === 0 ? (
        <EmptyState title="No scans performed" description="Run a health scan on an account to see results here." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.map(scan => (
            <HealthScanResultCard
              key={scan.id}
              accountName={scan.accountName}
              score={scan.score}
              previousScore={scan.previousScore}
              status={scan.status}
              trigger={scan.trigger}
              scannedAt={scan.scannedAt}
              findingCount={scan.findingCount}
              onClick={() => navigate(`/accounts/${scan.accountId}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
