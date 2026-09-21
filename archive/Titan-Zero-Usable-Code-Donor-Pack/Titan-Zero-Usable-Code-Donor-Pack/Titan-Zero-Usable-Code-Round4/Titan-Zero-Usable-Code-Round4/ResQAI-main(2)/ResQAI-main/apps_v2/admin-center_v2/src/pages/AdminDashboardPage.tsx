import { useAdminDashboard } from '../hooks/useAdminDashboard';
import { Card, StatusBadge, Skeleton, EmptyState, ErrorState } from '@resqai/foundation';
import { SystemHealthCard, EventVolumeChart } from '../components';

const pageStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 24 };
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 };
const statCardStyle: React.CSSProperties = { background: '#131c2f', border: '1px solid #243049', borderRadius: 8, padding: 20, display: 'flex', flexDirection: 'column', gap: 4 };
const statValueStyle: React.CSSProperties = { fontSize: 28, fontWeight: 700, color: '#e6ecf5' };
const statLabelStyle: React.CSSProperties = { fontSize: 13, color: '#8b9bb5' };
const sectionTitleStyle: React.CSSProperties = { fontSize: 16, fontWeight: 600, color: '#e6ecf5', marginBottom: 12 };
const alertRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #243049', fontSize: 13, color: '#c0ccdc' };

export function AdminDashboardPage() {
  const { data, loading, error } = useAdminDashboard();

  if (loading) return <div style={pageStyle}>
    <div style={gridStyle}>{[1,2,3,4].map(i => <Skeleton key={i} variant="card" />)}</div>
    <Skeleton variant="card" /><Skeleton variant="card" />
  </div>;

  if (error) return <ErrorState title="Failed to load dashboard" message={error} onRetry={() => window.location.reload()} />;

  if (!data) return <EmptyState title="No dashboard data" description="Unable to retrieve system metrics." />;

  return (
    <div style={pageStyle}>
      <div style={gridStyle}>
        <Card style={statCardStyle}><span style={statValueStyle}>{data.totalUsers}</span><span style={statLabelStyle}>Total Users</span></Card>
        <Card style={statCardStyle}><span style={statValueStyle}>{data.activeUsers}</span><span style={statLabelStyle}>Active Users</span></Card>
        <Card style={statCardStyle}><span style={statValueStyle}>{data.eventVolume24h.toLocaleString()}</span><span style={statLabelStyle}>Events (24h)</span></Card>
        <Card style={statCardStyle}><span style={statValueStyle}>{data.failedEvents24h}</span><span style={statLabelStyle}>Failed Events</span></Card>
      </div>
      <EventVolumeChart />
      <div>
        <div style={sectionTitleStyle}>System Health</div>
        <div style={gridStyle}>{data.systemHealth.map(s => <SystemHealthCard key={s.appName} service={s} />)}</div>
      </div>
      <Card style={{ background: '#131c2f', border: '1px solid #243049', borderRadius: 8, padding: 20 }}>
        <div style={sectionTitleStyle}>Recent Alerts</div>
        {data.recentAlerts.length === 0 && <div style={{ color: '#8b9bb5', fontSize: 13 }}>No alerts</div>}
        {data.recentAlerts.map((a, i) => (
          <div key={i} style={alertRow}>
            <StatusBadge variant="warning" size="sm">Alert</StatusBadge>
            <span>{a}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
