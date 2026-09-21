import { type FC } from 'react';
import { Card, Button, EmptyState } from '@resqai/foundation';
import { PermissionGuard } from '../components';
import { OPERATIONS_CENTER_PERMISSIONS } from '../contracts/permissions';

const reportTemplates = [
  { id: 'daily-summary', name: 'Daily Operations Summary', description: 'Overview of all operations for a given day' },
  { id: 'technician-performance', name: 'Technician Performance', description: 'Completion rates, ratings, and efficiency metrics' },
  { id: 'regional-breakdown', name: 'Regional Breakdown', description: 'Operations volume and status by region' },
  { id: 'escalation-analysis', name: 'Escalation Analysis', description: 'Escalation trends, root causes, and resolution times' },
  { id: 'dispatch-efficiency', name: 'Dispatch Efficiency', description: 'Dispatch times, acceptance rates, and SLA compliance' },
  { id: 'completed-operations', name: 'Completed Operations Log', description: 'Detailed log of all completed operations with durations' },
];

export const OperationsReportsPage: FC = () => {
  return (
    <PermissionGuard permission={OPERATIONS_CENTER_PERMISSIONS.VIEW_REPORTS} fallback={
      <div style={{ padding: 24, textAlign: 'center', color: '#f87171' }}>
        <h2>Permission Denied</h2>
        <p>You do not have permission to view Operations Reports.</p>
      </div>
    }>
      <div style={{ padding: 24 }}>
        <h1 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700, color: '#e6ecf5' }}>Operations Reports</h1>

        <EmptyState title="Reports Coming Soon" message="Report generation and export will be available in a future update." />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginTop: 24 }}>
          {reportTemplates.map(report => (
            <Card key={report.id} variant="bordered" style={{ padding: 20 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>{report.name}</h3>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: '#8b9bb5' }}>{report.description}</p>
              <Button size="sm" variant="ghost" onClick={() => {}} disabled>Generate (soon)</Button>
            </Card>
          ))}
        </div>
      </div>
    </PermissionGuard>
  );
};
