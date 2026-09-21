import { usePlatformMetrics } from '../hooks/usePlatformMetrics';
import { useAdminDashboard } from '../hooks/useAdminDashboard';
import { useEventBusMetrics } from '../hooks/useEventBusMetrics';
import { Card, Skeleton, EmptyState, ErrorState } from '@resqai/foundation';
import { MetricCard } from '../components/MetricCard';
import { EventVolumeChart } from '../components/EventVolumeChart';
import { ActiveSessionList } from '../components/ActiveSessionList';
import { useSessions } from '../hooks/useSessions';

const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 24 };
const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#e6ecf5' };
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 };
const sectionTitle: React.CSSProperties = { fontSize: 16, fontWeight: 600, color: '#e6ecf5', marginBottom: 12 };
const cardStyle: React.CSSProperties = { background: '#131c2f', border: '1px solid #243049', borderRadius: 8, padding: 20 };

export function MonitoringDashboardPage() {
  const { data: metrics, loading: metricsLoading, error: metricsError } = usePlatformMetrics();
  const { data: dashData } = useAdminDashboard();
  const { data: sessions, loading: sessionsLoading } = useSessions();

  if (metricsLoading) return <div style={pageStyle}>
    <div style={gridStyle}>{[1,2,3,4].map(i => <Skeleton key={i} variant="card" />)}</div>
  </div>;

  return (
    <div style={pageStyle}>
      <div style={titleStyle}>Monitoring Dashboard</div>
      {metricsError ? <ErrorState title="Failed to load metrics" message={metricsError} /> : (
        <>
          <div>
            <div style={sectionTitle}>Key Metrics</div>
            <div style={gridStyle}>
              {metrics.length === 0 ? <EmptyState title="No metrics" description="No monitoring data available." /> : metrics.map(m => <MetricCard key={m.id} metric={m} />)}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <EventVolumeChart />
            <Card style={cardStyle}>
              <div style={sectionTitle}>Active Sessions</div>
              <ActiveSessionList data={sessions} loading={sessionsLoading} onForceLogout={() => {}} />
            </Card>
          </div>
          {dashData && (
            <Card style={cardStyle}>
              <div style={sectionTitle}>System Summary</div>
              <div style={gridStyle}>
                <div><span style={{ color: '#8b9bb5', fontSize: 12 }}>Total Users</span><div style={{ color: '#e6ecf5', fontSize: 18, fontWeight: 600 }}>{dashData.totalUsers}</div></div>
                <div><span style={{ color: '#8b9bb5', fontSize: 12 }}>Active Users</span><div style={{ color: '#e6ecf5', fontSize: 18, fontWeight: 600 }}>{dashData.activeUsers}</div></div>
                <div><span style={{ color: '#8b9bb5', fontSize: 12 }}>Events (24h)</span><div style={{ color: '#e6ecf5', fontSize: 18, fontWeight: 600 }}>{dashData.eventVolume24h.toLocaleString()}</div></div>
                <div><span style={{ color: '#8b9bb5', fontSize: 12 }}>Failed Events</span><div style={{ color: '#ef5350', fontSize: 18, fontWeight: 600 }}>{dashData.failedEvents24h}</div></div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
