import { Card } from '../../../../shared/src/components';
import type { QuickActionVM } from '../../models/view-models';

interface QuickActionsWidgetProps {
  actions: QuickActionVM[];
}

const defaultActions: QuickActionVM[] = [
  { id: 'new-ticket', label: 'New Ticket', icon: '🎫', route: '/tickets/new', description: 'Create a support request' },
  { id: 'book-appointment', label: 'Book Appointment', icon: '📅', route: '/appointments/book', description: 'Schedule a service visit' },
  { id: 'pay-invoice', label: 'Pay Invoice', icon: '💳', route: '/invoices', description: 'View and pay outstanding invoices' },
  { id: 'track-tech', label: 'Track Technician', icon: '📍', route: '/track-technician', description: 'See technician live location' },
  { id: 'knowledge-base', label: 'Knowledge Base', icon: '📚', route: '/knowledge-base', description: 'Search help articles' },
  { id: 'messages', label: 'Messages', icon: '💬', route: '/messages', description: 'View your messages' },
];

export function QuickActionsWidget({ actions = defaultActions }: QuickActionsWidgetProps) {
  return (
    <Card padding="md" header={<span style={{ fontSize: 14, fontWeight: 600, color: '#e6ecf5' }}>Quick Actions</span>}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {actions.map((action) => (
          <div key={action.id}
               style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: 12, borderRadius: 8, background: '#131c2f', border: '1px solid #243049', cursor: 'pointer', transition: 'all 0.15s' }}
               onClick={() => { window.location.hash = action.route; }}
               title={action.description}>
            <span style={{ fontSize: 20 }}>{action.icon}</span>
            <span style={{ fontSize: 11, color: '#e6ecf5', textAlign: 'center', fontWeight: 500 }}>{action.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}