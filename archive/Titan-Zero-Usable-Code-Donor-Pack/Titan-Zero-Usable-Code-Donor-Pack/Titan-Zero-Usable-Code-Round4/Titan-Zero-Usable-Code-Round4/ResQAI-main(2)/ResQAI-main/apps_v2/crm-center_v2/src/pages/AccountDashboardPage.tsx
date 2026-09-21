import { useAccountDashboard } from '../../hooks/useAccountDashboard';
import { Card, StatusBadge, ProgressIndicator, Skeleton, EmptyState, ErrorState } from '../../../../shared/src/components';
import { HealthGauge, HealthCategoryBar, RiskSignalCard, SlippingAlertBanner } from '../../components';
import { navigate } from '../../state/AppContext';
import type { RiskLevel } from '../../models/dto';
import type { RiskSignalVM } from '../../models/view-models';

function levelVariant(level: RiskLevel): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (level) { case 'critical': case 'high': return 'error'; case 'medium': return 'warning'; case 'low': return 'success'; default: return 'neutral'; }
}

export default function AccountDashboardPage() {
  const { data, loading, error, refetch } = useAccountDashboard();

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton variant="rectangular" height={40} width={300} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginTop: 20 }}>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="card" height={120} />)}
        </div>
        <div style={{ marginTop: 20 }}><Skeleton variant="rectangular" height={200} /></div>
      </div>
    );
  }

  if (error) {
    return <div style={{ padding: 24 }}><ErrorState error={error} onRetry={refetch} title="Failed to load dashboard" /></div>;
  }

  if (!data) {
    return <div style={{ padding: 24 }}><EmptyState title="No dashboard data" description="Could not retrieve dashboard metrics." /></div>;
  }

  const { healthDistribution } = data;

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Account Health Dashboard</h1>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: '#8b9bb5' }}>{data.totalAccounts} accounts</span>
          <span style={{ fontSize: 13, color: '#8b9bb5' }}>Avg score: {data.averageHealthScore}</span>
        </div>
      </div>

      <SlippingAlertBanner overdueCount={data.overdueFollowups} onViewClick={() => navigate('/followups')} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        <Card style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <HealthGauge score={data.averageHealthScore} size={100} />
            <span style={{ fontSize: 13, color: '#8b9bb5' }}>Average Health Score</span>
          </div>
        </Card>
        <Card style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 12 }}>Health Distribution</div>
          <HealthCategoryBar {...healthDistribution} total={healthDistribution.total || 1} />
        </Card>
        <Card style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5', marginBottom: 12 }}>Key Metrics</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>{data.criticalAccounts}</div><div style={{ fontSize: 12, color: '#8b9bb5' }}>Critical</div></div>
            <div><div style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>{data.overdueFollowups}</div><div style={{ fontSize: 12, color: '#8b9bb5' }}>Overdue Followups</div></div>
            <div><div style={{ fontSize: 24, fontWeight: 700, color: '#41d1c4' }}>{data.upcomingAppointments}</div><div style={{ fontSize: 12, color: '#8b9bb5' }}>Appointments</div></div>
            <div><div style={{ fontSize: 24, fontWeight: 700, color: '#3b82f6' }}>{data.recentRiskSignals.length}</div><div style={{ fontSize: 12, color: '#8b9bb5' }}>Risk Signals</div></div>
          </div>
        </Card>
      </div>

      <Card style={{ background: '#131c2f', border: '1px solid #243049' }} header={<span style={{ fontWeight: 600, fontSize: 14, color: '#e6ecf5' }}>Recent Risk Signals</span>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {data.recentRiskSignals.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>No recent risk signals</div>
          ) : data.recentRiskSignals.slice(0, 5).map((signal: RiskSignalVM) => (
            <RiskSignalCard key={signal.id} {...signal} onAcknowledge={undefined} />
          ))}
        </div>
      </Card>
    </div>
  );
}
