import { useState, type FC } from 'react';
import { Card, Button, Skeleton, EmptyState } from '@resqai/foundation';
import { PermissionGuard, DispatchQueueTable } from '../components';
import { useOperations } from '../hooks/useOperations';
import { useAppContext } from '../state/AppContext';
import { OPERATIONS_CENTER_PERMISSIONS } from '../contracts/permissions';
import type { RegionName } from '../models/dto';

const regions: { id: RegionName; name: string; color: string }[] = [
  { id: 'northeast', name: 'Northeast', color: '#41d1c4' },
  { id: 'southeast', name: 'Southeast', color: '#60a5fa' },
  { id: 'midwest', name: 'Midwest', color: '#a78bfa' },
  { id: 'southwest', name: 'Southwest', color: '#f59e0b' },
  { id: 'west', name: 'West', color: '#4ade80' },
];

export const RegionalOperationsPage: FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<RegionName | 'all'>('all');
  const { selectedOperationIds, toggleOperationSelection } = useAppContext();
  const filters = selectedRegion !== 'all' ? { region: [selectedRegion] as RegionName[], pageSize: 100 } : { pageSize: 100 };
  const { operations, loading, error, refetch } = useOperations(filters);

  return (
    <PermissionGuard permission={OPERATIONS_CENTER_PERMISSIONS.VIEW_REGIONAL_OPS} fallback={
      <div style={{ padding: 24, textAlign: 'center', color: '#f87171' }}>
        <h2>Permission Denied</h2>
        <p>You do not have permission to view Regional Operations.</p>
      </div>
    }>
      <div style={{ padding: 24 }}>
        <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Regional Operations</h1>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <Button
            size="sm"
            variant={selectedRegion === 'all' ? 'primary' : 'ghost'}
            onClick={() => setSelectedRegion('all')}
          >
            All Regions
          </Button>
          {regions.map(r => (
            <Button
              key={r.id}
              size="sm"
              variant={selectedRegion === r.id ? 'primary' : 'ghost'}
              onClick={() => setSelectedRegion(r.id)}
              style={selectedRegion === r.id ? {} : { borderLeft: `3px solid ${r.color}` }}
            >
              {r.name}
            </Button>
          ))}
        </div>

        {error && <div role="alert" style={{ color: '#f87171', marginBottom: 16, fontSize: 13 }}>{error}</div>}

        <Card variant="bordered" style={{ padding: 20 }}>
          {loading ? (
            <div role="status" aria-label="Loading regional operations">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={48} style={{ marginBottom: 8 }} />)}
            </div>
          ) : operations.length === 0 ? (
            <EmptyState title="No Operations" message={`No operations in this region.`} />
          ) : (
            <DispatchQueueTable
              operations={operations}
              loading={false}
              error={null}
              onRetry={refetch}
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
