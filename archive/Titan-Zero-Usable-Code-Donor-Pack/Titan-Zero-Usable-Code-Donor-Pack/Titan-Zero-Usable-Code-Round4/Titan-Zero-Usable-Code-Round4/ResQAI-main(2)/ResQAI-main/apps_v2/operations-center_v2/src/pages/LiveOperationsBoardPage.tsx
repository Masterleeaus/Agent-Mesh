import { useState, type FC } from 'react';
import { Card, Button } from '@resqai/foundation';
import { useOperations } from '../hooks/useOperations';
import { useLiveMetrics } from '../hooks/useLiveMetrics';
import { LiveMetricsWidget, RegionalStatusWidget, PermissionGuard } from '../components';
import { OPERATIONS_CENTER_PERMISSIONS } from '../contracts/permissions';

const statusColors: Record<string, string> = {
  pending_dispatch: '#8b9bb5',
  dispatched: '#60a5fa',
  in_progress: '#f59e0b',
  on_hold: '#f87171',
  completed: '#4ade80',
  cancelled: '#6b7280',
  escalated: '#f87171',
};

export const LiveOperationsBoardPage: FC = () => {
  const { operations, loading, error, refetch } = useOperations({ pageSize: 50 });
  const { liveMetrics, regionalStatus, loading: metricsLoading } = useLiveMetrics();
  const [filter, setFilter] = useState<string>('all');

  const filteredOps = filter === 'all' ? operations : operations.filter(op => op.status === filter);
  const grouped: Record<string, typeof operations> = {};
  filteredOps.forEach(op => {
    const key = op.region;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(op);
  });

  return (
    <PermissionGuard permission={OPERATIONS_CENTER_PERMISSIONS.VIEW_LIVE_BOARD} fallback={
      <div style={{ padding: 24, textAlign: 'center', color: '#f87171' }}>
        <h2>Permission Denied</h2>
        <p>You do not have permission to view the Live Operations Board.</p>
      </div>
    }>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Live Operations Board</h1>
          <Button onClick={refetch} size="sm" aria-label="Refresh board">Refresh</Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
          <LiveMetricsWidget metrics={liveMetrics} loading={metricsLoading} />
          <RegionalStatusWidget regions={regionalStatus} loading={metricsLoading} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['all', 'pending_dispatch', 'dispatched', 'in_progress', 'on_hold', 'completed', 'escalated'].map(s => (
              <Button
                key={s}
                size="sm"
                variant={filter === s ? 'primary' : 'ghost'}
                onClick={() => setFilter(s)}
                aria-label={`Filter by ${s}`}
              >
                {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
              </Button>
            ))}
          </div>
        </div>

        {error && <div role="alert" style={{ color: '#f87171', marginBottom: 16, fontSize: 13 }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Object.entries(grouped).map(([region, ops]) => (
            <Card key={region} variant="bordered" style={{ padding: 16 }} role="region" aria-label={`${region} operations`}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#e6ecf5', textTransform: 'capitalize' }}>{region} ({ops.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ops.map(op => (
                  <div
                    key={op.id}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 12px', borderRadius: 6, background: '#0f1729',
                      borderLeft: `3px solid ${statusColors[op.status] || '#8b9bb5'}`,
                      cursor: 'pointer',
                    }}
                    onClick={() => { window.location.hash = `#/operations/${op.id}`; }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') window.location.hash = `#/operations/${op.id}`; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ color: '#60a5fa', fontFamily: 'monospace', fontSize: 12 }}>{op.id}</span>
                      <span style={{ color: '#e6ecf5', fontSize: 13, fontWeight: 500 }}>{op.title}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ color: op.priority === 'critical' ? '#f87171' : op.priority === 'high' ? '#f59e0b' : '#8b9bb5', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{op.priority}</span>
                      <span style={{ color: statusColors[op.status] || '#8b9bb5', fontSize: 12, textTransform: 'capitalize' }}>{op.status.replace(/_/g, ' ')}</span>
                      <span style={{ color: '#8b9bb5', fontSize: 12 }}>{op.technicianName || '\u2014'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PermissionGuard>
  );
};
