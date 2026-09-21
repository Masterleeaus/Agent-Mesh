import { Card } from '../../../../shared/src/components';
import type { TicketListItemVM } from '../../models/view-models';

interface OpenTicketsWidgetProps {
  tickets: TicketListItemVM[];
  loading?: boolean;
  onViewAll?: () => void;
}

const priorityColor: Record<string, string> = { high: '#e74c3c', medium: '#f0b429', low: '#6b7b95' };

export function OpenTicketsWidget({ tickets, loading, onViewAll }: OpenTicketsWidgetProps) {
  if (loading) {
    return (
      <Card padding="md" header={<span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Open Tickets</span>}>
        <div style={{ height: 120, background: '#1a2744', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
      </Card>
    );
  }

  return (
    <Card padding="md" header={
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Open Tickets</span>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#41d1c4' }}>{tickets.length}</span>
      </div>
    }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tickets.length === 0 ? (
          <div style={{ color: '#6b7b95', fontSize: 12, textAlign: 'center', padding: 16 }}>No open tickets</div>
        ) : (
          tickets.slice(0, 5).map((t) => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #1a2744', cursor: 'pointer' }}
                 onClick={() => { window.location.hash = `/tickets/${t.id}`; }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: priorityColor[t.priority] ?? '#6b7b95', flexShrink: 0 }} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 12, color: '#e6ecf5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.subject}</div>
              </div>
            </div>
          ))
        )}
      </div>
      {onViewAll && (
        <div style={{ marginTop: 8, textAlign: 'center' }}>
          <button onClick={onViewAll} style={{ background: 'none', border: 'none', color: '#41d1c4', fontSize: 12, cursor: 'pointer' }}>View All</button>
        </div>
      )}
    </Card>
  );
}