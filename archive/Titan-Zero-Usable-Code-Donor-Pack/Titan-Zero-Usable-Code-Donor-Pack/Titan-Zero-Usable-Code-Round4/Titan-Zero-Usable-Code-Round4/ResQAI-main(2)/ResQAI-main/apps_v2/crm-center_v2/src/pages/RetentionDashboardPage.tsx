import { useRetention } from '../hooks/useRetention';
import { Card, StatusBadge, Skeleton, EmptyState, ErrorState, Button, ProgressIndicator } from '../../../../shared/src/components';

export default function RetentionDashboardPage() {
  const { data, loading, error, refetch } = useRetention();

  if (loading) {
    return <div style={{ padding: 24 }}><Skeleton variant="rectangular" height={40} width={300} /><div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>{[1, 2, 3, 4].map(i => <Skeleton key={i} variant="card" height={120} />)}</div></div>;
  }

  if (error) {
    return <div style={{ padding: 24 }}><ErrorState error={error} onRetry={refetch} title="Failed to load retention data" /></div>;
  }

  if (!data) {
    return <div style={{ padding: 24 }}><EmptyState title="No retention data" description="Retention metrics are not available." /></div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: '0 0 16px 0' }}>Retention Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
        <Card style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ef4444' }}>{data.totalAtRisk}</div>
          <div style={{ fontSize: 12, color: '#8b9bb5' }}>Accounts at Risk</div>
        </Card>
        <Card style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#16a34a' }}>{data.recoveredThisMonth}</div>
          <div style={{ fontSize: 12, color: '#8b9bb5' }}>Recovered This Month</div>
        </Card>
        <Card style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: data.churnRate > 10 ? '#ef4444' : '#f59e0b' }}>{data.churnRate}%</div>
          <div style={{ fontSize: 12, color: '#8b9bb5' }}>Churn Rate</div>
        </Card>
        <Card style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#16a34a' }}>{data.retentionRate}%</div>
          <div style={{ fontSize: 12, color: '#8b9bb5' }}>Retention Rate</div>
        </Card>
        <Card style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#41d1c4' }}>{data.avgCustomerLifetime}</div>
          <div style={{ fontSize: 12, color: '#8b9bb5' }}>Avg Lifetime (months)</div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card style={{ background: '#131c2f', border: '1px solid #243049' }} header={<span style={{ fontWeight: 600, color: '#e6ecf5', fontSize: 14 }}>At-Risk by Reason</span>}>
          {data.atRiskByReason.map((r: { reason: string; count: number }) => (
            <div key={r.reason} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #243049', fontSize: 13 }}>
              <span style={{ color: '#cbd5e1' }}>{r.reason}</span>
              <span style={{ fontWeight: 700, color: r.count > 5 ? '#ef4444' : '#f59e0b' }}>{r.count}</span>
            </div>
          ))}
        </Card>

        <Card style={{ background: '#131c2f', border: '1px solid #243049' }} header={<span style={{ fontWeight: 600, color: '#e6ecf5', fontSize: 14 }}>Health Trend (6 months)</span>}>
          {data.healthTrend.map((t: { period: string; healthy: number; atRisk: number; churned: number }) => (
            <div key={t.period} style={{ padding: '8px 0', borderBottom: '1px solid #243049' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: '#e6ecf5', fontWeight: 600 }}>{t.period}</span>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ color: '#16a34a' }}>{t.healthy} healthy</span>
                  <span style={{ color: '#f59e0b' }}>{t.atRisk} at risk</span>
                  <span style={{ color: '#ef4444' }}>{t.churned} churned</span>
                </div>
              </div>
              <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ flex: t.healthy, backgroundColor: '#16a34a' }} />
                <div style={{ flex: t.atRisk, backgroundColor: '#f59e0b' }} />
                <div style={{ flex: t.churned || 1, backgroundColor: '#ef4444' }} />
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
