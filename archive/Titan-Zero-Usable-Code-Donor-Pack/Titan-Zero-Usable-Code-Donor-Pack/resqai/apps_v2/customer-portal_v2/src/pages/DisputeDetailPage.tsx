import { useDisputeDetail } from '../hooks/useDisputeDetail';
import { Card, StatusBadge, Skeleton, EmptyState, ErrorState, Button } from '../../../shared/src/components';
import { DisputeStatusCard } from '../components/DisputeStatusCard';
import { useNavigate } from '../routes/useNavigate';

interface DisputeDetailPageProps {
  disputeId: string;
}

export function DisputeDetailPage({ disputeId }: DisputeDetailPageProps) {
  const { data, loading, error } = useDisputeDetail(disputeId);
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
    return <ErrorState title="Failed to load dispute" message={error} onRetry={() => window.location.reload()} retryLabel="Retry" />;
  }

  if (!data) {
    return <EmptyState title="Dispute not found" description={`No dispute found with ID ${disputeId}.`} action={<Button variant="primary" onClick={() => navigate('/disputes')}>Back to Disputes</Button>} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/disputes')}>&larr; Back</Button>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e6ecf5', margin: '8px 0 0' }}>{data.subject}</h1>
        </div>
      </div>

      <DisputeStatusCard status={data.status} filedDate={data.filedDate} resolutionDate={data.resolutionDate} />

      <Card padding="md" header={<span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Description</span>}>
        <div style={{ fontSize: 13, color: '#8b9bb5', lineHeight: 1.6 }}>{data.description}</div>
      </Card>

      {data.resolution && (
        <Card padding="md" variant="bordered" style={{ borderColor: '#41d1c4' }}>
          <div style={{ fontSize: 12, color: '#6b7b95' }}>Resolution</div>
          <div style={{ fontSize: 13, color: '#e6ecf5', marginTop: 4 }}>{data.resolution}</div>
        </Card>
      )}

      {data.relatedTicketId && (
        <div style={{ fontSize: 12, color: '#6b7b95' }}>
          Related Ticket: <a href={`#/tickets/${data.relatedTicketId}`} style={{ color: '#41d1c4' }}>{data.relatedTicketId}</a>
        </div>
      )}
    </div>
  );
}
