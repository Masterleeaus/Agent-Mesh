import { useState } from 'react';
import { useFollowupDetail } from '../../hooks/useFollowupDetail';
import { Card, StatusBadge, Button, Skeleton, EmptyState, ErrorState } from '../../../../shared/src/components';
import { navigate } from '../../state/AppContext';
import type { FollowupStatus, FollowupPriority } from '../../models/dto';

function statusVariant(s: FollowupStatus): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  switch (s) { case 'completed': return 'success'; case 'in_progress': return 'info'; case 'open': return 'warning'; case 'waiting': return 'neutral'; case 'cancelled': return 'neutral'; default: return 'neutral'; }
}

function priorityColor(p: FollowupPriority): string {
  switch (p) { case 'urgent': return '#ef4444'; case 'high': return '#f97316'; case 'medium': return '#f59e0b'; case 'low': return '#6b7280'; default: return '#6b7280'; }
}

interface FollowupDetailPageProps {
  id: string;
}

export default function FollowupDetailPage({ id }: FollowupDetailPageProps) {
  const { data, loading, error } = useFollowupDetail(id);
  const [status, setStatus] = useState<FollowupStatus | null>(null);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton variant="rectangular" height={40} width={300} />
        <div style={{ marginTop: 16 }}><Skeleton variant="card" height={250} /></div>
      </div>
    );
  }

  if (error) {
    return <div style={{ padding: 24 }}><ErrorState error={error} onRetry={() => window.location.reload()} title="Failed to load followup" /></div>;
  }

  if (!data) {
    return <div style={{ padding: 24 }}><EmptyState title="Followup not found" description={`No followup with ID ${id}.`} action={<Button variant="primary" onClick={() => navigate('/followups')}>Back to Followups</Button>} /></div>;
  }

  const currentStatus = status || data.status;

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/followups')}>← Back</Button>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6ecf5', margin: 0 }}>{data.subject}</h1>
        <StatusBadge variant={statusVariant(currentStatus)}>{currentStatus.replace('_', ' ')}</StatusBadge>
      </div>
      <Card style={{ background: '#131c2f', border: '1px solid #243049' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
          <div><span style={{ color: '#8b9bb5' }}>Account</span><br /><span style={{ color: '#e6ecf5' }}>{data.accountName}</span></div>
          <div><span style={{ color: '#8b9bb5' }}>Customer</span><br /><span style={{ color: '#e6ecf5' }}>{data.customerName}</span></div>
          <div><span style={{ color: '#8b9bb5' }}>Type</span><br /><span style={{ color: '#e6ecf5' }}>{data.type}</span></div>
          <div><span style={{ color: '#8b9bb5' }}>Priority</span><br /><span style={{ color: priorityColor(data.priority), fontWeight: 600 }}>{data.priority.toUpperCase()}</span></div>
          <div><span style={{ color: '#8b9bb5' }}>Due Date</span><br /><span style={{ color: '#e6ecf5' }}>{data.dueDate}</span></div>
          <div><span style={{ color: '#8b9bb5' }}>Owner</span><br /><span style={{ color: '#e6ecf5' }}>{data.owner}</span></div>
          <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#8b9bb5' }}>Description</span><br /><span style={{ color: '#e6ecf5' }}>{data.description || 'No description'}</span></div>
          {data.notes && <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#8b9bb5' }}>Notes</span><br /><span style={{ color: '#e6ecf5' }}>{data.notes}</span></div>}
        </div>
      </Card>
      <div style={{ marginTop: 20 }}>
        <Card style={{ background: '#131c2f', border: '1px solid #243049' }} header={<span style={{ fontWeight: 600, color: '#e6ecf5', fontSize: 14 }}>Update Status</span>}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['open', 'in_progress', 'completed', 'waiting', 'cancelled'] as FollowupStatus[]).map(s => (
              <Button
                key={s}
                variant={currentStatus === s ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setStatus(s)}
              >
                {s.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
