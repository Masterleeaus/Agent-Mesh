import { type FC } from 'react';
import { Card, Skeleton } from '@resqai/foundation';
import type { DashboardMetricsVM } from '../models/view-models';

interface PendingDispatchWidgetProps {
  metrics: DashboardMetricsVM | null;
  loading: boolean;
}

export const PendingDispatchWidget: FC<PendingDispatchWidgetProps> = ({ metrics, loading }) => {
  if (loading) {
    return (
      <Card variant="bordered" style={{ padding: 20 }}>
        <Skeleton variant="text" height={16} width="60%" style={{ marginBottom: 12 }} />
        <Skeleton variant="text" height={32} width="40%" />
      </Card>
    );
  }
  const value = metrics?.pendingDispatch ?? 0;
  const change = metrics?.pendingDispatchChange ?? 0;
  return (
    <Card variant="bordered" style={{ padding: 20 }} role="region" aria-label="Pending dispatch widget">
      <div style={{ fontSize: 13, color: '#8b9bb5', marginBottom: 8 }}>Pending Dispatch</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>{value}</div>
      <div style={{ fontSize: 12, color: change >= 0 ? '#f87171' : '#4ade80', marginTop: 4 }}>
        {change >= 0 ? '+' : ''}{change}% vs yesterday
      </div>
    </Card>
  );
};
