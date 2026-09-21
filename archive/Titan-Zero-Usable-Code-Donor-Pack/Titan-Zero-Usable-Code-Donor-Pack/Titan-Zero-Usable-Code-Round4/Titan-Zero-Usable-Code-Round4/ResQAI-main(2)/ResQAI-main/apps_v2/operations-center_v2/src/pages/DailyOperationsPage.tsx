import { useState, type FC } from 'react';
import { Card, Button, Input, Skeleton, EmptyState } from '@resqai/foundation';
import { PermissionGuard, DispatchQueueTable } from '../components';
import { useOperations } from '../hooks/useOperations';
import { useAppContext } from '../state/AppContext';
import { OPERATIONS_CENTER_PERMISSIONS } from '../contracts/permissions';
import { operationsService } from '../services/operations-service';
import { useLiveMetrics } from '../hooks/useLiveMetrics';

export const DailyOperationsPage: FC = () => {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [dailyOps, setDailyOps] = useState<typeof import('../models/dto').OperationDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { selectedOperationIds, toggleOperationSelection } = useAppContext();
  const { metrics } = useLiveMetrics();

  const fetchDaily = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await operationsService.getDailyOperations(selectedDate);
      setDailyOps(res.data as unknown as typeof dailyOps);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load daily operations');
    } finally {
      setLoading(false);
    }
  };

  useState(() => { fetchDaily(); });

  return (
    <PermissionGuard permission={OPERATIONS_CENTER_PERMISSIONS.VIEW_DAILY_OPS} fallback={
      <div style={{ padding: 24, textAlign: 'center', color: '#f87171' }}>
        <h2>Permission Denied</h2>
        <p>You do not have permission to view Daily Operations.</p>
      </div>
    }>
      <div style={{ padding: 24 }}>
        <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Daily Operations</h1>

        <Card variant="bordered" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div>
              <label htmlFor="date" style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#8b9bb5' }}>Date</label>
              <Input id="date" type="date" value={selectedDate} onChange={setSelectedDate} aria-label="Select date" />
            </div>
            <Button onClick={fetchDaily} aria-label="Load operations for selected date">Load</Button>
          </div>
        </Card>

        {error && <div role="alert" style={{ color: '#f87171', marginBottom: 16, fontSize: 13 }}>{error}</div>}

        <Card variant="bordered" style={{ padding: 20 }}>
          {loading ? (
            <div role="status" aria-label="Loading daily operations">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={48} style={{ marginBottom: 8 }} />)}
            </div>
          ) : dailyOps.length === 0 ? (
            <EmptyState title="No Operations" message={`No operations scheduled for ${selectedDate}.`} />
          ) : (
            <DispatchQueueTable
              operations={dailyOps as any}
              loading={false}
              error={null}
              onRetry={fetchDaily}
              onOperationClick={(id) => { window.location.hash = `#/operations/${id}`; }}
              selectedIds={selectedOperationIds}
              onToggleSelect={toggleOperationSelection}
            />
          )}
        </Card>
      </div>
    </PermissionGuard>
  );
};
