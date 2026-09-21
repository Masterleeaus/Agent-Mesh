import { type FC } from 'react';
import { Skeleton, EmptyState } from '@resqai/foundation';
import type { TicketListItem } from '../models/view-models';
import { UrgencyIndicator } from './UrgencyIndicator';
import type { Urgency, TicketStatus } from '../models/dto';

interface KanbanViewProps {
  tickets: TicketListItem[];
  loading: boolean;
  onTicketClick: (id: string) => void;
}

const columns: { id: TicketStatus; label: string }[] = [
  { id: 'new', label: 'New' },
  { id: 'open', label: 'Open' },
  { id: 'pending', label: 'Pending' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'escalated', label: 'Escalated' },
  { id: 'closed', label: 'Closed' },
];

const columnColors: Record<string, string> = {
  new: '#60a5fa',
  open: '#fbbf24',
  pending: '#a78bfa',
  resolved: '#4ade80',
  escalated: '#f87171',
  closed: '#6b7b95',
};

const cardStyle: React.CSSProperties = {
  padding: '10px 12px',
  marginBottom: 8,
  borderRadius: 8,
  background: '#131c2f',
  border: '1px solid #243049',
  cursor: 'pointer',
  transition: 'border-color 0.15s',
};

export const KanbanView: FC<KanbanViewProps> = ({ tickets, loading, onTicketClick }) => {
  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns.length}, 1fr)`, gap: 12 }}>
        {columns.map(col => (
          <div key={col.id}>
            <Skeleton variant="rectangular" height={200} />
          </div>
        ))}
      </div>
    );
  }

  const grouped = columns.reduce((acc, col) => {
    acc[col.id] = tickets.filter(t => t.status === col.id);
    return acc;
  }, {} as Record<string, TicketListItem[]>);

  const allEmpty = columns.every(col => (grouped[col.id]?.length ?? 0) === 0);

  if (allEmpty) {
    return <EmptyState title="No tickets" description="No tickets match the current filters." />;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns.length}, 1fr)`, gap: 12, minHeight: 400 }}>
      {columns.map(col => {
        const colTickets = grouped[col.id] || [];
        return (
          <div key={col.id} role="region" aria-label={`${col.label} column`} style={{ minWidth: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', marginBottom: 8,
              borderBottom: `2px solid ${columnColors[col.id]}`,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#e6ecf5' }}>{col.label}</span>
              <span style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: '#243049', color: '#8b9bb5' }}>{colTickets.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {colTickets.length === 0 && (
                <p style={{ fontSize: 11, color: '#6b7b95', textAlign: 'center', padding: 16 }}>No tickets</p>
              )}
              {colTickets.map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => onTicketClick(ticket.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') onTicketClick(ticket.id); }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Ticket: ${ticket.subject}`}
                  style={cardStyle}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#e6ecf5', marginBottom: 4, lineHeight: 1.3 }}>{ticket.subject}</div>
                  <div style={{ fontSize: 11, color: '#8b9bb5', marginBottom: 4 }}>{ticket.customerName}</div>
                  <UrgencyIndicator urgency={ticket.urgency as Urgency} />
                  {ticket.ownerName && (
                    <div style={{ fontSize: 10, color: '#6b7b95', marginTop: 4 }}>{ticket.ownerName}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
