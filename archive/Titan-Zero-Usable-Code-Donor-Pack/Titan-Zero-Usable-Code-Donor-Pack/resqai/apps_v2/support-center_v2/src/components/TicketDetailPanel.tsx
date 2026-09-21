import { type FC } from 'react';
import { Card, StatusBadge, Skeleton, ErrorState, EmptyState, Button } from '@resqai/foundation';
import type { TicketDetailVM } from '../models/view-models';
import { ClassificationBadges } from './ClassificationBadges';
import { EscalationBanner } from './EscalationBanner';
import { SLAStopwatch } from './SLAStopwatch';

interface TicketDetailPanelProps {
  detail: TicketDetailVM | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export const TicketDetailPanel: FC<TicketDetailPanelProps> = ({ detail, loading, error, onRetry }) => {
  if (loading) {
    return (
      <div role="status" aria-label="Loading ticket details">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} variant="text" style={{ marginBottom: 12 }} />)}
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Failed to load ticket" message={error} onRetry={onRetry} />;
  }

  if (!detail) {
    return <EmptyState title="Ticket not found" description="The ticket you are looking for does not exist." />;
  }

  const { ticket } = detail;
  const statusVariant = ticket.status === 'resolved' || ticket.status === 'closed' ? 'success' as const
    : ticket.status === 'escalated' ? 'error' as const
    : ticket.status === 'pending' ? 'warning' as const
    : 'info' as const;

  return (
    <div>
      {ticket.status === 'escalated' && <EscalationBanner reason={ticket.escalationReason} escalatedTo={ticket.escalatedTo} />}
      <Card variant="elevated" style={{ marginBottom: 16 }} role="region" aria-label="Ticket summary">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#e6ecf5' }}>{ticket.subject}</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#8b9bb5' }}>Ticket #{ticket.id} · Created {new Date(ticket.createdAt).toLocaleDateString()}</p>
            {ticket.slaDeadline && (
              <div style={{ marginTop: 4 }}>
                <span style={{ fontSize: 12, color: '#8b9bb5' }}>SLA: </span>
                <SLAStopwatch deadline={ticket.slaDeadline} />
              </div>
            )}
          </div>
          <StatusBadge variant={statusVariant}>{ticket.status}</StatusBadge>
        </div>
      </Card>

      <Card variant="bordered" style={{ marginBottom: 16 }} role="region" aria-label="Ticket metadata">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><span style={{ color: '#8b9bb5', fontSize: 12 }}>Customer</span><p style={{ margin: '2px 0', color: '#e6ecf5' }}>{detail.customer.name}</p></div>
          <div><span style={{ color: '#8b9bb5', fontSize: 12 }}>Channel</span><p style={{ margin: '2px 0', color: '#e6ecf5' }}>{ticket.channel}</p></div>
          <div><span style={{ color: '#8b9bb5', fontSize: 12 }}>Owner</span><p style={{ margin: '2px 0', color: '#e6ecf5' }}>{ticket.ownerName || 'Unassigned'}</p></div>
          <div><span style={{ color: '#8b9bb5', fontSize: 12 }}>Classification</span><p style={{ margin: '2px 0' }}><ClassificationBadges type={ticket.classifiedType} urgency={ticket.urgency} /></p></div>
        </div>
      </Card>

      <Card variant="bordered" role="region" aria-label="Customer message">
        <h3 style={{ margin: '0 0 8px', fontSize: 14, color: '#e6ecf5' }}>Message</h3>
        <p style={{ margin: 0, color: '#c8d0dc', whiteSpace: 'pre-wrap' }}>{ticket.message}</p>
      </Card>
    </div>
  );
};
