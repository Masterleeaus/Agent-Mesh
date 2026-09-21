import { useState, type FC } from 'react';
import { Card } from '@resqai/foundation';
import { useLiveMetrics } from '../hooks/useLiveMetrics';
import { useDispatchQueue } from '../hooks/useDispatchQueue';
import {
  ActiveTicketsWidget, ActiveTechniciansWidget, PendingDispatchWidget,
  HighPriorityQueueWidget, OverdueJobsWidget, CompletedTodayWidget,
  LiveMetricsWidget, RegionalStatusWidget, PermissionGuard,
} from '../components';
import { OPERATIONS_CENTER_PERMISSIONS } from '../contracts/permissions';

export const OperationsDashboardPage: FC = () => {
  const { metrics, liveMetrics, regionalStatus, loading, error } = useLiveMetrics();
  const { pendingOperations } = useDispatchQueue();

  const highPriorityOps = pendingOperations.filter(op => op.priority === 'high' || op.priority === 'critical');
  const overdueOps = pendingOperations.filter(op => {
    if (!op.scheduledStart) return false;
    return new Date(op.scheduledStart) < new Date();
  });

  return (
    <PermissionGuard permission={OPERATIONS_CENTER_PERMISSIONS.VIEW_DASHBOARD} fallback={
      <div style={{ padding: 24, textAlign: 'center', color: '#f87171' }}>
        <h2>Permission Denied</h2>
        <p>You do not have permission to view the Operations Dashboard.</p>
      </div>
    }>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Operations Dashboard</h1>
          {error && <span style={{ color: '#f87171', fontSize: 13 }} role="alert">{error}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <ActiveTicketsWidget metrics={metrics} loading={loading} />
          <ActiveTechniciansWidget metrics={metrics} loading={loading} />
          <PendingDispatchWidget metrics={metrics} loading={loading} />
          <HighPriorityQueueWidget metrics={metrics} loading={loading} />
          <OverdueJobsWidget metrics={metrics} loading={loading} />
          <CompletedTodayWidget metrics={metrics} loading={loading} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
          <LiveMetricsWidget metrics={liveMetrics} loading={loading} />
          <RegionalStatusWidget regions={regionalStatus} loading={loading} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card variant="bordered" style={{ padding: 20 }} role="region" aria-label="High priority queue">
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>High Priority Queue</h3>
            {highPriorityOps.length === 0 ? (
              <div style={{ color: '#8b9bb5', fontSize: 13, textAlign: 'center', padding: 20 }}>No high priority operations</div>
            ) : (
              highPriorityOps.slice(0, 5).map(op => (
                <div
                  key={op.id}
                  style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1a2744', cursor: 'pointer' }}
                  onClick={() => { window.location.hash = '#/dispatch-queue'; }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') window.location.hash = '#/dispatch-queue'; }}
                >
                  <span style={{ color: '#e6ecf5', fontSize: 13 }}>{op.title}</span>
                  <span style={{ color: op.priority === 'critical' ? '#f87171' : '#f59e0b', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>{op.priority}</span>
                </div>
              ))
            )}
          </Card>

          <Card variant="bordered" style={{ padding: 20 }} role="region" aria-label="Overdue jobs">
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Overdue Jobs</h3>
            {overdueOps.length === 0 ? (
              <div style={{ color: '#8b9bb5', fontSize: 13, textAlign: 'center', padding: 20 }}>No overdue operations</div>
            ) : (
              overdueOps.slice(0, 5).map(op => (
                <div
                  key={op.id}
                  style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1a2744', cursor: 'pointer' }}
                  onClick={() => { window.location.hash = '#/dispatch-queue'; }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') window.location.hash = '#/dispatch-queue'; }}
                >
                  <span style={{ color: '#e6ecf5', fontSize: 13 }}>{op.title}</span>
                  <span style={{ color: '#f87171', fontSize: 12 }}>Overdue</span>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </PermissionGuard>
  );
};
