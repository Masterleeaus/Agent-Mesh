import { type FC } from 'react';
import { Card, Skeleton } from '@resqai/foundation';
import type { DashboardMetricsVM } from '../models/view-models';

interface CompletedTodayWidgetProps {
  metrics: DashboardMetricsVM | null;
  loading: boolean;
}

export const CompletedTodayWidget: FC<CompletedTodayWidgetProps> = ({ metrics, loading }) => {
  if (loading) {
    return (
      <Card variant="bordered" style={{ padding: 20 }}>
        <Skeleton variant="text" height={16} width="60%" style={{ marginBottom: 12 }} />
        <Skeleton variant="text" height={32} width="40%" />
      </Card>
    );
  }
  const value = metrics?.completedToday ?? 0;
  const change = metrics?.completedTodayChange ?? 0;
  return (
    <Card variant="bordered" style={{ padding: 20 }} role="region" aria-label="Completed today widget">
      <div style={{ fontSize: 13, color: '#8b9bb5', marginBottom: 8 }}>Completed Today</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#4ade80' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#8b9bb5', marginTop: 4 }}>
        Target: 12
      </div>
    </Card>
  );
};
