import { type FC } from 'react';
import { Card, Button } from '@resqai/foundation';
import { useOperations } from '../hooks/useOperations';
import { PermissionGuard } from '../components';
import { OPERATIONS_CENTER_PERMISSIONS } from '../contracts/permissions';
import { Skeleton, EmptyState } from '@resqai/foundation';

export const PendingAssignmentsPage: FC = () => {
  const { operations, loading, error, refetch } = useOperations({ status: ['pending_dispatch'], pageSize: 50 });

  return (
    <PermissionGuard permission={OPERATIONS_CENTER_PERMISSIONS.VIEW_ASSIGNMENTS} fallback={
      <div style={{ padding: 24, textAlign: 'center', color: '#f87171' }}>
        <h2>Permission Denied</h2>
        <p>You do not have permission to view Pending Assignments.</p>
      </div>
    }>
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Pending Assignments</h1>
          {error && <span style={{ color: '#f87171', fontSize: 13 }} role="alert">{error}</span>}
        </div>

        <Card variant="bordered" style={{ padding: 20 }}>
          {loading ? (
            <div role="status" aria-label="Loading pending assignments">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={48} style={{ marginBottom: 8 }} />)}
            </div>
          ) : operations.length === 0 ? (
            <EmptyState title="No Pending Assignments" message="All operations have been assigned to technicians." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {operations.map(op => (
                <div
                  key={op.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px', borderRadius: 6, background: '#0f1729',
                    border: '1px solid #1a2744',
                  }}
                >
                  <div>
                    <div style={{ color: '#e6ecf5', fontWeight: 500, fontSize: 13 }}>{op.title}</div>
                    <div style={{ color: '#8b9bb5', fontSize: 12, marginTop: 2 }}>
                      {op.customerName} - {op.region} - {Math.floor(op.estimatedDuration / 60)}h
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{
                      color: op.priority === 'critical' ? '#f87171' : op.priority === 'high' ? '#f59e0b' : '#8b9bb5',
                      fontSize: 11, fontWeight: 600, textTransform: 'uppercase', alignSelf: 'center',
                    }}>
                      {op.priority}
                    </span>
                    <Button size="sm" onClick={() => { window.location.hash = '#/dispatch-queue'; }}>Assign</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </PermissionGuard>
  );
};
