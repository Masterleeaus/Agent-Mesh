import { useAdminDashboard } from '../hooks/useAdminDashboard';
import { usePlatformMetrics } from '../hooks/usePlatformMetrics';
import { Card, StatusBadge, Skeleton, EmptyState, ErrorState } from '@resqai/foundation';
import { SystemHealthCard } from '../components/SystemHealthCard';
import { MetricCard } from '../components/MetricCard';

const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 24 };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#e6ecf5' };
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 };
const sectionTitle: React.CSSProperties = { fontSize: 16, fontWeight: 600, color: '#e6ecf5', marginBottom: 12 };
const cardStyle: React.CSSProperties = { background: '#131c2f', border: '1px solid #243049', borderRadius: 8, padding: 20 };

export function PlatformHealthPage() {
  const { data: dashData, loading: dashLoading, error: dashError } = useAdminDashboard();
  const { data: metrics, loading: metricsLoading, error: metricsError } = usePlatformMetrics();

  if (dashLoading || metricsLoading) return <div style={pageStyle}>
    <div style={gridStyle}>{[1,2,3,4].map(i => <Skeleton key={i} variant="card" />)}</div>
    <Skeleton variant="card" />
  </div>;

  if (dashError) return <ErrorState title="Failed to load health data" message={dashError} />;

  return (
    <div style={pageStyle}>
      <div style={titleStyle}>Platform Health</div>
      <div>
        <div style={sectionTitle}>Platform Metrics</div>
        <div style={gridStyle}>
          {metricsError ? <ErrorState title="Failed" message={metricsError} /> : metrics.length === 0 ? (
            <EmptyState title="No metrics" description="No platform metrics available." />
          ) : metrics.map(m => <MetricCard key={m.id} metric={m} />)}
        </div>
      </div>
      {dashData && (
        <>
          <div>
            <div style={sectionTitle}>System Health</div>
            <div style={gridStyle}>{dashData.systemHealth.map(s => <SystemHealthCard key={s.appName} service={s} />)}</div>
          </div>
          <Card style={cardStyle}>
            <div style={sectionTitle}>Recent Alerts</div>
            {dashData.recentAlerts.length === 0 ? (
              <div style={{ color: '#8b9bb5', fontSize: 13 }}>No active alerts</div>
            ) : dashData.recentAlerts.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #243049', fontSize: 13, color: '#c0ccdc' }}>
                <StatusBadge variant="warning" size="sm">Alert</StatusBadge>
                <span>{a}</span>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}
