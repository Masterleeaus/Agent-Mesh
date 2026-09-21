import { type FC } from 'react';
import { Card, Skeleton, EmptyState, ErrorState } from '@resqai/foundation';
import { useDashboard } from '../hooks/useDashboard';
import { WidgetCard } from '../components/WidgetCard';
import { PermissionGuard } from '../components/PermissionGuard';
import { RESOLUTION_CENTER_PERMISSIONS } from '../contracts/permissions';

export const ResolutionDashboardPage: FC = () => {
  const { dashboard, loading, error, refetch } = useDashboard();

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <ErrorState title="Failed to load dashboard" message={error} onRetry={refetch} />
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Resolution Dashboard</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} variant="rectangular" height={100} />)}
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div style={{ padding: 24 }}>
        <EmptyState title="No data" description="Dashboard data is unavailable." />
      </div>
    );
  }

  return (
    <PermissionGuard permission={RESOLUTION_CENTER_PERMISSIONS.VIEW_DASHBOARD}>
      <div style={{ padding: 24 }}>
        <h1 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Resolution Dashboard</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          <WidgetCard title="Pending Reviews" value={dashboard.pendingReviews} variant="warning" />
          <WidgetCard title="Active Disputes" value={dashboard.totalDisputes} variant="danger" />
          <WidgetCard title="Pending Approvals" value={dashboard.pendingApprovals} variant="warning" />
          <WidgetCard title="High Priority" value={dashboard.highPriorityCases} variant="danger" />
          <WidgetCard title="SLA Compliance" value={`${dashboard.slaCompliancePercent}%`} variant="success" subtitle="Resolution SLA" />
          <WidgetCard title="Avg Resolution Time" value={`${dashboard.averageResolutionTimeHours}h`} variant="default" subtitle="Last 30 days" />
          <WidgetCard title="Recently Closed" value={dashboard.recentlyClosedCount} variant="success" subtitle="Past 7 days" />
        </div>
      </div>
    </PermissionGuard>
  );
};
