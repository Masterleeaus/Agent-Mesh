import { useSystemHealth } from '../hooks/useSystemHealth';
import { KpiDashboardGrid, DataFreshnessIndicator } from '../components';
import { ErrorState, Card } from '../../../../shared/src/components';
import type { KpiCardVM, ServiceHealthVM } from '../models/view-models';

const statusColor = (status: string) => {
  switch (status) {
    case 'healthy': return '#22c55e';
    case 'degraded': return '#f59e0b';
    case 'down': return '#ef4444';
    default: return '#6b7a95';
  }
};

const statusIcon = (status: string) => {
  switch (status) {
    case 'healthy': return '\u2713';
    case 'degraded': return '\u26A0';
    case 'down': return '\u2717';
    default: return '\u2022';
  }
};

export function SystemHealthPage() {
  const { data, loading, error, refetch } = useSystemHealth();

  if (error) return <ErrorState title="Failed to load" message={error} onRetry={refetch} />;

  const kpiCards: KpiCardVM[] = data ? [
    { id: 'uptime', label: 'System Uptime', value: `${data.uptime}%`, trend: { value: data.uptime, previousValue: 99.95, percentChange: 0.02, direction: 'up' } },
    { id: 'latency', label: 'Avg Latency', value: `${data.avgLatency}ms`, trend: { value: data.avgLatency, previousValue: 32, percentChange: -12.5, direction: 'down' } },
    { id: 'error-rate', label: 'Error Rate', value: `${data.errorRate}%`, trend: { value: data.errorRate, previousValue: 0.18, percentChange: -33.3, direction: 'down' } },
    { id: 'active-users', label: 'Active Users', value: String(data.activeUsers), trend: { value: data.activeUsers, previousValue: 15, percentChange: 20.0, direction: 'up' } },
    { id: 'cache-hit', label: 'Cache Hit Rate', value: `${data.cacheHitRate}%`, trend: { value: data.cacheHitRate, previousValue: 85.2, percentChange: 2.7, direction: 'up' } },
    { id: 'api-reqs', label: 'API Requests', value: String(data.apiRequests), trend: { value: data.apiRequests, previousValue: 11200, percentChange: 12.3, direction: 'up' } },
  ] : [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>System Health</h1>
        <DataFreshnessIndicator lastUpdated={new Date().toISOString()} loading={loading} />
      </div>

      <KpiDashboardGrid metrics={kpiCards} loading={loading} columns={3} />

      <div style={{ marginTop: 24 }}>
        <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Service Status</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(data?.status || 'healthy') }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#e6ecf5', textTransform: 'capitalize' }}>{data?.status}</span>
            </div>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 16, padding: '8px 0' }}>
                  <div style={{ flex: 2, height: 12, background: '#243049', borderRadius: 4 }} />
                  <div style={{ flex: 1, height: 12, background: '#243049', borderRadius: 4 }} />
                  <div style={{ flex: 1, height: 12, background: '#243049', borderRadius: 4 }} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(data?.services || []).map((svc, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: i % 2 === 0 ? '#1a2540' : 'transparent', borderRadius: 6 }}>
                  <span style={{ fontSize: 16, color: statusColor(svc.status) }}>{statusIcon(svc.status)}</span>
                  <div style={{ flex: 1, fontSize: 14, color: '#e6ecf5', fontWeight: 500 }}>{svc.name}</div>
                  <span style={{ fontSize: 12, color: statusColor(svc.status), textTransform: 'capitalize', fontWeight: 600 }}>{svc.status}</span>
                  <span style={{ fontSize: 12, color: '#8b9bb5', minWidth: 60, textAlign: 'right' }}>{svc.latency}ms</span>
                  <span style={{ fontSize: 11, color: '#6b7a95', minWidth: 80, textAlign: 'right' }}>{new Date(svc.lastChecked).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
