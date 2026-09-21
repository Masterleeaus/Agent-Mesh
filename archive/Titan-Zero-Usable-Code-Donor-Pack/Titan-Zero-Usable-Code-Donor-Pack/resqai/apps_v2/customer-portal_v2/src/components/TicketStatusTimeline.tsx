import { Card } from '../../../shared/src/components';
import { TicketStatus } from '../models/dto';

interface TimelineStep {
  label: string;
  status: TicketStatus;
  timestamp: string | null;
  active: boolean;
  completed: boolean;
}

interface TicketStatusTimelineProps {
  currentStatus: TicketStatus;
  createdAt: string;
  resolvedAt: string | null;
}

const statusOrder: TicketStatus[] = [
  TicketStatus.Open,
  TicketStatus.InProgress,
  TicketStatus.WaitingOnCustomer,
  TicketStatus.WaitingOnInternal,
  TicketStatus.Resolved,
  TicketStatus.Closed,
];

export function TicketStatusTimeline({ currentStatus, createdAt, resolvedAt }: TicketStatusTimelineProps) {
  const currentIdx = statusOrder.indexOf(currentStatus);

  const steps: TimelineStep[] = statusOrder.map((s, i) => ({
    label: s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    status: s,
    timestamp: i === 0 ? createdAt : i === statusOrder.indexOf(TicketStatus.Resolved) ? resolvedAt : null,
    active: i === currentIdx,
    completed: i < currentIdx,
  }));

  return (
    <Card padding="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {steps.map((step, i) => (
          <div key={step.status} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, position: 'relative', paddingBottom: i < steps.length - 1 ? 24 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: step.completed ? '#41d1c4' : step.active ? '#f0b429' : '#243049', border: step.active ? '2px solid #f0b429' : 'none', flexShrink: 0 }} />
              {i < steps.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 24, background: step.completed ? '#41d1c4' : '#243049' }} />}
            </div>
            <div style={{ paddingTop: 0 }}>
              <div style={{ fontSize: 13, fontWeight: step.active ? 700 : 400, color: step.active ? '#f0b429' : step.completed ? '#e6ecf5' : '#6b7b95' }}>{step.label}</div>
              {step.timestamp && <div style={{ fontSize: 11, color: '#6b7b95', marginTop: 2 }}>{new Date(step.timestamp).toLocaleString()}</div>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
