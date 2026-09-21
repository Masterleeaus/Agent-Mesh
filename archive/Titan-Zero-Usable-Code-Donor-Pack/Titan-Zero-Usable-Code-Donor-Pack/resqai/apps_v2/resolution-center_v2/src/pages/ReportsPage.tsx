import { type FC } from 'react';
import { Card, StatusBadge } from '@resqai/foundation';
import { useDashboard } from '../hooks/useDashboard';
import { WidgetCard } from '../components/WidgetCard';
import { PermissionGuard } from '../components/PermissionGuard';
import { RESOLUTION_CENTER_PERMISSIONS } from '../contracts/permissions';

export const ReportsPage: FC = () => {
  const { dashboard } = useDashboard();

  return (
    <PermissionGuard permission={RESOLUTION_CENTER_PERMISSIONS.VIEW_REPORTS}>
      <div style={{ padding: 24 }}>
        <h1 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Reports</h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
          <WidgetCard title="Resolution SLA" value={dashboard ? `${dashboard.slaCompliancePercent}%` : '--'} subtitle="Overall compliance" variant="success" />
          <WidgetCard title="Avg Resolution Time" value={dashboard ? `${dashboard.averageResolutionTimeHours}h` : '--'} subtitle="Per case average" variant="default" />
          <WidgetCard title="Total Pending" value={dashboard ? dashboard.totalPending : '--'} subtitle="Awaiting action" variant="warning" />
          <WidgetCard title="Pending Approvals" value={dashboard ? dashboard.pendingApprovals : '--'} subtitle="Needs sign-off" variant="warning" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card variant="bordered" style={{ padding: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#e6ecf5' }}>Resolution by Type</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[{ type: 'Full Refund', count: 2 }, { type: 'Partial Refund', count: 3 }, { type: 'Rework', count: 2 }, { type: 'Credit', count: 1 }, { type: 'Apology', count: 1 }].map(item => (
                <div key={item.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1a2744' }}>
                  <span style={{ fontSize: 13, color: '#e6ecf5' }}>{item.type}</span>
                  <StatusBadge variant="info">{item.count}</StatusBadge>
                </div>
              ))}
            </div>
          </Card>

          <Card variant="bordered" style={{ padding: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#e6ecf5' }}>Disputes by Reason</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[{ reason: 'Billing', count: 3 }, { reason: 'Service Quality', count: 2 }, { reason: 'Damage', count: 1 }, { reason: 'No Show', count: 1 }, { reason: 'Incomplete Work', count: 1 }].map(item => (
                <div key={item.reason} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1a2744' }}>
                  <span style={{ fontSize: 13, color: '#e6ecf5' }}>{item.reason}</span>
                  <StatusBadge variant="info">{item.count}</StatusBadge>
                </div>
              ))}
            </div>
          </Card>

          <Card variant="bordered" style={{ padding: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#e6ecf5' }}>Priority Distribution</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[{ priority: 'Critical', count: 3, color: '#f04438' }, { priority: 'High', count: 3, color: '#f79009' }, { priority: 'Normal', count: 2, color: '#41d1c4' }, { priority: 'Low', count: 2, color: '#8b9bb5' }].map(item => (
                <div key={item.priority} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1a2744' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                    <span style={{ fontSize: 13, color: '#e6ecf5' }}>{item.priority}</span>
                  </div>
                  <StatusBadge variant="info">{item.count}</StatusBadge>
                </div>
              ))}
            </div>
          </Card>

          <Card variant="bordered" style={{ padding: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#e6ecf5' }}>Monthly Trends</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[{ month: 'May 2026', opened: 4, closed: 3 }, { month: 'Apr 2026', opened: 6, closed: 5 }, { month: 'Mar 2026', opened: 3, closed: 4 }].map(item => (
                <div key={item.month} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1a2744' }}>
                  <span style={{ fontSize: 13, color: '#e6ecf5' }}>{item.month}</span>
                  <span style={{ fontSize: 12, color: '#8b9bb5' }}>Opened: {item.opened} | Closed: {item.closed}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PermissionGuard>
  );
};
