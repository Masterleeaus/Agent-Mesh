import { type FC } from 'react';
import { Card } from '@resqai/foundation';
import { CompletedOperationsTable, PermissionGuard } from '../components';
import { useOperations } from '../hooks/useOperations';
import { OPERATIONS_CENTER_PERMISSIONS } from '../contracts/permissions';

export const CompletedOperationsPage: FC = () => {
  const { operations, loading, error, refetch } = useOperations({ status: ['completed'], pageSize: 100 });

  return (
    <PermissionGuard permission={OPERATIONS_CENTER_PERMISSIONS.VIEW_COMPLETED_OPS} fallback={
      <div style={{ padding: 24, textAlign: 'center', color: '#f87171' }}>
        <h2>Permission Denied</h2>
        <p>You do not have permission to view Completed Operations.</p>
      </div>
    }>
      <div style={{ padding: 24 }}>
        <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Completed Operations</h1>

        {error && (
          <Card variant="bordered" style={{ padding: 12, marginBottom: 16, background: 'rgba(248, 113, 113, 0.05)', borderColor: '#f87171' }} role="alert">
            <span style={{ color: '#f87171', fontSize: 13 }}>{error}</span>
          </Card>
        )}

        <Card variant="bordered" style={{ padding: 20 }}>
          <CompletedOperationsTable
            operations={operations}
            loading={loading}
            error={error}
            onRetry={refetch}
            onOperationClick={(id) => { window.location.hash = `#/operations/${id}`; }}
          />
        </Card>
      </div>
    </PermissionGuard>
  );
};
