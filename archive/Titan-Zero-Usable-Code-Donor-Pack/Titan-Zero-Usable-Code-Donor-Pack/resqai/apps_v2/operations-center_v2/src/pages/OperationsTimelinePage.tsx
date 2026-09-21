import { type FC } from 'react';
import { Card } from '@resqai/foundation';
import { OperationsTimelineTable, PermissionGuard } from '../components';
import { useOperationsTimeline } from '../hooks/useOperationsTimeline';
import { OPERATIONS_CENTER_PERMISSIONS } from '../contracts/permissions';

export const OperationsTimelinePage: FC = () => {
  const { events, total, loading, error, refetch } = useOperationsTimeline();

  return (
    <PermissionGuard permission={OPERATIONS_CENTER_PERMISSIONS.VIEW_TIMELINE} fallback={
      <div style={{ padding: 24, textAlign: 'center', color: '#f87171' }}>
        <h2>Permission Denied</h2>
        <p>You do not have permission to view the Operations Timeline.</p>
      </div>
    }>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Operations Timeline</h1>
          <span style={{ color: '#8b9bb5', fontSize: 13 }}>{total} events</span>
        </div>

        {error && (
          <Card variant="bordered" style={{ padding: 12, marginBottom: 16, background: 'rgba(248, 113, 113, 0.05)', borderColor: '#f87171' }} role="alert">
            <span style={{ color: '#f87171', fontSize: 13 }}>{error}</span>
          </Card>
        )}

        <Card variant="bordered" style={{ padding: 20 }}>
          <OperationsTimelineTable
            events={events}
            loading={loading}
            error={error}
            onRetry={refetch}
          />
        </Card>
      </div>
    </PermissionGuard>
  );
};
