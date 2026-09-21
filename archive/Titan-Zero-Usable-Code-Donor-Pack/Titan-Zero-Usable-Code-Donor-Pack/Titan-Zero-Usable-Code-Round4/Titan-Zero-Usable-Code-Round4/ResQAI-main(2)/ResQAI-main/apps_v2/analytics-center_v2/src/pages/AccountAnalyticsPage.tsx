import { useState } from 'react';
import { Card, Table, Filter, Skeleton, ErrorState, EmptyState } from '../../../../shared/src/components';
import type { TableColumn, FilterGroup } from '../../../../shared/src/components';
import type { AccountMetricsDTO } from '../models/dto';
import { useMetrics } from '../hooks';
import { analyticsService } from '../services';

const filterGroups: FilterGroup[] = [
  { id: 'tier', label: 'Health Tier', options: [{ label: 'Healthy', value: 'healthy' }, { label: 'At Risk', value: 'at_risk' }, { label: 'Churned', value: 'churned' }] },
];

export function AccountAnalyticsPage() {
  const { data, loading, error, refetch } = useMetrics<AccountMetricsDTO>(() => analyticsService.getAccountMetrics());
  const [filterValues, setFilterValues] = useState<Record<string, string[]>>({});

  const columns: TableColumn[] = [
    { key: 'tier', header: 'Health Tier' },
    { key: 'count', header: 'Accounts', align: 'right' },
  ];

  const riskColumns: TableColumn[] = [
    { key: 'factor', header: 'Risk Factor' },
    { key: 'accounts', header: 'Accounts', align: 'right' },
    { key: 'percentage', header: 'Percentage', align: 'right' },
  ];

  if (error) {
    return <ErrorState title="Account Analytics Error" message={error} onRetry={refetch} />;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Skeleton variant="text" width={240} height={28} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="card" height={100} />)}
        </div>
        <Skeleton variant="rectangular" height={300} />
      </div>
    );
  }

  if (!data) {
    return <EmptyState title="No Account Data" description="Account analytics data is not available yet" />;
  }

  const healthData = data.healthDistribution.map((h, i) => ({ id: i, ...h }));
  const riskData = data.churnRiskFactors.map((r, i) => ({ id: i, factor: r.factor, accounts: r.accounts, percentage: `${r.percentage}%` }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>Account Analytics</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 12, color: '#8b9bb5', fontWeight: 500, textTransform: 'uppercase' }}>Total Accounts</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#e6ecf5' }}>{data.totalAccounts}</div>
        </Card>
        <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 12, color: '#8b9bb5', fontWeight: 500, textTransform: 'uppercase' }}>At Risk</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#fbbf24' }}>{data.atRiskAccounts}</div>
        </Card>
        <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 12, color: '#8b9bb5', fontWeight: 500, textTransform: 'uppercase' }}>Followups Overdue</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ef4444' }}>{data.followupsOverdue}</div>
        </Card>
        <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ fontSize: 12, color: '#8b9bb5', fontWeight: 500, textTransform: 'uppercase' }}>Followup Completion</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#22c55e' }}>{(data.followupCompletionRate * 100).toFixed(1)}%</div>
        </Card>
      </div>

      <Filter groups={filterGroups} values={filterValues} onChange={(g: string, v: string, c: boolean) => setFilterValues((prev) => ({ ...prev, [g]: c ? [...(prev[g] || []), v] : (prev[g] || []).filter((x) => x !== v) }))} onClear={() => setFilterValues({})} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card padding="none" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #243049', fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Health Distribution</div>
          {healthData.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#6b7a95' }}>No health data</div>
          ) : (
            <Table columns={columns} data={healthData} />
          )}
        </Card>
        <Card padding="none" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #243049', fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Churn Risk Factors</div>
          {riskData.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#6b7a95' }}>No risk data</div>
          ) : (
            <Table columns={riskColumns} data={riskData} />
          )}
        </Card>
      </div>
    </div>
  );
}
