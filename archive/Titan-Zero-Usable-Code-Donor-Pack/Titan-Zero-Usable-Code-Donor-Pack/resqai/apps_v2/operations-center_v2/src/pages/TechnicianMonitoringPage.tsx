import { type FC } from 'react';
import { Card, Skeleton } from '@resqai/foundation';
import { TechnicianStatusTable, PermissionGuard } from '../components';
import { useTechnicians } from '../hooks/useTechnicians';
import { OPERATIONS_CENTER_PERMISSIONS } from '../contracts/permissions';

const statusColors: Record<string, string> = {
  available: '#4ade80',
  en_route: '#60a5fa',
  on_site: '#f59e0b',
  on_break: '#a78bfa',
  offline: '#6b7280',
  completed: '#4ade80',
};

export const TechnicianMonitoringPage: FC = () => {
  const { technicians, loading, error, refetch } = useTechnicians();

  const byStatus: Record<string, typeof technicians> = {};
  technicians.forEach(t => {
    const s = t.status;
    if (!byStatus[s]) byStatus[s] = [];
    byStatus[s].push(t);
  });

  return (
    <PermissionGuard permission={OPERATIONS_CENTER_PERMISSIONS.MONITOR_TECHNICIANS} fallback={
      <div style={{ padding: 24, textAlign: 'center', color: '#f87171' }}>
        <h2>Permission Denied</h2>
        <p>You do not have permission to view Technician Monitoring.</p>
      </div>
    }>
      <div style={{ padding: 24 }}>
        <h1 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Technician Monitoring</h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={80} />)
          ) : (
            Object.entries(byStatus).map(([status, techs]) => (
              <Card key={status} variant="bordered" style={{ padding: 16, textAlign: 'center' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColors[status] || '#6b7280', margin: '0 auto 8px' }} />
                <div style={{ fontSize: 24, fontWeight: 700, color: '#e6ecf5' }}>{techs.length}</div>
                <div style={{ fontSize: 12, color: '#8b9bb5', textTransform: 'capitalize' }}>{status.replace('_', ' ')}</div>
              </Card>
            ))
          )}
        </div>

        <TechnicianStatusTable
          technicians={technicians}
          loading={loading}
          error={error}
          onRetry={refetch}
          onTechnicianClick={(id) => {}}
        />
      </div>
    </PermissionGuard>
  );
};
