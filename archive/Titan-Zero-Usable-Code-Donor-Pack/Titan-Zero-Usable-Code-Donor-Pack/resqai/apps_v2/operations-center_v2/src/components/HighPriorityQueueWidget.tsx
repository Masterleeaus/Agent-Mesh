import { type FC } from 'react';
import { Card, Skeleton } from '@resqai/foundation';
import type { DashboardMetricsVM } from '../models/view-models';

interface HighPriorityQueueWidgetProps {
  metrics: DashboardMetricsVM | null;
  loading: boolean;
}

export const HighPriorityQueueWidget: FC<HighPriorityQueueWidgetProps> = ({ metrics, loading }) => {
  if (loading) {
    return (
      <Card variant="bordered" style={{ padding: 20 }}>
        <Skeleton variant="text" height={16} width="60%" style={{ marginBottom: 12 }} />
        <Skeleton variant="text" height={32} width="40%" />
      </Card>
    );
  }
  const value = metrics?.highPriority ?? 0;
  const change = metrics?.highPriorityChange ?? 0;
  return (
    <Card variant="bordered" style={{ padding: 20 }} role="region" aria-label="High priority queue widget">
      <div style={{ fontSize: 13, color: '#8b9bb5', marginBottom: 8 }}>High Priority</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#f87171' }}>{value}</div>
      <div style={{ fontSize: 12, color: change >= 0 ? '#f87171' : '#4ade80', marginTop: 4 }}>
        {change >= 0 ? '+' : ''}{change}% vs yesterday
      </div>
    </Card>
  );
};
