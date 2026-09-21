import { Card, Button, StatusBadge } from '../../../../shared/src/components';
import type { ScheduledReportVM } from '../models/view-models';

interface ScheduledReportCardProps {
  report: ScheduledReportVM;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggle?: (id: string, enabled: boolean) => void;
}

export function ScheduledReportCard({ report, onEdit, onDelete, onToggle }: ScheduledReportCardProps) {
  return (
    <Card padding="md" variant="bordered" style={{ background: '#131c2f', border: '1px solid #243049' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#e6ecf5' }}>{report.reportName}</div>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#8b9bb5' }}>
            <span>Frequency: {report.frequency}</span>
            <span>Format: {report.format.toUpperCase()}</span>
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#6b7a95' }}>
            <span>Next: {report.nextRunAt ? new Date(report.nextRunAt).toLocaleDateString() : 'N/A'}</span>
            <span>Last: {report.lastRunAt ? new Date(report.lastRunAt).toLocaleDateString() : 'Never'}</span>
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
            {report.recipients.map((r, i) => (
              <StatusBadge key={i} variant="info">{r}</StatusBadge>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <StatusBadge variant={report.enabled ? 'success' : 'warning'}>{report.enabled ? 'Active' : 'Paused'}</StatusBadge>
          <Button variant="ghost" size="sm" onClick={() => onToggle?.(report.id, !report.enabled)}>
            {report.enabled ? 'Pause' : 'Resume'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit?.(report.id)}>Edit</Button>
          <Button variant="danger" size="sm" onClick={() => onDelete?.(report.id)}>Delete</Button>
        </div>
      </div>
    </Card>
  );
}
