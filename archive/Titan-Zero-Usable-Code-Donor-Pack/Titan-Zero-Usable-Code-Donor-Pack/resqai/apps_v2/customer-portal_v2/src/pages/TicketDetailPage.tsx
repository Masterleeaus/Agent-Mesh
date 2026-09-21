import { useTicketDetail } from '../hooks/useTicketDetail';
import { Card, Tabs, StatusBadge, Skeleton, EmptyState, ErrorState, Button } from '../../../shared/src/components';
import { TicketStatusTimeline } from '../components/TicketStatusTimeline';
import { TicketStatus } from '../models/dto';
import { useNavigate } from '../routes/useNavigate';

interface TicketDetailPageProps {
  ticketId: string;
}

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  [TicketStatus.Open]: 'warning',
  [TicketStatus.InProgress]: 'info',
  [TicketStatus.WaitingOnCustomer]: 'neutral',
  [TicketStatus.WaitingOnInternal]: 'info',
  [TicketStatus.Resolved]: 'success',
  [TicketStatus.Closed]: 'neutral',
};

const tabs = [
  { id: 'details', label: 'Details' },
  { id: 'activity', label: 'Activity' },
];

export function TicketDetailPage({ ticketId }: TicketDetailPageProps) {
  const { data, loading, error } = useTicketDetail(ticketId);
  const navigate = useNavigate();

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Skeleton variant="rectangular" height={40} width={200} />
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Failed to load ticket" message={error} onRetry={() => window.location.reload()} retryLabel="Retry" />;
  }

  if (!data) {
    return <EmptyState title="Ticket not found" description={`No ticket found with ID ${ticketId}.`} action={<Button variant="primary" onClick={() => navigate('/tickets')}>Back to Tickets</Button>} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/tickets')}>&larr; Back</Button>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e6ecf5', margin: '8px 0 0' }}>{data.subject}</h1>
        </div>
        <StatusBadge variant={statusVariant[data.status]} size="md">{data.status.replace(/_/g, ' ')}</StatusBadge>
      </div>

      <Tabs tabs={tabs} activeId="details" onChange={() => {}} />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <Card padding="md" header={<span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Ticket Details</span>}>
          <div style={{ fontSize: 13, color: '#8b9bb5', lineHeight: 1.6 }}>{data.message}</div>
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
            <div><span style={{ color: '#6b7b95' }}>Type:</span> <span style={{ color: '#e6ecf5' }}>{data.requestType}</span></div>
            <div><span style={{ color: '#6b7b95' }}>Channel:</span> <span style={{ color: '#e6ecf5' }}>{data.channel}</span></div>
            <div><span style={{ color: '#6b7b95' }}>Priority:</span> <span style={{ color: '#e6ecf5' }}>{data.priority}</span></div>
            <div><span style={{ color: '#6b7b95' }}>Created:</span> <span style={{ color: '#e6ecf5' }}>{new Date(data.createdAt).toLocaleString()}</span></div>
          </div>
        </Card>
        <TicketStatusTimeline currentStatus={data.status} createdAt={data.createdAt} resolvedAt={data.resolvedAt} />
      </div>
    </div>
  );
}
